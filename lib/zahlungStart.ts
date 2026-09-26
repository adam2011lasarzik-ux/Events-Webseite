/* ---------------------------------------------------------------
   Eine Bezahlseite für eine noch NICHT gespeicherte Anmeldung
   erzeugen.

   Seit dem Umbau vom 25.09.2026 gibt es hier keine Anmeldenummer
   mehr: Zwischen dem Absenden des Formulars und der bestätigten
   Zahlung steht in der VERA-Datenbank nichts. Die Anmeldedaten reisen
   verschlüsselt in der `metadata` der Bezahlseite mit
   (lib/anmeldeNutzlast.ts) und kommen mit der Zahlung zurück.

   Was diese Datei vorher prüft — und was diese Prüfungen wert sind:

     1. Steht der Termin (noch) fest?
     2. Gibt es für diese Adresse schon eine Buchung?
     3. Reichen die Plätze?

   Alle drei sind MOMENTAUFNAHMEN, keine Zusagen. Es wird kein Platz
   gehalten; zwischen dieser Prüfung und dem Eingang der Zahlung kann
   jemand anders bezahlen. Verbindlich entschieden wird erst in
   lib/anmeldungAnlegen.ts, wenn das Geld da ist.

   Sie bleiben trotzdem stehen, und zwar aus einem einzigen Grund:
   Wer auf eine Bezahlseite geschickt wird, obwohl die Veranstaltung
   schon jetzt sichtbar voll ist, bezahlt für nichts und bekommt das
   Geld hinterher zurück. Das ist die unangenehmste Erfahrung, die
   dieser Ablauf zu bieten hat — und die meisten Fälle davon fängt
   eine schlichte Abfrage hier ab.

   Der Betrag kommt IMMER aus der Datenbank. Ein aus dem Browser
   mitgeschickter Betrag wird an keiner Stelle gelesen.
   --------------------------------------------------------------- */

import { terminSteht } from "@/lib/termin";
import { db } from "@/lib/db";
import { belegtFilter } from "@/lib/plaetze";
import { plaetzeReichen } from "@/lib/zahlungRegeln";
import { verschluesseln, type Nutzlast } from "@/lib/anmeldeNutzlast";
import { schluesselbund, SchluesselFehlt } from "@/lib/anmeldeSchluessel";
import { sitzungErstellen, ZahlungNichtEingerichtet } from "@/lib/zahlung";

export type StartFehler =
  | "kein-termin"
  | "keine-plaetze"
  | "doppelt"
  | "nicht-eingerichtet"
  | "anbieter";

export type StartErgebnis =
  | { url: string }
  /** `frei` ist nur bei „keine-plaetze" gesetzt. */
  | { fehler: StartFehler; frei?: number };

/**
 * Aus einer geprüften Anmeldung eine Bezahlseite machen.
 *
 * Erwartet eine Nutzlast OHNE Zeitstempel — den setzt das
 * Verschlüsseln selbst, damit niemand eine unbegrenzt haltbare Marke
 * erzeugen kann.
 */
export async function bezahlseiteFuerNutzlast(
  nutzlast: Omit<Nutzlast, "erstelltMs">,
  eventTitel: string,
): Promise<StartErgebnis> {
  const event = await db.event.findUnique({
    where: { id: nutzlast.eventId },
    select: { id: true, maxPersonen: true, startAt: true },
  });
  if (!event) return { fehler: "kein-termin" };

  /* Dieselbe Regel wie beim Absenden (Entscheidung 2.5). Sie wird
     hier erneut geprüft, weil zwischen dem Aufbau des Formulars und
     dem Absenden Zeit vergeht: Wird der Termin im Adminbereich
     entfernt, darf für diese Veranstaltung kein Geld mehr fließen. */
  if (!terminSteht(event)) return { fehler: "kein-termin" };

  /* Je Veranstaltung und Adresse genau eine Anmeldung. Verbindlich
     entschieden wird das erst beim Zahlungseingang — dort greift der
     eindeutige Index. Hier abzufangen erspart dem häufigen Fall eine
     Zahlung samt Erstattung. */
  const vorhanden = await db.registration.findUnique({
    where: {
      eventId_kontaktEmail: { eventId: event.id, kontaktEmail: nutzlast.kontaktEmail },
    },
    select: { status: true },
  });
  if (vorhanden && vorhanden.status !== "STORNIERT") return { fehler: "doppelt" };

  const personen = nutzlast.teilnehmer.length;
  if (event.maxPersonen !== null) {
    const belegte = await db.registration.findMany({
      where: { eventId: event.id, ...belegtFilter() },
      select: { _count: { select: { teilnehmer: true } } },
    });
    const belegt = belegte.reduce((s, a) => s + a._count.teilnehmer, 0);
    const platz = plaetzeReichen(event.maxPersonen, belegt, personen);
    if (!platz.reicht) return { fehler: "keine-plaetze", frei: platz.frei };
  }

  try {
    const marke = verschluesseln(nutzlast, schluesselbund());

    const sitzung = await sitzungErstellen({
      email: nutzlast.kontaktEmail,
      eventId: nutzlast.eventId,
      eventTitel,
      personen,
      gesamtCents: nutzlast.gesamtpreisCents,
      marke,
    });

    return { url: sitzung.url };
  } catch (e) {
    if (e instanceof SchluesselFehlt) {
      /* Ohne Schlüssel kann keine Anmeldung mehr zustande kommen.
         Das ist ein Betriebsfehler, kein Kundenfehler — deshalb laut
         ins Protokoll und für den Besucher dieselbe Antwort wie bei
         einer fehlenden Zahlungseinrichtung. */
      console.error("ANMELDUNG_SCHLUESSEL fehlt oder ist unbrauchbar:", e.message);
      return { fehler: "nicht-eingerichtet" };
    }
    if (e instanceof ZahlungNichtEingerichtet) {
      console.error("Zahlung nicht eingerichtet:", e.grund);
      return { fehler: "nicht-eingerichtet" };
    }
    console.error("Bezahlseite konnte nicht erzeugt werden:", e);
    return { fehler: "anbieter" };
  }
}
