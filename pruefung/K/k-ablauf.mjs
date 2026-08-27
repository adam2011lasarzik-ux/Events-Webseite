/* Anmeldung und Bezahlung als EIN Vorgang — die 15 geforderten Fälle,
   soweit sie ohne Browser prüfbar sind. */
import Stripe from "stripe";
import { absenden, personen, BASIS } from "./senden.mjs";
import { alsText } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";
import { berechnePreis } from "../../lib/preise.js";
import { plaetzeReichen, istTestschluessel } from "../../lib/zahlungRegeln.js";
import { bezahlseiteFuer } from "../../lib/zahlungStart.js";

const ATTRAPPE = "http://127.0.0.1:4242";
const GEHEIMNIS = "whsec_pruefgeheimnis_nur_lokal";
const stripe = new Stripe("sk_test_pruefung_ohne_echtes_konto");

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
let ip = 10;
const neueIp = () => `203.0.113.${(ip = (ip % 240) + 1)}`;

const holeSitzung = async (id) =>
  (await (await fetch(`${ATTRAPPE}/steuerung/sitzungen`)).json()).find((s) => s.id === id);

async function bezahlen(sitzungId, betrag) {
  const zusatz = betrag === undefined ? "" : `?betrag=${betrag}`;
  return (await fetch(`${ATTRAPPE}/steuerung/bezahlt/${sitzungId}${zusatz}`, { method: "POST" })).json();
}

let ereignisse = 0;
async function rueckmeldung(sitzung, art = "checkout.session.completed", kennung) {
  const ereignis = {
    id: kennung ?? `evt_k_${++ereignisse}`, object: "event", type: art,
    data: { object: sitzung },
  };
  const rohtext = JSON.stringify(ereignis);
  const kopf = stripe.webhooks.generateTestHeaderString({ payload: rohtext, secret: GEHEIMNIS });
  const antwort = await fetch(`${BASIS}/zahlung/rueckmeldung`, {
    method: "POST", body: rohtext,
    headers: { "content-type": "application/json", "stripe-signature": kopf },
  });
  return { status: antwort.status, ereignisId: ereignis.id };
}

const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

const belegteJetzt = async () => {
  const rows = await db.registration.findMany({
    where: { eventId: event.id, ...belegtFilter() },
    select: { _count: { select: { teilnehmer: true } } },
  });
  return rows.reduce((s, r) => s + r._count.teilnehmer, 0);
};

async function frischeLage() {
  await db.participant.deleteMany({});
  await db.registration.deleteMany({});
  await db.anmeldeVersuch.deleteMany({});
  await db.zahlungsEreignis.deleteMany({});
  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 100 } });
}

/** Meldet an und liefert Antwort + Anmeldung. */
async function anmelden(email, felder) {
  const antwort = await absenden({ eventSlug: "padel-falkensee", webseite: "", ...felder }, neueIp());
  const anmeldung = await db.registration.findFirst({
    where: { kontaktEmail: email }, include: { teilnehmer: true },
  });
  return { antwort, anmeldung };
}

const einzel = (email) => ({
  weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0,
  ...personen([{ vorname: "Ein", nachname: "Zeln", email, telefon: "" }]),
});
/** Familienpaket: 2 Erwachsene + 2 Schüler = 4 Personen. */
const familie = (email) => ({
  weg: "familie", selbstAls: "adult", schueler: 2, erwachsene: 2,
  ...personen([
    { vorname: "Mama", nachname: "Muster", email, telefon: "030111" },
    { vorname: "Papa", nachname: "Muster" },
    { vorname: "Kind", nachname: "Eins" },
    { vorname: "Kind", nachname: "Zwei" },
  ]),
  einwilligungVormund: "an",
});

await frischeLage();

