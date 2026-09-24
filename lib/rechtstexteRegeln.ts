/* ---------------------------------------------------------------
   Versionierte Rechtstexte — die REINEN Regeln, ohne Datenbank.

   Herausgelöst aus lib/rechtstexte.ts am 24.09.2026. Der Grund ist
   praktisch: Das Werkzeug, das den Wortlaut aus content/de.ts in eine
   Datei schreibt (werkzeuge/rechtstextExport.ts), braucht die
   Prüfsumme — aber keine Datenbank. Solange beides in einer Datei
   stand, zog jeder Aufruf lib/db.ts mit und scheiterte ohne
   DATABASE_URL.

   Der Wortlaut dieser Regeln ist unverändert. Sie werden von
   lib/rechtstexte.ts weiterhin re-exportiert, damit bestehende
   Importe gültig bleiben und es weiterhin EINE Definition gibt.
   --------------------------------------------------------------- */

import { createHash } from "node:crypto";

/** Die Textarten, wie sie im Datenmodell heißen. */
export type Rechtstextart = "AGB_B2C" | "AGB_B2B" | "DATENSCHUTZ";

/** Alle Arten, für Prüfungen und Adminanzeige. */
export const RECHTSTEXTARTEN: Rechtstextart[] = ["AGB_B2C", "AGB_B2B", "DATENSCHUTZ"];

/** Wie die Arten in der Oberfläche heißen. */
export const ARTNAME: Record<Rechtstextart, string> = {
  AGB_B2C: "Teilnahmebedingungen (Verbraucher)",
  AGB_B2B: "Bedingungen für Geschäftskunden",
  DATENSCHUTZ: "Datenschutzerklärung",
};

/**
 * Die Prüfsumme über einen Wortlaut.
 *
 * Sie belegt nicht gegenüber Dritten, dass nichts geändert wurde — wer
 * die Zeile ändern kann, kann auch die Prüfsumme neu setzen. Sie macht
 * eine UNBEABSICHTIGTE Änderung aber sofort sichtbar, und genau dafür
 * ist sie da.
 *
 * Der Wortlaut wird vorher NICHT normalisiert: Ein geändertes
 * Leerzeichen ist eine geänderte Fassung. Wer den Text anfasst, legt
 * eine neue Version an.
 */
export function pruefsumme(inhalt: string): string {
  return createHash("sha256").update(inhalt, "utf8").digest("hex");
}

/** Die nächste freie Versionsnummer. Fassungen beginnen bei 1. */
export function naechsteVersion(vorhandene: number[]): number {
  return vorhandene.length === 0 ? 1 : Math.max(...vorhandene) + 1;
}

/** Das Nötigste, um zu entscheiden, welche Fassung gilt. */
export interface Fassung {
  id: string;
  version: number;
  gueltigAb: Date;
}

/**
 * Welche Fassung galt zu einem bestimmten Zeitpunkt?
 *
 * Die neueste, deren `gueltigAb` nicht NACH dem Zeitpunkt liegt —
 * **nicht** schlicht die neueste. Das ist der Unterschied, auf den es
 * ankommt: Eine Fassung, die erst morgen gilt, darf heute nicht
 * einbezogen werden, und eine Buchung von letztem Monat trägt die
 * Fassung von letztem Monat.
 *
 * Gibt es keine gültige Fassung, ist die Antwort null. Der Aufrufer
 * entscheidet, was das bedeutet — diese Funktion rät nicht.
 */
export function geltendeFassung<T extends Fassung>(fassungen: T[], zeitpunkt: Date): T | null {
  const gueltige = fassungen.filter((f) => f.gueltigAb.getTime() <= zeitpunkt.getTime());
  if (gueltige.length === 0) return null;
  return gueltige.reduce((a, b) => (a.version >= b.version ? a : b));
}

