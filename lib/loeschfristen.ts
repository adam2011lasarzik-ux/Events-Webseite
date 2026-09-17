/* ---------------------------------------------------------------
   Die Fristen des Löschkonzepts.

   Reine Funktionen: keine Datenbank, kein Netzverkehr, keine Anzeige
   — nur Rechnungen und Entscheidungen. Dasselbe Vorgehen wie bei
   lib/preise.ts, lib/storno.ts und lib/plaetze.ts, damit sich jede
   Frist einzeln prüfen lässt, ohne einen einzigen echten Datensatz
   anzufassen.

   Grundlage: docs/rechtstexte-entwuerfe/13-loeschkonzept.md.

   Wer eine Frist ändern will, ändert sie HIER. Eine zweite Rechnung
   an anderer Stelle wäre der Weg zu zwei verschiedenen Ergebnissen.
   --------------------------------------------------------------- */

/** Die sieben Klassen. Entspricht dem Prisma-Enum `Loeschklasse`. */
export type Loeschklasse =
  | "GESUNDHEITSANGABEN"
  | "EINVERSTAENDNIS_VOLL"
  | "ZUSTIMMUNGSNACHWEIS"
  | "ANMELDEDATEN"
  | "CHECKLISTE"
  | "VORFALLAKTE"
  | "STEUERUNTERLAGEN";

/** Was mit einem fälligen Datensatz geschieht. */
export type Loeschaktion =
  /** Personenbezug überschreiben, Rest bleibt stehen. */
  | "anonymisieren"
  /** Datensatz vollständig entfernen. */
  | "loeschen"
  /** Papier — die Anwendung kann nur erinnern. */
  | "erinnern"
  /** Niemals automatisch anfassen. */
  | "niemals";

/* ── Die Fristen, an einer Stelle ──────────────────────────────── */

/** K1 — Gesundheits- und Notfallangaben, in Tagen nach Veranstaltungsende. */
export const GESUNDHEIT_TAGE = 7;
/** K2 — vollständige Einverständniserklärungen, in Jahren ab Jahresende. */
export const EINVERSTAENDNIS_JAHRE = 3;
/** K3 — reduzierter Zustimmungsnachweis, in Jahren ab Jahresende. */
export const ZUSTIMMUNGSNACHWEIS_JAHRE = 10;
/** K4 — Anmelde- und Check-in-Daten, in Jahren ab Jahresende. */
export const ANMELDEDATEN_JAHRE = 3;
/** K5 — Checkliste mit Personenbezug, in Jahren ab Jahresende. */
export const CHECKLISTE_JAHRE = 3;
/** K6 — Vorfallakte, leichte Einstufung, in Jahren ab Abschluss. */
export const VORFALL_LEICHT_JAHRE = 10;
/** K6 — Vorfallakte bei Personen- oder Gesundheitsschaden (§ 199 Abs. 2 BGB). */
export const VORFALL_SCHWER_JAHRE = 30;

/**
 * Welche Aktion gehört zu welcher Klasse?
 *
 * STEUERUNTERLAGEN steht bewusst mit "niemals" darin, statt zu
 * fehlen: Ein fehlender Eintrag wäre ein Versehen, ein ausdrückliches
 * "niemals" ist eine Aussage. Der Löschlauf prüft das und bricht ab,
 * wenn er auf diese Klasse stößt.
 */
export const AKTION_JE_KLASSE: Record<Loeschklasse, Loeschaktion> = {
  GESUNDHEITSANGABEN: "erinnern",
  EINVERSTAENDNIS_VOLL: "erinnern",
  ZUSTIMMUNGSNACHWEIS: "loeschen",
  ANMELDEDATEN: "anonymisieren",
  CHECKLISTE: "anonymisieren",
  VORFALLAKTE: "loeschen",
  STEUERUNTERLAGEN: "niemals",
};

