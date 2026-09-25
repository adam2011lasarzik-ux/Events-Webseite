/* ---------------------------------------------------------------
   Die Anmeldedaten verschlüsselt durch den Zahlungsanbieter tragen.

   Hintergrund (Entscheidung vom 25.09.2026): Vor einer erfolgreichen
   Zahlung darf in der VERA-Datenbank NICHTS gespeichert werden —
   keine Anmeldung, kein Teilnehmer, keine Platzsperre, kein
   Zahlungsversuch. Die Formulardaten müssen die Zeit zwischen dem
   Absenden und der bestätigten Zahlung trotzdem überdauern.

   Sie tun das hier: verschlüsselt, in der `metadata` der
   Checkout-Sitzung. Der Anbieter verwahrt eine Zeichenkette, die nur
   dieser Server lesen kann; kommt die Zahlung zurück, wird sie wieder
   aufgeschlossen und erst dann entsteht die Anmeldung.

   ── Was diese Datei bewusst NICHT tut ───────────────────────────

   Sie kennt weder Datenbank noch Netz. Das ist kein Schönheitspunkt:
   Das Werkzeug, das die Größe misst, und die Prüfliste müssen sie
   ohne DATABASE_URL benutzen können — und eine reine Funktion lässt
   sich vollständig prüfen, eine mit Datenbank nur teilweise. Dasselbe
   Vorgehen wie in lib/preise.ts und lib/storno.ts.

   ── Der Aufbau einer Marke ──────────────────────────────────────

       v1.<schlüsselkennung>.<zufallswert>.<geheimtext+siegel>

   Vier Teile, durch Punkte getrennt, jeder für sich base64url:

   * `v1` — die Fassung des Formats. Ändert sich der Aufbau, steht
     hier `v2`, und alte Marken bleiben lesbar.
   * `schlüsselkennung` — die ersten Stellen des Fingerabdrucks des
     Schlüssels. Damit ist beim Entschlüsseln klar, WELCHER Schlüssel
     gemeint ist, ohne zu raten. Genau das macht den Schlüsselwechsel
     möglich: Zwei Schlüssel können nebeneinander gelten, jede Marke
     sagt selbst, zu welchem sie gehört.
   * `zufallswert` — zwölf Byte, für jede Marke neu. Derselbe Klartext
     ergibt nie zweimal denselben Geheimtext.
   * `geheimtext+siegel` — AES-256-GCM. Das Siegel (16 Byte) hängt
     hinten an.

   ── Warum GCM und nicht bloß „verschlüsselt" ────────────────────

   AES-GCM verschlüsselt UND versiegelt. Ein verändertes Byte lässt
   das Aufschließen fehlschlagen — es gibt kein „entschlüsselt sich
   eben falsch". Zusätzlich gehen Veranstaltungskennung und Preis als
   MITVERSIEGELTE Zusatzdaten ein, ohne selbst im Geheimtext zu
   stehen: Eine Marke, die an eine andere Veranstaltung oder an einen
   anderen Betrag gehängt wird, lässt sich nicht öffnen. Damit ist der
   Weg versperrt, eine gültige Marke für eine teure Buchung an eine
   billige Zahlung zu heften.

   ── Warum vorher gepackt wird ───────────────────────────────────

   Eine Familie mit vielen Personen und langen Namen kommt roh auf
   knapp 5000 Zeichen. Gepackt bleiben davon im schlimmsten Fall rund
   3800 Zeichen — gemessen, nicht geschätzt. Der Anbieter nimmt
   Felder zu je 500 Zeichen; am 25.09.2026 wurde gegen die echte
   Schnittstelle belegt, dass 20 solcher Felder durchgehen. Gebraucht
   werden 8.
   --------------------------------------------------------------- */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { gunzipSync, gzipSync, constants as zlibWerte } from "node:zlib";

/** Die Fassung des Markenformats. Steht vorn in jeder Marke. */
export const MARKENFASSUNG = "v1";

