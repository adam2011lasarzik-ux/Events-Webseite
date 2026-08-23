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

/** Passt eine Gruppe dieser Größe noch hinein? */
export function passtGruppe(
  maxPersonen: number | null,
  belegtePersonen: number,
  gruppengroesse: number,
): boolean {
  if (maxPersonen === null) return true;
  return belegtePersonen + gruppengroesse <= maxPersonen;
}
