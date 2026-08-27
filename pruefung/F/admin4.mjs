/* Fachliche Prüfung: Event anlegen, veröffentlichen, Anmeldungen verwalten. */
import { anmelden, hole, sende, actionFelder, BASIS } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

await db.anmeldeVersuch.deleteMany({});

/* Reste eines früheren Laufs abräumen — diese Liste legt „Sommerfest am
   Kanal" als ENTWURF an und veröffentlicht es später. Läge es vom
   letzten Mal noch veröffentlicht da, schlüge die Prüfung „ein Entwurf
   erscheint NICHT auf der Startseite" fehl, ohne dass am Produkt etwas
   falsch wäre. Jede Liste stellt ihren Ausgangszustand selbst her; so
   macht es `G/g1` mit den Probe-Events auch. */
const alteSommerfeste = await db.event.findMany({
  where: { slug: "sommerfest-am-kanal" },
  select: { id: true },
});
for (const e of alteSommerfeste) {
  // Teilnehmer hängen per onDelete: Cascade an der Anmeldung und
  // verschwinden mit ihr — sie einzeln zu löschen wäre doppelt.
  await db.registration.deleteMany({ where: { eventId: e.id } });
  await db.eventAbschnitt.deleteMany({ where: { eventId: e.id } });
  await db.event.delete({ where: { id: e.id } });
}

const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "192.0.2.30");
if (!s.cookie) throw new Error("Anmeldung fehlgeschlagen");
const K = s.cookie;

const neuSeite = await hole("/admin/events/neu", K);
const neuFelder = actionFelder(neuSeite.html, 'name="titel"');

// ── Ein Event über das Formular anlegen, als ENTWURF ───────────
const werte = {
  eventId: "", titel: "Sommerfest am Kanal", slug: "", stadt: "Falkensee",
  ortName: "Bootshaus", strasse: "Uferweg 3", plz: "14612",
  karteTitel: "Sommerfest", karteZielgruppe: "Für alle",
  karteKurz: "Grillen, Musik und ein langer Abend am Wasser.",
  kurz: "Ein Abend am Kanal.",
  beschreibung: "Erster Absatz.\n\nZweiter Absatz.",
  dabei: "Grillgut\nGetränke", mitbringen: "Gute Laune\nEine Decke",
  startAt: "2026-07-18T14:00", endAt: "2026-07-18T22:00",
  status: "ENTWURF", kategorie: "COMMUNITY",
  maxPersonen: "50", schwelleWenigPlaetze: "10",
  preisSchueler: "7,35", preisErwachsener: "14,00",
  familieAktiv: "an", familieBasis: "30,00", familieWeitererSchueler: "6,00",
  familieEnthaltenErwachsene: "2", familieEnthaltenSchueler: "1", familieMaxSchueler: "6",
};

const angelegt = await sende("/admin/events/neu", neuFelder, werte, K);
const neu = await db.event.findUnique({ where: { slug: "sommerfest-am-kanal" }, include: { abschnitte: true } });
pruefe("Event über das Formular angelegt", neu !== null, `Ziel ${angelegt.ziel ?? "—"}`);
pruefe("Adresse aus dem Titel gebildet", neu?.slug === "sommerfest-am-kanal", neu?.slug);
pruefe("7,35 € werden zu 735 Cent (nicht 734)", neu?.preisSchuelerCents === 735, `${neu?.preisSchuelerCents}`);
pruefe("Familienpaket übernommen",
  neu?.familieAktiv === true && neu?.familieBasisCents === 3000 && neu?.familieMaxSchueler === 6);
pruefe("Inhaltsblöcke „dabei\" und „mitbringen\" angelegt",
  neu?.abschnitte.length === 2 && neu.abschnitte.some((a) => a.art === "dabei"));

// ── Entwurf ist öffentlich NICHT sichtbar ──────────────────────
const start1 = await hole("/");
pruefe("Ein Entwurf erscheint NICHT auf der Startseite",
  !start1.html.includes("Sommerfest"));
const seite1 = await hole("/events/sommerfest-am-kanal");
pruefe("… und seine Adresse ist nicht erreichbar", seite1.status === 404,
  `Antwort ${seite1.status}`);

// ── Veröffentlichen ────────────────────────────────────────────
const bearbeitenSeite = await hole(`/admin/events/${neu.id}`, K);
const bearbeitenFelder = actionFelder(bearbeitenSeite.html, 'name="titel"');
await sende(`/admin/events/${neu.id}`, bearbeitenFelder,
  { ...werte, eventId: neu.id, slug: "sommerfest-am-kanal", status: "VEROEFFENTLICHT" }, K);

const start2 = await hole("/");
pruefe("DER BEWEIS: veröffentlicht erscheint es sofort auf der Startseite — ohne Neubau",
  start2.html.includes("Sommerfest"));
const seite2 = await hole("/events/sommerfest-am-kanal");
pruefe("… und hat eine eigene, erreichbare Adresse", seite2.status === 200,
  `Antwort ${seite2.status}`);

// ── Zeitzone: 14:00 eingegeben, 14:00 angezeigt ────────────────
// Die Uhrzeit steht auf der kompakten Detailseite /event/[slug],
// nicht auf der grossen Event-Seite.
const detail = await hole("/event/sommerfest-am-kanal");
const inDb = (await db.event.findUniqueOrThrow({ where: { id: neu.id } })).startAt;
pruefe("Eingegebene Uhrzeit erscheint als deutsche Zeit auf der Seite",
  detail.html.includes("14:00 – 22:00"),
  `in der Datenbank steht ${inDb?.toISOString()} (UTC), angezeigt wird deutsche Zeit`);

// ── Änderung wird sofort sichtbar ──────────────────────────────
await sende(`/admin/events/${neu.id}`, bearbeitenFelder,
  { ...werte, eventId: neu.id, slug: "sommerfest-am-kanal", status: "VEROEFFENTLICHT",
    titel: "Sommerfest am Kanal (verlegt)" }, K);
const seite3 = await hole("/events/sommerfest-am-kanal");
pruefe("Eine Titeländerung erscheint sofort", seite3.html.includes("verlegt"));

// ── Doppelte Adresse wird abgewiesen ───────────────────────────
const vorher = await db.event.count();
const doppelt = await sende("/admin/events/neu", neuFelder,
  { ...werte, eventId: "", slug: "sommerfest-am-kanal", titel: "Anderes Fest" }, K);
pruefe("Eine bereits belegte Adresse wird abgewiesen",
  (await db.event.count()) === vorher && doppelt.text.includes("gehört schon zu"));

// ── Unvollständiges Formular ───────────────────────────────────
const leer = await sende("/admin/events/neu", neuFelder,
  { eventId: "", titel: "", stadt: "", karteTitel: "", karteKurz: "", kurz: "",
    beschreibung: "", preisSchueler: "", preisErwachsener: "" }, K);
pruefe("Leeres Formular speichert nichts", (await db.event.count()) === vorher);
pruefe("… und meldet die fehlenden Felder", leer.text.includes("Der Titel fehlt"));

console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
