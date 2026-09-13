/* Eine SPÄTE Zahlungsbestätigung darf eine Stornierung nicht
   zurückdrehen.

   Der Fall stammt aus dem echten Testbetrieb und war ein Fehler:
   PayPal bestätigt verzögert. Eine Buchung wurde bezahlt, danach vom
   Kunden storniert und erstattet — und dann traf die Nachmeldung
   `checkout.session.async_payment_succeeded` ein. Die Rückmeldung
   prüfte damals nur `zahlungsStatus === "BEZAHLT"`; auf ERSTATTET traf
   das nicht zu, also schrieb sie die Buchung zurück auf „bestätigt"
   und „bezahlt". Sie stand danach wieder als Teilnehmer in der Liste,
   obwohl das Geld längst zurück war.

   Bei Karten konnte das nie auffallen: die bestätigen sofort, eine
   späte Meldung gibt es dort nicht. Genau deshalb steht der Fall hier.

   Voraussetzungen: Datenbank, Attrappe auf 4242, Server auf 3213. */
import Stripe from "stripe";
import { absenden, personen, BASIS } from "../K/senden.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";

const GEHEIMNIS = "whsec_pruefgeheimnis_nur_lokal";
const stripe = new Stripe("sk_test_pruefung_ohne_echtes_konto");

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
let ip = 20;
const neueIp = () => `203.0.113.${(ip = (ip % 200) + 1)}`;

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

/** Eine geglückte Zahlungsmeldung — wahlweise die sofortige oder die
    verzögerte Fassung. Beide laufen in dieselbe Funktion. */
const bezahltEreignis = (id, art, s) => ({
  id, object: "event", type: art,
  data: { object: { id: s.sitzung, object: "checkout.session",
    metadata: { anmeldungId: s.anmeldungId }, client_reference_id: s.anmeldungId,
    payment_status: "paid", status: "complete",
    amount_total: s.betrag, payment_intent: s.zahlung } },
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
  { eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "adult", webseite: "",
    ...personen([
      { vorname: "Nina", nachname: "Spaet", email: "nina.spaet@example.org", telefon: "030222" },
    ]) },
  neueIp(),
);
const roh = await db.registration.findFirstOrThrow({
  where: { kontaktEmail: "nina.spaet@example.org" },
});

/* ═══ Teil 1: der gewöhnliche Weg muss weiter funktionieren ═══════
   Der neue Wachposten darf die geglückte Zahlung nicht aussperren. */
const gut = await rueckmeldung(bezahltEreignis("evt_m_spaet_1", "checkout.session.completed",
  { sitzung: roh.zahlungsReferenz, anmeldungId: roh.id, betrag: roh.gesamtpreisCents,
    zahlung: "pi_spaet_pruefung" }));
const bezahlt = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });
pruefe("Eine offene Reservierung wird weiterhin ganz normal bestätigt",
  gut.status === 200 && bezahlt.status === "BESTAETIGT" && bezahlt.zahlungsStatus === "BEZAHLT",
  `${bezahlt.status} / ${bezahlt.zahlungsStatus}`);
pruefe("… und die Zahlungskennung wird festgehalten",
  bezahlt.zahlungsAbsicht === "pi_spaet_pruefung", bezahlt.zahlungsAbsicht ?? "keine");

/* ═══ Teil 2: der eigentliche Fall ════════════════════════════════
   Storniert und erstattet — den Zustand stellen wir unmittelbar her.
   Wie er entsteht, prüfen die Storno-Listen; hier geht es allein um
   die Frage, was eine Nachmeldung damit anstellt. */
await db.registration.update({
  where: { id: roh.id },
  data: {
    status: "STORNIERT", zahlungsStatus: "ERSTATTET",
    storniertAm: new Date(), reserviertBis: null,
  },
});
pruefe("Vorbedingung: die Buchung ist storniert und erstattet, der Platz frei",
  (await belegte(event.id)) === 0, `${await belegte(event.id)} belegt`);

const spaet = await rueckmeldung(bezahltEreignis(
  "evt_m_spaet_2", "checkout.session.async_payment_succeeded",
  { sitzung: roh.zahlungsReferenz, anmeldungId: roh.id, betrag: roh.gesamtpreisCents,
    zahlung: "pi_spaet_pruefung" }));
const danach = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });

pruefe("Die späte Meldung wird angenommen (kein endloses Wiederholen)",
  spaet.status === 200, `Antwort ${spaet.status}`);
pruefe("Die Stornierung bleibt bestehen", danach.status === "STORNIERT", danach.status);
pruefe("Die Erstattung bleibt bestehen", danach.zahlungsStatus === "ERSTATTET",
  danach.zahlungsStatus);
pruefe("Der Storno-Zeitpunkt bleibt stehen", danach.storniertAm !== null);
pruefe("… und der Platz bleibt frei", (await belegte(event.id)) === 0,
  `${await belegte(event.id)} belegt`);

/* Auch die sofortige Fassung derselben Meldung darf es nicht. */
const spaet2 = await rueckmeldung(bezahltEreignis(
  "evt_m_spaet_3", "checkout.session.completed",
  { sitzung: roh.zahlungsReferenz, anmeldungId: roh.id, betrag: roh.gesamtpreisCents,
    zahlung: "pi_spaet_pruefung" }));