// ── 1. Einzelperson bezahlt erfolgreich ────────────────────────
{
  const a = await anmelden("einzel@example.org", einzel("einzel@example.org"));
  pruefe("1 · Einzelperson: geht direkt zur Bezahlseite",
    (a.antwort.ziel ?? "").includes("/bezahlseite/"));
  const sitzung = await bezahlen(a.anmeldung.zahlungsReferenz);
  await rueckmeldung(sitzung);
  const nach = await db.registration.findUniqueOrThrow({ where: { id: a.anmeldung.id } });
  pruefe("1 · … und ist danach bestätigt und bezahlt",
    nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT",
    `${nach.status} / ${nach.zahlungsStatus}`);
}

// ── 2.–4. Familienpaket ────────────────────────────────────────
await frischeLage();
{
  const a = await anmelden("familie@example.org", familie("familie@example.org"));
  pruefe("2 · Familienpaket: geht direkt zur Bezahlseite",
    (a.antwort.ziel ?? "").includes("/bezahlseite/"), a.antwort.ziel ?? a.antwort.text.slice(0, 80));
  pruefe("3 · Vier Personen belegen vier Plätze",
    a.anmeldung.teilnehmer.length === 4 && (await belegteJetzt()) === 4,
    `${a.anmeldung.teilnehmer.length} Teilnehmer, ${await belegteJetzt()} belegt`);

  const regeln = {
    schuelerCents: event.preisSchuelerCents,
    erwachsenerCents: event.preisErwachsenerCents,
    familie: {
      basisCents: event.familieBasisCents,
      enthalteneErwachsene: event.familieEnthaltenErwachsene,
      enthalteneSchueler: event.familieEnthaltenSchueler,
      weitererSchuelerCents: event.familieWeitererSchuelerCents,
      maxSchueler: event.familieMaxSchueler,
    },
  };
  // „family", nicht „familie" — so heisst der Wert in lib/preise.ts.
  const erwartet = berechnePreis(regeln, { art: "family", schueler: 2, erwachsene: 2 });
  const sitzung = await holeSitzung(a.anmeldung.zahlungsReferenz);
  pruefe("4 · Preis serverseitig berechnet und so an den Anbieter gegeben",
    a.anmeldung.gesamtpreisCents === erwartet.gesamtCents &&
      sitzung.amount_total === erwartet.gesamtCents,
    `${sitzung.amount_total} Cent = ${(sitzung.amount_total / 100).toFixed(2)} €`);

  const bezahlt = await bezahlen(a.anmeldung.zahlungsReferenz);
  await rueckmeldung(bezahlt);
  const nach = await db.registration.findUniqueOrThrow({
    where: { id: a.anmeldung.id }, include: { teilnehmer: true },
  });
  pruefe("2 · Familienpaket ist danach bestätigt und bezahlt",
    nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT");
  pruefe("3 · … und belegt weiterhin genau vier Plätze", (await belegteJetzt()) === 4);
}

// ── 5.–7. Abbruch und zweiter Anlauf ───────────────────────────
await frischeLage();
{
  const a = await anmelden("abbruch@example.org", einzel("abbruch@example.org"));
  const nach = await db.registration.findUniqueOrThrow({ where: { id: a.anmeldung.id } });
  pruefe("5 · Nach dem Abbruch bleibt die Anmeldung unbezahlt",
    nach.zahlungsStatus === "OFFEN" && nach.status === "RESERVIERT");

  const seite = alsText(await (await fetch(`${BASIS}/anmeldung/danke?nr=${a.anmeldung.id}&zahlung=abgebrochen`)).text());
  pruefe("6 · Die Seite sagt „noch nicht abgeschlossen“",
    seite.includes("noch nicht abgeschlossen"));
  pruefe("6 · … und NICHT „Danke, wir haben deine Anmeldung“",
    !seite.includes("Danke") || !seite.includes("wir haben deine Anmeldung"));
  pruefe("6 · … und nicht „bestätigt“", !seite.includes("Anmeldung ist bestätigt"));

  const erneut = await bezahlseiteFuer(a.anmeldung.id);
  pruefe("7 · „Jetzt bezahlen“ nach Abbruch führt wieder zum Anbieter",
    "url" in erneut && erneut.url.includes("/bezahlseite/"),
    "url" in erneut ? erneut.url : JSON.stringify(erneut));
  const danach = await db.registration.findUniqueOrThrow({
    where: { id: a.anmeldung.id }, include: { teilnehmer: true },
  });
  pruefe("7 · … ohne dass Daten neu eingegeben werden mussten",
    danach.teilnehmer.length === 1 && danach.kontaktEmail === "abbruch@example.org");
}

// ── 8./9. Reservierung läuft ab ────────────────────────────────
await frischeLage();
{
  const a = await anmelden("ablauf@example.org", familie("ablauf@example.org"));
  pruefe("8 · Vor Ablauf sind vier Plätze belegt", (await belegteJetzt()) === 4);
  await db.registration.update({
    where: { id: a.anmeldung.id }, data: { reserviertBis: new Date(Date.now() - 60_000) },
  });
  pruefe("8 · Nach Ablauf gilt die Anmeldung nicht als bestätigte Teilnahme",
    (await db.registration.findUniqueOrThrow({ where: { id: a.anmeldung.id } })).status === "RESERVIERT");
  pruefe("9 · … und die Plätze sind wieder frei", (await belegteJetzt()) === 0);

  const seite = alsText(await (await fetch(`${BASIS}/anmeldung/danke?nr=${a.anmeldung.id}`)).text());
  pruefe("9 · Die Seite zeigt „Reservierung abgelaufen“ statt einer Bestätigung",
    seite.includes("Reservierung abgelaufen") && seite.includes("noch nicht abgeschlossen"));
}

// ── 10./11. Letzte Plätze ──────────────────────────────────────
await frischeLage();
{
  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 3 } });

  const a = await anmelden("drei@example.org", familie("drei@example.org"));
  pruefe("11 · Familie mit 4 Personen bei 3 Plätzen wird abgelehnt",
    a.anmeldung === null && a.antwort.text.includes("reicht das nicht"),
    (a.antwort.text.match(/Es sind nur noch [^<"]*/) ?? ["—"])[0]);

  // Drei Einzelplätze: der dritte muss noch gehen, der vierte nicht.
  for (const i of [1, 2, 3]) {
    await anmelden(`platz${i}@example.org`, einzel(`platz${i}@example.org`));
  }
  pruefe("10 · Drei Plätze sind belegt", (await belegteJetzt()) === 3);
  const vierter = await anmelden("platz4@example.org", einzel("platz4@example.org"));
  pruefe("10 · Der letzte Platz wird kein zweites Mal verkauft",
    vierter.anmeldung === null && vierter.antwort.text.includes("ausgebucht"));

  // Auch der zweite Anlauf über „Jetzt bezahlen" prüft die Plätze neu.
  const eine = await db.registration.findFirstOrThrow({ where: { kontaktEmail: "platz1@example.org" } });
  await db.registration.updateMany({
    where: { kontaktEmail: "platz1@example.org" },
    data: { reserviertBis: new Date(Date.now() - 60_000) },
  });
  await db.registration.updateMany({
    where: { kontaktEmail: { in: ["platz2@example.org", "platz3@example.org"] } },
    data: { status: "BESTAETIGT", reserviertBis: null },
  });
  await anmelden("platz5@example.org", einzel("platz5@example.org"));
  const versuch = await bezahlseiteFuer(eine.id);
  pruefe("11 · Zweiter Anlauf wird abgelehnt, wenn inzwischen kein Platz mehr frei ist",
    "fehler" in versuch && versuch.fehler === "keine-plaetze",
    JSON.stringify(versuch));

  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 100 } });
}

