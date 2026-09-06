/* ---------------------------------------------------------------
   Eine unterschriebene Rückmeldung an den Server schicken.

   Dieselbe Mechanik wie in pruefung/J/j-zahlung.mjs, hier als eigener
   Baustein, damit die P-Liste sie mitbenutzen kann, ohne sie ein
   zweites Mal zu schreiben.

   Der Schlüssel ist erfunden und erreicht keinen echten Dienst — er
   ist nur der Wert, auf den die örtliche Attrappe hört.
   --------------------------------------------------------------- */

import Stripe from "stripe";

const GEHEIMNIS = process.env.ZAHLUNG_WEBHOOK_GEHEIMNIS ?? "whsec_pruefgeheimnis_nur_lokal";
const stripe = new Stripe(process.env.ZAHLUNG_GEHEIMSCHLUESSEL ?? "sk_test_pruefung_ohne_echtes_konto");

export async function rueckmeldungSenden(basis, ereignis, { unterschrift } = {}) {
  const rohtext = JSON.stringify(ereignis);
  const kopf =
    unterschrift === undefined
      ? stripe.webhooks.generateTestHeaderString({ payload: rohtext, secret: GEHEIMNIS })
      : unterschrift;

  const antwort = await fetch(`${basis}/zahlung/rueckmeldung`, {
    method: "POST",
    body: rohtext,
    headers: {
      "content-type": "application/json",
      ...(kopf ? { "stripe-signature": kopf } : {}),
    },
  });
  return { status: antwort.status, text: await antwort.text() };
}