/**
 * Darf der allgemeine Löschlauf diese Klasse überhaupt anfassen?
 *
 * Die Antwort ist für STEUERUNTERLAGEN immer nein. Diese Funktion ist
 * die technische Umsetzung der Vorgabe „Der allgemeine Löschlauf darf
 * diese Daten niemals löschen oder anonymisieren."
 */
export function darfLoeschlaufAnfassen(klasse: Loeschklasse): boolean {
  return AKTION_JE_KLASSE[klasse] !== "niemals";
}

/* ── Rechnen mit Fristen ───────────────────────────────────────── */

/**
 * Das Ende des Kalenderjahres, in dem der Zeitpunkt liegt.
 *
 * Mehrere Fristen rechnen „ab dem Ende des Kalenderjahres der
 * Veranstaltung" — dieselbe Systematik, die auch § 147 Abs. 4 AO für
 * die steuerlichen Fristen vorgibt. Der Startpunkt ist der 31.12.
 * 23:59:59.999 des Jahres.
 */
export function jahresende(zeitpunkt: Date): Date {
  return new Date(Date.UTC(zeitpunkt.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
}

/** Zeitpunkt plus eine Anzahl ganzer Jahre. */
export function plusJahre(zeitpunkt: Date, jahre: number): Date {
  const d = new Date(zeitpunkt.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + jahre);
  return d;
}

/** Zeitpunkt plus eine Anzahl Tage. */
export function plusTage(zeitpunkt: Date, tage: number): Date {
  return new Date(zeitpunkt.getTime() + tage * 24 * 60 * 60 * 1000);
}

/* ── Fälligkeit je Klasse ──────────────────────────────────────── */

/**
 * Wann werden Gesundheitsangaben fällig?
 *
 * Kurze Frist ab dem tatsächlichen Ende der Veranstaltung — nicht ab
 * Jahresende. Gesundheitsangaben sind die sensibelste Kategorie; sie
 * sollen so früh wie möglich verschwinden.
 */
export function faelligGesundheit(veranstaltungsende: Date): Date {
  return plusTage(veranstaltungsende, GESUNDHEIT_TAGE);
}

/** K2 — vollständige Einverständniserklärung: 3 Jahre ab Jahresende. */
export function faelligEinverstaendnis(veranstaltung: Date): Date {
  return plusJahre(jahresende(veranstaltung), EINVERSTAENDNIS_JAHRE);
}

/** K3 — reduzierter Nachweis: 10 Jahre ab Jahresende. */
export function faelligZustimmungsnachweis(veranstaltung: Date): Date {
  return plusJahre(jahresende(veranstaltung), ZUSTIMMUNGSNACHWEIS_JAHRE);
}

/** K4 — Anmelde- und Check-in-Daten: 3 Jahre ab Jahresende. */
export function faelligAnmeldedaten(veranstaltung: Date): Date {
  return plusJahre(jahresende(veranstaltung), ANMELDEDATEN_JAHRE);
}

/** K5 — Checkliste: 3 Jahre ab Jahresende. */
export function faelligCheckliste(veranstaltung: Date): Date {
  return plusJahre(jahresende(veranstaltung), CHECKLISTE_JAHRE);
}

/**
 * K6 — Vorfallakte: erst ab ABSCHLUSS, nicht ab Veranstaltung.
 *
 * Solange ein Fall offen ist, gibt es keine Fälligkeit. Das ist der
 * Grund für den Rückgabewert `null`: Ein offener Vorfall hat keinen
 * Startzeitpunkt, gegen den man rechnen könnte.
 */
export function faelligVorfall(
  abgeschlossenAm: Date | null,
  einstufung: "LEICHT" | "SCHWER",
): Date | null {
  if (!abgeschlossenAm) return null;
  const jahre = einstufung === "SCHWER" ? VORFALL_SCHWER_JAHRE : VORFALL_LEICHT_JAHRE;
  return plusJahre(abgeschlossenAm, jahre);
}

/* ── Fälligkeit prüfen ─────────────────────────────────────────── */

/**
 * Ist ein Datensatz fällig?
 *
 * `null` heißt „noch keine Fälligkeit bestimmbar" — etwa bei einem
 * offenen Vorfall oder einer Veranstaltung ohne Termin. Ein solcher
 * Datensatz ist NIE fällig. Das ist bewusst die vorsichtige Richtung:
 * Wer keinen Startzeitpunkt hat, wird nicht gelöscht.
 */
export function istFaellig(faelligAm: Date | null, jetzt: Date = new Date()): boolean {
  if (!faelligAm) return false;
  return jetzt.getTime() >= faelligAm.getTime();
}

/**
 * Wird ein Datensatz demnächst fällig?
 *
 * Für die Vorschau im Adminbereich: zeigt, was in den nächsten Tagen
 * ansteht, bevor der Lauf es anfasst.
 */
export function faelligInnerhalb(
  faelligAm: Date | null,
  tage: number,
  jetzt: Date = new Date(),
): boolean {
  if (!faelligAm) return false;
  const grenze = plusTage(jetzt, tage);
  return faelligAm.getTime() <= grenze.getTime();
}

/* ── Sperre ────────────────────────────────────────────────────── */

/** Der Ausschnitt einer Sperre, den die Entscheidung braucht. */
export interface Sperrangabe {
  grund: string;
  aufgehobenAm: Date | null;
}

/**
 * Ist dieser Datensatz gesperrt?
 *
 * Eine Sperre gilt, solange sie nicht ausdrücklich aufgehoben wurde.
 * Mehrere Sperren auf demselben Datensatz sind zulässig — es genügt
 * eine offene, damit nichts gelöscht wird.
 */
export function istGesperrt(sperren: Sperrangabe[]): boolean {
  return sperren.some((s) => s.aufgehobenAm === null);
}

/** Die Gründe aller offenen Sperren, für das Protokoll. */
export function offeneSperrgruende(sperren: Sperrangabe[]): string[] {
  return sperren.filter((s) => s.aufgehobenAm === null).map((s) => s.grund);
}

/* ── Die zusammenfassende Entscheidung ─────────────────────────── */

export type Loeschentscheidung =
  | { handeln: true; aktion: Exclude<Loeschaktion, "niemals"> }
  | { handeln: false; grund: "steuerrelevant" | "gesperrt" | "nicht-faellig" | "kein-termin" };

/**
 * Die eine Entscheidung, die der Löschlauf je Datensatz trifft.
 *
 * Reihenfolge der Prüfungen ist Absicht und darf nicht getauscht
 * werden:
 *
 *   1. Steuerrelevant?  → niemals anfassen, noch vor allem anderen.
 *   2. Gesperrt?        → nichts tun, auch wenn längst fällig.
 *   3. Fälligkeit da?   → ohne Startzeitpunkt wird nicht gelöscht.
 *   4. Fällig?          → erst dann handeln.
 *
 * Wer 1 und 2 vertauscht, könnte einen steuerrelevanten Datensatz
 * anfassen, nur weil zufällig keine Sperre darauf lag.
 */
export function entscheide(
  klasse: Loeschklasse,
  faelligAm: Date | null,
  sperren: Sperrangabe[],
  jetzt: Date = new Date(),
): Loeschentscheidung {
  if (!darfLoeschlaufAnfassen(klasse)) {
    return { handeln: false, grund: "steuerrelevant" };
  }
  if (istGesperrt(sperren)) {
    return { handeln: false, grund: "gesperrt" };
  }
  if (!faelligAm) {
    return { handeln: false, grund: "kein-termin" };
  }
  if (!istFaellig(faelligAm, jetzt)) {
    return { handeln: false, grund: "nicht-faellig" };
  }
  const aktion = AKTION_JE_KLASSE[klasse];
  // Nach darfLoeschlaufAnfassen() kann das kein "niemals" mehr sein.
  return { handeln: true, aktion: aktion as Exclude<Loeschaktion, "niemals"> };
}
