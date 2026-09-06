/* ---------------------------------------------------------------
   Die Regeln für die Selbstbedienungs-Stornierung — an EINER Stelle.

   Reine Funktionen: kein Netzverkehr, keine Datenbank, keine Anzeige.
   Dadurch lässt sich jede Regel einzeln prüfen, ohne Server, Stripe
   oder Postfach — dasselbe Vorgehen wie bei lib/preise.ts und
   lib/plaetze.ts.

   Wer die Frist ändern will, ändert sie hier. Eine zweite Rechnung an
   anderer Stelle wäre der Weg zu zwei verschiedenen Antworten auf
   dieselbe Frage.
   --------------------------------------------------------------- */

/** Wie lange vor Beginn die Selbstbedienung endet. */
export const STORNO_VORLAUF_STUNDEN = 24;

/**
 * Ab wann keine Selbstbedienung mehr möglich ist.
 *
 * null bedeutet: Für diese Veranstaltung steht noch kein Termin fest —
 * dann gibt es auch keine Frist, gegen die man rechnen könnte.
 */
export function stornoFristEnde(startAt: Date | null): Date | null {
  if (!startAt) return null;
  return new Date(startAt.getTime() - STORNO_VORLAUF_STUNDEN * 60 * 60 * 1000);
}

/**
 * Liegt der Zeitpunkt noch vor der Frist?
 *
 * Ohne Termin ist die Antwort ja: Eine Veranstaltung ohne Datum kann
 * nicht in 24 Stunden beginnen. Das ist keine Nachlässigkeit, sondern
 * die einzige Auslegung, die nicht willkürlich ist.
 */
export function innerhalbFrist(startAt: Date | null, jetzt: Date = new Date()): boolean {
  const ende = stornoFristEnde(startAt);
  if (ende === null) return true;
  return jetzt.getTime() < ende.getTime();
}

/** Der Ausschnitt einer Buchung, den die Entscheidung braucht. */
export interface Buchungslage {
  status: "RESERVIERT" | "BESTAETIGT" | "WARTELISTE" | "STORNIERT";
  zahlungsStatus: "OFFEN" | "BEZAHLT" | "ERSTATTET" | "TEILWEISE_ERSTATTET";
  gesamtpreisCents: number;
  startAt: Date | null;
}

export type Stornogrund = "bereits-storniert" | "bereits-erstattet" | "zu-spaet";

export type Stornoentscheidung =
  /** Stornieren erlaubt. `erstatten` sagt, ob dabei Geld zurückgeht. */
  | { erlaubt: true; erstatten: boolean }
  | { erlaubt: false; grund: Stornogrund };

/**
 * Die eine Entscheidung: Darf diese Buchung selbst storniert werden?
 *
 * Die Reihenfolge der Prüfungen ist bewusst: Wer bereits storniert
 * hat, soll „schon erledigt" lesen und nicht „zu spät" — die zweite
 * Meldung wäre zwar auch wahr, aber irreführend.
 */
export function stornoEntscheidung(
  lage: Buchungslage,
  jetzt: Date = new Date(),
): Stornoentscheidung {
  if (lage.status === "STORNIERT") {
    return { erlaubt: false, grund: "bereits-storniert" };
  }

  /* Eine bereits (teilweise) erstattete Buchung fasst die
     Selbstbedienung nicht an. Was dort passiert ist, weiß nur der
     Veranstalter — eine zweite, automatische Erstattung darauf wäre
     der teuerste denkbare Fehler. */
  if (lage.zahlungsStatus === "ERSTATTET" || lage.zahlungsStatus === "TEILWEISE_ERSTATTET") {
    return { erlaubt: false, grund: "bereits-erstattet" };
  }

  if (!innerhalbFrist(lage.startAt, jetzt)) {
    return { erlaubt: false, grund: "zu-spaet" };
  }

  /* Erstattet wird nur, wo auch bezahlt wurde: Eine unbezahlte
     Reservierung und ein kostenloses Event werden schlicht storniert.
     Der Betrag stammt aus der Datenbank, nie aus dem Browser. */
  return { erlaubt: true, erstatten: lage.zahlungsStatus === "BEZAHLT" && lage.gesamtpreisCents > 0 };
}