const danach2 = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });
pruefe("Dasselbe gilt für die sofortige Fassung der Meldung",
  spaet2.status === 200 && danach2.status === "STORNIERT" && danach2.zahlungsStatus === "ERSTATTET",
  `${danach2.status} / ${danach2.zahlungsStatus}`);

/* ═══ Teil 3: storniert, aber NIE bezahlt ═════════════════════════
   Wer storniert, solange die Zahlung noch läuft, bekommt keine
   Erstattung — es ist ja noch kein Geld da. Trifft das Geld danach
   doch ein, darf die Buchung trotzdem nicht auferstehen. Die
   Zahlungskennungen müssen aber festgehalten werden, sonst liesse
   sich eine später von Hand ausgelöste Erstattung dieser Buchung
   nicht mehr zuordnen. */
await db.registration.update({
  where: { id: roh.id },
  data: {
    status: "STORNIERT", zahlungsStatus: "OFFEN",
    zahlungsAbsicht: null, bezahlterBetragCents: null, bezahltAm: null,
  },
});
await rueckmeldung(bezahltEreignis("evt_m_spaet_4", "checkout.session.async_payment_succeeded",
  { sitzung: roh.zahlungsReferenz, anmeldungId: roh.id, betrag: roh.gesamtpreisCents,
    zahlung: "pi_spaet_nachzuegler" }));
const nachzuegler = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });

pruefe("Eine stornierte, unbezahlte Buchung wird durch spätes Geld NICHT bestätigt",
  nachzuegler.status === "STORNIERT" && nachzuegler.zahlungsStatus === "OFFEN",
  `${nachzuegler.status} / ${nachzuegler.zahlungsStatus}`);
pruefe("… die Zahlungskennung wird aber festgehalten (sonst wäre eine Erstattung nicht zuzuordnen)",
  nachzuegler.zahlungsAbsicht === "pi_spaet_nachzuegler", nachzuegler.zahlungsAbsicht ?? "keine");
pruefe("… ebenso der eingegangene Betrag",
  nachzuegler.bezahlterBetragCents === roh.gesamtpreisCents,
  String(nachzuegler.bezahlterBetragCents));
pruefe("… und der Platz bleibt frei", (await belegte(event.id)) === 0,
  `${await belegte(event.id)} belegt`);

/* ═══ Teil 4: nach Storno und Erstattung erneut anmelden ═════════
   Genau der Weg, den ein Kunde nimmt, der es sich anders überlegt:
   storniert, Geld zurück, und zwei Wochen später bucht er doch. Der
   Duplikatsschutz reaktiviert dabei DIESELBE Zeile, statt eine zweite
   anzulegen. Die Spuren der alten, erstatteten Zahlung müssen dabei
   verschwinden — sonst verbucht die Rückmeldung die neue Zahlung
   nicht, und der Kunde hätte bezahlt, ohne bestätigt zu sein. */
await db.registration.update({
  where: { id: roh.id },
  data: {
    status: "STORNIERT", zahlungsStatus: "ERSTATTET",
    storniertAm: new Date(), reserviertBis: null,
    zahlungsAbsicht: "pi_alt_erstattet", bezahlterBetragCents: 2500, bezahltAm: new Date(),
  },
});

await absenden(
  { eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "adult", webseite: "",
    ...personen([
      { vorname: "Nina", nachname: "Spaet", email: "nina.spaet@example.org", telefon: "030222" },
    ]) },
  neueIp(),
);
const erneut = await db.registration.findFirstOrThrow({
  where: { kontaktEmail: "nina.spaet@example.org" },
});

pruefe("Die erneute Anmeldung reaktiviert dieselbe Zeile",
  erneut.id === roh.id && (await db.registration.count({
    where: { kontaktEmail: "nina.spaet@example.org" } })) === 1);
pruefe("… als frische Reservierung", erneut.status === "RESERVIERT", erneut.status);
pruefe("… mit zurückgesetztem Zahlungsstatus", erneut.zahlungsStatus === "OFFEN",
  erneut.zahlungsStatus);
pruefe("… ohne die Spuren der alten, erstatteten Zahlung",
  erneut.zahlungsAbsicht === null && erneut.bezahlterBetragCents === null
    && erneut.bezahltAm === null,
  `${erneut.zahlungsAbsicht} / ${erneut.bezahlterBetragCents} / ${erneut.bezahltAm}`);

const neuBezahlt = await rueckmeldung(bezahltEreignis(
  "evt_m_spaet_5", "checkout.session.completed",
  { sitzung: erneut.zahlungsReferenz ?? "cs_neu_pruefung", anmeldungId: erneut.id,
    betrag: erneut.gesamtpreisCents, zahlung: "pi_neu_pruefung" }));
const bestaetigt = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });
pruefe("Die NEUE Zahlung wird verbucht — der Kunde ist bestätigt",
  neuBezahlt.status === 200 && bestaetigt.status === "BESTAETIGT"
    && bestaetigt.zahlungsStatus === "BEZAHLT",
  `${bestaetigt.status} / ${bestaetigt.zahlungsStatus}`);
pruefe("… mit der neuen Zahlungskennung, nicht der alten",
  bestaetigt.zahlungsAbsicht === "pi_neu_pruefung", bestaetigt.zahlungsAbsicht ?? "keine");

// ── Aufräumen ───────────────────────────────────────────────────
await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.zahlungsEreignis.deleteMany({});
await db.anmeldeVersuch.deleteMany({});

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