/**
 * Wie lange eine Marke höchstens gilt.
 *
 * 24 Stunden, weil eine Bezahlseite beim Anbieter längstens so lange
 * lebt. Eine Marke, die älter ist, kann zu keiner offenen Zahlung
 * mehr gehören — sie anzunehmen hiesse, einem beliebig alten Zettel
 * zu glauben.
 */
export const HOECHSTALTER_MINUTEN = 24 * 60;

/** Eine teilnehmende Person, so knapp wie möglich geschrieben. */
export interface NutzlastTeilnehmer {
  vorname: string;
  nachname: string;
  /** „S" für Schüler, „E" für Erwachsene — je ein Zeichen statt eines Wortes. */
  typ: "S" | "E";
  geburtsjahr?: number;
}

/** Alles, was eine Anmeldung ausmacht — ohne eine Zeile Datenbank. */
export interface Nutzlast {
  eventId: string;
  kontaktVorname: string;
  kontaktNachname: string;
  kontaktEmail: string;
  kontaktTelefon: string | null;
  buchungsart: "EINZEL" | "FAMILIE";
  istVormundBuchung: boolean;
  einwilligungVormund: boolean;
  agbAkzeptiert: boolean;
  kenntnisAufnahmen: boolean;
  gesamtpreisCents: number;
  /** Welche Fassungen der Rechtstexte beim ABSENDEN galten. */
  agbFassungId: string | null;
  datenschutzFassungId: string | null;
  teilnehmer: NutzlastTeilnehmer[];
  /** Millisekunden seit 1970, gesetzt beim Verschlüsseln. */
  erstelltMs: number;
}

/** Ein Schlüssel mit seiner Kennung. */
export interface Schluessel {
  kennung: string;
  bytes: Buffer;
}

/**
 * Der Schlüsselbund: einer zum Verschlüsseln, beliebig viele zum
 * Aufschliessen.
 *
 * Genau so läuft ein Schlüsselwechsel ab: Der neue Schlüssel kommt
 * nach `aktuell`, der alte bleibt eine Zeit lang in `weitere`. Marken,
 * die noch mit dem alten unterwegs sind, lassen sich weiter öffnen;
 * neue entstehen nur noch mit dem neuen. Nach 24 Stunden — der
 * längsten Lebensdauer einer Bezahlseite — kann der alte weg.
 */
export interface Schluesselbund {
  aktuell: Schluessel;
  weitere: Schluessel[];
}

/** Wird geworfen, wenn eine Marke nicht angenommen werden darf. */
export class MarkeUngueltig extends Error {
  constructor(readonly grund: MarkenFehler, hinweis?: string) {
    super(hinweis ?? grund);
    this.name = "MarkeUngueltig";
  }
}

export type MarkenFehler =
  | "aufbau"
  | "fassung"
  | "schluessel-unbekannt"
  | "siegel"
  | "inhalt"
  | "abgelaufen";

/**
 * Die Kennung eines Schlüssels: die ersten acht Stellen seines
 * SHA-256-Fingerabdrucks.
 *
 * Bewusst abgeleitet und nicht frei vergeben. Eine von Hand vergebene
 * Nummer wäre die erste Stelle, an der jemand beim Wechsel zweimal
 * dieselbe benutzt — und dann zeigte die Marke auf den falschen
 * Schlüssel. Acht Stellen reichen: Sie müssen nur zwei oder drei
 * gleichzeitig gültige Schlüssel auseinanderhalten, nicht die Welt.
 *
 * Der Fingerabdruck verrät den Schlüssel nicht; SHA-256 lässt sich
 * nicht umkehren, und aus acht Stellen erst recht nichts gewinnen.
 */
export function schluesselKennung(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 8);
}

/** Aus rohen Bytes einen Schlüssel mit Kennung machen. */
export function alsSchluessel(bytes: Buffer): Schluessel {
  if (bytes.length !== 32) {
    throw new Error(`Ein Schlüssel muss 32 Byte lang sein, dieser hat ${bytes.length}.`);
  }
  return { kennung: schluesselKennung(bytes), bytes };
}

