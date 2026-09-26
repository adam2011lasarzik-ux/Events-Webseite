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

   ── Was Stufe 2 daran geändert hat ──────────────────────────────

   Der Schutz sitzt seit dem 26.09.2026 an einer anderen Stelle, und
   an einer besseren: Die Bezahlseite („cs_…") steht mit einem
   eindeutigen Index an der Anmeldung. Trifft eine zweite Meldung zu
   derselben Bezahlseite ein, findet `anmeldungAusZahlung` die Zeile
   und meldet „schon da" — ganz gleich, in welchem Zustand sie ist.
   Es braucht keine Aufzählung erlaubter Zustände mehr, die man
   vergessen könnte; es ist eine Eigenschaft der Datenbank.

   Ein Teil dieser Liste ist dadurch entfallen: „storniert, aber nie
   bezahlt". Diesen Zustand kann der Zahlweg nicht mehr erzeugen —
   eine unbezahlte Anmeldung gibt es nicht.

   Voraussetzungen: Datenbank, Attrappe auf 4242, Server auf 3213. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { absenden, personen, BASIS } from "../K/senden.mjs";
import * as zw from "../zahlweg.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";
import { stornoDurchAdmin } from "../../lib/stornoAusfuehren.js";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
let ip = 20;
const neueIp = () => `203.0.113.${(ip = (ip % 200) + 1)}`;

const rueckmeldung = (sitzung, art, kennung) => zw.rueckmeldung(BASIS, sitzung, art, kennung);

const belegte = async (eventId) => {
  const treffer = await db.registration.findMany({
    where: { eventId, ...belegtFilter() },
    include: { teilnehmer: true },
  });
  return treffer.reduce((s, a) => s + a.teilnehmer.length, 0);
};

const EMAIL = "nina.spaet@example.org";
const formular = () => ({
  eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "adult", webseite: "",
  ...personen([{ vorname: "Nina", nachname: "Spaet", email: EMAIL, telefon: "030222" }]),
});

/** Absenden, beim Anbieter bezahlen, Rückmeldung — Sitzung zurück. */
async function durchbezahlen() {
  const antwort = await absenden(formular(), neueIp());
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);
  if (!sitzungId) throw new Error(`keine Bezahlseite: ${antwort.text?.slice(0, 120)}`);
  const sitzung = await zw.bezahlen(sitzungId);
  await rueckmeldung(sitzung);
  return sitzung;
}

async function aufraeumen() {
  await db.participant.deleteMany({});
  await db.registration.deleteMany({});
  await db.anmeldeVersuch.deleteMany({});
  await db.zahlungsEreignis.deleteMany({});
  await db.fehlbuchung.deleteMany({});
}

await aufraeumen();
const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

/* ═══ Teil 1: der gewöhnliche Weg muss weiter funktionieren ═══════ */
const ersteSitzung = await durchbezahlen();
const bezahlt = await db.registration.findFirstOrThrow({ where: { kontaktEmail: EMAIL } });
pruefe("Die bezahlte Zahlung legt die Anmeldung an und bestätigt sie",
  bezahlt.status === "BESTAETIGT" && bezahlt.zahlungsStatus === "BEZAHLT",
  `${bezahlt.status} / ${bezahlt.zahlungsStatus}`);
pruefe("… die Bezahlseite wird als Kennung festgehalten",
  bezahlt.zahlungsReferenz === ersteSitzung.id, bezahlt.zahlungsReferenz ?? "keine");
pruefe("… und die Zahlungskennung ebenfalls",
  Boolean(bezahlt.zahlungsAbsicht), bezahlt.zahlungsAbsicht ?? "keine");

/* ═══ Teil 2: der eigentliche Fall ════════════════════════════════
   Storniert und erstattet — den Zustand stellen wir unmittelbar her.
   Wie er entsteht, prüfen die Storno-Listen; hier geht es allein um
   die Frage, was eine Nachmeldung damit anstellt. */
