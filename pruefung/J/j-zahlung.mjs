/* Zahlung — der ganze eigene Ablauf.

   Der Anbieter selbst ist eine Attrappe (stripe-attrappe.mjs), weil
   api.stripe.com aus dieser Umgebung gesperrt ist. Geprüft wird damit
   alles, wofür wir verantwortlich sind: Unterschrift, doppelte
   Meldungen, Betragsabgleich, Statuswechsel, Riegel.

   „Reservierung" stand bis zum 26.09.2026 im Titel. Es gibt sie
   nicht mehr: Zwischen dem Absenden und der bestätigten Zahlung
   steht in der VERA-Datenbank nichts. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import Stripe from "stripe";
import { absenden, personen, BASIS, ANMELDEPFAD } from "./senden.mjs";
import { db } from "../../lib/db.js";
import { istTestschluessel, betragPasst } from "../../lib/zahlungRegeln.js";
import * as zw from "../zahlweg.mjs";

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
  return { antwort, sitzungId: zw.sitzungAusZiel(antwort.ziel) };
}

/** Die Anmeldung zu einer Adresse — oder null, wenn es keine gibt. */
const anmeldungVon = (email) =>
  db.registration.findFirst({ where: { kontaktEmail: email }, include: { teilnehmer: true } });

// ── Aufräumen, damit jeder Lauf gleich beginnt ─────────────────
await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.anmeldeVersuch.deleteMany({});
await db.zahlungsEreignis.deleteMany({});
await db.fehlbuchung.deleteMany({});

// ── 1. Reine Regeln ────────────────────────────────────────────
pruefe("Testschlüssel wird erkannt", istTestschluessel("sk_test_abc"));
pruefe("Echter Schlüssel wird NICHT als Testschlüssel gewertet",
  !istTestschluessel("sk_live_abc") && !istTestschluessel("pk_test_abc"));
/* Die Prüfungen zu `darfZahlen` sind am 26.09.2026 entfallen — samt
   der Funktion. Sie entschied, ob für eine GESPEICHERTE Anmeldung
   bezahlt werden darf; beim Zahlungsstart gibt es keine mehr. Was
   an ihre Stelle getreten ist, prüfen Abschnitt 2 (nichts wird
   gespeichert) und die Liste X. */
pruefe("Betragsabgleich: gleich passt, abweichend nicht",
  betragPasst(700, 700) && !betragPasst(100, 700) && !betragPasst(null, 700));

// ── 2. Anmeldung führt zur Bezahlseite — und speichert NICHTS ──
const a1 = await anmelden("lena@example.org");
pruefe("Anmeldung leitet zur Bezahlseite des Anbieters",
  (a1.antwort.ziel ?? "").startsWith(`${ATTRAPPE}/bezahlseite/`), a1.antwort.ziel ?? "—");
pruefe("Dabei entsteht KEINE Anmeldung", (await db.registration.count()) === 0);
pruefe("… und kein Teilnehmer", (await db.participant.count()) === 0);

// Der Anbieter hat genau die gewünschten Wege bekommen
const sitzungen = await (await fetch(`${ATTRAPPE}/steuerung/sitzungen`)).json();
const meine = sitzungen.find((s) => s.id === a1.sitzungId);
pruefe("Nur Karte und PayPal angefragt (Wallets kommen über die Karte)",
  JSON.stringify(meine?.payment_method_types) === JSON.stringify(["card", "paypal"]),
  JSON.stringify(meine?.payment_method_types));
pruefe("Der Betrag kommt aus der Datenbank", meine?.amount_total === 700,
  `${meine?.amount_total} Cent`);

/* Die Anmeldung reist verschlüsselt in der `metadata` mit. Zwei
   Dinge müssen stimmen, und das zweite ist das wichtigere: Sie muss
   da sein — und sie muss VERSCHLÜSSELT sein. Stünde der Name im
   Klartext beim Anbieter, wäre der ganze Umbau sinnlos. */
const marke = await zw.markeAusMetadaten(meine?.metadata);
pruefe("Die Veranstaltung wird mitgegeben",
  typeof meine?.metadata?.event === "string" && meine.metadata.event.length > 0,
  meine?.metadata?.event ?? "—");
pruefe("Die verschlüsselte Anmeldung reist mit", marke.startsWith("v1."),
  `${marke.length} Zeichen`);
