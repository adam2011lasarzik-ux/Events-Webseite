/* Der neue Fall: eine verzögert FEHLGESCHLAGENE Zahlung.

   Bei PayPal und ähnlichen Wegen entscheidet sich nicht sofort, ob
   das Geld kommt. Meldet der Anbieter später einen Fehlschlag, darf
   die Anmeldung den Platz nicht bis zum Ende der halben Stunde
   weiter blockieren — sie muss aber erhalten bleiben, damit ein
   zweiter Anlauf ohne neue Eingabe möglich ist. */
import Stripe from "stripe";
import { absenden, personen, BASIS } from "../K/senden.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";
import { bezahlseiteFuer } from "../../lib/zahlungStart.js";

const GEHEIMNIS = "whsec_pruefgeheimnis_nur_lokal";
const stripe = new Stripe("sk_test_pruefung_ohne_echtes_konto");

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
let ip = 60;
const neueIp = () => `198.51.100.${(ip = (ip % 200) + 1)}`;

async function rueckmeldung(ereignis) {
  const rohtext = JSON.stringify(ereignis);
  const kopf = stripe.webhooks.generateTestHeaderString({ payload: rohtext, secret: GEHEIMNIS });
  const antwort = await fetch(`${BASIS}/zahlung/rueckmeldung`, {
    method: "POST",
    body: rohtext,
    headers: { "content-type": "application/json", "stripe-signature": kopf },
  });
  return { status: antwort.status, text: await antwort.text() };
}

const ereignis = (id, sitzung) => ({
  id, object: "event", type: "checkout.session.async_payment_failed",
  data: { object: { id: sitzung.id, object: "checkout.session",
    metadata: { anmeldungId: sitzung.anmeldungId }, client_reference_id: sitzung.anmeldungId,
    payment_status: "unpaid", status: "open", amount_total: sitzung.betrag } },
});

const belegte = async (eventId) => {
  const treffer = await db.registration.findMany({
    where: { eventId, ...belegtFilter(new Date()) },
    include: { teilnehmer: true },
  });
  return treffer.reduce((s, a) => s + a.teilnehmer.length, 0);
};

// ── Aufräumen und anmelden ──────────────────────────────────────
await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.anmeldeVersuch.deleteMany({});
await db.zahlungsEreignis.deleteMany({});

const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

await absenden(
  { eventSlug: "padel-falkensee", weg: "familie", schueler: 2, erwachsene: 2, webseite: "",
    ...personen([
      { vorname: "Mia", nachname: "Fehl", email: "mia.fehl@example.org", telefon: "030111" },
      { vorname: "Tom", nachname: "Fehl" },
      { vorname: "Kim", nachname: "Fehl" },
      { vorname: "Lu", nachname: "Fehl" },
    ]),
    einwilligungVormund: "an" },
  neueIp(),
);

const a1 = await db.registration.findFirstOrThrow({ where: { kontaktEmail: "mia.fehl@example.org" } });
pruefe("Anmeldung entsteht als Reservierung", a1.status === "RESERVIERT" && a1.zahlungsStatus === "OFFEN");
pruefe("… und belegt sofort vier Plätze", (await belegte(event.id)) === 4, `${await belegte(event.id)} belegt`);
pruefe("… mit einer Bezahlseite beim Anbieter", Boolean(a1.zahlungsReferenz), a1.zahlungsReferenz ?? "keine");

// ── Der Anbieter meldet: Zahlung fehlgeschlagen ─────────────────
const r = await rueckmeldung(ereignis("evt_m_fehl_1",
  { id: a1.zahlungsReferenz, anmeldungId: a1.id, betrag: a1.gesamtpreisCents }));
pruefe("Die Fehlermeldung wird angenommen", r.status === 200, `Antwort ${r.status}`);

const a2 = await db.registration.findUniqueOrThrow({ where: { id: a1.id } });
pruefe("Die Anmeldung bleibt bestehen", a2 !== null);
pruefe("Sie gilt NICHT als bezahlt", a2.zahlungsStatus === "OFFEN", a2.zahlungsStatus);
pruefe("Sie gilt NICHT als bestätigt", a2.status === "RESERVIERT", a2.status);
pruefe("Die Reservierung ist beendet",
  a2.reserviertBis !== null && a2.reserviertBis <= new Date(),
  String(a2.reserviertBis));
pruefe("… und der Platz ist damit sofort wieder frei", (await belegte(event.id)) === 0,
  `${await belegte(event.id)} belegt`);

// ── Zweiter Anlauf ──────────────────────────────────────────────
const zweiter = await bezahlseiteFuer(a1.id, new Date());
pruefe("Ein zweiter Anlauf ist möglich", Boolean(zweiter.url), JSON.stringify(zweiter).slice(0, 90));
const a3 = await db.registration.findUniqueOrThrow({ where: { id: a1.id } });
pruefe("… und hält den Platz wieder", (await belegte(event.id)) === 4, `${await belegte(event.id)} belegt`);
pruefe("… ohne dass ein zweiter Datensatz entsteht",
  (await db.registration.count({ where: { kontaktEmail: "mia.fehl@example.org" } })) === 1);

// ── Dieselbe Meldung ein zweites Mal ────────────────────────────
const wieder = await rueckmeldung(ereignis("evt_m_fehl_1",
  { id: a1.zahlungsReferenz, anmeldungId: a1.id, betrag: a1.gesamtpreisCents }));
pruefe("Dieselbe Meldung wirkt nicht doppelt", wieder.status === 200 && wieder.text.includes("Bereits"));
pruefe("… der zweite Anlauf bleibt unangetastet", (await belegte(event.id)) === 4,
  `${await belegte(event.id)} belegt`);

// ── Eine Fehlermeldung NACH erfolgreicher Zahlung ───────────────
await db.registration.update({
  where: { id: a1.id },
  data: { status: "BESTAETIGT", zahlungsStatus: "BEZAHLT", reserviertBis: null, bezahltAm: new Date() },
});
const spaet = await rueckmeldung(ereignis("evt_m_fehl_2",
  { id: a3.zahlungsReferenz, anmeldungId: a1.id, betrag: a1.gesamtpreisCents }));
const a4 = await db.registration.findUniqueOrThrow({ where: { id: a1.id } });
pruefe("Eine späte Fehlermeldung reisst eine bezahlte Anmeldung NICHT auf",
  spaet.status === 200 && a4.status === "BESTAETIGT" && a4.zahlungsStatus === "BEZAHLT",
  `${a4.status} / ${a4.zahlungsStatus}`);

// ── Aufräumen ───────────────────────────────────────────────────
await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.zahlungsEreignis.deleteMany({});
await db.anmeldeVersuch.deleteMany({});

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
