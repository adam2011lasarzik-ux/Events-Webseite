/* ---------------------------------------------------------------
   Prüfliste W · Widerspruch gegen Aufnahmen (B-10) und die Prüfung
   vor der Veröffentlichung (B-13)

   Warum diese Liste vergleichsweise streng ist: Seit dem Wegfall der
   Foto-Einwilligung (B-17) stützen sich die Aufnahmen auf das
   berechtigte Interesse. Der Widerspruch nach Art. 21 DS-GVO ist
   damit die EINZIGE technische Sicherung des Konzepts — es gibt
   keine Einwilligung, die danebenstünde. Fällt hier etwas aus, fängt
   es nichts auf.

   Teil 1 braucht weder Datenbank noch Server.
   Teil 2 läuft gegen die echte Datenbank.
   Teil 3 braucht zusätzlich den Server auf Port 3213.

   Voraussetzungen: siehe docs/pruefen.md.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs.
   Diese Liste legt eine Testveranstaltung samt Widersprüchen und
   Prüfvermerken an und räumt sie wieder ab. */
import "../schutz.mjs";

import { readFileSync } from "node:fs";
import { db } from "../../lib/db.js";
import {
  WEGNAME,
  WIDERSPRUCHSWEGE,
  darfVeroeffentlichen,
  freigabe,
  geltendeWidersprueche,
  giltNoch,
  letzteJeZiel,
  namenZeile,
  pruefungFesthalten,
  pruefungen,
  widerspruchAnlegen,
  widerspruchZuruecknehmen,
  widersprueche,
} from "../../lib/aufnahmen.js";
import { AKTION_JE_KLASSE } from "../../lib/loeschfristen.js";
import { actionFelder, anmelden, hole, sende } from "../H/admin-senden.mjs";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) {
    ok++;
    console.log("  ✓", name);
  } else {
    fehl++;
    console.log("  ✗", name, zusatz);
  }
};

const lies = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

const T0 = new Date("2026-09-01T10:00:00Z");
const T1 = new Date("2026-09-02T10:00:00Z");
const T2 = new Date("2026-09-03T10:00:00Z");

/* ══ Teil 1 · Die reinen Regeln ═══════════════════════════════════ */

console.log("\nW1 · Gilt ein Widerspruch noch?");
pruefe("Ohne Rücknahme gilt er", giltNoch({ zurueckgenommenAm: null }));
pruefe("Mit Rücknahme gilt er nicht mehr", !giltNoch({ zurueckgenommenAm: T1 }));

console.log("\nW2 · Darf veröffentlicht werden?");
pruefe("Kein Widerspruch → erlaubt, auch ungeprüft", darfVeroeffentlichen(0, null).erlaubt);
pruefe(
  "Ein Widerspruch, NICHT geprüft → verboten (Grund: ungeprüft)",
  darfVeroeffentlichen(1, null).erlaubt === false &&
    darfVeroeffentlichen(1, null).grund === "ungeprueft",
);
pruefe(
  "null bedeutet NICHT „unbekannt, dann halt ja“",
  darfVeroeffentlichen(3, null).erlaubt === false,
  "der teuerste denkbare Standardwert",
);
pruefe(
  "Geprüft, jemand erkennbar → verboten (Grund: erkennbar)",
  darfVeroeffentlichen(1, true).erlaubt === false &&
    darfVeroeffentlichen(1, true).grund === "erkennbar",
);
pruefe("Geprüft, niemand erkennbar → erlaubt", darfVeroeffentlichen(1, false).erlaubt);

console.log("\nW3 · Namen für den Prüfvermerk");
pruefe("Leerzeichen am Rand fallen weg", namenZeile([" Anna Meier "]) === "Anna Meier");
pruefe("Mehrfache Leerzeichen werden zusammengezogen", namenZeile(["Anna  Meier"]) === "Anna Meier");
pruefe(
  "Derselbe Name erscheint nur einmal",
  namenZeile(["Anna Meier", "Anna  Meier", " Anna Meier"]) === "Anna Meier",
);
pruefe("Leere Einträge fallen heraus", namenZeile(["", "  ", "Bo Lind"]) === "Bo Lind");
pruefe("Mehrere Namen werden mit Komma verbunden", namenZeile(["A", "B"]) === "A, B");