/* Gegen den VOLLEN Text der metadata geprüft, Geheimtext eingeschlossen.
   Die Adresse ist lang genug, dass sie dort nicht zufällig auftauchen
   kann — anders als ein kurzes Wort wie „Test", das in 3.800 Zeichen
   base64 hin und wieder von selbst entsteht und die Prüfung zu einer
   Zufallssache machen würde. */
const alleWerte = JSON.stringify(meine?.metadata ?? {});
pruefe("… und die Adresse steht dort NICHT im Klartext",
  !alleWerte.includes("lena@example.org"));
pruefe("… und kein Feld ist nach Personendaten benannt",
  !/vorname|nachname|email|telefon/i.test(Object.keys(meine?.metadata ?? {}).join(",")),
  Object.keys(meine?.metadata ?? {}).join(", "));

// ── 3. Ein offener Zahlungsvorgang belegt KEINEN Platz ─────────
//
// Bis zum 24.09.2026 belegte schon das Öffnen der Bezahlseite einen
// Platz — im Adminbereich stand „1 Anmeldung · 1 Platz reserviert",
// obwohl niemand bezahlt hatte. Seit dem 26.09.2026 ist die Frage
// noch einfacher zu beantworten: Es gibt gar keine Zeile, die etwas
// belegen könnte.
const { belegtFilter } = await import("../../lib/plaetze.js");
const belegteJetzt = async () => {
  const rows = await db.registration.findMany({
    where: { event: { slug: "padel-falkensee" }, ...belegtFilter() },
    select: { _count: { select: { teilnehmer: true } } },
  });
  return rows.reduce((s, r) => s + r._count.teilnehmer, 0);
};

pruefe("Ein offener Zahlungsvorgang belegt KEINEN Platz",
  (await belegteJetzt()) === 0, `${await belegteJetzt()} belegt`);

// ── 4. Rückmeldung ohne gültige Unterschrift ───────────────────
const sitzungBezahlt = await zw.bezahlen(a1.sitzungId);

let r = await rueckmeldung(sitzungEreignis(sitzungBezahlt), { unterschrift: "t=1,v1=falsch" });
pruefe("Rückmeldung mit falscher Unterschrift wird abgewiesen", r.status === 400, `Status ${r.status}`);
r = await rueckmeldung(sitzungEreignis(sitzungBezahlt), { unterschrift: null });
pruefe("Rückmeldung ohne Unterschrift wird abgewiesen", r.status === 400, `Status ${r.status}`);
pruefe("… und hat nichts angelegt", (await db.registration.count()) === 0);

// ── 5. Gültige Rückmeldung ─────────────────────────────────────
const echtesEreignis = sitzungEreignis(sitzungBezahlt);
r = await rueckmeldung(echtesEreignis);
pruefe("Gültige Rückmeldung wird angenommen", r.status === 200, `Status ${r.status}`);
let nach = await anmeldungVon("lena@example.org");
pruefe("Erst jetzt entsteht die Anmeldung — bestätigt und bezahlt",
  nach !== null && nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT",
  `${nach?.status} / ${nach?.zahlungsStatus}`);
pruefe("Die Bezahlseite ist als Kennung festgehalten",
  nach.zahlungsReferenz === a1.sitzungId, nach.zahlungsReferenz ?? "—");
pruefe("Der bezahlte Betrag stimmt", nach.bezahlterBetragCents === nach.gesamtpreisCents);
pruefe("Der Zeitpunkt der Zahlung ist festgehalten", nach.bezahltAm !== null);
pruefe("… und jetzt ist ein Platz belegt", (await belegteJetzt()) === 1);

