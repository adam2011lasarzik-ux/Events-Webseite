/* ---------------------------------------------------------------
   Die Regeln rund um die Zahlung — ohne Netzverkehr.

   Reine Funktionen: kein HTTP, keine Datenbank, kein Stripe. Dieselbe
   Herangehensweise wie bei lib/preise.ts und lib/anmeldung.ts, damit
   sich jede Entscheidung einzeln prüfen lässt.

   Absichtlich getrennt von lib/zahlung.ts: Diese Datei lässt sich
   prüfen, ohne dass irgendetwas nach draußen spricht.
   --------------------------------------------------------------- */

import { HOECHSTALTER_MINUTEN } from "./anmeldeNutzlast";

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
 * Ein Zahlungsschlüssel für den ECHTBETRIEB?
 *
 * Das Gegenstück zu istTestschluessel. Stripe kennzeichnet auch
 * Live-Schlüssel eindeutig (sk_live_ / rk_live_).
 */
export function istLiveschluessel(schluessel: string): boolean {
  return /^(sk|rk)_live_/.test(schluessel.trim());
}

/** Das Urteil über einen hinterlegten Zahlungsschlüssel. */
export type SchluesselUrteil =
  | { ok: true; modus: "test" | "live" }
  | { ok: false; grund: "fehlt" | "ungueltig" | "live-ohne-freigabe" };

/**
 * Darf mit diesem Schlüssel bezahlt werden — und in welchem Modus?
 *
 * Reine Regel, ohne Netz und ohne Zugriff auf process.env: OB der
 * Echtbetrieb freigegeben ist, entscheidet der Aufrufer und reicht es
 * als `echtbetriebFreigegeben` herein. So bleibt diese Datei prüfbar.
 *
 * Der Riegel ist bewusst ZWEISTUFIG: Ein Live-Schlüssel allein genügt
 * NICHT. Echte Zahlungen brauchen zusätzlich eine ausdrückliche Freigabe
 * (Umgebungsvariable ZAHLUNG_ECHTBETRIEB). So kann ein versehentlich
 * eingetragener Live-Schlüssel niemals für sich allein echtes Geld
 * bewegen — der Echtbetrieb bleibt eine bewusste, zweifache Handlung.
 */
export function schluesselPruefen(
  schluessel: string,
  echtbetriebFreigegeben: boolean,
): SchluesselUrteil {
  const s = schluessel.trim();
  if (s === "") return { ok: false, grund: "fehlt" };
  if (istTestschluessel(s)) return { ok: true, modus: "test" };
  if (istLiveschluessel(s)) {
    return echtbetriebFreigegeben
      ? { ok: true, modus: "live" }
      : { ok: false, grund: "live-ohne-freigabe" };
  }
  return { ok: false, grund: "ungueltig" };
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

/* ---------------------------------------------------------------
   Darf die verschlüsselte Anmeldung aus der Bezahlseite entfernt
   werden?

   Reine Regel, ohne Netz und ohne Datenbank — deshalb steht sie hier
   und nicht in lib/zahlung.ts. Was sie entscheidet, betrifft Geld und
   fremde Daten zugleich; eine Regel, die man nur im Zusammenspiel mit
   Stripe prüfen kann, wäre an dieser Stelle die falsche.

   Am 26.09.2026 gegen die echte Schnittstelle belegt: Ein leerer Wert
   entfernt den Schlüssel vollständig, und auch eine VERFALLENE
   Bezahlseite lässt sich noch ändern.
   --------------------------------------------------------------- */

/** Was über eine Bezahlseite bekannt sein muss, um zu entscheiden. */
export interface Markenlage {
  /** Trägt die Bezahlseite überhaupt noch eine Marke? */
  hatMarke: boolean;
  /** „open" = noch bezahlbar, „complete" = abgeschlossen, „expired" = verfallen. */
  status: string | null;
  /** Meldet der Anbieter Geldeingang? */
  bezahlt: boolean;
  /** Gibt es bei VERA eine Anmeldung ODER eine Fehlbuchung dazu? */
  verbucht: boolean;
  /** Wie alt die Bezahlseite ist, in Millisekunden. */
  alterMs: number;
}

/**
 * Drei Fälle, und nur einer davon braucht eine Frist.
 *
 *   noch offen        → NEIN. Die Marke wird gleich gebraucht.
 *   bezahlt, offen    → NEIN, solange nicht verbucht: Der Abgleichlauf
 *     bei VERA           legt die Anmeldung daraus erst noch an. Sie
 *                        vorher zu entfernen hiesse, Geld ohne jede
 *                        Zuordnung stehenzulassen.
 *   bezahlt, verbucht → JA, aber erst nach 24 Stunden. Vorher ist die
 *                        Marke der einzige Weg, die Buchung nach dem
 *                        Einspielen einer Sicherung wiederherzustellen.
 *                        Danach ist sie ohnehin wertlos:
 *                        `entschluesseln` weist sie als abgelaufen ab.
 *   nicht bezahlt,    → JA, sofort. Es ist kein Geld geflossen, es gibt
 *   nicht mehr offen    nichts zu rekonstruieren.
 */
export function markeDarfWeg(lage: Markenlage): boolean {
  if (!lage.hatMarke) return false;
  // Eine offene Bezahlseite behält ihre Marke — immer.
  if (lage.status === "open") return false;

  if (lage.bezahlt) {
    if (!lage.verbucht) return false;
    return lage.alterMs >= MARKE_SCHONFRIST_MS;
  }

  return true;
}

/**
 * Wie lange die Marke einer bezahlten, verbuchten Bezahlseite stehen
 * bleibt: genauso lange, wie sie überhaupt brauchbar ist.
 *
 * Dieselbe Zahl wie `HOECHSTALTER_MINUTEN` in lib/anmeldeNutzlast.ts,
 * und das mit Absicht von dort geholt statt abgeschrieben: Würde die
 * eine Frist verlängert und die andere nicht, entstünde genau
 * dazwischen ein Fenster, in dem eine noch brauchbare Marke bereits
 * entfernt wäre.
 */
export const MARKE_SCHONFRIST_MS = HOECHSTALTER_MINUTEN * 60_000;