console.log("\nW4 · Je Ziel der jüngste Vermerk");
const vermerke = [
  { ziel: "Website", erkennbar: true, geprueftAm: T0 },
  { ziel: "Website", erkennbar: false, geprueftAm: T2 },
  { ziel: "Instagram", erkennbar: false, geprueftAm: T1 },
];
const jeZiel = letzteJeZiel(vermerke);
pruefe("Aus drei Vermerken werden zwei Ziele", jeZiel.length === 2);
pruefe(
  "Für „Website“ zählt der jüngste, nicht der erste",
  jeZiel.find((z) => z.ziel === "Website").geprueftAm.getTime() === T2.getTime(),
);
pruefe(
  "Groß-/Kleinschreibung trennt kein Ziel auf",
  letzteJeZiel([
    { ziel: "Website", erkennbar: false, geprueftAm: T0 },
    { ziel: "website", erkennbar: false, geprueftAm: T1 },
  ]).length === 1,
);
pruefe("Ohne Vermerke bleibt die Liste leer", letzteJeZiel([]).length === 0);

console.log("\nW5 · Freigabe je Ziel — mit Zeit");
pruefe("Kein Widerspruch → frei, auch ohne Vermerk", freigabe([], null).erlaubt);
pruefe(
  "Widerspruch, kein Vermerk → gesperrt (ungeprüft)",
  freigabe([{ erklaertAm: T0 }], null).grund === "ungeprueft",
);
pruefe(
  "Widerspruch vor der Prüfung, niemand erkennbar → frei",
  freigabe([{ erklaertAm: T0 }], { ziel: "Website", erkennbar: false, geprueftAm: T1 }).erlaubt,
);
pruefe(
  "Widerspruch NACH der Prüfung → gesperrt (veraltet)",
  freigabe([{ erklaertAm: T2 }], { ziel: "Website", erkennbar: false, geprueftAm: T1 })
    .grund === "veraltet",
  "der gefährlichste Fall: alter grüner Haken, neuer Widerspruch",
);
pruefe(
  "Einer alt, einer neu → ebenfalls gesperrt",
  freigabe([{ erklaertAm: T0 }, { erklaertAm: T2 }], {
    ziel: "Website",
    erkennbar: false,
    geprueftAm: T1,
  }).grund === "veraltet",
);
pruefe(
  "Geprüft und erkennbar → gesperrt (erkennbar)",
  freigabe([{ erklaertAm: T0 }], { ziel: "Website", erkennbar: true, geprueftAm: T1 })
    .grund === "erkennbar",
);

console.log("\nW6 · Wege");
pruefe("Vier Wege sind vorgesehen", WIDERSPRUCHSWEGE.length === 4);
pruefe(
  "Jeder Weg hat einen deutschen Namen",
  WIDERSPRUCHSWEGE.every((w) => typeof WEGNAME[w] === "string" && WEGNAME[w].length > 0),
);

/* ══ Teil 2 · Datenmodell und Datenbank ══════════════════════════ */

console.log("\nW7 · Löschklasse K8 — der Widerspruch überlebt den Löschlauf");
pruefe(
  "AUFNAHMEWIDERSPRUCH wird NIEMALS gelöscht",
  AKTION_JE_KLASSE.AUFNAHMEWIDERSPRUCH === "niemals",
  `steht auf: ${AKTION_JE_KLASSE.AUFNAHMEWIDERSPRUCH}`,
);
const schema = lies("prisma/schema.prisma");
pruefe(
  "Die Klasse steht im Schema",
  /enum Loeschklasse[\s\S]*?AUFNAHMEWIDERSPRUCH/.test(schema),
);
pruefe(
  "Der Widerspruch trägt sie als Standard",
  /model Aufnahmewiderspruch[\s\S]*?loeschklasse\s+Loeschklasse\s+@default\(AUFNAHMEWIDERSPRUCH\)/.test(
    schema,
  ),
);
pruefe(
  "Der Prüfvermerk ebenso",
  /model Veroeffentlichungspruefung[\s\S]*?loeschklasse\s+Loeschklasse\s+@default\(AUFNAHMEWIDERSPRUCH\)/.test(
    schema,
  ),
);
pruefe(
  "Fällt die Veranstaltung weg, fällt der Widerspruch mit — aber eine Buchung reißt ihn nicht mit",
  /model Aufnahmewiderspruch[\s\S]*?event\s+Event\s+@relation\([^)]*onDelete: Cascade/.test(schema) &&
    /model Aufnahmewiderspruch[\s\S]*?registration\s+Registration\?[\s\S]*?onDelete: SetNull/.test(
      schema,
    ),
  "eine gelöschte Anmeldung darf den Widerspruch nicht entfernen",
);