// ── 6. Dieselbe Meldung noch einmal ────────────────────────────
const vorherAm = nach.bezahltAm.getTime();
r = await rueckmeldung(echtesEreignis);
pruefe("Dieselbe Meldung ein zweites Mal wird freundlich quittiert", r.status === 200);
nach = await db.registration.findUnique({ where: { id: nach.id } });
pruefe("… und wirkt nicht doppelt", nach.bezahltAm.getTime() === vorherAm);
pruefe("… es bleibt bei einer Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: "lena@example.org" } })) === 1);
pruefe("Es gibt genau EINEN Ereigniseintrag",
  (await db.zahlungsEreignis.count({ where: { id: echtesEreignis.id } })) === 1);

// ── 7. Abweichender Betrag ─────────────────────────────────────
//
// Der Betragsabgleich ist seit dem 26.09.2026 keine Prüfung NEBEN
// der Entschlüsselung mehr, sondern ein Teil von ihr: Der Betrag ist
// mitversiegelt (AAD). Passt er nicht, öffnet sich die Marke gar
// nicht erst — es kann also keine Anmeldung entstehen, auch nicht
// versehentlich.
const a2 = await anmelden("mara@example.org");
const gefaelscht = await zw.bezahlen(a2.sitzungId, 1);
r = await rueckmeldung(sitzungEreignis(gefaelscht));
pruefe("Rückmeldung mit abweichendem Betrag wird angenommen …", r.status === 200);
pruefe("… legt aber KEINE Anmeldung an",
  (await db.registration.count({ where: { kontaktEmail: "mara@example.org" } })) === 0);

const fehl = await db.fehlbuchung.findUnique({ where: { sitzungId: a2.sitzungId } });
pruefe("… sondern hält den Vorgang als Fehlbuchung fest",
  fehl !== null && fehl.grund === "betrag-abweichend", fehl?.grund ?? "keine");
pruefe("… mit dem eingegangenen Betrag", fehl?.betragCents === 1, `${fehl?.betragCents} Cent`);
/* Ausdrückliche Entscheidung vom 25.09.2026: bei abweichendem Betrag
   KEINE automatische Erstattung, sondern eine Warnung im
   Adminbereich und eine Prüfung von Hand. */
pruefe("… und wird NICHT automatisch erstattet", fehl?.erstattetAm === null);

// ── 8. Erstattung ──────────────────────────────────────────────
r = await rueckmeldung({
  id: "evt_pruef_erstattung", object: "event", type: "charge.refunded",
  data: { object: { id: "ch_x", amount_refunded: 700, payment_intent: null,
    metadata: { anmeldungId: nach.id } } },
});
const erstattet = await db.registration.findUnique({ where: { id: nach.id } });
pruefe("Erstattung wird vermerkt", erstattet.zahlungsStatus === "ERSTATTET",
  erstattet.zahlungsStatus);

// ── 9. Eine verfallene Bezahlseite ─────────────────────────────
const a3 = await anmelden("timo@example.org");
await rueckmeldung(sitzungEreignis(await zw.holeSitzung(a3.sitzungId), "checkout.session.expired"));
pruefe("Eine verfallene Bezahlseite hinterlässt keine Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: "timo@example.org" } })) === 0);
pruefe("… und keine Fehlbuchung — es floss kein Geld",
  (await db.fehlbuchung.count({ where: { sitzungId: a3.sitzungId } })) === 0);

// ── 10. Zweiter Anlauf derselben Person ────────────────────────
const a3neu = await anmelden("timo@example.org");
pruefe("Nach dem Verfall darf dieselbe Person erneut — kein „bereits angemeldet“",
  (a3neu.antwort.ziel ?? "").startsWith(`${ATTRAPPE}/bezahlseite/`),
  a3neu.antwort.ziel ?? a3neu.antwort.text.slice(0, 80));
pruefe("… mit einer eigenen, neuen Bezahlseite", a3neu.sitzungId !== a3.sitzungId);

// ── 11. Eine zweite Anmeldung derselben Adresse ────────────────
//
// Die Stelle von „Bezahlen einer bereits bezahlten Anmeldung wird
// abgelehnt". Es gibt keinen Bezahlknopf mehr, den man drücken
// könnte — geprüft wird deshalb dasselbe eine Ebene früher: Wer
// bezahlt hat, kommt gar nicht erst wieder zur Bezahlseite.
await db.registration.update({
  where: { id: nach.id },
  data: { status: "BESTAETIGT", zahlungsStatus: "BEZAHLT" },
});
const nochmal = await anmelden("lena@example.org");
pruefe("Wer schon bezahlt hat, kommt nicht wieder zur Bezahlseite",
  nochmal.sitzungId === null, nochmal.antwort.ziel ?? "keine Weiterleitung");
pruefe("… und es entsteht keine zweite Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: "lena@example.org" } })) === 1);

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
