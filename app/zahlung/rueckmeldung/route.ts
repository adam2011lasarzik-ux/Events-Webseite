/* ---------------------------------------------------------------
   Die Rückmeldung des Zahlungsanbieters.

   Das ist die EINZIGE Stelle, die eine Anmeldung auf „bezahlt" setzen
   darf. Eine Rückleitung im Browser („…?bezahlt=1") kann jeder selbst
   in die Adresszeile tippen und ist als Nachweis wertlos.

   Vier Dinge passieren hier, in dieser Reihenfolge:
     1. Unterschrift prüfen — ohne gültige Unterschrift: 400.
     2. Doppelte Meldungen abfangen — dieselbe Meldung wirkt genau
        einmal.
     3. Betrag abgleichen — weicht er ab, wird NICHT auf bezahlt
        gesetzt.
     4. Erst dann speichern.
   --------------------------------------------------------------- */

import type Stripe from "stripe";
import { db } from "@/lib/db";
import { rueckmeldungPruefen, ZahlungNichtEingerichtet } from "@/lib/zahlung";
import { betragPasst } from "@/lib/zahlungRegeln";
import { fassungenZurBuchung } from "@/lib/rechtstexte";
import { mailSendenOhneAbbruch } from "@/lib/mail";
import { zahlungsBestaetigungsMail } from "@/lib/mailVorlagen";
import { stornoLink } from "@/lib/storno";

/* Node-Laufzeit: Die Unterschrift wird über den ROHTEXT gebildet.
   Läge hier ein bereits verarbeiteter Körper vor, ginge die Prüfung
   ins Leere. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(anfrage: Request) {
  // Rohtext, nicht anfrage.json(): Schon ein umsortiertes Leerzeichen
  // würde die Unterschrift ungültig machen.
  const rohtext = await anfrage.text();
  const unterschrift = anfrage.headers.get("stripe-signature");

  let ereignis: Stripe.Event;
  try {
    ereignis = rueckmeldungPruefen(rohtext, unterschrift);
  } catch (e) {
    if (e instanceof ZahlungNichtEingerichtet) {
      console.error("Rückmeldung ohne eingerichtete Zahlung:", e.grund);
      return new Response("Zahlung ist nicht eingerichtet.", { status: 500 });
    }
    // Bewusst knapp: Wer hier ohne gültige Unterschrift anklopft, soll
    // nicht erfahren, woran es lag.
    console.warn("Rückmeldung mit ungültiger Unterschrift abgewiesen.");
    return new Response("Ungültige Unterschrift.", { status: 400 });
  }

  /* Doppelte Meldungen wirken nicht doppelt.

     Der Anbieter schickt eine Meldung notfalls mehrfach — das ist
     Absicht, sonst ginge sie bei einer Störung verloren. Der Eintrag
     in der Tabelle ist der Merkzettel: Ist die Kennung schon da,
     wurde die Meldung bereits verarbeitet. */
  try {
    await db.zahlungsEreignis.create({ data: { id: ereignis.id, art: ereignis.type } });
  } catch {
    // Bekannt — freundlich mit 200 quittieren, sonst versucht es der
    // Anbieter immer wieder.
    return new Response("Bereits verarbeitet.", { status: 200 });
  }

  try {
    switch (ereignis.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await bezahltVermerken(ereignis.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.expired":
        // Die Bezahlseite ist verfallen. Die Anmeldung bleibt
        // bestehen; ihr Platz läuft über reserviertBis von selbst aus.
        break;

      case "checkout.session.async_payment_failed":
        await fehlgeschlagenVermerken(ereignis.data.object as Stripe.Checkout.Session);
        break;

      case "charge.refunded":
        await erstattungVermerken(ereignis.data.object as Stripe.Charge);
        break;

      default:
        // Alles andere interessiert uns nicht — trotzdem mit 200
        // quittieren, sonst wiederholt der Anbieter es endlos.
        break;
    }
  } catch (e) {
    // Bei einem echten Fehler NICHT mit 200 antworten: Dann versucht
    // es der Anbieter später erneut, und die Zahlung geht nicht
    // verloren. Der Merkzettel wird dafür wieder entfernt.
    await db.zahlungsEreignis.delete({ where: { id: ereignis.id } }).catch(() => {});
    console.error("Rückmeldung konnte nicht verarbeitet werden:", e);
    return new Response("Konnte nicht verarbeitet werden.", { status: 500 });
  }

  return new Response("Angenommen.", { status: 200 });
}

