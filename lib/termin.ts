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