// ── 12. Doppelklick ────────────────────────────────────────────
await frischeLage();
{
  const a = await anmelden("doppel@example.org", einzel("doppel@example.org"));
  const ersteSitzung = a.anmeldung.zahlungsReferenz;

  const [x, y] = await Promise.all([
    bezahlseiteFuer(a.anmeldung.id),
    bezahlseiteFuer(a.anmeldung.id),
  ]);
  pruefe("12 · Zwei gleichzeitige Klicks führen zur SELBEN Bezahlseite",
    "url" in x && "url" in y && x.url === y.url, "url" in x ? x.url : JSON.stringify(x));

  const nach = await db.registration.findUniqueOrThrow({ where: { id: a.anmeldung.id } });
  pruefe("12 · … und es bleibt bei einer Sitzung", nach.zahlungsReferenz === ersteSitzung);

  const offene = (await (await fetch(`${ATTRAPPE}/steuerung/sitzungen`)).json())
    .filter((s) => s.metadata?.anmeldungId === a.anmeldung.id && s.status === "open");
  pruefe("12 · … genau EINE offene Bezahlseite für diese Anmeldung",
    offene.length === 1, `${offene.length} offen`);
}

// ── 12b. Neue Sitzung schliesst die alte ───────────────────────
await frischeLage();
{
  const a = await anmelden("neuesitzung@example.org", einzel("neuesitzung@example.org"));
  const alt = a.anmeldung.zahlungsReferenz;
  // Betrag ändern erzwingt eine neue Sitzung.
  await db.registration.update({ where: { id: a.anmeldung.id }, data: { gesamtpreisCents: 1400 } });
  const neu = await bezahlseiteFuer(a.anmeldung.id);
  const nach = await db.registration.findUniqueOrThrow({ where: { id: a.anmeldung.id } });
  pruefe("12 · Bei geändertem Betrag entsteht eine neue Bezahlseite",
    "url" in neu && nach.zahlungsReferenz !== alt);
  const alteSitzung = await holeSitzung(alt);
  pruefe("12 · … und die alte ist geschlossen — sie lässt sich nicht mehr bezahlen",
    alteSitzung.status === "expired", alteSitzung.status);
  const versuch = await fetch(`${ATTRAPPE}/steuerung/klick-bezahlt/${alt}`, { redirect: "manual" });
  pruefe("12 · … auch über den alten Link nicht", versuch.status === 410, `Status ${versuch.status}`);
}