/** Die Zahlungskennung („pi_…") aus einer Bezahlseite holen. */
function zahlungsAbsichtVon(sitzung: Stripe.Checkout.Session): string | null {
  return typeof sitzung.payment_intent === "string"
    ? sitzung.payment_intent
    : (sitzung.payment_intent?.id ?? null);
}

async function bezahltVermerken(sitzung: Stripe.Checkout.Session): Promise<void> {
  const id = sitzung.metadata?.anmeldungId ?? sitzung.client_reference_id;
  if (!id) {
    console.error("Rückmeldung ohne Anmeldenummer:", sitzung.id);
    return;
  }
  if (sitzung.payment_status !== "paid") return;

  const anmeldung = await db.registration.findUnique({
    where: { id },
    include: { event: true, teilnehmer: true },
  });
  if (!anmeldung) {
    console.error("Rückmeldung für unbekannte Anmeldung:", id);
    return;
  }
  /* Eine bereits stornierte Buchung wird NIE wiederbelebt.

     Das war ein echter Fehler, gefunden im Testbetrieb: PayPal
     bestätigt verzögert. Wer nach der Zahlung storniert, aber bevor
     die Nachmeldung eintrifft, landete hier mit einer stornierten und
     bereits erstatteten Buchung — und sie wurde zurückgeschrieben auf
     "bestätigt" und "bezahlt". Sie stand danach wieder als Teilnehmer
     in der Liste, obwohl das Geld längst zurück war. Bei Karten fiel
     das nie auf: die bestätigen sofort, eine späte Meldung gibt es
     dort nicht.

     Die Zahlungskennungen werden trotzdem festgehalten. Ohne sie
     liesse sich eine später von Hand ausgelöste Erstattung dieser
     Buchung nicht mehr zuordnen (siehe erstattungVermerken). Status
     und Zahlungsstatus bleiben unangetastet. */
  if (anmeldung.status === "STORNIERT") {
    console.error(
      `Zahlungsmeldung für eine bereits stornierte Anmeldung (${id}, Sitzung ${sitzung.id}). ` +
        "Status unverändert gelassen — bitte prüfen, ob Geld zurückgezahlt werden muss.",
    );
    await db.registration.update({
      where: { id },
      data: {
        zahlungsReferenz: sitzung.id,
        zahlungsAbsicht: zahlungsAbsichtVon(sitzung) ?? anmeldung.zahlungsAbsicht,
        bezahlterBetragCents: sitzung.amount_total ?? anmeldung.bezahlterBetragCents,
      },
    });
    return;
  }

  /* Nur eine OFFENE Zahlung darf auf "bezahlt" wechseln. Vorher stand
     hier allein `=== "BEZAHLT"` — dadurch rutschten ERSTATTET und
     TEILWEISE_ERSTATTET durch und wurden zurückgedreht. Die
     Schwesterfunktion fehlgeschlagenVermerken prüft seit jeher auch
     den Anmeldestatus; hier fehlte das. */
  if (anmeldung.zahlungsStatus !== "OFFEN") return;

  /* Betragsabgleich. Weicht der Betrag ab, wird NICHT auf bezahlt
     gesetzt — entweder wurde am Ablauf manipuliert, oder zwei Vorgänge
     sind durcheinandergeraten. Beides gehört angesehen, nicht
     stillschweigend verbucht. Die Sitzungskennung bleibt gespeichert,
     damit sich der Fall im Adminbereich nachvollziehen lässt. */
  if (!betragPasst(sitzung.amount_total ?? null, anmeldung.gesamtpreisCents)) {
    console.error(
      `Betrag weicht ab (Anmeldung ${id}): gemeldet ${sitzung.amount_total}, ` +
        `erwartet ${anmeldung.gesamtpreisCents}`,
    );
    await db.registration.update({
      where: { id },
      data: { zahlungsReferenz: sitzung.id, bezahlterBetragCents: sitzung.amount_total ?? null },
    });
    return;
  }

  /* Geld ist geflossen — der Platz gilt. Erst hier, an dieser
     Stelle, wird ein Platz überhaupt belegt.

     Auch dann, wenn das Event inzwischen voll ist. Einen bezahlten
     Platz stillschweigend abzulehnen wäre der schlimmere Fehler; die
     Überbuchung sieht der Veranstalter im Adminbereich und kann sie
     klären. Seit dem 24.09.2026 wird während der Zahlung kein Platz
     mehr gehalten — dieser Fall ist damit die bewusst in Kauf
     genommene Kehrseite und nicht mehr die seltene Ausnahme. */
  await db.registration.update({
    where: { id },
    data: {
      status: "BESTAETIGT",
      reserviertBis: null,
      zahlungsStatus: "BEZAHLT",
      zahlungsWeg: "ONLINE",
      zahlungsReferenz: sitzung.id,
      /* Die eigentliche Zahlung festhalten. Ohne sie liesse sich
         später weder eine Erstattung auslösen noch eine
         Erstattungs-Rückmeldung dieser Buchung zuordnen. */
      zahlungsAbsicht: zahlungsAbsichtVon(sitzung),
      bezahlterBetragCents: sitzung.amount_total ?? anmeldung.gesamtpreisCents,
      bezahltAm: new Date(),
    },
  });

  // Angenehme Zugabe, kein Grund, die Rückmeldung scheitern zu lassen —
  // die Zahlung ist bereits verbucht, ein Mail-Ausfall darf das nicht
  // rückgängig machen.
  await mailSendenOhneAbbruch({
    an: anmeldung.kontaktEmail,
    ...zahlungsBestaetigungsMail(
      {
        id: anmeldung.id,
        kontaktVorname: anmeldung.kontaktVorname,
        kontaktNachname: anmeldung.kontaktNachname,
        kontaktEmail: anmeldung.kontaktEmail,
        kontaktTelefon: anmeldung.kontaktTelefon,
        gesamtpreisCents: anmeldung.gesamtpreisCents,
        teilnehmer: anmeldung.teilnehmer,
      },
      {
        titel: anmeldung.event.titel,
        startAt: anmeldung.event.startAt,
        ortName: anmeldung.event.ortName,
        stadt: anmeldung.event.stadt,
      },
      // Der Storno-Link — der einzige Weg, auf dem der Schlüssel
      // den Anmelder erreicht.
      stornoLink(process.env.OEFFENTLICHE_ADRESSE, anmeldung.id, anmeldung.stornoSchluessel),
      // Dieselben Fassungen wie in der Anmeldebestätigung —
      // die der BUCHUNG, nicht die heute geltenden.
      await fassungenZurBuchung(anmeldung.id),
    ),
  });
}

