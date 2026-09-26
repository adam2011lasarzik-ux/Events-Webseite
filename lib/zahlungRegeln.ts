/* ---------------------------------------------------------------
   Die Regeln rund um die Zahlung — ohne Netzverkehr.

   Reine Funktionen: kein HTTP, keine Datenbank, kein Stripe. Dieselbe
   Herangehensweise wie bei lib/preise.ts und lib/anmeldung.ts, damit
   sich jede Entscheidung einzeln prüfen lässt.

   Absichtlich getrennt von lib/zahlung.ts: Diese Datei lässt sich
   prüfen, ohne dass irgendetwas nach draußen spricht.
   --------------------------------------------------------------- */

/* ── Entfallen am 26.09.2026: `Zahlbar`, `ZahlungAbgelehnt`, `darfZahlen`

   Diese drei beantworteten die Frage „darf für DIESE gespeicherte
   Anmeldung eine Bezahlung gestartet werden?" — mit Gründen wie
   „bereits bezahlt" oder „storniert".

   Seit Stufe 2 gibt es zum Zeitpunkt des Zahlungsstarts keine
   gespeicherte Anmeldung mehr, über die man das entscheiden könnte.
   Die Gründe, aus denen eine Bezahlseite verweigert wird, heissen
   jetzt `StartFehler` und stehen in lib/zahlungStart.ts; die Gründe,
   aus denen aus einer eingegangenen Zahlung keine Anmeldung wird,
   heissen `Fehlbuchungsgrund` und stehen in lib/anmeldungAnlegen.ts.

   Die Funktion stehen zu lassen wäre kein harmloser Rest gewesen:
   Sie beschrieb einen Ablauf, den es nicht mehr gibt, und hätte bei
   der nächsten Änderung als geltende Regel gelesen werden können. */

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
        /* Diese Zeile liest JEDER zahlende Kunde auf der Bezahlseite.
           "Gesamtpreis" statt "ohne Umsatzsteuer": Letzteres liesse
           sich als Nettopreis missverstehen, auf den noch etwas
           daraufkommt — das Gegenteil dessen, was gemeint ist. */
        description:
          `${personen} ${personen === 1 ? "Person" : "Personen"} · ` +
          "Gesamtpreis, keine Umsatzsteuer (§ 19 UStG)",
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
