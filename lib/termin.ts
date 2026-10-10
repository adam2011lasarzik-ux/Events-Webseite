/**
 * Steht der Termin einer Veranstaltung fest?
 *
 * Hintergrund (Entscheidung 2.5 vom 18.09.2026): Ticketverkauf und
 * Buchung sind erst möglich, wenn **Datum und Uhrzeit feststehen**.
 * Veranstaltungen mit „Termin folgt" dürfen nur angekündigt werden und
 * haben keinen Kaufknopf.
 *
 * Warum das eine eigene Datei ist: Die Regel wird an vier Stellen
 * gebraucht — beim Anlegen einer Anmeldung, beim Starten einer
 * Bezahlung, auf der Anmeldeseite und an den Knöpfen, die dorthin
 * führen. Vier Kopien derselben Bedingung laufen früher oder später
 * auseinander; dann ist der Knopf ausgeblendet, aber die Serveraktion
 * lässt die Buchung trotzdem durch.
 *
 * Die Funktion ist bewusst auf ein Feld beschränkt: `startAt` trägt in
 * diesem Projekt Datum **und** Uhrzeit. Ein zusätzliches Ende (`endAt`)
 * ist für die Buchbarkeit nicht erforderlich und wird deshalb hier auch
 * nicht geprüft.
 */

/** Die Datenbankform: ein Zeitpunkt oder nichts. */
export interface EventMitStart {
  startAt: Date | null;
}

/** Die Anzeigeform aus `lib/events.ts`: ein Datumstext oder nichts. */
export interface EventMitDatum {
  datum: string | null;
}

/** Datenbankform — steht ein Termin fest? */
export function terminSteht(event: EventMitStart): boolean {
  return event.startAt !== null;
}

/** Anzeigeform — steht ein Termin fest? */
export function terminStehtAnzeige(event: EventMitDatum): boolean {
  return event.datum !== null;
}

/* ─────────────────────────────────────────────────────────────────
   Ob eine Anmeldung MÖGLICH ist, hängt an mehr als „Datum gesetzt":
   Eine Veranstaltung, die schon vorbei ist, darf keine Tickets mehr
   verkaufen; ebenso außerhalb des Anmeldefensters (anmeldungAb /
   anmeldungBis). Das wird — wie terminSteht — an EINER Stelle
   entschieden, damit Anzeige (Knopf, Formular) und Server (Aktion,
   Bezahlstart) nicht auseinanderlaufen.
   ───────────────────────────────────────────────────────────────── */

export type AnmeldeStatus =
  | "offen"
  | "kein-termin"
  | "noch-nicht-offen"
  | "anmeldeschluss"
  | "vorbei";

/** Die für die Buchbarkeit maßgeblichen Zeitpunkte (DB-Form). */
export interface EventFenster {
  startAt: Date | null;
  endAt: Date | null;
  anmeldungAb: Date | null;
  anmeldungBis: Date | null;
}

/**
 * In welchem Zustand ist die Anmeldung dieser Veranstaltung?
 *
 * Reihenfolge der Prüfung ist Absicht: ohne Termin gibt es nichts zu
 * buchen; davor ist sie „noch nicht offen"; ist die Veranstaltung
 * vorbei, ist das die treffendste Auskunft; sonst entscheidet die
 * Anmeldefrist.
 */
export function anmeldeStatus(event: EventFenster, jetzt: Date = new Date()): AnmeldeStatus {
  if (!event.startAt) return "kein-termin";
  if (event.anmeldungAb && jetzt.getTime() < event.anmeldungAb.getTime()) return "noch-nicht-offen";
  const ende = event.endAt ?? event.startAt;
  if (jetzt.getTime() > ende.getTime()) return "vorbei";
  if (event.anmeldungBis && jetzt.getTime() > event.anmeldungBis.getTime()) return "anmeldeschluss";
  return "offen";
}

/** Darf jetzt gebucht werden? (DB-Form, serverseitig maßgeblich.) */
export function anmeldungOffen(event: EventFenster, jetzt: Date = new Date()): boolean {
  return anmeldeStatus(event, jetzt) === "offen";
}

/** Anzeigeform — ist der „Anmelden"-Weg offen? */
export function anmeldungOffenAnzeige(event: { anmeldeStatus: AnmeldeStatus }): boolean {
  return event.anmeldeStatus === "offen";
}
