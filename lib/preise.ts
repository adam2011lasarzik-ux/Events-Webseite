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
  /** Hat dieses Event überhaupt eine eigene Schüler-Preiskategorie?
   *  false = nur EIN Preis (erwachsenerCents), keine „Mein Kind"-/
   *  Familienpaket-Wege. Die eigentliche Durchsetzung passiert NICHT
   *  hier (diese Datei kennt den Wert nur zur Weitergabe), sondern in
   *  lib/anmeldung.ts → pruefeUndBaue(), das ist der Ort, an dem der
   *  Server „weg"/"selbstAls" vor jeder Rechnung korrigiert. */
  schuelerAktiv: boolean;
  schuelerCents: number;
  erwachsenerCents: number;
  familie: Familienpaket | null;
  /** Höchstzahl Erwachsener je Einzelbuchung (Ticketart „Erwachsene").
   *  Kommt aus Event.maxErwachsene, Standard 4. Serverseitig in
   *  begrenzeAuswahl() durchgesetzt — der Browser kann sie nicht
   *  aushebeln. */
  maxErwachsene: number;
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

/**
 * Harte Obergrenze: insgesamt höchstens sechs Personen je Buchung —
 * unabhängig von der Ticketart (Erwachsene, Schüler, Familie). Vorgabe
 * vom 08.10.2026. Serverseitig in begrenzeAuswahl() und in
 * lib/anmeldung.ts durchgesetzt; die Oberfläche begrenzt zusätzlich.
 */
export const MAX_PERSONEN_PRO_BUCHUNG = 6;

/** Mindestzahl Kinder im Familienpaket (Vorgabe „mindestens 4 Kinder"). */
export const MIN_FAMILIE_KINDER = 4;

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
    const erwachsene = f.enthalteneErwachsene;
    // Kinder: mindestens vier (oder die enthaltene Zahl, falls höher)
    // und nie so viele, dass Erwachsene und Kinder zusammen die harte
    // Grenze von sechs Personen überschreiten; zusätzlich höchstens die
    // am Event konfigurierte Obergrenze.
    const untergrenze = Math.max(f.enthalteneSchueler, MIN_FAMILIE_KINDER);
    const obergrenze = Math.min(f.maxSchueler, MAX_PERSONEN_PRO_BUCHUNG - erwachsene);
    // Bei einer widersprüchlichen Konfiguration (zu viele enthaltene
    // Erwachsene) gewinnt die harte Sechser-Grenze: lieber weniger
    // Kinder als mehr als sechs Personen.
    const schueler =
      obergrenze < untergrenze ? obergrenze : ganzZahl(auswahl.schueler, untergrenze, obergrenze);
    return { art: "family", erwachsene, schueler };
  }
  // Erwachsene: höchstens so viele, wie das Event erlaubt (Standard 4),
  // aber nie mehr als die harte Grenze von sechs. Ein unsinniger oder
  // fehlender Wert fällt auf 4 zurück.
  const maxErw =
    Number.isFinite(regeln.maxErwachsene) && regeln.maxErwachsene > 0
      ? Math.min(Math.trunc(regeln.maxErwachsene), MAX_PERSONEN_PRO_BUCHUNG)
      : 4;
  let schueler = ganzZahl(auswahl.schueler, 0, MAX_PERSONEN_PRO_BUCHUNG);
  let erwachsene = ganzZahl(auswahl.erwachsene, 0, maxErw);
  // Harte Gesamtgrenze: nie mehr als sechs Personen je Buchung. Eine
  // Übermenge wird zuerst bei den Schülern abgeschnitten (defensiver
  // Rückfall — die Oberfläche lässt es gar nicht erst zu, und
  // pruefeUndBaue() lehnt einen manipulierten Aufruf sichtbar ab).
  if (schueler + erwachsene > MAX_PERSONEN_PRO_BUCHUNG) {
    schueler = Math.max(0, MAX_PERSONEN_PRO_BUCHUNG - erwachsene);
  }
  return { art: "single", schueler, erwachsene };
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
export function alsEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
