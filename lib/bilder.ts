/* ---------------------------------------------------------------
   Titelbilder von Veranstaltungen entgegennehmen und ablegen.

   Grundsatz: Eine hochgeladene Datei wird NIEMALS so gespeichert, wie
   sie ankommt. Sie wird geöffnet, neu berechnet und neu geschrieben.
   Das ist der wirksamste Schutz — wirksamer als jede Endungs- oder
   Typprüfung: Was sich nicht als Bild öffnen lässt, kommt gar nicht
   erst durch, und in einer echten Bilddatei eingebetteter Fremdinhalt
   überlebt das Neuberechnen nicht.

   Zwei Dinge passieren dabei nebenbei und sind wichtiger, als sie
   aussehen:

   1. Die Drehung aus den EXIF-Daten wird angewendet. Ohne das liegen
      Handyfotos auf der Seite quer.
   2. Die Metadaten werden anschließend verworfen. Fotos vom iPhone
      tragen GPS-Koordinaten — die haben auf einer öffentlichen Seite
      nichts verloren.

   Abgelegt wird AUSSERHALB von `public/`. Bei einem Deployment aus Git
   wird `public/` ersetzt; hochgeladene Bilder wären dann weg.
   --------------------------------------------------------------- */

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OutputInfo } from "sharp";

/** Obergrenze für die hochgeladene Datei. */
export const MAX_BYTES = 10 * 1024 * 1024;

/** Die beiden Breiten, die erzeugt werden. */
export const BREIT = 1800;
export const SCHMAL = 900;

/** Adresse, unter der die Bilder ausgeliefert werden. */
export const BILDER_PFAD = "/bilder";

/*
 * Hinweis zur Bauwarnung „Dynamic filesystem access".
 *
 * Der Zielpfad steht erst zur Laufzeit fest — er kommt aus einer
 * Umgebungsvariablen. Turbopack kann ihn deshalb beim Bauen nicht
 * ausrechnen und warnt, es müsse vorsichtshalber das ganze Projekt in
 * die Serverdateien aufnehmen.
 *
 * Für dieses Projekt ist das folgenlos: Diese Verfolgung wird nur bei
 * `output: "standalone"` überhaupt ausgeliefert, und das ist hier
 * nicht eingestellt (nachgesehen, nicht angenommen — es gibt kein
 * .next/standalone). Ein Umweg über dynamische Importe wurde probiert
 * und beseitigt die Warnung nicht; er hätte also nur Umstände gemacht.
 */

/**
 * Wo die Dateien liegen.
 *
 * Über eine Umgebungsvariable, weil das Verzeichnis beim Hoster auf
 * einen Ort zeigen muss, den ein Deployment nicht überschreibt.
 */
export function verzeichnis(): string {
  return process.env.BILDER_VERZEICHNIS ?? path.join(process.cwd(), "daten", "bilder");
}

/**
 * Aus dem Namen der großen Fassung den der kleinen machen.
 *
 * Eine Namensregel statt eines zweiten Datenbankfeldes: So bleibt das
 * Datenmodell unverändert, und es kann keine Zeile geben, in der die
 * beiden Größen auseinanderlaufen.
 */
export function kleineFassung(url: string): string {
  return url.replace(/\.webp$/, "-klein.webp");
}

/** Gehört diese Adresse zu einem hochgeladenen Bild? */
export function istHochgeladen(url: string | null): boolean {
  return !!url && url.startsWith(`${BILDER_PFAD}/`);
}

/**
 * Ist der Dateiname harmlos?
 *
 * Wird von der Auslieferungsroute benutzt. Nur die Namen, die diese
 * Datei selbst vergibt, kommen durch — kein Punkt-Punkt, kein
 * Schrägstrich, keine Umwege ins Dateisystem.
 */
export function nameIstErlaubt(name: string): boolean {
  return /^[a-f0-9]{24}(-klein)?\.webp$/.test(name);
}

export type BildFehler =
  | { art: "zuGross"; text: string }
  | { art: "keinBild"; text: string };

export interface BildErgebnis {
  /** Adresse der großen Fassung, z. B. „/bilder/ab12….webp". */
  url: string;
  breite: number;
  hoehe: number;
}

/**
 * Ein hochgeladenes Bild prüfen, umrechnen und ablegen.
 *
 * Wirft nicht, sondern liefert entweder Fehler ODER Ergebnis — der
 * Aufrufer kann also nicht versehentlich mit einem halben Ergebnis
 * weiterarbeiten.
 */
export async function bildAblegen(
  datei: File,
): Promise<{ fehler: BildFehler } | { fehler: null; bild: BildErgebnis }> {
  if (datei.size > MAX_BYTES) {
    return {
      fehler: {
        art: "zuGross",
        text: `Das Bild ist zu groß (${(datei.size / 1024 / 1024).toFixed(1)} MB). Erlaubt sind ${MAX_BYTES / 1024 / 1024} MB.`,
      },
    };
  }

  const roh = Buffer.from(await datei.arrayBuffer());

  let gross: Buffer;
  let klein: Buffer;
  let masse: OutputInfo;

  try {
    // .rotate() ohne Winkel wendet die EXIF-Drehung an. Danach sind die
    // Metadaten weg — sharp übernimmt sie nur mit withMetadata().
    const quelle = sharp(roh, { failOn: "error" }).rotate();

    gross = await quelle
      .clone()
      .resize({ width: BREIT, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    klein = await quelle
      .clone()
      .resize({ width: SCHMAL, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    masse = await sharp(gross).toBuffer({ resolveWithObject: true }).then((r) => r.info);
  } catch {
    // Bewusst ohne Einzelheiten: Die interne Fehlermeldung einer
    // Bildbibliothek hilft dem Bediener nicht und verrät mehr, als sie
    // soll.
    return {
      fehler: {
        art: "keinBild",
        text: "Diese Datei lässt sich nicht als Bild lesen. Bitte ein JPEG, PNG oder WebP wählen.",
      },
    };
  }

  const name = `${randomBytes(12).toString("hex")}.webp`;
  const ordner = verzeichnis();
  await mkdir(ordner, { recursive: true });
  await writeFile(path.join(ordner, name), gross);
  await writeFile(path.join(ordner, name.replace(/\.webp$/, "-klein.webp")), klein);

  return {
    fehler: null,
    bild: { url: `${BILDER_PFAD}/${name}`, breite: masse.width, hoehe: masse.height },
  };
}

/**
 * Beide Fassungen eines hochgeladenen Bildes löschen.
 *
 * Stillschweigend, wenn die Datei schon weg ist: Ein fehlender
 * Aufräumschritt darf das Speichern eines Events nicht scheitern
 * lassen. Adressen, die nicht von hier stammen (z. B. das
 * mitgelieferte /images/…), werden nicht angefasst.
 */
export async function bildLoeschen(url: string | null): Promise<void> {
  if (!istHochgeladen(url)) return;
  const name = url!.slice(BILDER_PFAD.length + 1);
  if (!nameIstErlaubt(name)) return;

  const ordner = verzeichnis();
  for (const datei of [name, name.replace(/\.webp$/, "-klein.webp")]) {
    await unlink(path.join(ordner, datei)).catch(() => {});
  }
}
