/* ---------------------------------------------------------------
   Die Rückmeldung des Zahlungsanbieters.

   Seit dem Umbau vom 25.09.2026 entsteht die Anmeldung HIER — vorher
   gibt es sie nicht. Bis zur bestätigten Zahlung steht in der
   VERA-Datenbank nichts; die Anmeldedaten liegen verschlüsselt in der
   Bezahlseite des Anbieters.

   Fünf Dinge passieren, in dieser Reihenfolge:
     1. Unterschrift prüfen — ohne gültige Unterschrift: 400.
     2. Doppelte Meldungen abfangen — dieselbe Meldung wirkt genau
        einmal.
     3. Die Marke aufschliessen. Veranstaltung und Betrag gehen als
        mitversiegelte Zusatzdaten ein: Passt einer von beiden nicht,
        öffnet sie sich gar nicht erst.
     4. Plätze prüfen und anlegen — in EINER Transaktion, mit
        gesperrter Veranstaltungszeile (lib/anmeldungAnlegen.ts).
     5. Reicht es nicht, entsteht keine Anmeldung, sondern ein Beleg
        in `Fehlbuchung`, und das Geld geht zurück.

   Eine Rückleitung im Browser („…?bezahlt=1") kann jeder selbst in
   die Adresszeile tippen und ist als Nachweis wertlos.
   --------------------------------------------------------------- */

import type Stripe from "stripe";
import { db } from "@/lib/db";
import {
  rueckmeldungPruefen,
  ZahlungNichtEingerichtet,
  markeZusammensetzen,
  erstattungAusloesen,
} from "@/lib/zahlung";
import { entschluesseln, MarkeUngueltig } from "@/lib/anmeldeNutzlast";
import { schluesselbund } from "@/lib/anmeldeSchluessel";
import {
  anmeldungAusZahlung,
  fehlbuchungFesthalten,
  erstattungVermerken as fehlbuchungErstattungVermerken,
  SOFORT_ERSTATTEN,
  type Fehlbuchungsgrund,
} from "@/lib/anmeldungAnlegen";
import { fassungenZurBuchung } from "@/lib/rechtstexte";
import { mailSendenOhneAbbruch, adminEmpfaenger } from "@/lib/mail";
import {
  zahlungsBestaetigungsMail,
  adminBenachrichtigungsMail,
  erstattungsHinweisMail,
} from "@/lib/mailVorlagen";
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
      case "checkout.session.async_payment_failed":
        /* Kein Geld geflossen, also gibt es nichts zu vermerken —
           und ausdrücklich nichts anzulegen. Eine abgebrochene oder
           fehlgeschlagene Zahlung hinterlässt seit dem 25.09.2026
           KEINE Zeile in der VERA-Datenbank. Die Meldung wird nur
           quittiert. */
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
  if (sitzung.payment_status !== "paid") return;

  const betragCents = sitzung.amount_total;
  if (betragCents === null) {
    console.error("Bezahlte Sitzung ohne Betrag:", sitzung.id);
    return;
  }

  const eventId = sitzung.metadata?.event ?? null;
  const marke = markeZusammensetzen(sitzung.metadata);

  /* Eine bezahlte Sitzung ohne Marke. Das kann nur zweierlei sein:
     eine Bezahlseite aus der Zeit vor dem Umbau, die beim Ausrollen
     noch offen war — oder etwas, das niemand vorhergesehen hat.

     In beiden Fällen gilt: Geld ist da, eine Anmeldung kann nicht
     entstehen. Es wird ein Beleg geschrieben, aber NICHT automatisch
     erstattet. Bei einem Vorgang, den das Programm nicht versteht,
     eigenmächtig Geld zurückzubuchen wäre die falsche Antwort; der
     Adminbereich weist ihn zur Klärung aus.

     Der Ausrollplan sieht deshalb vor, vorher nachzusehen, dass keine
     Bezahlseite mehr offen ist. */
  if (!eventId || !marke) {
    console.error(
      `Bezahlte Sitzung ohne verschlüsselte Anmeldung (${sitzung.id}). ` +
        "Bitte im Adminbereich klären — es wurde NICHT automatisch erstattet.",
    );
    await fehlbuchungFesthalten(sitzung.id, betragCents, "ohne-marke");
    return;
  }

  /* Aufschliessen. Veranstaltung und Betrag muss der Aufrufer
     mitbringen — beide kommen aus der Rückmeldung des Anbieters, nicht
     aus der Marke. Stimmen sie nicht mit dem überein, was beim
     Absenden galt, scheitert das Siegel. Genau das ist der
     Betragsabgleich: Er ist nicht eine Prüfung neben der
     Verschlüsselung, sondern ein Teil von ihr. */
  let nutzlast;
  try {
    nutzlast = entschluesseln(marke, schluesselbund(), { eventId, preisCents: betragCents });
  } catch (e) {
    const grund = e instanceof MarkeUngueltig ? e.grund : "unbekannt";
    console.error(
      `Die Marke der Sitzung ${sitzung.id} liess sich nicht aufschliessen (${grund}). ` +
        "Geld ist eingegangen. NICHT automatisch erstattet — bitte im Adminbereich klären.",
    );
    await fehlbuchungFesthalten(sitzung.id, betragCents, "betrag-abweichend");
    return;
  }

  const zahlungId = zahlungsAbsichtVon(sitzung);

  const ergebnis = await anmeldungAusZahlung(nutzlast, {
    sitzungId: sitzung.id,
    zahlungId,
    bezahlterBetragCents: betragCents,
  });

  if (ergebnis.lage === "schon-da") {
    /* Ein anderer Weg war schneller — die Abschluss-Seite oder der
       nächtliche Abgleich. Kein Fehler, nichts zu tun: Die Mail ist
       dort bereits verschickt worden. */
    return;
  }

  if (ergebnis.lage === "fehlbuchung") {
    await fehlbuchungAbwickeln(sitzung.id, betragCents, zahlungId, ergebnis.grund, nutzlast.kontaktEmail);
    return;
  }

  await bestaetigungVerschicken(ergebnis.anmeldungId);
}

