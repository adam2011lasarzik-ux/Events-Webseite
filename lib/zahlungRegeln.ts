/* ---------------------------------------------------------------
   Die Regeln rund um die Zahlung — ohne Netzverkehr.

   Reine Funktionen: kein HTTP, keine Datenbank, kein Stripe. Dieselbe
   Herangehensweise wie bei lib/preise.ts und lib/anmeldung.ts, damit
   sich jede Entscheidung einzeln prüfen lässt.

   Absichtlich getrennt von lib/zahlung.ts: Diese Datei lässt sich
   prüfen, ohne dass irgendetwas nach draußen spricht.
   --------------------------------------------------------------- */

/** Was der Server über eine Anmeldung wissen muss, um zu entscheiden. */
export interface Zahlbar {
  id: string;
  status: string;
  zahlungsStatus: string;
  gesamtpreisCents: number;
}

export type ZahlungAbgelehnt =
  | "unbekannt"
  | "storniert"
  | "bereits-bezahlt"
  | "kein-betrag"
  /** Für die ganze Gruppe sind nicht mehr genug Plätze frei. */
  | "keine-plaetze";

/**
 * Darf für diese Anmeldung eine Bezahlung gestartet werden?
 *
 * Gibt einen Grund zurück, wenn nicht — oder null, wenn alles passt.
 * Der Grund ist bewusst ein fester Wert und kein Text: Die Formulierung
 * gehört ins Wörterbuch, nicht in die Regel.
 */
export function darfZahlen(anmeldung: Zahlbar | null): ZahlungAbgelehnt | null {
  if (!anmeldung) return "unbekannt";
  if (anmeldung.status === "STORNIERT") return "storniert";
  if (anmeldung.zahlungsStatus === "BEZAHLT") return "bereits-bezahlt";
  // Ein kostenloses Event braucht keine Bezahlung. Stripe würde einen
  // Betrag von 0 ohnehin ablehnen.
  if (anmeldung.gesamtpreisCents <= 0) return "kein-betrag";
  return null;
}

/**
 * Stimmt der von Stripe gemeldete Betrag mit dem überein, der bei der
 * Anmeldung eingefroren wurde?
 *
 * Wenn nicht, wird NICHT auf bezahlt gesetzt. Ein abweichender Betrag
 * heißt entweder, dass jemand am Ablauf manipuliert hat, oder dass
 * zwei Vorgänge durcheinandergeraten sind. Beides gehört angesehen und
 * nicht stillschweigend als „passt schon" verbucht.
 */
export function betragPasst(gemeldetCents: number | null, erwartetCents: number): boolean {
  return gemeldetCents !== null && gemeldetCents === erwartetCents;
}

/**
 * Ein Zahlungsschlüssel für den Testbetrieb?
 *
 * Der Riegel gegen echte Zahlungen. Stripe kennzeichnet Testschlüssel
 * eindeutig; alles andere wird abgewiesen. Der Echtbetrieb ist damit
 * keine Frage einer vergessenen Einstellung, sondern eine bewusste
 * spätere Änderung an dieser Stelle.
 */
export function istTestschluessel(schluessel: string): boolean {
  return /^(sk|rk)_test_/.test(schluessel.trim());
}

/**
 * Aus einem Cent-Betrag die Beschriftung auf der Bezahlseite bauen.
 *
 * Ein einziger Posten statt einer Liste: Der verbindliche Betrag ist
 * der eingefrorene Gesamtpreis der Anmeldung. Eine aufgeschlüsselte
 * Liste könnte durch Rundung von diesem Betrag abweichen — bei Geld
 * ist das kein Schönheitsfehler.
 */
export function posten(titel: string, personen: number, gesamtCents: number) {
  return {
    price_data: {
      currency: "eur",
      unit_amount: gesamtCents,
      product_data: {
        name: titel,
        description: `${personen} ${personen === 1 ? "Person" : "Personen"} · inkl. MwSt.`,
      },
    },
    quantity: 1,
  };
}

/**
 * Passt die Gruppe noch hinein?
 *
 * Diese Prüfung gehört VOR die Bezahlseite. Sonst kann jemand für
 * einen Platz bezahlen, den es nicht mehr gibt — und das Geld wieder
 * herausgeben zu müssen ist der unangenehmste Weg, einen Fehler zu
 * bemerken.
 *
 * `belegtOhneDiese` lässt die eigene Anmeldung bewusst aus: Sie wird
 * gleich bezahlt, nicht zusätzlich gebucht. Ohne diese Ausnahme stünde
 * man sich beim zweiten Anlauf selbst im Weg.
 */
export function plaetzeReichen(
  maxPersonen: number | null,
  belegtOhneDiese: number,
  personen: number,
): { reicht: true } | { reicht: false; frei: number } {
  if (maxPersonen === null) return { reicht: true };
  const frei = Math.max(0, maxPersonen - belegtOhneDiese);
  return personen <= frei ? { reicht: true } : { reicht: false, frei };
}
