/* Der Fall: eine verzögert FEHLGESCHLAGENE Zahlung.

   Bei PayPal und ähnlichen Wegen entscheidet sich nicht sofort, ob
   das Geld kommt. Meldet der Anbieter später einen Fehlschlag, darf
   nichts zurückbleiben.

   ── Was diese Liste seit Stufe 2 prüft ──────────────────────────

   Bis zum 25.09.2026 entstand beim Absenden eine Reservierung, und
   diese Liste prüfte, dass ein Fehlschlag sie NICHT löscht: Sie sollte
   erhalten bleiben, damit ein zweiter Anlauf ohne neue Eingabe möglich
   ist, aber ihren Platz sofort freigeben.

   Beides ist entfallen. Es gibt keine Reservierung mehr, die man
   erhalten oder freigeben könnte. Der zweite Anlauf ist eine neue
   Anmeldung — und weil vom ersten nichts übrig ist, steht ihm auch
   nichts im Weg. Was bleibt, ist die schärfere Frage: Hinterlässt ein
   Fehlschlag wirklich NICHTS? Diese Liste beantwortet sie.

   Der letzte Fall ist unverändert wichtig: Eine Fehlermeldung, die
   NACH einer erfolgreichen Zahlung eintrifft, darf eine bezahlte
   Anmeldung nicht aufreissen. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { absenden, personen, BASIS } from "../K/senden.mjs";
import * as zw from "../zahlweg.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
let ip = 60;
const neueIp = () => `198.51.100.${(ip = (ip % 200) + 1)}`;

const rueckmeldung = (sitzung, art, kennung) => zw.rueckmeldung(BASIS, sitzung, art, kennung);

const belegte = async (eventId) => {
  const treffer = await db.registration.findMany({
    where: { eventId, ...belegtFilter() },
    include: { teilnehmer: true },
  });
  return treffer.reduce((s, a) => s + a.teilnehmer.length, 0);
};

const EMAIL = "mia.fehl@example.org";
const familie = () => ({
  eventSlug: "padel-falkensee", weg: "familie", selbstAls: "adult",
  schueler: 2, erwachsene: 2, webseite: "",
  ...personen([
    { vorname: "Mia", nachname: "Fehl", email: EMAIL, telefon: "030111" },
    { vorname: "Tom", nachname: "Fehl" },
    { vorname: "Kim", nachname: "Fehl" },
    { vorname: "Lu", nachname: "Fehl" },
  ]),
  einwilligungVormund: "an",
});

async function aufraeumen() {
  await db.participant.deleteMany({});
  await db.registration.deleteMany({});
  await db.anmeldeVersuch.deleteMany({});
  await db.zahlungsEreignis.deleteMany({});
  await db.fehlbuchung.deleteMany({});
}

await aufraeumen();
const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

// ── Absenden ────────────────────────────────────────────────────
const erst = await absenden(familie(), neueIp());
const sitzung1 = zw.sitzungAusZiel(erst.ziel);
pruefe("Das Absenden führt zur Bezahlseite", sitzung1 !== null, erst.ziel ?? erst.text.slice(0, 70));
pruefe("… und legt keine Anmeldung an", (await db.registration.count()) === 0);
pruefe("… und belegt keinen Platz", (await belegte(event.id)) === 0);

// ── Der Anbieter meldet: Zahlung fehlgeschlagen ─────────────────
const offen = await zw.holeSitzung(sitzung1);
const r = await rueckmeldung(offen, "checkout.session.async_payment_failed", "evt_m_fehl_1");
pruefe("Die Fehlermeldung wird angenommen", r.status === 200, `Antwort ${r.status}`);
pruefe("Danach gibt es KEINE Anmeldung", (await db.registration.count()) === 0);
pruefe("… keinen Teilnehmer", (await db.participant.count()) === 0);
pruefe("… und keine Fehlbuchung, denn es ist kein Geld geflossen",
  (await db.fehlbuchung.count()) === 0);
pruefe("… und weiterhin keinen belegten Platz", (await belegte(event.id)) === 0);

// ── Dieselbe Meldung ein zweites Mal ────────────────────────────
const wieder = await rueckmeldung(offen, "checkout.session.async_payment_failed", "evt_m_fehl_1");
pruefe("Dieselbe Meldung wirkt nicht doppelt",
  wieder.status === 200 && wieder.text.includes("Bereits"), wieder.text.slice(0, 40));

// ── Zweiter Anlauf ──────────────────────────────────────────────
//
// Früher hiess das „zurück zur alten Bezahlseite". Heute ist es eine
// gewöhnliche neue Anmeldung — und genau das ist der Beweis, dass der
// Fehlschlag nichts hinterlassen hat, das im Weg stünde.
const zweit = await absenden(familie(), neueIp());
const sitzung2 = zw.sitzungAusZiel(zweit.ziel);
pruefe("Ein zweiter Anlauf ist möglich", sitzung2 !== null, zweit.ziel ?? zweit.text.slice(0, 70));
pruefe("… mit einer neuen, eigenen Bezahlseite", sitzung2 !== sitzung1);
pruefe("… und es ist immer noch nichts gespeichert", (await db.registration.count()) === 0);

// ── Der zweite Anlauf gelingt ───────────────────────────────────
await rueckmeldung(await zw.bezahlen(sitzung2));
const a = await db.registration.findFirstOrThrow({
  where: { kontaktEmail: EMAIL }, include: { teilnehmer: true },
});
pruefe("Erst die bezahlte Zahlung legt die Anmeldung an",
  a.status === "BESTAETIGT" && a.zahlungsStatus === "BEZAHLT", `${a.status} / ${a.zahlungsStatus}`);
pruefe("… mit allen vier Personen und vier belegten Plätzen",
  a.teilnehmer.length === 4 && (await belegte(event.id)) === 4);
pruefe("… und genau einmal", (await db.registration.count({ where: { kontaktEmail: EMAIL } })) === 1);

// ── Eine Fehlermeldung NACH erfolgreicher Zahlung ───────────────
//
// Der Anbieter kann eine alte Meldung nachreichen. Sie darf eine
// bezahlte Anmeldung nicht aufreissen.
const spaet = await rueckmeldung(
  await zw.holeSitzung(sitzung2), "checkout.session.async_payment_failed", "evt_m_fehl_2");
const danach = await db.registration.findUniqueOrThrow({ where: { id: a.id } });
pruefe("Eine späte Fehlermeldung reisst eine bezahlte Anmeldung NICHT auf",
  spaet.status === 200 && danach.status === "BESTAETIGT" && danach.zahlungsStatus === "BEZAHLT",
  `${danach.status} / ${danach.zahlungsStatus}`);
pruefe("… und der Platz bleibt belegt", (await belegte(event.id)) === 4);

// ── Aufräumen ───────────────────────────────────────────────────
await aufraeumen();

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