/**
 * Geld ist da, eine Anmeldung kann nicht entstehen.
 *
 * Erst den Beleg schreiben, dann erstatten — in dieser Reihenfolge und
 * nicht umgekehrt. Stürzt der Dienst dazwischen ab, steht eine offene
 * Zeile da, die der Abgleichlauf findet. Andersherum wäre das Geld
 * zurück und niemand wüsste davon.
 *
 * Der Erstattungsaufruf steht ausserhalb jeder Datenbanktransaktion:
 * Ein Netzaufruf in einer offenen Transaktion hielte Sperren über eine
 * fremde Laufzeit hinweg.
 */
async function fehlbuchungAbwickeln(
  sitzungId: string,
  betragCents: number,
  zahlungId: string | null,
  grund: Fehlbuchungsgrund,
  email: string,
): Promise<void> {
  const { schonDa } = await fehlbuchungFesthalten(sitzungId, betragCents, grund);
  if (schonDa) return;

  if (!SOFORT_ERSTATTEN.includes(grund)) {
    console.error(`Fehlbuchung ${sitzungId} (${grund}) — bewusst NICHT automatisch erstattet.`);
    return;
  }

  if (!zahlungId) {
    console.error(
      `Fehlbuchung ${sitzungId} (${grund}): keine Zahlungskennung, Erstattung nicht möglich. ` +
        "Bitte im Dashboard des Anbieters von Hand erstatten.",
    );
    return;
  }

  try {
    const erstattung = await erstattungAusloesen(zahlungId, sitzungId);
    await fehlbuchungErstattungVermerken(sitzungId, erstattung.id);
  } catch (e) {
    /* Nicht erneut werfen: Der Beleg steht, und der Abgleichlauf holt
       die Erstattung nach. Die Rückmeldung mit 500 zu beantworten
       würde den Anbieter dieselbe Meldung wiederholen lassen — und
       beim zweiten Mal stünde die Zeile schon, sodass er gar nicht
       mehr hierher käme. */
    console.error(`Erstattung für ${sitzungId} fehlgeschlagen, wird nachgeholt:`, e);
    return;
  }

  await mailSendenOhneAbbruch({
    an: email,
    ...erstattungsHinweisMail(grund),
  });
}

/** Die Bestätigungsmail zu einer frisch angelegten Anmeldung. */
async function bestaetigungVerschicken(anmeldungId: string): Promise<void> {
  const anmeldung = await db.registration.findUnique({
    where: { id: anmeldungId },
    include: { event: true, teilnehmer: true },
  });
  if (!anmeldung) return;

  // Angenehme Zugabe, kein Grund, die Rückmeldung scheitern zu lassen —
  // die Anmeldung steht bereits, ein Mail-Ausfall darf das nicht
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
      // Die Fassungen der BUCHUNG, nicht die heute geltenden.
      await fassungenZurBuchung(anmeldung.id),
    ),
  });

  const empfaenger = adminEmpfaenger();
  if (empfaenger) {
    await mailSendenOhneAbbruch({
      an: empfaenger,
      ...adminBenachrichtigungsMail(
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
      ),
    });
  }
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