const SLUG = "w-probe-aufnahmen";
await db.aufnahmewiderspruch.deleteMany({ where: { event: { slug: SLUG } } });
await db.veroeffentlichungspruefung.deleteMany({ where: { event: { slug: SLUG } } });
await db.registration.deleteMany({ where: { event: { slug: SLUG } } });
await db.event.deleteMany({ where: { slug: SLUG } });

const event = await db.event.create({
  data: {
    slug: SLUG,
    titel: "W-Probe Aufnahmen",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "W-Probe",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "VEROEFFENTLICHT",
  },
});

console.log("\nW8 · Widerspruch anlegen und zurücknehmen");
const w1 = await widerspruchAnlegen({
  eventId: event.id,
  name: "  Anna   Meier ",
  weg: "CHECKIN",
  notiz: "  nur sie, nicht das Kind  ",
  erfasstVon: "pruefung",
});
const geladen = await db.aufnahmewiderspruch.findUniqueOrThrow({ where: { id: w1.id } });
pruefe("Der Widerspruch steht in der Datenbank", geladen.eventId === event.id);
pruefe("Der Name ist bereinigt gespeichert", geladen.name === "Anna Meier", geladen.name);
pruefe("Die Notiz ist bereinigt gespeichert", geladen.notiz === "nur sie, nicht das Kind");
pruefe("Er gilt sofort", geladen.zurueckgenommenAm === null);
pruefe("Die Löschklasse steht auf K8", geladen.loeschklasse === "AUFNAHMEWIDERSPRUCH");
pruefe("Er hat keine Fälligkeit — er verfällt nicht von selbst", geladen.faelligAm === null);

let abgelehnt = false;
try {
  await widerspruchAnlegen({ eventId: event.id, name: "   ", weg: "EMAIL", erfasstVon: "p" });
} catch {
  abgelehnt = true;
}
pruefe("Ein Widerspruch ohne Namen wird abgelehnt", abgelehnt);

await widerspruchZuruecknehmen(w1.id, true);
const zurueck = await db.aufnahmewiderspruch.findUniqueOrThrow({ where: { id: w1.id } });
pruefe("Nach der Rücknahme ist der Zeitpunkt gesetzt", zurueck.zurueckgenommenAm !== null);
pruefe(
  "Die Zeile ist NICHT gelöscht — sie belegt, dass ein Widerspruch bestand",
  (await db.aufnahmewiderspruch.count({ where: { id: w1.id } })) === 1,
);
pruefe(
  "Ein zurückgenommener zählt nicht mehr zu den geltenden",
  (await geltendeWidersprueche(event.id)).length === 0,
);
await widerspruchZuruecknehmen(w1.id, false);
pruefe(
  "Die Rücknahme lässt sich rückgängig machen",
  (await geltendeWidersprueche(event.id)).length === 1,
);

console.log("\nW9 · Prüfvermerk hält den Stand von damals fest");
const v1 = await pruefungFesthalten({
  eventId: event.id,
  ziel: "Website",
  erkennbar: false,
  geprueftVon: "pruefung",
});
pruefe("Der Vermerk zählt den einen Widerspruch", v1.widersprueche === 1);
const v1Daten = await db.veroeffentlichungspruefung.findUniqueOrThrow({ where: { id: v1.id } });
pruefe("Der Name ist im Vermerk kopiert", v1Daten.namen === "Anna Meier", v1Daten.namen ?? "—");
pruefe("Das Ergebnis ist festgehalten", v1Daten.erkennbar === false);
pruefe("Die Löschklasse steht auch hier auf K8", v1Daten.loeschklasse === "AUFNAHMEWIDERSPRUCH");