/**
 * Eine verzögert fehlgeschlagene Zahlung.
 *
 * Nicht jede Zahlart entscheidet sich sofort: Bei PayPal und ähnlichen
 * Wegen meldet der Anbieter erst später, dass es doch nicht geklappt
 * hat. Ohne diesen Zweig sähe der Versuch bis zum Ende der halben
 * Stunde nach „Bezahlung läuft" aus, obwohl längst feststeht, dass
 * kein Geld kommt. (Einen Platz hielt er schon vorher nicht — seit
 * dem 24.09.2026 zählt nur eine bezahlte Anmeldung, lib/plaetze.ts.)
 *
 * Bewusst wird die Anmeldung NICHT gelöscht und NICHT storniert: Der
 * Mensch soll es noch einmal versuchen können, ohne alles neu
 * einzutippen. Beendet wird nur der Versuch, und die Anmeldung
 * erscheint überall als „nicht abgeschlossen".
 */
async function fehlgeschlagenVermerken(sitzung: Stripe.Checkout.Session): Promise<void> {
  const id = sitzung.metadata?.anmeldungId ?? sitzung.client_reference_id;
  if (!id) {
    console.error("Fehlgeschlagene Zahlung ohne Anmeldenummer:", sitzung.id);
    return;
  }

  const anmeldung = await db.registration.findUnique({ where: { id } });
  if (!anmeldung) {
    console.error("Fehlgeschlagene Zahlung für unbekannte Anmeldung:", id);
    return;
  }

  /* Wer schon bezahlt hat, bleibt bezahlt. Käme eine alte
     Fehlermeldung nach einem geglückten zweiten Anlauf an, würde sie
     sonst eine bestätigte Anmeldung wieder aufreissen. */
  if (anmeldung.zahlungsStatus === "BEZAHLT" || anmeldung.status !== "RESERVIERT") return;

  /* Die Frist auf JETZT setzen statt auf null: Die ganze Seite —
     Platzzählung, Adminliste, Abschluss-Seite — erkennt eine
     abgelaufene Reservierung genau daran, dass `reserviertBis` in der
     Vergangenheit liegt (lib/plaetze.ts, belegtFilter). So gilt der
     Fall überall sofort als beendet, ohne eine zweite Regel dafür. */
  await db.registration.update({
    where: { id },
    data: { reserviertBis: new Date(), zahlungsReferenz: sitzung.id },
  });
}

