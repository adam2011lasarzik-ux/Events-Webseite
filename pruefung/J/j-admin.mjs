/* Der Adminbereich muss die Zahlung zeigen — und nur, was es gibt.

   ── Die Geschichte dieser Liste ─────────────────────────────────

   Erste Fassung: Eine Reservierung zählt „als belegter Platz".
   Genau das war der beim Test gemeldete Fehler: Schon das Öffnen der
   Bezahlseite erschien als „1 Anmeldung · 1 Platz reserviert", obwohl
   niemand bezahlt hatte.

   Zweite Fassung (24.09.2026): Ein offener Versuch bleibt SICHTBAR,
   zählt aber weder als Anmeldung noch als belegter Platz.

   Dritte Fassung (26.09.2026, Stufe 2): Es gibt keinen offenen
   Versuch mehr, den man zeigen könnte — zwischen Absenden und
   bestätigter Zahlung steht in der VERA-Datenbank nichts. Die Liste
   prüft deshalb jetzt drei Dinge:

     1. Vor der Zahlung zeigt der Adminbereich NICHTS an — und zwar
        auch keine Andeutung („reserviert", „offene Zahlung").
     2. Erst die Zahlung macht daraus eine Anmeldung und einen
        belegten Platz.
     3. Geld ohne Anmeldung (eine Fehlbuchung) erscheint als deutliche
        Warnung ganz oben — das Einzige auf der Übersicht, das eine
        Handlung verlangt. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { anmelden, hole, alsText } from "./admin-senden.mjs";
import { absenden, personen, BASIS } from "./senden.mjs";
import * as zw from "../zahlweg.mjs";
import { db } from "../../lib/db.js";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1; console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.anmeldeVersuch.deleteMany({});
await db.zahlungsEreignis.deleteMany({});
await db.fehlbuchung.deleteMany({});

const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "198.51.100.30");
const K = s.cookie;
if (!K) throw new Error("Anmeldung fehlgeschlagen");

const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

// ── 1. Vor der Zahlung ist nichts zu sehen ─────────────────────
const abgesendet = await absenden(
  { eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "student",
    schueler: 1, erwachsene: 0, webseite: "",
    ...personen([{ vorname: "Rita", nachname: "Probe", email: "rita@example.org", telefon: "" }]) },
  "198.51.100.31",
);
const sitzungId = zw.sitzungAusZiel(abgesendet.ziel);
if (!sitzungId) throw new Error(`keine Bezahlseite: ${abgesendet.text?.slice(0, 120)}`);

let seite = await hole(`/admin/events/${event.id}/anmeldungen`, K);
let text = alsText(seite.html);
pruefe("Vor der Zahlung steht der Name NICHT im Adminbereich",
  !text.includes("Rita") && !text.includes("rita@example.org"));
pruefe("… es ist kein Platz belegt", text.includes("0 von 100 Plätzen belegt"),
  (text.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);
pruefe("… und keine Anmeldung gezählt", text.includes("0 Anmeldungen"),
  (text.match(/\d+ Anmeldung(en)?/) ?? ["—"])[0]);
pruefe("Und das Wort „reserviert“ steht nirgends — VERA reserviert nichts",
  !/Platz reserviert|Plätze reserviert|Reservierung/i.test(text),
  (text.match(/[^.]*eservier[^.]*/) ?? ["—"])[0].slice(0, 90));
pruefe("… ebensowenig eine „offene Zahlung“, die es nicht gibt",
  !/offener Zahlung|Zahlung offen, Versuch/i.test(text));

const uebersicht = alsText((await hole("/admin", K)).html);
pruefe("Die Übersicht sagt dasselbe — keine Anmeldung, kein Platz",
  /0\s*feste Teilnehmer/.test(uebersicht) && !/in offener Zahlung/.test(uebersicht),
  (uebersicht.match(/\d+\s*feste Teilnehmer/) ?? ["—"])[0]);

// ── 2. Erst die Zahlung macht daraus eine Anmeldung ────────────
await zw.rueckmeldung(BASIS, await zw.bezahlen(sitzungId));
const anmeldung = await db.registration.findFirstOrThrow({
  where: { kontaktEmail: "rita@example.org" },
});