await widerspruchAnlegen({
  eventId: event.id,
  name: "Bo Lind",
  weg: "VOR_ORT",
  erfasstVon: "pruefung",
});
const nochmal = await db.veroeffentlichungspruefung.findUniqueOrThrow({ where: { id: v1.id } });
pruefe(
  "Ein späterer Widerspruch ändert den alten Vermerk NICHT",
  nochmal.widersprueche === 1 && nochmal.namen === "Anna Meier",
  "der Vermerk belegt, was damals bekannt war",
);

const geltendeJetzt = await geltendeWidersprueche(event.id);
const vermerkeJetzt = await pruefungen(event.id);
pruefe("Jetzt gelten zwei Widersprüche", geltendeJetzt.length === 2);
const standWebsite = freigabe(
  geltendeJetzt,
  letzteJeZiel(vermerkeJetzt).find((z) => z.ziel === "Website") ?? null,
);
pruefe(
  "Die alte Freigabe für „Website“ gilt damit NICHT mehr",
  standWebsite.erlaubt === false && standWebsite.grund === "veraltet",
  JSON.stringify(standWebsite),
);

const v2 = await pruefungFesthalten({
  eventId: event.id,
  ziel: "Website",
  erkennbar: false,
  geprueftVon: "pruefung",
});
pruefe("Die neue Prüfung kennt beide Widersprüche", v2.widersprueche === 2);
pruefe(
  "Danach ist „Website“ wieder frei",
  freigabe(
    await geltendeWidersprueche(event.id),
    letzteJeZiel(await pruefungen(event.id)).find((z) => z.ziel === "Website") ?? null,
  ).erlaubt,
);
pruefe(
  "„Instagram“ bleibt gesperrt — es wurde nie geprüft",
  freigabe(
    await geltendeWidersprueche(event.id),
    letzteJeZiel(await pruefungen(event.id)).find((z) => z.ziel === "Instagram") ?? null,
  ).erlaubt === false,
  "es gibt keine stillschweigende Freigabe",
);
pruefe(
  "Alle Widersprüche der Veranstaltung sind auffindbar",
  (await widersprueche(event.id)).length === 2,
);

/* ══ Teil 3 · Zugang und Serveraktionen ══════════════════════════ */

console.log("\nW10 · Zugangsschutz");

const GEFAELSCHT = "vera_admin=voellig-ausgedacht-aber-lang-genug-xxxxxxxxxxxxxxx";

const ohne = await hole("/admin/aufnahmen", null);
pruefe(
  "/admin/aufnahmen ohne Sitzung → Weiterleitung zur Anmeldung",
  ohne.status >= 300 && ohne.status < 400 && (ohne.ziel ?? "").includes("/admin/login"),
  `Antwort ${ohne.status}, Ziel ${ohne.ziel ?? "—"}`,
);
const falsch = await hole("/admin/aufnahmen", GEFAELSCHT);
pruefe(
  "… mit erfundenem Cookie ebenfalls abgewiesen",
  falsch.status >= 300 && falsch.status < 400,
  `Antwort ${falsch.status}`,
);

const sitzung = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
if (!sitzung.cookie) throw new Error("Anmeldung fehlgeschlagen — läuft der Server auf 3213?");

const seite = await hole(`/admin/aufnahmen?event=${event.id}`, sitzung.cookie);
pruefe("Angemeldet ist die Seite erreichbar", seite.status === 200, `Antwort ${seite.status}`);
pruefe("Die Seite trägt noindex — Namen gehören in keine Suchmaschine", /noindex/i.test(seite.html));
pruefe("Die geltenden Widersprüche sind sichtbar", seite.html.includes("Anna Meier"));
pruefe(
  "Die Platzhalter B-11 und B-12 sind als solche gekennzeichnet",
  /PLATZHALTER — B-11/.test(seite.html) && /PLATZHALTER — B-12/.test(seite.html),
);

const erfassenFelder = actionFelder(seite.html, 'name="name"');
const pruefFelder = actionFelder(seite.html, 'name="ziel"');

