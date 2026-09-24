/* ---------------------------------------------------------------
   Versionierte Rechtstexte — die Regeln an EINER Stelle.

   Hintergrund: Entscheidung 6.7 (20.09.2026). Maßgeblich für einen
   Vertrag ist immer die Fassung, die bei VERTRAGSSCHLUSS einbezogen
   wurde. Ändert VERA die Bedingungen später, gilt für Altbuchungen
   weiterhin die alte. Ohne ein Archiv liesse sich zwei Jahre später
   nicht mehr belegen, welche das war — und die Git-Historie ist
   gegenüber einem Kunden kein Nachweis, sondern ein internes
   Werkzeug, das VERA selbst ändern kann.

   Zwei Dinge sind bewusst getrennt:

     - die REINEN Regeln (Prüfsumme, nächste Version, welche Fassung
       gilt) — ohne Datenbank, einzeln prüfbar, so wie in
       lib/preise.ts und lib/storno.ts. Sie stehen seit dem 24.09.2026
       in lib/rechtstexteRegeln.ts, weil das Werkzeug, das den
       Wortlaut in eine Datei schreibt, sie ohne DATABASE_URL braucht.
       Diese Datei reicht sie weiter, damit es nur EINE Definition
       gibt;
     - die Datenbankzugriffe, die darauf aufbauen — ab hier.

   Prüfliste U prüft beides getrennt.
   --------------------------------------------------------------- */

import { db } from "./db";
import {
  pruefsumme,
  naechsteVersion,
  geltendeFassung,
  RECHTSTEXTARTEN,
  ARTNAME,
  type Rechtstextart,
  type Fassung,
} from "./rechtstexteRegeln";

/* Die reinen Regeln stehen seit dem 24.09.2026 in
   lib/rechtstexteRegeln.ts — sie müssen ohne Datenbank benutzbar
   sein (werkzeuge/rechtstextExport.ts). Hier werden sie
   weitergereicht, damit jeder bestehende Import weiter gilt und es
   trotzdem nur EINE Definition gibt. */
export {
  pruefsumme,
  naechsteVersion,
  geltendeFassung,
  RECHTSTEXTARTEN,
  ARTNAME,
  type Rechtstextart,
  type Fassung,
};

/* ── Ab hier mit Datenbank ──────────────────────────────────────── */

/** Wird geworfen, wenn jemand eine bestehende Fassung ändern will. */
export class FassungUnveraenderbar extends Error {
  constructor(art: Rechtstextart, version: number) {
    super(
      `Die Fassung ${art} v${version} besteht bereits und darf nicht geändert werden. ` +
        `Eine Änderung am Wortlaut ist eine NEUE Fassung.`,
    );
    this.name = "FassungUnveraenderbar";
  }
}

/**
 * Eine neue Fassung anlegen — der einzige Weg, einen Rechtstext in die
 * Datenbank zu bringen.
 *
 * Es gibt bewusst KEINE Funktion zum Ändern. Wer den Wortlaut
 * anfasst, legt eine neue Version an; die alte bleibt stehen, weil
 * Buchungen auf sie verweisen. Genau das ist mit „unveränderbar"
 * gemeint.
 *
 * Die Versionsnummer wird hier vergeben, nicht vom Aufrufer. Eine
 * vom Aufrufer gewählte Nummer wäre die erste Stelle, an der jemand
 * versehentlich eine bestehende Fassung überschreibt.
 */
export async function fassungAnlegen(
  art: Rechtstextart,
  inhalt: string,
  datum: Date,
  gueltigAb: Date = datum,
): Promise<{ id: string; version: number }> {
  const vorhandene = await db.rechtstext.findMany({
    where: { art },
    select: { version: true },
  });
  const version = naechsteVersion(vorhandene.map((v) => v.version));

  try {
    const neu = await db.rechtstext.create({
      data: { art, version, datum, gueltigAb, inhalt, pruefsumme: pruefsumme(inhalt) },
      select: { id: true, version: true },
    });
    return neu;
  } catch {
    /* Zwei gleichzeitige Aufrufe könnten dieselbe Nummer wählen. Der
       eindeutige Index (art, version) fängt das ab — und dass er es
       tut, ist der eigentliche Schutz. */
    throw new FassungUnveraenderbar(art, version);
  }
}

/**
 * Die Fassung, die für einen Vertragsschluss JETZT einzubeziehen ist.
 *
 * Gibt null zurück, wenn es für diese Art noch keine gültige Fassung
 * gibt. Der Aufrufer muss das behandeln — stillschweigend „keine"
 * anzunehmen wäre der Fehler, der später nicht mehr belegbar ist.
 */
export async function geltendeFassungJetzt(
  art: Rechtstextart,
  jetzt: Date = new Date(),
): Promise<{ id: string; version: number; datum: Date; inhalt: string } | null> {
  const fassungen = await db.rechtstext.findMany({
    where: { art, gueltigAb: { lte: jetzt } },
    orderBy: { version: "desc" },
    take: 1,
    select: { id: true, version: true, datum: true, inhalt: true },
  });
  return fassungen[0] ?? null;
}

/** Alle Fassungen einer Art, neueste zuerst — für den Adminbereich. */
export async function alleFassungen(art: Rechtstextart) {
  return db.rechtstext.findMany({
    where: { art },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      datum: true,
      gueltigAb: true,
      pruefsumme: true,
      erstelltAm: true,
      _count: { select: { anmeldungenAgb: true, anmeldungenDatenschutz: true } },
    },
  });
}

/**
 * Stimmt der gespeicherte Wortlaut noch mit seiner Prüfsumme überein?
 *
 * Der Wächter gegen die unbeabsichtigte Änderung. Wird im Adminbereich
 * angezeigt und von Prüfliste U geprüft.
 */
export async function fassungenUnversehrt(): Promise<
  { id: string; art: Rechtstextart; version: number }[]
> {
  const alle = await db.rechtstext.findMany({
    select: { id: true, art: true, version: true, inhalt: true, pruefsumme: true },
  });
  return alle
    .filter((f) => pruefsumme(f.inhalt) !== f.pruefsumme)
    .map(({ id, art, version }) => ({ id, art: art as Rechtstextart, version }));
}

/**
 * Die Fassungen, die für EINE Buchung gelten — für die Mail.
 *
 * Bewusst die Fassungen der Buchung, nicht die heute geltenden. Eine
 * Zahlungsbestätigung kann Wochen nach dem Vertragsschluss hinausgehen;
 * sie muss denselben Wortlaut tragen wie die Anmeldebestätigung, sonst
 * bekäme derselbe Kunde zwei verschiedene Vertragstexte zu einem
 * Vertrag.
 *
 * Buchungen von vor dieser Änderung haben keine Fassung hinterlegt —
 * dann bleibt die Liste leer und die Mail geht ohne Anhang hinaus. Das
 * ist richtig so: Einen Text anzuhängen, der damals nicht galt, wäre
 * schlechter als keiner.
 */
export async function fassungenZurBuchung(
  anmeldungId: string,
): Promise<{ art: string; version: number; datum: Date; inhalt: string }[]> {
  const a = await db.registration.findUnique({
    where: { id: anmeldungId },
    select: {
      agbFassung: { select: { art: true, version: true, datum: true, inhalt: true } },
      datenschutzFassung: { select: { art: true, version: true, datum: true, inhalt: true } },
    },
  });
  if (!a) return [];
  return [a.agbFassung, a.datenschutzFassung]
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .map((f) => ({
      art: ARTNAME[f.art as Rechtstextart],
      version: f.version,
      datum: f.datum,
      inhalt: f.inhalt,
    }));
}
