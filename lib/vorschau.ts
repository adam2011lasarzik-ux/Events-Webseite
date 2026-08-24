/* ---------------------------------------------------------------
   Welche Personen-Bereiche das spätere Anmeldeformular zeigen muss.

   Diese Funktion arbeitet mit derselben `Auswahl`, aus der auch
   lib/preise.ts den Gesamtpreis errechnet. Dadurch können
   Zusammenfassung und Formular-Vorschau nicht auseinanderlaufen —
   genau das war vorher der Fehler: Die Vorschau hatte ihre eigene,
   fest verdrahtete Liste und blieb bei einem Schüler stehen, während
   der Zähler längst weitergelaufen war.

   Hier steht bewusst KEIN Text, nur die Rollen. Die Übersetzung in
   Überschriften übernimmt die Anzeige — so bleibt die Logik
   sprachunabhängig und einzeln prüfbar.
   --------------------------------------------------------------- */

import type { Auswahl } from "./preise";

export type Anmeldeweg = "selbst" | "kind" | "familie";

export type Vorschaurolle =
  /** Einzelanmeldung: eine Person, die sich selbst anmeldet. */
  | { rolle: "selbst" }
  /** `kontakt` markiert die Person, über die wir die Anmeldung erreichen. */
  | { rolle: "erwachsener"; nummer: number; kontakt: boolean }
  | { rolle: "schueler"; nummer: number }
  /** Erziehungsberechtigte:r — Vertragspartner, nicht zwingend Teilnehmer. */
  | { rolle: "elternteil" };

/** Braucht diese Rolle E-Mail und Telefon, oder reicht der Name? */
export function brauchtKontaktdaten(rolle: Vorschaurolle): boolean {
  return (
    rolle.rolle === "selbst" ||
    rolle.rolle === "elternteil" ||
    (rolle.rolle === "erwachsener" && rolle.kontakt)
  );
}

export function vorschauRollen(weg: Anmeldeweg, auswahl: Auswahl): Vorschaurolle[] {
  if (weg === "selbst") {
    return [{ rolle: "selbst" }];
  }

  const schueler: Vorschaurolle[] = Array.from(
    { length: Math.max(0, auswahl.schueler) },
    (_, i) => ({ rolle: "schueler", nummer: i + 1 }),
  );

  if (weg === "kind") {
    // Der Elternteil wird genau einmal abgefragt, egal wie viele
    // Kinder angemeldet werden — und auch dann, wenn er selbst nicht
    // mitspielt, denn er schließt den Vertrag ab.
    return [...schueler, { rolle: "elternteil" }];
  }

  // Familienpaket: Der erste Erwachsene ist zugleich die
  // Kontaktperson, alle weiteren brauchen nur ihren Namen.
  const erwachsene: Vorschaurolle[] = Array.from(
    { length: Math.max(0, auswahl.erwachsene) },
    (_, i) => ({ rolle: "erwachsener", nummer: i + 1, kontakt: i === 0 }),
  );

  return [...erwachsene, ...schueler];
}