/* ── Die mitversiegelten Zusatzdaten ──────────────────────────────
   Sie stehen NICHT im Geheimtext, gehen aber in das Siegel ein. Wer
   die Marke an eine andere Veranstaltung oder an einen anderen Betrag
   hängt, kann sie nicht mehr öffnen. */
function zusatzdaten(eventId: string, preisCents: number): Buffer {
  return Buffer.from(`${eventId}|${preisCents}`, "utf8");
}

/**
 * Aus einer Nutzlast eine Marke machen.
 *
 * `erstelltMs` wird hier gesetzt, nicht vom Aufrufer übernommen —
 * ein vom Aufrufer gewählter Zeitpunkt wäre die erste Stelle, an der
 * jemand versehentlich eine unbegrenzt haltbare Marke erzeugt.
 */
export function verschluesseln(
  nutzlast: Omit<Nutzlast, "erstelltMs">,
  bund: Schluesselbund,
  jetzt: Date = new Date(),
): string {
  const vollstaendig: Nutzlast = { ...nutzlast, erstelltMs: jetzt.getTime() };

  const gepackt = gzipSync(Buffer.from(JSON.stringify(vollstaendig), "utf8"), {
    level: zlibWerte.Z_BEST_COMPRESSION,
  });

  const zufallswert = randomBytes(12);
  const schloss = createCipheriv("aes-256-gcm", bund.aktuell.bytes, zufallswert);
  schloss.setAAD(zusatzdaten(nutzlast.eventId, nutzlast.gesamtpreisCents));
  const geheim = Buffer.concat([schloss.update(gepackt), schloss.final(), schloss.getAuthTag()]);

  return [
    MARKENFASSUNG,
    bund.aktuell.kennung,
    zufallswert.toString("base64url"),
    geheim.toString("base64url"),
  ].join(".");
}

/**
 * Eine Marke wieder aufschliessen.
 *
 * Veranstaltungskennung und Betrag muss der Aufrufer mitbringen — er
 * hat sie aus der Rückmeldung des Anbieters, nicht aus der Marke.
 * Stimmen sie nicht mit dem überein, was beim Verschlüsseln galt,
 * scheitert das Siegel. Genau das ist der Sinn: Die Marke allein
 * beweist nichts, erst ihr Zusammenspiel mit der Zahlung.
 */
