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
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import Stripe from "stripe";
import { absenden, personen, BASIS } from "../K/senden.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";
import { bezahlseiteFuer } from "../../lib/zahlungStart.js";
import { stornoDurchAdmin } from "../../lib/stornoAusfuehren.js";

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

/* ═══ Teil 5: die Abschluss-Seite als zweite Tür ══════════════════
   Sie fragt beim Anbieter nach und darf selbst auf „bezahlt"
   schreiben. Sie ist OHNE Anmeldung erreichbar — wer nach seiner
   Stornierung den alten Link noch einmal öffnet (Mail, Verlauf,
   Lesezeichen), hätte seine erstattete Buchung sonst mit einem
   blossen Seitenaufruf zurückgeholt.

   Die Bezahlseite wird dafür WIRKLICH beim Anbieter angelegt und dort
   als bezahlt markiert. Eine erfundene Kennung liefe in eine
   Fehlermeldung — die Prüfung bestünde dann aus dem falschen Grund
   und wäre wertlos. Genau das ist beim ersten Anlauf passiert. */
await db.registration.update({
  where: { id: roh.id },
  data: {
    status: "RESERVIERT", zahlungsStatus: "OFFEN",
    storniertAm: null, reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
    zahlungsAbsicht: null, zahlungsReferenz: null, bezahlterBetragCents: null, bezahltAm: null,
  },
});

await bezahlseiteFuer(roh.id, new Date());
const mitSitzung = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });
pruefe("Vorbedingung: eine echte Bezahlseite ist angelegt",
  Boolean(mitSitzung.zahlungsReferenz), mitSitzung.zahlungsReferenz ?? "keine");

const attrappe =
  `http://${process.env.ZAHLUNG_TEST_HOST ?? "127.0.0.1"}:${process.env.ZAHLUNG_TEST_PORT ?? 4242}`;
const markiert = await fetch(
  `${attrappe}/steuerung/klick-bezahlt/${mitSitzung.zahlungsReferenz}`,
  { redirect: "manual" },
);
pruefe("Vorbedingung: beim Anbieter gilt sie als bezahlt",
  markiert.status === 302, `Antwort ${markiert.status}`);

/* Jetzt storniert und erstattet — die Rückmeldung des Anbieters wird
   absichtlich NICHT geschickt, es geht allein um den Seitenaufruf. */
await db.registration.update({
  where: { id: roh.id },
  data: {
    status: "STORNIERT", zahlungsStatus: "ERSTATTET",
    storniertAm: new Date(), reserviertBis: null,
  },
});

/* Mit `zahlung=zurueck` — nur dann fragt die Seite beim Anbieter nach.
   Genau diese Adresse steht nach einer Zahlung im Verlauf und in der
   Adresszeile; sie wird erneut aufgerufen, wenn jemand zurückblättert
   oder den Tab später wieder öffnet. */
const seite = await fetch(`${BASIS}/anmeldung/danke?nr=${roh.id}&zahlung=zurueck`);
await seite.text();
const nachSeitenaufruf = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });

pruefe("Die Abschluss-Seite ist erreichbar", seite.status === 200, `Antwort ${seite.status}`);
pruefe("… belebt eine stornierte Buchung aber NICHT wieder",
  nachSeitenaufruf.status === "STORNIERT" && nachSeitenaufruf.zahlungsStatus === "ERSTATTET",
  `${nachSeitenaufruf.status} / ${nachSeitenaufruf.zahlungsStatus}`);
pruefe("… und der Platz bleibt frei", (await belegte(event.id)) === 0,
  `${await belegte(event.id)} belegt`);

/* ═══ Teil 6: zweimal buchen, zweimal stornieren ══════════════════
   Der Weg, der im Betrieb scheiterte. Eine Buchungszeile wird bei der
   erneuten Anmeldung wiederverwendet — die zweite Stornierung erstattet
   deshalb eine ANDERE Zahlung als die erste. Der Wiederholungsschlüssel
   an den Anbieter enthielt frueher nur die Anmeldenummer und war damit
   beide Male gleich. Der Anbieter wies die zweite Erstattung ab
   ("idempotency_error"), einen ganzen Tag lang — fuer den Kunden sah
   es aus, als taete der Storno-Knopf nichts. */
const anbieter =
  `http://${process.env.ZAHLUNG_TEST_HOST ?? "127.0.0.1"}:${process.env.ZAHLUNG_TEST_PORT ?? 4242}`;

/** Bezahlseite anlegen, beim Anbieter bezahlen, Rueckmeldung schicken. */
async function durchbezahlen(lauf) {
  await bezahlseiteFuer(roh.id, new Date());
  const a = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });
  await fetch(`${anbieter}/steuerung/klick-bezahlt/${a.zahlungsReferenz}`, { redirect: "manual" });
  const sitzung = await (
    await fetch(`${anbieter}/v1/checkout/sessions/${a.zahlungsReferenz}`)
  ).json();
  await rueckmeldung(bezahltEreignis(`evt_m_zweimal_${lauf}`, "checkout.session.completed", {
    sitzung: a.zahlungsReferenz, anmeldungId: roh.id,
    betrag: a.gesamtpreisCents, zahlung: sitzung.payment_intent,
  }));
  return sitzung.payment_intent;
}

await db.registration.update({
  where: { id: roh.id },
  data: {
    status: "RESERVIERT", zahlungsStatus: "OFFEN",
    storniertAm: null, reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
    zahlungsAbsicht: null, zahlungsReferenz: null, bezahlterBetragCents: null, bezahltAm: null,
  },
});

const ersteZahlung = await durchbezahlen(1);
const ersterStorno = await stornoDurchAdmin(roh.id);
pruefe("Erste Buchung: Stornierung mit Erstattung",
  ersterStorno.erfolg === true && ersterStorno.erstattet === true,
  JSON.stringify(ersterStorno));

/* Erneut anmelden — dieselbe Zeile, frische Zahlung. */
await absenden(
  { eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "adult", webseite: "",
    ...personen([
      { vorname: "Nina", nachname: "Spaet", email: "nina.spaet@example.org", telefon: "030222" },
    ]) },
  neueIp(),
);
const zweiteZahlung = await durchbezahlen(2);
pruefe("Die zweite Zahlung ist eine andere als die erste",
  Boolean(zweiteZahlung) && zweiteZahlung !== ersteZahlung,
  `${ersteZahlung} → ${zweiteZahlung}`);

const zweiterStorno = await stornoDurchAdmin(roh.id);
pruefe("Zweite Buchung: Stornierung wird NICHT vom Wiederholungsschlüssel blockiert",
  zweiterStorno.erfolg === true && zweiterStorno.erstattet === true,
  JSON.stringify(zweiterStorno));

const nachZweitem = await db.registration.findUniqueOrThrow({ where: { id: roh.id } });
pruefe("… und die Buchung steht auf storniert und erstattet",
  nachZweitem.status === "STORNIERT" && nachZweitem.zahlungsStatus === "ERSTATTET",
  `${nachZweitem.status} / ${nachZweitem.zahlungsStatus}`);

// ── Aufräumen ───────────────────────────────────────────────────
await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.zahlungsEreignis.deleteMany({});
await db.anmeldeVersuch.deleteMany({});

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
