/* Zahlung und Reservierung — der ganze eigene Ablauf.

   Der Anbieter selbst ist eine Attrappe (stripe-attrappe.mjs), weil
   api.stripe.com aus dieser Umgebung gesperrt ist. Geprüft wird damit
   alles, wofür wir verantwortlich sind: Reservierung, Unterschrift,
   doppelte Meldungen, Betragsabgleich, Statuswechsel, Riegel. */
import Stripe from "stripe";
import { absenden, personen, BASIS, ANMELDEPFAD } from "./senden.mjs";
import { db } from "../../lib/db.js";
import { istTestschluessel, darfZahlen, betragPasst } from "../../lib/zahlungRegeln.js";

const ATTRAPPE = "http://127.0.0.1:4242";
const GEHEIMNIS = "whsec_pruefgeheimnis_nur_lokal";
const stripe = new Stripe("sk_test_pruefung_ohne_echtes_konto");

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

let ip = 100;
const neueIp = () => `198.51.100.${(ip = (ip % 200) + 1)}`;

/** Eine Rückmeldung mit gültiger Unterschrift schicken. */
async function rueckmeldung(ereignis, { unterschrift } = {}) {
  const rohtext = JSON.stringify(ereignis);
  const kopf =
    unterschrift === undefined
      ? stripe.webhooks.generateTestHeaderString({ payload: rohtext, secret: GEHEIMNIS })
      : unterschrift;
  const antwort = await fetch(`${BASIS}/zahlung/rueckmeldung`, {
    method: "POST",
    body: rohtext,
    headers: { "content-type": "application/json", ...(kopf ? { "stripe-signature": kopf } : {}) },
  });
  return { status: antwort.status, text: await antwort.text() };
}

let ereignisZaehler = 0;
const sitzungEreignis = (sitzung, art = "checkout.session.completed") => ({
  id: `evt_pruef_${++ereignisZaehler}`,
  object: "event",
  type: art,
  data: { object: sitzung },
});

/** Meldet eine Person an und liefert die Anmeldung samt Sitzung. */
async function anmelden(email, { schueler = 1, erwachsene = 0 } = {}) {
  const antwort = await absenden(
    {
      eventSlug: "padel-falkensee", weg: "selbst",
      selbstAls: schueler > 0 ? "student" : "adult",
      schueler, erwachsene, webseite: "",
      ...personen([{ vorname: "Test", nachname: "Person", email, telefon: "" }]),
    },
    neueIp(),
  );
  const anmeldung = await db.registration.findFirst({
    where: { kontaktEmail: email }, include: { teilnehmer: true },
  });
  return { antwort, anmeldung };
}

// ── Aufräumen, damit jeder Lauf gleich beginnt ─────────────────
await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.anmeldeVersuch.deleteMany({});
await db.zahlungsEreignis.deleteMany({});

// ── 1. Reine Regeln ────────────────────────────────────────────
pruefe("Testschlüssel wird erkannt", istTestschluessel("sk_test_abc"));
pruefe("Echter Schlüssel wird NICHT als Testschlüssel gewertet",
  !istTestschluessel("sk_live_abc") && !istTestschluessel("pk_test_abc"));
pruefe("Zahlung für unbekannte Anmeldung abgelehnt", darfZahlen(null) === "unbekannt");
pruefe("Zahlung für stornierte Anmeldung abgelehnt",
  darfZahlen({ id: "x", status: "STORNIERT", zahlungsStatus: "OFFEN", gesamtpreisCents: 700 }) === "storniert");
pruefe("Zahlung für bereits bezahlte Anmeldung abgelehnt",
  darfZahlen({ id: "x", status: "BESTAETIGT", zahlungsStatus: "BEZAHLT", gesamtpreisCents: 700 }) === "bereits-bezahlt");
pruefe("Zahlung über 0 € abgelehnt",
  darfZahlen({ id: "x", status: "RESERVIERT", zahlungsStatus: "OFFEN", gesamtpreisCents: 0 }) === "kein-betrag");
pruefe("Betragsabgleich: gleich passt, abweichend nicht",
  betragPasst(700, 700) && !betragPasst(100, 700) && !betragPasst(null, 700));

// ── 2. Anmeldung führt zur Bezahlseite ─────────────────────────
const a1 = await anmelden("lena@example.org");
pruefe("Anmeldung leitet zur Bezahlseite des Anbieters",
  (a1.antwort.ziel ?? "").startsWith(`${ATTRAPPE}/bezahlseite/`), a1.antwort.ziel ?? "—");
