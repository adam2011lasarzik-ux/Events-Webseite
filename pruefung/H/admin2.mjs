/* Der Kern der Sicherheitsprüfung: Server-Aktionen ohne gültige Sitzung.
   Wer nur die Seiten prüft, prüft die Türen und lässt die Fenster offen. */
import { anmelden, hole, sende, actionFelder } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

const EVENT = await db.event.findFirstOrThrow();

// Angemeldet, um an die Aktions-Kennungen zu kommen.
const sitzung = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
if (!sitzung.cookie) throw new Error("Anmeldung fehlgeschlagen");

const neuSeite = await hole("/admin/events/neu", sitzung.cookie);
const neuFelder = actionFelder(neuSeite.html, 'name="titel"');
console.log("Aktions-Felder auf /admin/events/neu:", Object.keys(neuFelder).join(", "), "\n");

const eventWerte = {
  eventId: "", titel: "EINGESCHLEUST", slug: "eingeschleust", stadt: "Nirgendwo",
  karteTitel: "X", karteKurz: "X", kurz: "X", beschreibung: "X",
  preisSchueler: "1,00", preisErwachsener: "1,00",
  status: "VEROEFFENTLICHT", kategorie: "SPORT", schwelleWenigPlaetze: "10",
};

// ── 1. Event anlegen OHNE Cookie ───────────────────────────────
const vorher = await db.event.count();
const ohne = await sende("/admin/events/neu", neuFelder, eventWerte, null);
pruefe("Event anlegen ohne Sitzung speichert nichts",
  (await db.event.count()) === vorher,
  `Antwort ${ohne.status}, Ziel ${ohne.ziel ?? "—"}`);

// ── 2. Mit gefälschtem Cookie ──────────────────────────────────
const gefaelscht = await sende("/admin/events/neu", neuFelder, eventWerte,
  "vera_admin=voellig-ausgedacht-aber-lang-genug-xxxxxxxxxxxxxxx");
pruefe("Event anlegen mit erfundenem Cookie speichert nichts",
  (await db.event.count()) === vorher,
  `Antwort ${gefaelscht.status}`);

// ── 3. Mit gültigem Cookie klappt es ───────────────────────────
const mit = await sende("/admin/events/neu", neuFelder, eventWerte, sitzung.cookie);
const jetzt = await db.event.findUnique({ where: { slug: "eingeschleust" } });
pruefe("Mit gültiger Sitzung wird das Event angelegt", jetzt !== null,
  `Antwort ${mit.status}, Ziel ${mit.ziel ?? "—"}`);

// ── 4. Status einer Anmeldung ohne Sitzung ─────────────────────
const testAnmeldung = await db.registration.create({
  data: {
    eventId: EVENT.id, kontaktVorname: "Prüf", kontaktNachname: "Ling",
    kontaktEmail: "pruef@example.org", gesamtpreisCents: 700, status: "BESTAETIGT",
    teilnehmer: { create: [{ vorname: "Prüf", nachname: "Ling", typ: "SCHUELER" }] },
  },
});

const listeSeite = await hole(`/admin/events/${EVENT.id}/anmeldungen`, sitzung.cookie);
const listeFelder = actionFelder(listeSeite.html, 'name="status"');

await sende(`/admin/events/${EVENT.id}/anmeldungen`, listeFelder,
  { anmeldungId: testAnmeldung.id, status: "STORNIERT" }, null);
let stand = await db.registration.findUniqueOrThrow({ where: { id: testAnmeldung.id } });
pruefe("Stornieren ohne Sitzung ändert nichts", stand.status === "BESTAETIGT",
  `Status ist ${stand.status}`);

// ── 5. Anonymisieren ohne Sitzung ──────────────────────────────
const anonFelder = actionFelder(listeSeite.html, "Personendaten löschen");
await sende(`/admin/events/${EVENT.id}/anmeldungen`, anonFelder,
  { anmeldungId: testAnmeldung.id }, null);
stand = await db.registration.findUniqueOrThrow({ where: { id: testAnmeldung.id } });
pruefe("Anonymisieren ohne Sitzung ändert nichts",
  stand.kontaktVorname === "Prüf" && stand.anonymisiertAm === null);

// ── 6. Abgelaufene Sitzung ─────────────────────────────────────
const eigene = await db.adminSession.findFirstOrThrow({ orderBy: { erstelltAm: "desc" } });
await db.adminSession.update({
  where: { id: eigene.id },
  data: { laeuftAbAm: new Date(Date.now() - 60_000) },
});
const abgelaufen = await hole("/admin", sitzung.cookie);
pruefe("Abgelaufene Sitzung wird abgewiesen", abgelaufen.ziel === "/admin/login",
  `Antwort ${abgelaufen.status}, Ziel ${abgelaufen.ziel ?? "—"}`);
pruefe("… und der abgelaufene Eintrag wird dabei entfernt",
  (await db.adminSession.findUnique({ where: { id: eigene.id } })) === null);

// Aufräumen
await db.participant.deleteMany({ where: { registrationId: testAnmeldung.id } });
await db.registration.delete({ where: { id: testAnmeldung.id } });
if (jetzt) {
  await db.eventAbschnitt.deleteMany({ where: { eventId: jetzt.id } });
  await db.event.delete({ where: { id: jetzt.id } });
}

console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
