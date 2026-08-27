/* Der Adminbereich muss die Reservierung und die Zahlung zeigen. */
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
pruefe("Die Anmeldungsliste zeigt „Platz reserviert“", text.includes("Platz reserviert"));
pruefe("… mit dem Ablaufzeitpunkt", text.includes("Platz reserviert bis"));
pruefe("… und der Zahlungsreferenz", text.includes("Zahlungsreferenz:"));
pruefe("Die Reservierung zählt als belegter Platz", text.includes("1 von 100 Plätzen belegt"),
  (text.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);

// Von Hand als bezahlt markieren bestätigt zugleich
const { actionFelder, sende } = await import("./admin-senden.mjs");
const felder = actionFelder(seite.html, 'name="zahlungsStatus"');
await sende(`/admin/events/${event.id}/anmeldungen`, felder,
  { anmeldungId: anmeldung.id, zahlungsStatus: "BEZAHLT" }, K, "198.51.100.32");
const nach = await db.registration.findUniqueOrThrow({ where: { id: anmeldung.id } });
pruefe("Von Hand auf „bezahlt“ setzen bestätigt die Anmeldung",
  nach.status === "BESTAETIGT" && nach.zahlungsStatus === "BEZAHLT", `${nach.status} / ${nach.zahlungsStatus}`);
pruefe("… und beendet die Reservierung", nach.reserviertBis === null);

// Abgelaufene Reservierung wird als abgelaufen ausgewiesen
await db.registration.update({
  where: { id: anmeldung.id },
  data: { status: "RESERVIERT", zahlungsStatus: "OFFEN", reserviertBis: new Date(Date.now() - 60_000) },
});
seite = await hole(`/admin/events/${event.id}/anmeldungen`, K);
text = alsText(seite.html);
pruefe("Eine abgelaufene Reservierung wird als abgelaufen ausgewiesen",
  text.includes("Reservierung abgelaufen"));
pruefe("… und belegt keinen Platz mehr", text.includes("0 von 100 Plätzen belegt"),
  (text.match(/\d+ von \d+ Plätzen belegt/) ?? ["—"])[0]);

// Ohne Anmeldung kein Zugang zur Rückmeldung? (die ist öffentlich, aber
// ohne Unterschrift wirkungslos — hier nur der Vollständigkeit halber)
const ohne = await hole(`/admin/events/${event.id}/anmeldungen`);
pruefe("Anmeldungsliste ohne Zugang → Weiterleitung",
  ohne.status >= 300 && ohne.status < 400 && (ohne.ziel ?? "").includes("/admin/login"));

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
