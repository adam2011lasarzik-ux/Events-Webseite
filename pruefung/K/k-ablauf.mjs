/* Anmeldung und Bezahlung als EIN Vorgang — die 15 geforderten Fälle,
   soweit sie ohne Browser prüfbar sind. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { absenden, personen, BASIS } from "./senden.mjs";
import { alsText } from "./admin-senden.mjs";
import * as zw from "../zahlweg.mjs";
import { db } from "../../lib/db.js";
import { belegtFilter } from "../../lib/plaetze.js";
import { berechnePreis } from "../../lib/preise.js";
import { plaetzeReichen, istTestschluessel } from "../../lib/zahlungRegeln.js";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
let ip = 10;
const neueIp = () => `203.0.113.${(ip = (ip % 240) + 1)}`;

/* Bezahlen, Rückmeldung und Sitzungskennung liegen seit Stufe 2 in
   pruefung/zahlweg.mjs — acht Listen brauchen denselben Ablauf. */
const rueckmeldung = (sitzung, art, kennung) => zw.rueckmeldung(BASIS, sitzung, art, kennung);
const { bezahlen, holeSitzung, sitzungAusZiel } = zw;

const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

/* Belegt = bezahlt. Seit Stufe 2 (26.09.2026) gibt es gar keine
   andere Art von Anmeldung mehr: Sie entsteht erst mit der
   bestätigten Zahlung. `offeneJetzt` ist deshalb entfallen — es gäbe
   nichts zu zählen. */
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
  await db.fehlbuchung.deleteMany({});
  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 100 } });
}

/**
 * Absenden — und was danach WIRKLICH da ist.
 *
 * Seit Stufe 2 entsteht beim Absenden keine Anmeldung mehr. Diese
 * Funktion liefert deshalb die Sitzungskennung der Bezahlseite und,
 * falls doch schon eine Anmeldung existiert (kostenloses Event), auch
 * diese. Wer eine bezahlte Anmeldung braucht, nimmt `durchbezahlen`.
 */
async function anmelden(email, felder) {
  const antwort = await absenden({ eventSlug: "padel-falkensee", webseite: "", ...felder }, neueIp());
  const sitzungId = sitzungAusZiel(antwort.ziel);
  const anmeldung = await db.registration.findFirst({
    where: { kontaktEmail: email }, include: { teilnehmer: true },
  });
  return { antwort, sitzungId, anmeldung };
}