async function erstattungVermerken(zahlung: Stripe.Charge): Promise<void> {
  /* Diese Zuordnung war der eigentliche Fehler.
     
     Gespeichert wird die BEZAHLSEITE („cs_…"). Eine Erstattungs-
     Rückmeldung trägt aber die Charge- und die Zahlungskennung
     („ch_…", „pi_…") — die Sitzung kommt darin nicht vor. Gesucht
     wurde also nach Werten, die dort nie stehen konnten. Eine im
     Dashboard von Hand ausgelöste Kulanz-Erstattung blieb dadurch
     still wirkungslos: Die Buchung stand weiter auf „bezahlt".

     Die vorhandene Prüfung übersah das, weil sie das Ereignis selbst
     baut und die Anmeldenummer dabei von Hand mitgibt.

     Jetzt drei Wege, vom sichersten zum schwächsten:
       1. die an der Zahlung hinterlegte Anmeldenummer
       2. die gespeicherte Zahlungskennung
       3. die Charge-Kennung (für Zahlungen ohne Zahlungsabsicht) */
  const zahlungId = typeof zahlung.payment_intent === "string" ? zahlung.payment_intent : null;
  const anmeldung = await db.registration.findFirst({
    where: {
      OR: [
        ...(zahlung.metadata?.anmeldungId ? [{ id: zahlung.metadata.anmeldungId }] : []),
        ...(zahlungId ? [{ zahlungsAbsicht: zahlungId }] : []),
        { zahlungsReferenz: zahlung.id },
      ],
    },
  });
  if (!anmeldung) {
    console.error("Erstattung ohne zugehörige Anmeldung:", zahlung.id);
    return;
  }

  const erstattetCents = zahlung.amount_refunded ?? 0;
  const vollstaendig = erstattetCents >= (anmeldung.bezahlterBetragCents ?? anmeldung.gesamtpreisCents);

  await db.registration.update({
    where: { id: anmeldung.id },
    data: { zahlungsStatus: vollstaendig ? "ERSTATTET" : "TEILWEISE_ERSTATTET" },
  });
}
