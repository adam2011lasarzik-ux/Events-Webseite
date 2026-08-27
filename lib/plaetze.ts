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
 * Belegt sind:
 *   - bestätigte Anmeldungen
 *   - Reservierungen, deren Frist noch läuft
 *
 * Eine ABGELAUFENE Reservierung zählt nicht mehr — dafür wird nichts
 * gelöscht und nichts aufgeräumt, die Bedingung vergleicht einfach mit
 * der Uhrzeit. Ein Aufräumlauf im Hintergrund wäre auf geteiltem
 * Hosting nicht verlässlich; diese Lösung braucht keinen.
 */
export function belegtFilter(jetzt: Date = new Date()) {
  return {
    OR: [
      { status: "BESTAETIGT" as const },
      { status: "RESERVIERT" as const, reserviertBis: { gt: jetzt } },
    ],
  };
}

/** Wie lange ein Platz gehalten wird, während die Zahlung läuft. */
export const RESERVIERUNG_MINUTEN = 30;

export function reserviertBis(jetzt: Date = new Date()): Date {
  return new Date(jetzt.getTime() + RESERVIERUNG_MINUTEN * 60 * 1000);
}