/** Absenden, bezahlen, Rückmeldung — und die entstandene Anmeldung. */
async function durchbezahlen(email, felder, betrag) {
  const erst = await anmelden(email, felder);
  if (!erst.sitzungId) return erst;
  const sitzung = await bezahlen(erst.sitzungId, betrag);
  await rueckmeldung(sitzung);
  const anmeldung = await db.registration.findFirst({
    where: { kontaktEmail: email }, include: { teilnehmer: true },
  });
  return { ...erst, sitzung, anmeldung };
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
await frischeLage();
{
  const a = await anmelden("einzel@example.org", einzel("einzel@example.org"));
  pruefe("1 · Einzelanmeldung geht direkt zur Bezahlseite", a.sitzungId !== null,
    a.antwort.ziel ?? a.antwort.text.slice(0, 80));
  pruefe("1 · … und legt dabei NICHTS in der Datenbank an", a.anmeldung === null);

  await rueckmeldung(await bezahlen(a.sitzungId));
  const nach = await db.registration.findFirst({ where: { kontaktEmail: "einzel@example.org" } });
  pruefe("1 · Erst die bestätigte Zahlung legt sie an — bestätigt und bezahlt",
    nach !== null && nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT",
    `${nach?.status} / ${nach?.zahlungsStatus}`);
}

// ── 2.–4. Familienpaket ────────────────────────────────────────
await frischeLage();
{
  const a = await anmelden("familie@example.org", familie("familie@example.org"));
  pruefe("2 · Familienpaket: geht direkt zur Bezahlseite", a.sitzungId !== null,
    a.antwort.ziel ?? a.antwort.text.slice(0, 80));
  pruefe("3 · Vor der Zahlung ist kein Platz belegt und nichts gespeichert",
    (await belegteJetzt()) === 0 && (await db.registration.count()) === 0);

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
  const sitzung = await holeSitzung(a.sitzungId);
  pruefe("4 · Preis serverseitig berechnet und so an den Anbieter gegeben",
    sitzung.amount_total === erwartet.gesamtCents,
    `${sitzung.amount_total} Cent = ${(sitzung.amount_total / 100).toFixed(2)} €`);

  await rueckmeldung(await bezahlen(a.sitzungId));
  const nach = await db.registration.findFirstOrThrow({
    where: { kontaktEmail: "familie@example.org" }, include: { teilnehmer: true },
  });
  pruefe("2 · Familienpaket ist danach bestätigt und bezahlt",
    nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT");
  pruefe("3 · … mit allen vier Teilnehmern", nach.teilnehmer.length === 4);
  pruefe("3 · … und belegt ERST JETZT genau vier Plätze", (await belegteJetzt()) === 4);
  pruefe("4 · … zum eingefrorenen Preis", nach.gesamtpreisCents === erwartet.gesamtCents);

  /* Sicherheitsfund E aus der Prüfung des Adminbereichs: Die
     Bestätigungsseite ist über eine unratbare, aber nicht geheime
     Anmeldenummer erreichbar. Sie darf deshalb nur die Personenzahl
     zeigen, keine Namen. */
  const bestaetigung = alsText(await (await fetch(`${BASIS}/anmeldung/danke?nr=${nach.id}`)).text());
  pruefe("Sicherheit · Bestätigungsseite zeigt die Personenzahl", bestaetigung.includes("4"));
  pruefe("Sicherheit · … aber KEINE Teilnehmernamen",
    !["Mama", "Papa", "Muster", "Eins", "Zwei"].some((name) => bestaetigung.includes(name)));
}

// ── 5.–7. Abbruch: es bleibt NICHTS zurück ─────────────────────
//
// Diese drei Fälle haben mit Stufe 2 ihre Bedeutung geändert, und das
// ist der Kern des Umbaus. Vorher hiessen sie „Abbruch und zweiter
// Anlauf": Die Anmeldung blieb gespeichert, und ein Knopf führte
// zurück zur Bezahlseite. Beides gibt es nicht mehr.
await frischeLage();
{
  await anmelden("abbruch@example.org", einzel("abbruch@example.org"));
  pruefe("5 · Nach dem Abbruch gibt es KEINE Anmeldung",
    (await db.registration.count({ where: { kontaktEmail: "abbruch@example.org" } })) === 0);
  pruefe("5 · … und keinen Teilnehmer", (await db.participant.count()) === 0);
  pruefe("5 · … und keine Fehlbuchung, denn es floss kein Geld",
    (await db.fehlbuchung.count()) === 0);

  const seite = alsText(await (await fetch(`${BASIS}/anmeldung/danke?zahlung=abgebrochen`)).text());
  pruefe("6 · Die Seite sagt, dass nichts gespeichert wurde",
    seite.includes("nichts gespeichert") && seite.includes("nichts abgebucht"));
  pruefe("6 · … und NICHT „wir haben deine Anmeldung“",
    !seite.includes("wir haben deine Anmeldung"));
  pruefe("6 · … und nicht „bestätigt“", !seite.includes("Anmeldung ist bestätigt"));
  pruefe("7 · … und bietet keinen Weg, die Zahlung fortzusetzen",
    !/Jetzt bezahlen|Zahlung jederzeit/i.test(seite));

  /* Der Gegenbeweis: Dieselbe Person kann sich neu anmelden. Der
     Abbruch hat ihr nichts verbaut — zugleich der Beleg, dass
     wirklich nichts zurückblieb. */
  const zweiter = await anmelden("abbruch@example.org", einzel("abbruch@example.org"));
  pruefe("7 · Dieselbe Person kann sich danach neu anmelden — kein „bereits angemeldet“",
    zweiter.sitzungId !== null, zweiter.antwort.text.slice(0, 80));
}

// ── 8./9. Die Bezahlseite verfällt ─────────────────────────────
await frischeLage();
{
  const a = await anmelden("ablauf@example.org", familie("ablauf@example.org"));
  pruefe("8 · Vor der Zahlung ist kein Platz belegt", (await belegteJetzt()) === 0);
  pruefe("8 · … und keine Zeile entstanden", (await db.registration.count()) === 0);

  await rueckmeldung(await holeSitzung(a.sitzungId), "checkout.session.expired");
  pruefe("9 · Nach dem Verfall bleibt es dabei: keine Anmeldung",
    (await db.registration.count()) === 0);
  pruefe("9 · … und keine Fehlbuchung — es ist kein Geld geflossen",
    (await db.fehlbuchung.count()) === 0);

  const seite = alsText(await (await fetch(`${BASIS}/anmeldung/danke?zahlung=abgebrochen`)).text());
  pruefe("9 · Die Seite zeigt keine Bestätigung", !seite.includes("Zahlung erfolgreich"));
  pruefe("9 · … und verspricht keine Reservierung", !/reserviert|Reservierung/i.test(seite));
}

// ── 10./11. Letzte Plätze ──────────────────────────────────────
//
// Die Schutzwirkung liegt jetzt vollständig auf der bezahlten Seite.
// Wer trotzdem durchkommt und bezahlt, bekommt sein Geld zurück.
await frischeLage();
{
  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 3 } });

  for (const i of [1, 2, 3]) {
    await durchbezahlen(`platz${i}@example.org`, einzel(`platz${i}@example.org`));
  }
  pruefe("10 · Drei bezahlte Anmeldungen belegen drei Plätze",
    (await belegteJetzt()) === 3, `${await belegteJetzt()} belegt`);

  const vierter = await anmelden("platz4@example.org", einzel("platz4@example.org"));
  pruefe("10 · Der letzte Platz wird kein zweites Mal verkauft — es geht gar nicht erst zur Zahlung",
    vierter.sitzungId === null && vierter.antwort.text.includes("ausgebucht"),
    vierter.antwort.text.slice(0, 80));

  const familieZuGross = await anmelden("drei@example.org", familie("drei@example.org"));
  pruefe("11 · Und eine Familie, die nicht mehr hineinpasst, ebenfalls nicht",
    familieZuGross.sitzungId === null &&
      /reicht das nicht|ausgebucht/.test(familieZuGross.antwort.text));

  /* Der Fall, den Stufe 2 erst möglich macht — und den sie deshalb
     auch auffangen muss: Jemand hat eine Bezahlseite offen, während
     die letzten Plätze vergeben werden. Er bezahlt. Es gibt keinen
     Vertrag, und das Geld geht zurück. */
  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 4 } });
  const knapp = await anmelden("knapp@example.org", einzel("knapp@example.org"));
  pruefe("11 · Bei einem freien Platz kommt der Nächste noch zur Bezahlseite",
    knapp.sitzungId !== null);

  await durchbezahlen("schneller@example.org", einzel("schneller@example.org"));
  pruefe("11 · … ein Schnellerer bezahlt und bekommt ihn",
    (await belegteJetzt()) === 4, `${await belegteJetzt()} belegt`);

  await rueckmeldung(await bezahlen(knapp.sitzungId));
  pruefe("11 · Der Langsamere bekommt KEINE Anmeldung",
    (await db.registration.count({ where: { kontaktEmail: "knapp@example.org" } })) === 0);

  const fehl = await db.fehlbuchung.findUnique({ where: { sitzungId: knapp.sitzungId } });
  pruefe("11 · … sondern eine Fehlbuchung mit dem Grund „keine-plaetze“",
    fehl !== null && fehl.grund === "keine-plaetze", fehl?.grund);
  pruefe("11 · … und sein Geld wird automatisch erstattet",
    fehl?.erstattetAm !== null && (fehl?.erstattungId ?? "").startsWith("re_"),
    `${fehl?.erstattetAm} / ${fehl?.erstattungId}`);

  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 100 } });
}