await db.registration.update({
  where: { id: bezahlt.id },
  data: { status: "STORNIERT", zahlungsStatus: "ERSTATTET", storniertAm: new Date() },
});
pruefe("Vorbedingung: die Buchung ist storniert und erstattet, der Platz frei",
  (await belegte(event.id)) === 0, `${await belegte(event.id)} belegt`);

const spaet = await rueckmeldung(
  ersteSitzung, "checkout.session.async_payment_succeeded", "evt_m_spaet_2");
const danach = await db.registration.findUniqueOrThrow({ where: { id: bezahlt.id } });

pruefe("Die späte Meldung wird angenommen (kein endloses Wiederholen)",
  spaet.status === 200, `Antwort ${spaet.status}`);
pruefe("Die Stornierung bleibt bestehen", danach.status === "STORNIERT", danach.status);
pruefe("Die Erstattung bleibt bestehen", danach.zahlungsStatus === "ERSTATTET",
  danach.zahlungsStatus);
pruefe("Der Storno-Zeitpunkt bleibt stehen", danach.storniertAm !== null);
pruefe("… und der Platz bleibt frei", (await belegte(event.id)) === 0,
  `${await belegte(event.id)} belegt`);
pruefe("… und es entsteht KEINE zweite Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: EMAIL } })) === 1);

/* Auch die sofortige Fassung derselben Meldung darf es nicht. */
const spaet2 = await rueckmeldung(ersteSitzung, "checkout.session.completed", "evt_m_spaet_3");
const danach2 = await db.registration.findUniqueOrThrow({ where: { id: bezahlt.id } });
pruefe("Dasselbe gilt für die sofortige Fassung der Meldung",
  spaet2.status === 200 && danach2.status === "STORNIERT" && danach2.zahlungsStatus === "ERSTATTET",
  `${danach2.status} / ${danach2.zahlungsStatus}`);

/* ═══ Teil 3: nach Storno und Erstattung erneut anmelden ═════════
   Genau der Weg, den ein Kunde nimmt, der es sich anders überlegt:
   storniert, Geld zurück, und zwei Wochen später bucht er doch. Weil
   es je Veranstaltung und Adresse nur eine Zeile geben kann, wird
   DIESELBE wiederverwendet. Die Spuren der alten, erstatteten Zahlung
   müssen dabei verschwinden — sonst stünde an einer bezahlten Buchung
   die Kennung einer längst erstatteten Zahlung, und eine spätere
   Erstattung träfe die falsche. */
const zweiteSitzung = await durchbezahlen();
const erneut = await db.registration.findFirstOrThrow({ where: { kontaktEmail: EMAIL } });

pruefe("Die erneute Anmeldung verwendet dieselbe Zeile",
  erneut.id === bezahlt.id &&
    (await db.registration.count({ where: { kontaktEmail: EMAIL } })) === 1);
pruefe("… sie ist bestätigt und bezahlt",
  erneut.status === "BESTAETIGT" && erneut.zahlungsStatus === "BEZAHLT",
  `${erneut.status} / ${erneut.zahlungsStatus}`);
pruefe("… der Storno-Zeitpunkt ist gelöscht und die Reaktivierung vermerkt",
  erneut.storniertAm === null && erneut.reaktiviertAm !== null);
pruefe("… mit der NEUEN Bezahlseite, nicht der alten",
  erneut.zahlungsReferenz === zweiteSitzung.id && zweiteSitzung.id !== ersteSitzung.id,
  `${ersteSitzung.id} → ${erneut.zahlungsReferenz}`);
pruefe("… und der Platz ist wieder belegt", (await belegte(event.id)) === 1);

/* Und die alte Meldung darf auch jetzt nichts mehr bewirken. */
const ganzSpaet = await rueckmeldung(
  ersteSitzung, "checkout.session.async_payment_succeeded", "evt_m_spaet_4");
pruefe("Eine Nachmeldung zur ALTEN Bezahlseite ändert nichts mehr",
  ganzSpaet.status === 200 &&
    (await db.registration.count({ where: { kontaktEmail: EMAIL } })) === 1 &&
    (await belegte(event.id)) === 1);

/* ═══ Teil 4: die Abschluss-Seite als zweite Tür ══════════════════
   Sie fragt beim Anbieter nach und darf selbst anlegen. Sie ist OHNE
   Anmeldung erreichbar — wer nach seiner Stornierung den alten Link
   noch einmal öffnet (Mail, Verlauf, Lesezeichen), hätte seine
   erstattete Buchung sonst mit einem blossen Seitenaufruf
   zurückgeholt.

   Die Bezahlseite ist dafür WIRKLICH beim Anbieter angelegt und dort
   bezahlt. Eine erfundene Kennung liefe in eine Fehlermeldung — die
   Prüfung bestünde dann aus dem falschen Grund und wäre wertlos.
   Genau das ist beim ersten Anlauf passiert. */
await db.registration.update({
  where: { id: bezahlt.id },
  data: { status: "STORNIERT", zahlungsStatus: "ERSTATTET", storniertAm: new Date() },
});

const seite = await fetch(`${BASIS}/anmeldung/danke?sitzung=${zweiteSitzung.id}&zahlung=zurueck`);
await seite.text();
const nachSeitenaufruf = await db.registration.findUniqueOrThrow({ where: { id: bezahlt.id } });

pruefe("Die Abschluss-Seite ist erreichbar", seite.status === 200, `Antwort ${seite.status}`);
pruefe("… belebt eine stornierte Buchung aber NICHT wieder",
  nachSeitenaufruf.status === "STORNIERT" && nachSeitenaufruf.zahlungsStatus === "ERSTATTET",
  `${nachSeitenaufruf.status} / ${nachSeitenaufruf.zahlungsStatus}`);
pruefe("… legt auch keine zweite an",
  (await db.registration.count({ where: { kontaktEmail: EMAIL } })) === 1);
pruefe("… und der Platz bleibt frei", (await belegte(event.id)) === 0,
  `${await belegte(event.id)} belegt`);

/* ═══ Teil 5: zweimal buchen, zweimal stornieren ══════════════════
   Der Weg, der im Betrieb scheiterte. Eine Buchungszeile wird bei der
   erneuten Anmeldung wiederverwendet — die zweite Stornierung erstattet
   deshalb eine ANDERE Zahlung als die erste. Der Wiederholungsschlüssel
   an den Anbieter enthielt früher nur die Anmeldenummer und war damit
   beide Male gleich. Der Anbieter wies die zweite Erstattung ab
   („idempotency_error"), einen ganzen Tag lang — für den Kunden sah
   es aus, als täte der Storno-Knopf nichts. */
await aufraeumen();

const lauf1 = await durchbezahlen();
const ersterStorno = await stornoDurchAdmin(
  (await db.registration.findFirstOrThrow({ where: { kontaktEmail: EMAIL } })).id);
pruefe("Erste Buchung: Stornierung mit Erstattung",
  ersterStorno.erfolg === true && ersterStorno.erstattet === true,
  JSON.stringify(ersterStorno));

const lauf2 = await durchbezahlen();
pruefe("Die zweite Buchung hat eine eigene Bezahlseite", lauf2.id !== lauf1.id,
  `${lauf1.id} → ${lauf2.id}`);

const zweiterStorno = await stornoDurchAdmin(
  (await db.registration.findFirstOrThrow({ where: { kontaktEmail: EMAIL } })).id);
pruefe("Zweite Buchung: Stornierung wird NICHT vom Wiederholungsschlüssel blockiert",
  zweiterStorno.erfolg === true && zweiterStorno.erstattet === true,
  JSON.stringify(zweiterStorno));

const nachZweitem = await db.registration.findFirstOrThrow({ where: { kontaktEmail: EMAIL } });
pruefe("… und die Buchung steht auf storniert und erstattet",
  nachZweitem.status === "STORNIERT" && nachZweitem.zahlungsStatus === "ERSTATTET",
  `${nachZweitem.status} / ${nachZweitem.zahlungsStatus}`);

// ── Aufräumen ───────────────────────────────────────────────────
await aufraeumen();

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
