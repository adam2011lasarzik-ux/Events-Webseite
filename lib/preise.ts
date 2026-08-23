/* ---------------------------------------------------------------
   Preisberechnung — die einzige Stelle im Projekt, an der Preise
   berechnet werden.

   Warum an nur einer Stelle: Sobald Anzeige und Server getrennt
   rechnen, liefern sie früher oder später verschiedene Beträge.
   Der Besucher sieht dann einen anderen Preis als den, der
   abgebucht wird. Bei Geld ist das kein Schönheitsfehler.

   Warum Cent statt Euro: Kommazahlen rechnen minimal ungenau
   (0.1 + 0.2 ergibt nicht exakt 0.3). Bei Geld führt das zu
   Summen, die nicht aufgehen. Ganze Cent-Zahlen sind exakt.
   --------------------------------------------------------------- */

export type TeilnehmerTyp = "student" | "adult";
export type Buchungsart = "single" | "family";

export interface Familienpaket {
  /** Grundpreis, deckt die unten genannten Personen ab. */
  basisCents: number;
  enthalteneErwachsene: number;
  enthalteneSchueler: number;
  /** Preis je Schüler über die enthaltenen hinaus. */
  weitererSchuelerCents: number;
  /** Obergrenze Schüler je Familienbuchung. */
  maxSchueler: number;
}

export interface Preisregeln {
  schuelerCents: number;
  erwachsenerCents: number;
  familie: Familienpaket | null;
}

export interface Auswahl {
  art: Buchungsart;
  schueler: number;
  erwachsene: number;
}

export interface Posten {
  bezeichnung: string;
  anzahl: number;
  einzelCents: number;
  summeCents: number;
}

export interface Preisergebnis {
  gesamtCents: number;
  personen: number;
  posten: Posten[];
}

const ganzZahl = (wert: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(Number.isFinite(wert) ? wert : min)));

/**
 * Begrenzt eine Auswahl auf das, was tatsächlich buchbar ist.
 *
 * Diese Funktion ist bewusst streng: Sie wird auch serverseitig
 * verwendet, damit niemand über manipulierte Eingaben 5000
 * Teilnehmer in eine Anmeldung packen kann.
 */
export function begrenzeAuswahl(regeln: Preisregeln, auswahl: Auswahl): Auswahl {
  if (auswahl.art === "family" && regeln.familie) {
    const f = regeln.familie;
    return {
      art: "family",
      // Im Familienpaket ist die Zahl der Erwachsenen fest.
      erwachsene: f.enthalteneErwachsene,
      schueler: ganzZahl(auswahl.schueler, f.enthalteneSchueler, f.maxSchueler),
    };
  }
  return {
    art: "single",
    schueler: ganzZahl(auswahl.schueler, 0, 10),
    erwachsene: ganzZahl(auswahl.erwachsene, 0, 10),
  };
}

/** Berechnet Gesamtpreis, Personenzahl und die einzelnen Posten. */
export function berechnePreis(regeln: Preisregeln, rohAuswahl: Auswahl): Preisergebnis {
  const auswahl = begrenzeAuswahl(regeln, rohAuswahl);
  const posten: Posten[] = [];

  if (auswahl.art === "family" && regeln.familie) {
    const f = regeln.familie;
    const weitere = Math.max(0, auswahl.schueler - f.enthalteneSchueler);

    posten.push({
      bezeichnung: "familieBasis",
      anzahl: 1,
      einzelCents: f.basisCents,
      summeCents: f.basisCents,
    });

    if (weitere > 0) {
      posten.push({
        bezeichnung: "familieWeitererSchueler",
        anzahl: weitere,
        einzelCents: f.weitererSchuelerCents,
        summeCents: weitere * f.weitererSchuelerCents,
      });
    }
  } else {
    if (auswahl.schueler > 0) {
      posten.push({
        bezeichnung: "schueler",
        anzahl: auswahl.schueler,
        einzelCents: regeln.schuelerCents,
        summeCents: auswahl.schueler * regeln.schuelerCents,
      });
    }
    if (auswahl.erwachsene > 0) {
      posten.push({
        bezeichnung: "erwachsener",
        anzahl: auswahl.erwachsene,
        einzelCents: regeln.erwachsenerCents,
        summeCents: auswahl.erwachsene * regeln.erwachsenerCents,
      });
    }
  }

  return {
    gesamtCents: posten.reduce((summe, p) => summe + p.summeCents, 0),
    personen: auswahl.schueler + auswahl.erwachsene,
    posten,
  };
}

/** Cent-Betrag als Euro darstellen, z. B. 4200 → „42,00 €". */
export function alsEuro(cents: number, sprache: string = "de"): string {
  return new Intl.NumberFormat(sprache === "en" ? "en-IE" : "de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
