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

async function bezahltVermerken(sitzung: Stripe.Checkout.Session): Promise<void> {
  const id = sitzung.metadata?.anmeldungId ?? sitzung.client_reference_id;
  if (!id) {
    console.error("Rückmeldung ohne Anmeldenummer:", sitzung.id);
    return;
  }
  if (sitzung.payment_status !== "paid") return;

  const anmeldung = await db.registration.findUnique({ where: { id } });
  if (!anmeldung) {
    console.error("Rückmeldung für unbekannte Anmeldung:", id);
    return;
  }
  if (anmeldung.zahlungsStatus === "BEZAHLT") return;

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

  /* Geld ist geflossen — der Platz gilt.

     Auch dann, wenn die Reservierung inzwischen abgelaufen und das
     Event voll ist. Einen bezahlten Platz stillschweigend abzulehnen
     wäre der schlimmere Fehler; eine Überbuchung sieht der
     Veranstalter im Adminbereich und kann sie klären. */
  await db.registration.update({
    where: { id },
    data: {
      status: "BESTAETIGT",
      reserviertBis: null,
      zahlungsStatus: "BEZAHLT",
      zahlungsWeg: "ONLINE",
      zahlungsReferenz: sitzung.id,
      bezahlterBetragCents: sitzung.amount_total ?? anmeldung.gesamtpreisCents,
      bezahltAm: new Date(),
    },
  });
}

async function erstattungVermerken(zahlung: Stripe.Charge): Promise<void> {
  // Die Zahlung führt zurück auf die Sitzung; über deren Kennung
  // finden wir die Anmeldung wieder.
  const sitzungId = typeof zahlung.payment_intent === "string" ? zahlung.payment_intent : null;
  const anmeldung = await db.registration.findFirst({
    where: {
      OR: [
        { zahlungsReferenz: zahlung.id },
        ...(sitzungId ? [{ zahlungsReferenz: sitzungId }] : []),
        ...(zahlung.metadata?.anmeldungId ? [{ id: zahlung.metadata.anmeldungId }] : []),
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