export function entschluesseln(
  marke: string,
  bund: Schluesselbund,
  pruefung: {
    eventId: string;
    preisCents: number;
    jetzt?: Date;
    hoechstalterMinuten?: number;
  },
): Nutzlast {
  const teile = marke.split(".");
  if (teile.length !== 4) {
    throw new MarkeUngueltig("aufbau", `Erwartet vier Teile, gefunden ${teile.length}.`);
  }
  const [fassung, kennung, zufallRoh, geheimRoh] = teile;

  if (fassung !== MARKENFASSUNG) {
    throw new MarkeUngueltig("fassung", `Unbekannte Markenfassung „${fassung}".`);
  }

  const passend = [bund.aktuell, ...bund.weitere].find((s) => s.kennung === kennung);
  if (!passend) {
    /* Der Fall, der einen Schlüsselwechsel schiefgehen lässt: Der alte
       Schlüssel wurde entfernt, während noch Marken mit ihm unterwegs
       waren. Deshalb steht die Kennung im Klartext in der Meldung —
       sie verrät nichts und sagt sofort, welcher Schlüssel fehlt. */
    throw new MarkeUngueltig(
      "schluessel-unbekannt",
      `Zu der Kennung „${kennung}" ist kein Schlüssel hinterlegt.`,
    );
  }

  let gepackt: Buffer;
  try {
    const zufallswert = Buffer.from(zufallRoh, "base64url");
    const geheim = Buffer.from(geheimRoh, "base64url");
    if (zufallswert.length !== 12 || geheim.length < 17) {
      throw new Error("Längen passen nicht.");
    }
    const siegel = geheim.subarray(geheim.length - 16);
    const rumpf = geheim.subarray(0, geheim.length - 16);

    const schloss = createDecipheriv("aes-256-gcm", passend.bytes, zufallswert);
    schloss.setAAD(zusatzdaten(pruefung.eventId, pruefung.preisCents));
    schloss.setAuthTag(siegel);
    gepackt = Buffer.concat([schloss.update(rumpf), schloss.final()]);
  } catch {
    /* Hierher führen ALLE Wege der Fälschung: verändertes Byte,
       falsche Veranstaltung, falscher Betrag, abgeschnittene Marke.
       Sie werden bewusst nicht unterschieden — wer probiert, soll
       nicht erfahren, welcher Teil nicht gepasst hat. */
    throw new MarkeUngueltig("siegel", "Das Siegel der Marke passt nicht.");
  }

  let nutzlast: Nutzlast;
  try {
    nutzlast = JSON.parse(gunzipSync(gepackt).toString("utf8")) as Nutzlast;
  } catch {
    throw new MarkeUngueltig("inhalt", "Der Inhalt der Marke ist unlesbar.");
  }

  if (!istNutzlast(nutzlast)) {
    throw new MarkeUngueltig("inhalt", "Der Inhalt der Marke ist unvollständig.");
  }

  const jetzt = pruefung.jetzt ?? new Date();
  const hoechstalter = pruefung.hoechstalterMinuten ?? HOECHSTALTER_MINUTEN;
  if (jetzt.getTime() - nutzlast.erstelltMs > hoechstalter * 60_000) {
    throw new MarkeUngueltig("abgelaufen", "Die Marke ist zu alt.");
  }

  return nutzlast;
}

/**
 * Sieht das, was aus der Marke kam, wirklich wie eine Nutzlast aus?
 *
 * Das Siegel beweist, dass NIEMAND FREMDES den Inhalt geschrieben
 * hat — nicht, dass er zu dieser Fassung des Programms passt. Eine
 * Marke aus einer älteren Fassung ist echt und trotzdem unbrauchbar.
 * Deshalb die Prüfung; ohne sie liefe ein fehlendes Feld später als
 * `undefined` in die Datenbank.
 */
function istNutzlast(w: unknown): w is Nutzlast {
  if (typeof w !== "object" || w === null) return false;
  const n = w as Record<string, unknown>;
  const text = (x: unknown) => typeof x === "string" && x.length > 0;
  const jaNein = (x: unknown) => typeof x === "boolean";

  if (!text(n.eventId) || !text(n.kontaktVorname) || !text(n.kontaktNachname)) return false;
  if (!text(n.kontaktEmail)) return false;
  if (!(n.kontaktTelefon === null || typeof n.kontaktTelefon === "string")) return false;
  if (n.buchungsart !== "EINZEL" && n.buchungsart !== "FAMILIE") return false;
  if (!jaNein(n.istVormundBuchung) || !jaNein(n.einwilligungVormund)) return false;
  if (!jaNein(n.agbAkzeptiert) || !jaNein(n.kenntnisAufnahmen)) return false;
  if (typeof n.gesamtpreisCents !== "number" || !Number.isInteger(n.gesamtpreisCents)) return false;
  if (typeof n.erstelltMs !== "number" || !Number.isFinite(n.erstelltMs)) return false;
  if (!(n.agbFassungId === null || typeof n.agbFassungId === "string")) return false;
  if (!(n.datenschutzFassungId === null || typeof n.datenschutzFassungId === "string")) return false;

  if (!Array.isArray(n.teilnehmer) || n.teilnehmer.length === 0) return false;
  return n.teilnehmer.every((t) => {
    if (typeof t !== "object" || t === null) return false;
    const p = t as Record<string, unknown>;
    if (!text(p.vorname) || !text(p.nachname)) return false;
    if (p.typ !== "S" && p.typ !== "E") return false;
    return p.geburtsjahr === undefined || typeof p.geburtsjahr === "number";
  });
}