seite = await hole(`/admin/events/${event.id}/anmeldungen`, K);
text = alsText(seite.html);
pruefe("Nach der Zahlung steht die Anmeldung im Adminbereich", text.includes("Rita"));
pruefe("… als belegter Platz", text.includes("1 von 100 Plätzen belegt"),
  (text.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);
pruefe("… und als gezählte Anmeldung", text.includes("1 Anmeldung "),
  (text.match(/\d+ Anmeldung(en)?/) ?? ["—"])[0]);

// ── 3. Der Zahlungsstatus lässt sich weiterhin von Hand setzen ──
//
// Für die Wege „zahlt vor Ort" und „Überweisung" gibt es ihn
// weiterhin; sie sind im Datenmodell erhalten geblieben.
const { actionFelder, sende } = await import("./admin-senden.mjs");
const felder = actionFelder(seite.html, 'name="zahlungsStatus"');
await sende(`/admin/events/${event.id}/anmeldungen`, felder,
  { anmeldungId: anmeldung.id, zahlungsStatus: "ERSTATTET" }, K, "198.51.100.32");
const nach = await db.registration.findUniqueOrThrow({ where: { id: anmeldung.id } });
pruefe("Der Zahlungsstatus lässt sich von Hand ändern",
  nach.zahlungsStatus === "ERSTATTET", nach.zahlungsStatus);

await sende(`/admin/events/${event.id}/anmeldungen`, felder,
  { anmeldungId: anmeldung.id, zahlungsStatus: "BEZAHLT" }, K, "198.51.100.33");
const zurueck = await db.registration.findUniqueOrThrow({ where: { id: anmeldung.id } });
pruefe("Von Hand auf „bezahlt“ setzen bestätigt die Anmeldung",
  zurueck.status === "BESTAETIGT" && zurueck.zahlungsStatus === "BEZAHLT",
  `${zurueck.status} / ${zurueck.zahlungsStatus}`);

// ── 4. Geld ohne Anmeldung wird oben als Warnung ausgewiesen ───
//
// Der Fall, den Stufe 2 überhaupt erst möglich macht: Jemand hat
// bezahlt, und es ist keine Anmeldung daraus geworden. Das ist das
// Einzige im Adminbereich, das eine Handlung verlangt — deshalb muss
// es unübersehbar sein und die Sitzungskennung nennen, mit der sich
// der Vorgang beim Anbieter wiederfinden lässt.
await db.fehlbuchung.create({
  data: { sitzungId: "cs_test_pruefung_fehlbuchung", betragCents: 1400, grund: "betrag-abweichend" },
});
const mitWarnung = alsText((await hole("/admin", K)).html);
pruefe("Eine Fehlbuchung erscheint als Warnung auf der Übersicht",
  /1 eingegangene Zahlung ohne Anmeldung/.test(mitWarnung),
  (mitWarnung.match(/\d+ eingegangene Zahlung[^·]*/) ?? ["—"])[0].slice(0, 70));
pruefe("… mit dem Betrag", /14,00/.test(mitWarnung));
pruefe("… mit dem Grund in Klartext", /Betrag passt nicht/.test(mitWarnung));
pruefe("… mit dem ausdrücklichen Hinweis, dass NICHT erstattet wurde",
  /NICHT automatisch erstattet/.test(mitWarnung));
pruefe("… und mit der Sitzungskennung zum Wiederfinden",
  mitWarnung.includes("cs_test_pruefung_fehlbuchung"));

/* Eine erstattete Fehlbuchung ist erledigt und verschwindet wieder.

   ACHTUNG, offener Punkt vom 26.09.2026: Das gilt nur für die drei
   Gründe, bei denen automatisch erstattet wird. Eine Zeile mit
   „betrag-abweichend" oder „ohne-marke" wird ABSICHTLICH nicht
   erstattet — und hat damit heute keinen Weg, jemals wieder zu
   verschwinden. Wer sie von Hand geklärt hat, sieht die Warnung
   trotzdem weiter. Das ist Adam zur Entscheidung vorgelegt: Es
   bräuchte ein Feld „erledigt am" und einen Knopf dafür. */
await db.fehlbuchung.update({
  where: { sitzungId: "cs_test_pruefung_fehlbuchung" },
  data: { erstattetAm: new Date(), erstattungId: "re_test_von_hand" },
});
const ohneWarnung = alsText((await hole("/admin", K)).html);
pruefe("Eine erledigte Fehlbuchung wird nicht mehr angemahnt",
  !/eingegangene Zahlung(en)? ohne Anmeldung/.test(ohneWarnung));

// ── 5. Zugang ──────────────────────────────────────────────────
const ohne = await hole(`/admin/events/${event.id}/anmeldungen`);
pruefe("Anmeldungsliste ohne Zugang → Weiterleitung",
  ohne.status >= 300 && ohne.status < 400 && (ohne.ziel ?? "").includes("/admin/login"));

await db.fehlbuchung.deleteMany({});

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