// ── 13. Mehrfache Rückmeldung ──────────────────────────────────
await frischeLage();
{
  const a = await anmelden("mehrfach@example.org", familie("mehrfach@example.org"));
  const sitzung = await bezahlen(a.anmeldung.zahlungsReferenz);
  const erste = await rueckmeldung(sitzung);
  await rueckmeldung(sitzung, "checkout.session.completed", erste.ereignisId);
  await rueckmeldung(sitzung, "checkout.session.completed");
  const nach = await db.registration.findUniqueOrThrow({
    where: { id: a.anmeldung.id }, include: { teilnehmer: true },
  });
  pruefe("13 · Mehrfache Rückmeldung zählt Teilnehmer nicht doppelt",
    nach.teilnehmer.length === 4 && (await belegteJetzt()) === 4,
    `${nach.teilnehmer.length} Teilnehmer, ${await belegteJetzt()} belegt`);
  pruefe("13 · … und es gibt genau eine Anmeldung",
    (await db.registration.count({ where: { kontaktEmail: "mehrfach@example.org" } })) === 1);
}

// ── 14./15. Schlüssel ──────────────────────────────────────────
pruefe("14 · Testschlüssel werden akzeptiert", istTestschluessel("sk_test_abc"));
{
  const { zugangVergessen, stripe: zugang } = await import("../../lib/zahlung.js");
  const gemerkt = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
  process.env.ZAHLUNG_GEHEIMSCHLUESSEL = "sk_live_echtes_konto";
  zugangVergessen();
  let abgewiesen = false;
  try { zugang(); } catch { abgewiesen = true; }
  pruefe("15 · Echte Schlüssel bleiben gesperrt", abgewiesen);
  process.env.ZAHLUNG_GEHEIMSCHLUESSEL = gemerkt;
  zugangVergessen();
}

// ── Reine Regel: Plätze reichen ────────────────────────────────
pruefe("Regel · plaetzeReichen rechnet richtig",
  plaetzeReichen(100, 96, 4).reicht === true &&
  plaetzeReichen(100, 97, 4).reicht === false &&
  plaetzeReichen(100, 97, 4).frei === 3 &&
  plaetzeReichen(null, 9999, 50).reicht === true);

await frischeLage();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
