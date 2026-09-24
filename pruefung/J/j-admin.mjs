/* Der Adminbereich muss den Zahlungsversuch und die Zahlung zeigen.

   Umgeschrieben am 24.09.2026. Diese Liste prüfte vorher, dass eine
   Reservierung „als belegter Platz" zählt. Genau das war der beim Test
   gemeldete Fehler: Schon das Öffnen der Bezahlseite erschien als
   „1 Anmeldung · 1 Platz reserviert", obwohl niemand bezahlt hatte.
   Die Prüfungen sind deshalb umgedreht — sie halten jetzt fest, dass
   ein offener Versuch SICHTBAR bleibt, aber weder als Anmeldung noch
   als belegter Platz zählt. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { anmelden, hole, alsText } from "./admin-senden.mjs";
import { absenden, personen } from "./senden.mjs";
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

const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "198.51.100.30");
const K = s.cookie;
if (!K) throw new Error("Anmeldung fehlgeschlagen");

await absenden(
  { eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "student",
    schueler: 1, erwachsene: 0, webseite: "",
    ...personen([{ vorname: "Rita", nachname: "Probe", email: "rita@example.org", telefon: "" }]) },
  "198.51.100.31",
);
const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });
const anmeldung = await db.registration.findFirstOrThrow({ where: { kontaktEmail: "rita@example.org" } });

let seite = await hole(`/admin/events/${event.id}/anmeldungen`, K);
let text = alsText(seite.html);
pruefe("Die Anmeldungsliste zeigt den offenen Zahlungsversuch",
  text.includes("Zahlung offen, Versuch läuft bis"));
pruefe("… und sagt dabei ausdrücklich, dass kein Platz belegt ist",
  text.includes("kein Platz belegt"));
pruefe("… und nennt die Zahlungsreferenz", text.includes("Zahlungsreferenz:"));
pruefe("Der offene Versuch belegt KEINEN Platz",
  text.includes("0 von 100 Plätzen belegt"),
  (text.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);
pruefe("… und zählt NICHT als Anmeldung",
  text.includes("0 Anmeldungen"),
  (text.match(/\d+ Anmeldung(en)?/) ?? ["—"])[0]);
pruefe("… wird aber mit seinen Personen ausgewiesen",
  text.includes("1 in offener Zahlung (zählen nicht mit)"));
pruefe("Und das Wort „reserviert“ steht nirgends mehr — VERA reserviert nichts",
  !/Platz reserviert|Plätze reserviert|Reservierung/i.test(text),
  (text.match(/[^.]*eservier[^.]*/) ?? ["—"])[0].slice(0, 90));

/* Die Übersichtsseite muss dasselbe sagen. Zwei Seiten, die
   verschieden zählen, wären genau der Fehler, der gemeldet wurde. */
const uebersicht = alsText((await hole("/admin", K)).html);
pruefe("Die Übersicht zählt den offenen Versuch ebenfalls nicht als Anmeldung",
  /1\s*in offener Zahlung \(zählt nicht mit\)/.test(uebersicht),
  (uebersicht.match(/\d+ in offener Zahlung[^0-9]*/) ?? ["—"])[0]);

// Von Hand als bezahlt markieren bestätigt zugleich
const { actionFelder, sende } = await import("./admin-senden.mjs");
const felder = actionFelder(seite.html, 'name="zahlungsStatus"');
await sende(`/admin/events/${event.id}/anmeldungen`, felder,
  { anmeldungId: anmeldung.id, zahlungsStatus: "BEZAHLT" }, K, "198.51.100.32");
const nach = await db.registration.findUniqueOrThrow({ where: { id: anmeldung.id } });
pruefe("Von Hand auf „bezahlt“ setzen bestätigt die Anmeldung",
  nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT", `${nach.status} / ${nach.zahlungsStatus}`);
pruefe("… und beendet den Zahlungsversuch", nach.reserviertBis === null);
const nachZahlung = alsText((await hole(`/admin/events/${event.id}/anmeldungen`, K)).html);
pruefe("Erst die Zahlung macht daraus einen belegten Platz",
  nachZahlung.includes("1 von 100 Plätzen belegt"),
  (nachZahlung.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);
pruefe("… und eine gezählte Anmeldung",
  nachZahlung.includes("1 Anmeldung "),
  (nachZahlung.match(/\d+ Anmeldung(en)?/) ?? ["—"])[0]);

// Ein beendeter Zahlungsversuch wird als beendet ausgewiesen
await db.registration.update({
  where: { id: anmeldung.id },
  data: { status: "RESERVIERT", zahlungsStatus: "OFFEN", reserviertBis: new Date(Date.now() - 60_000) },
});
seite = await hole(`/admin/events/${event.id}/anmeldungen`, K);
text = alsText(seite.html);
pruefe("Ein beendeter Zahlungsversuch wird als beendet ausgewiesen",
  text.includes("Zahlungsversuch beendet am"));
pruefe("… und belegt keinen Platz", text.includes("0 von 100 Plätzen belegt"),
  (text.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);

// Ohne Anmeldung kein Zugang zur Rückmeldung? (die ist öffentlich, aber
// ohne Unterschrift wirkungslos — hier nur der Vollständigkeit halber)
const ohne = await hole(`/admin/events/${event.id}/anmeldungen`);
pruefe("Anmeldungsliste ohne Zugang → Weiterleitung",
  ohne.status >= 300 && ohne.status < 400 && (ohne.ziel ?? "").includes("/admin/login"));

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