const vorher = await db.aufnahmewiderspruch.count();
await sende(
  "/admin/aufnahmen",
  erfassenFelder,
  { eventId: event.id, name: "EINGESCHLEUST", weg: "EMAIL", notiz: "", registrationId: "" },
  null,
);
pruefe(
  "Widerspruch erfassen ohne Sitzung: nichts gespeichert",
  (await db.aufnahmewiderspruch.count()) === vorher,
);
await sende(
  "/admin/aufnahmen",
  erfassenFelder,
  { eventId: event.id, name: "EINGESCHLEUST", weg: "EMAIL", notiz: "", registrationId: "" },
  GEFAELSCHT,
);
pruefe(
  "… und mit erfundenem Cookie ebenfalls nicht",
  (await db.aufnahmewiderspruch.count()) === vorher,
);

const vermerkeVorher = await db.veroeffentlichungspruefung.count();
await sende(
  "/admin/aufnahmen",
  pruefFelder,
  { eventId: event.id, ziel: "EINGESCHLEUST", erkennbar: "nein", notiz: "" },
  null,
);
pruefe(
  "Prüfung festhalten ohne Sitzung: kein Vermerk — niemand kann sich selbst freigeben",
  (await db.veroeffentlichungspruefung.count()) === vermerkeVorher,
  "der schärfste Fall dieser Liste",
);

/* Der Widerspruch ist das Gegenstück: Auch das ZURÜCKNEHMEN darf
   ohne Sitzung nicht gehen — sonst liesse sich eine Sperre von außen
   aufheben. */
const umstellFelder = actionFelder(seite.html, 'name="widerspruchId"');
await sende(
  "/admin/aufnahmen",
  umstellFelder,
  { widerspruchId: w1.id, zurueck: "ja" },
  null,
);
pruefe(
  "Widerspruch zurücknehmen ohne Sitzung: er gilt weiterhin",
  (await db.aufnahmewiderspruch.findUniqueOrThrow({ where: { id: w1.id } })).zurueckgenommenAm ===
    null,
);

console.log("\nW11 · Angemeldet wirkt es");
await sende(
  "/admin/aufnahmen",
  erfassenFelder,
  { eventId: event.id, name: "Cem Yilmaz", weg: "EMAIL", notiz: "", registrationId: "" },
  sitzung.cookie,
);
pruefe(
  "Angemeldet wird der Widerspruch angelegt",
  (await db.aufnahmewiderspruch.count({ where: { eventId: event.id, name: "Cem Yilmaz" } })) === 1,
);
await sende(
  "/admin/aufnahmen",
  erfassenFelder,
  { eventId: event.id, name: "", weg: "EMAIL", notiz: "", registrationId: "" },
  sitzung.cookie,
);
pruefe(
  "Ein leerer Name wird auch angemeldet abgelehnt",
  (await db.aufnahmewiderspruch.count({ where: { eventId: event.id } })) === 3,
);
await sende(
  "/admin/aufnahmen",
  erfassenFelder,
  { eventId: "gibt-es-nicht", name: "Nirgendwo", weg: "EMAIL", notiz: "", registrationId: "" },
  sitzung.cookie,
);
pruefe(
  "Eine erfundene Veranstaltungs-Kennung wird abgewiesen",
  (await db.aufnahmewiderspruch.count({ where: { name: "Nirgendwo" } })) === 0,
  "ein Widerspruch im Nirgendwo taucht in keiner Prüfung auf",
);
await sende(
  "/admin/aufnahmen",
  pruefFelder,
  { eventId: event.id, ziel: "Instagram", erkennbar: "", notiz: "" },
  sitzung.cookie,
);
pruefe(
  "Eine Prüfung ohne Ergebnis wird abgelehnt — es gibt keinen Standardwert",
  (await db.veroeffentlichungspruefung.count({ where: { eventId: event.id, ziel: "Instagram" } })) ===
    0,
);

/* ── Aufräumen ──────────────────────────────────────────────────── */

await db.veroeffentlichungspruefung.deleteMany({ where: { eventId: event.id } });
await db.aufnahmewiderspruch.deleteMany({ where: { eventId: event.id } });
await db.event.delete({ where: { id: event.id } });
pruefe("Testdaten wieder entfernt", (await db.event.count({ where: { slug: SLUG } })) === 0);

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen\n`);
await db.$disconnect();
process.exit(fehl === 0 ? 0 : 1);