pruefe("Status ist „Platz reserviert“", a1.anmeldung?.status === "RESERVIERT", a1.anmeldung?.status);
const minuten = a1.anmeldung?.reserviertBis
  ? Math.round((a1.anmeldung.reserviertBis.getTime() - Date.now()) / 60000) : -1;
pruefe("Der Platz ist rund 30 Minuten gehalten", minuten >= 28 && minuten <= 30, `${minuten} Minuten`);
pruefe("Die Sitzungskennung ist gespeichert",
  (a1.anmeldung?.zahlungsReferenz ?? "").startsWith("cs_test_"), a1.anmeldung?.zahlungsReferenz ?? "—");
pruefe("Zahlung steht auf offen", a1.anmeldung?.zahlungsStatus === "OFFEN");

// Der Anbieter hat genau die gewünschten Wege bekommen
const sitzungen = await (await fetch(`${ATTRAPPE}/steuerung/sitzungen`)).json();
const meine = sitzungen.find((s) => s.metadata?.anmeldungId === a1.anmeldung.id);
pruefe("Nur Karte und PayPal angefragt (Wallets kommen über die Karte)",
  JSON.stringify(meine?.payment_method_types) === JSON.stringify(["card", "paypal"]),
  JSON.stringify(meine?.payment_method_types));
pruefe("Der Betrag kommt aus der Datenbank",
  meine?.amount_total === a1.anmeldung.gesamtpreisCents, `${meine?.amount_total} Cent`);
pruefe("Die Anmeldenummer wird mitgegeben",
  meine?.client_reference_id === a1.anmeldung.id && meine?.metadata?.anmeldungId === a1.anmeldung.id);

// ── 3. Reservierung belegt den Platz ───────────────────────────
const { belegtFilter } = await import("../../lib/plaetze.js");
const belegteJetzt = async () => {
  const rows = await db.registration.findMany({
    where: { event: { slug: "padel-falkensee" }, ...belegtFilter() },
    select: { _count: { select: { teilnehmer: true } } },
  });
  return rows.reduce((s, r) => s + r._count.teilnehmer, 0);
};
pruefe("Die Reservierung belegt sofort einen Platz", (await belegteJetzt()) === 1, `${await belegteJetzt()} belegt`);

// ── 4. Rückmeldung ohne gültige Unterschrift ───────────────────
const sitzungBezahlt = await (await fetch(
  `${ATTRAPPE}/steuerung/bezahlt/${a1.anmeldung.zahlungsReferenz}`, { method: "POST" })).json();

let r = await rueckmeldung(sitzungEreignis(sitzungBezahlt), { unterschrift: "t=1,v1=falsch" });
pruefe("Rückmeldung mit falscher Unterschrift wird abgewiesen", r.status === 400, `Status ${r.status}`);
r = await rueckmeldung(sitzungEreignis(sitzungBezahlt), { unterschrift: null });
pruefe("Rückmeldung ohne Unterschrift wird abgewiesen", r.status === 400, `Status ${r.status}`);
let nach = await db.registration.findUnique({ where: { id: a1.anmeldung.id } });
pruefe("… und hat nichts verändert", nach.zahlungsStatus === "OFFEN" && nach.status === "RESERVIERT");

// ── 5. Gültige Rückmeldung ─────────────────────────────────────
const echtesEreignis = sitzungEreignis(sitzungBezahlt);
r = await rueckmeldung(echtesEreignis);
pruefe("Gültige Rückmeldung wird angenommen", r.status === 200, `Status ${r.status}`);
nach = await db.registration.findUnique({ where: { id: a1.anmeldung.id } });
pruefe("Anmeldung ist jetzt bestätigt und bezahlt",
  nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT",
  `${nach.status} / ${nach.zahlungsStatus}`);
pruefe("Die Reservierung ist beendet", nach.reserviertBis === null);
pruefe("Der bezahlte Betrag stimmt", nach.bezahlterBetragCents === nach.gesamtpreisCents);
pruefe("Der Zeitpunkt der Zahlung ist festgehalten", nach.bezahltAm !== null);