// ── 12. Zwei Anläufe erzeugen zwei getrennte Bezahlseiten ──────
//
// Früher wurde eine offene Bezahlseite wiederverwendet, damit nicht
// zweimal abgebucht werden kann. Das ging, weil es eine Anmeldung
// gab, an der die Sitzung hing. Jetzt gibt es sie nicht — zwei
// Absendungen sind zwei getrennte Vorgänge.
//
// Doppelt abgebucht bleibt trotzdem niemand: Bezahlt jemand beide,
// legt die erste die Anmeldung an, und die zweite wird zur
// Fehlbuchung „doppelte-adresse" und vollständig erstattet.
await frischeLage();
{
  const erst = await anmelden("doppel@example.org", einzel("doppel@example.org"));
  const zweit = await anmelden("doppel@example.org", einzel("doppel@example.org"));
  pruefe("12 · Zwei Absendungen ergeben zwei verschiedene Bezahlseiten",
    erst.sitzungId !== null && zweit.sitzungId !== null && erst.sitzungId !== zweit.sitzungId);

  await rueckmeldung(await bezahlen(erst.sitzungId));
  pruefe("12 · Die erste Zahlung legt die Anmeldung an",
    (await db.registration.count({ where: { kontaktEmail: "doppel@example.org" } })) === 1);

  await rueckmeldung(await bezahlen(zweit.sitzungId));
  pruefe("12 · Die zweite legt KEINE zweite an",
    (await db.registration.count({ where: { kontaktEmail: "doppel@example.org" } })) === 1);

  const fehl = await db.fehlbuchung.findUnique({ where: { sitzungId: zweit.sitzungId } });
  pruefe("12 · … sondern wird zur Fehlbuchung „doppelte-adresse“",
    fehl !== null && fehl.grund === "doppelte-adresse", fehl?.grund);
  pruefe("12 · … und wird vollständig erstattet", fehl?.erstattetAm !== null);
}

// ── 13. Mehrfache Rückmeldung ──────────────────────────────────
await frischeLage();
{
  const a = await anmelden("mehrfach@example.org", familie("mehrfach@example.org"));
  const sitzung = await bezahlen(a.sitzungId);
  const erste = await rueckmeldung(sitzung);
  await rueckmeldung(sitzung, "checkout.session.completed", erste.ereignisId);
  await rueckmeldung(sitzung, "checkout.session.completed");
  const nach = await db.registration.findFirstOrThrow({
    where: { kontaktEmail: "mehrfach@example.org" }, include: { teilnehmer: true },
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
