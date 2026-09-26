/* ---------------------------------------------------------------
   Freie Plätze.

   Entscheidende Regel: Gezählt werden PERSONEN, niemals
   Anmeldungen. Eine Familie mit sechs Personen belegt sechs
   Plätze. Würde man Anmeldungen zählen, zeigte die Seite noch
   freie Plätze an, während die Anlage längst voll ist — ein
   Fehler, der erst am Veranstaltungstag auffällt.
   --------------------------------------------------------------- */

export type Platzlage = "offen" | "wenige" | "ausgebucht" | "unbegrenzt";

export interface Platzstand {
  lage: Platzlage;
  frei: number;
  /** Nur bei „wenige" soll die Zahl im Text erscheinen. */
  zahlZeigen: boolean;
}

export function platzstand(
  maxPersonen: number | null,
  belegtePersonen: number,
  schwelle: number,
): Platzstand {
  if (maxPersonen === null) {
    return { lage: "unbegrenzt", frei: Number.POSITIVE_INFINITY, zahlZeigen: false };
  }

  const frei = Math.max(0, maxPersonen - Math.max(0, belegtePersonen));

  if (frei === 0) return { lage: "ausgebucht", frei: 0, zahlZeigen: false };
  if (frei <= schwelle) return { lage: "wenige", frei, zahlZeigen: true };
  return { lage: "offen", frei, zahlZeigen: false };
}

/* Hier stand einmal `passtGruppe(maxPersonen, belegtePersonen,
   gruppengroesse)`. Sie wurde von niemandem mehr aufgerufen und
   beantwortete dieselbe Frage wie `plaetzeReichen()` in
   lib/zahlungRegeln.ts — nur ohne die Ausnahme für die eigene, gerade
   zu bezahlende Anmeldung. Zwei Funktionen für dieselbe Frage, von
   denen die stillere die falschere ist, sind eine Falle für den
   nächsten Menschen, der hier etwas ändert. Deshalb entfernt.

   Die Frage „passt diese Gruppe noch?" beantwortet ausschliesslich
   `plaetzeReichen()`. */

/**
 * Welche Anmeldungen belegen einen Platz?
 *
 * Diese Regel steht bewusst an genau EINER Stelle. Sie wird von der
 * öffentlichen Anzeige (lib/events.ts), vom Adminbereich
 * (lib/adminDaten.ts) und von der Platzprüfung beim Anmelden benutzt.
 * Liefen die drei auseinander, zeigte die Seite freie Plätze an,
 * während die Anlage längst voll ist.
 *
 * Belegt ist ausschliesslich eine **bestätigte** Anmeldung — also
 * eine, für die bezahlt wurde (oder die bei einer kostenlosen
 * Veranstaltung sofort bestätigt wird).
 *
 * ── Geändert am 24.09.2026, Entscheidung von Adam ──
 *
 * Vorher galt zusätzlich: „Reservierungen, deren Frist noch läuft".
 * Ein bloßes Öffnen der Bezahlseite belegte damit sofort einen Platz
 * und erschien im Adminbereich als „1 Anmeldung · 1 Platz reserviert",
 * obwohl niemand bezahlt hatte. Wer die Seite nur ansah und wegklickte,
 * hielt den Platz eine halbe Stunde lang besetzt.
 *
 * Was das kostet, gehört ausgesprochen: Ein Platz wird jetzt NICHT
 * mehr gehalten, während jemand bezahlt. Stehen zwei Personen
 * gleichzeitig am letzten Platz, können beide bezahlen — und beide
 * Zahlungen gelten, denn Geld ist geflossen (siehe
 * app/zahlung/rueckmeldung/route.ts). Die Überbuchung wird im
 * Adminbereich ausgewiesen und muss von Hand geklärt werden. Das ist
 * der bewusst in Kauf genommene Preis dafür, dass eine unbezahlte
 * Anmeldung niemandem einen Platz wegnimmt.
 *
 * Seit dem 25.09.2026 entsteht eine Anmeldung ohnehin erst MIT der
 * bestätigten Zahlung (lib/anmeldungAnlegen.ts). Eine unbezahlte
 * Anmeldung gibt es nicht mehr — die Regel unten ist deshalb nicht
 * nur die richtige, sondern die einzig mögliche.
 */
export function belegtFilter() {
  return { status: "BESTAETIGT" as const };
}

/* Hier standen bis zum 26.09.2026 `offenerVersuchFilter()`,
   `ZAHLFRIST_MINUTEN` und `reserviertBis()`.

   Alle drei sind mit Stufe 2 entfallen, und zwar ersatzlos: Es gibt
   keinen offenen Zahlungsversuch mehr, den man zählen könnte. Vor der
   bestätigten Zahlung steht in der VERA-Datenbank nichts — keine
   Anmeldung, kein Teilnehmer, keine Frist. Wer hier etwas
   Vergleichbares wieder einführt, hebt genau diese Zusage auf. */