// ── 6. Dieselbe Meldung noch einmal ────────────────────────────
const vorherAm = nach.bezahltAm.getTime();
r = await rueckmeldung(echtesEreignis);
pruefe("Dieselbe Meldung ein zweites Mal wird freundlich quittiert", r.status === 200);
nach = await db.registration.findUnique({ where: { id: a1.anmeldung.id } });
pruefe("… und wirkt nicht doppelt", nach.bezahltAm.getTime() === vorherAm);
pruefe("Es gibt genau EINEN Ereigniseintrag",
  (await db.zahlungsEreignis.count({ where: { id: echtesEreignis.id } })) === 1);

// ── 7. Abweichender Betrag ─────────────────────────────────────
const a2 = await anmelden("mara@example.org");
const gefaelscht = await (await fetch(
  `${ATTRAPPE}/steuerung/bezahlt/${a2.anmeldung.zahlungsReferenz}?betrag=1`, { method: "POST" })).json();
r = await rueckmeldung(sitzungEreignis(gefaelscht));
pruefe("Rückmeldung mit abweichendem Betrag wird angenommen …", r.status === 200);
let nach2 = await db.registration.findUnique({ where: { id: a2.anmeldung.id } });
pruefe("… setzt aber NICHT auf bezahlt",
  nach2.zahlungsStatus === "OFFEN" && nach2.status === "RESERVIERT",
  `${nach2.status} / ${nach2.zahlungsStatus}`);
pruefe("… und hält den gemeldeten Betrag zur Klärung fest",
  nach2.bezahlterBetragCents === 1, `${nach2.bezahlterBetragCents} Cent`);

// ── 8. Erstattung ──────────────────────────────────────────────
r = await rueckmeldung({
  id: "evt_pruef_erstattung", object: "event", type: "charge.refunded",
  data: { object: { id: "ch_x", amount_refunded: 700, payment_intent: null,
    metadata: { anmeldungId: a1.anmeldung.id } } },
});
nach = await db.registration.findUnique({ where: { id: a1.anmeldung.id } });
pruefe("Erstattung wird vermerkt", nach.zahlungsStatus === "ERSTATTET", nach.zahlungsStatus);

// ── 9. Abgelaufene Reservierung ────────────────────────────────
await db.registration.update({
  where: { id: a2.anmeldung.id },
  data: { reserviertBis: new Date(Date.now() - 60_000) },
});
pruefe("Eine abgelaufene Reservierung belegt keinen Platz mehr",
  (await belegteJetzt()) === 1, `${await belegteJetzt()} belegt`);
pruefe("… und wurde dabei NICHT gelöscht",
  (await db.registration.count({ where: { id: a2.anmeldung.id } })) === 1);

// ── 10. Zweiter Anlauf derselben Person ────────────────────────
const a2neu = await anmelden("mara@example.org");
pruefe("Nach Ablauf darf dieselbe Person erneut — kein „bereits angemeldet“",
  (a2neu.antwort.ziel ?? "").startsWith(`${ATTRAPPE}/bezahlseite/`),
  a2neu.antwort.ziel ?? a2neu.antwort.text.slice(0, 80));
pruefe("… und es entsteht kein zweiter Datensatz",
  (await db.registration.count({ where: { kontaktEmail: "mara@example.org" } })) === 1);

// ── 11. Zahlung für eine bezahlte Anmeldung ────────────────────
await db.registration.update({
  where: { id: a1.anmeldung.id }, data: { zahlungsStatus: "BEZAHLT" },
});
const { bezahlseiteFuer } = await import("../../lib/zahlungStart.js");
let versuch = await bezahlseiteFuer(a1.anmeldung.id);
pruefe("Bezahlen einer bereits bezahlten Anmeldung wird abgelehnt",
  "fehler" in versuch && versuch.fehler === "bereits-bezahlt");
versuch = await bezahlseiteFuer("gibtesnicht");
pruefe("Bezahlen einer unbekannten Nummer wird abgelehnt",
  "fehler" in versuch && versuch.fehler === "unbekannt");

// ── 12. Der Riegel gegen echte Zahlungen ───────────────────────
const { zugangVergessen, stripe: zugang } = await import("../../lib/zahlung.js");
const gemerkt = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
process.env.ZAHLUNG_GEHEIMSCHLUESSEL = "sk_live_echtes_konto";
zugangVergessen();
let abgewiesen = false;
try { zugang(); } catch { abgewiesen = true; }
pruefe("Ein ECHTER Schlüssel wird abgewiesen — keine echte Zahlung möglich", abgewiesen);
process.env.ZAHLUNG_GEHEIMSCHLUESSEL = gemerkt;
zugangVergessen();

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
