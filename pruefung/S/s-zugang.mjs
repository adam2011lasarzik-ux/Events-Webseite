/* ---------------------------------------------------------------
   Prüfliste S, Teil 3 — Zugangsschutz der neuen Adminseiten.

   Der Kern derselbe wie in F/admin2: Wer nur die Seiten prüft, prüft
   die Türen und lässt die Fenster offen. Eine Server-Aktion ist über
   das Netz erreichbar wie jede andere Adresse und läuft an jedem
   Layout vorbei.

   Hier stehen besonders scharfe Fälle: Wer ohne Sitzung eine Sperre
   aufheben könnte, gäbe damit fremde Daten zur Vernichtung frei. Und
   wer ohne Sitzung den Löschlauf starten könnte, löste die Vernichtung
   selbst aus.

   Braucht einen laufenden Server auf Port 3213 (siehe docs/pruefen.md).
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { actionFelder, anmelden, hole, sende } from "../H/admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

const GEFAELSCHT = "vera_admin=voellig-ausgedacht-aber-lang-genug-xxxxxxxxxxxxxxx";

/* ── Seiten ohne Sitzung ──────────────────────────────────────── */

console.log("── Seiten ohne Anmeldung ──\n");

for (const pfad of ["/admin/loeschen", "/admin/vorfaelle"]) {
  const ohne = await hole(pfad, null);
  pruefe(
    `${pfad} ohne Sitzung → Weiterleitung zur Anmeldung`,
    ohne.status >= 300 && ohne.status < 400 && (ohne.ziel ?? "").includes("/admin/login"),
    `Antwort ${ohne.status}, Ziel ${ohne.ziel ?? "—"}`,
  );

  const falsch = await hole(pfad, GEFAELSCHT);
  pruefe(
    `${pfad} mit erfundenem Cookie → ebenfalls abgewiesen`,
    falsch.status >= 300 && falsch.status < 400,
    `Antwort ${falsch.status}`,
  );
}

/* ── Angemeldet: Kennungen der Aktionen holen ─────────────────── */

const sitzung = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
if (!sitzung.cookie) throw new Error("Anmeldung fehlgeschlagen — läuft der Server auf 3213?");

/* Die Testdaten entstehen VOR dem ersten Laden der Seite.

   Das Formular „Löschsperre von Hand setzen" zeigt seit dem Umbau
   eine Auswahlliste der Anmeldungen statt eines Freitextfelds. Gibt
   es keine einzige Anmeldung, gibt es auch kein Feld `zielId` — und
   die Liste scheiterte hier mit „Kein Formular gefunden". Das war
   nicht der Zugangsschutz, sondern ein leerer Datenstand: `alle.sh`
   räumt vor jeder Liste auf. */
/* Eine eigene, längst vergangene Veranstaltung. Die vorhandene wäre
   die falsche Wahl: `faelligkeitenAuffrischen()` rechnet die
   Fälligkeit bei JEDEM Lauf aus dem Veranstaltungstermin neu, und ein
   künftiger Termin setzte das hier eingetragene Datum sofort wieder
   zurück. Das ist richtig so — die Prüfung muss sich danach richten. */
const event = await db.event.create({
  data: {
    slug: "s-probe-zugang",
    titel: "S-Probe Zugang",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "S-Probe",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: new Date("2015-06-15T12:00:00Z"),
    endAt: new Date("2015-06-15T12:00:00Z"),
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "ENTWURF",
  },
});

const opfer = await db.registration.create({
  data: {
    eventId: event.id,
    kontaktVorname: "Zugangs",
    kontaktNachname: "Probe",
    kontaktEmail: "zugangsprobe@s-pruefung.invalid",
    gesamtpreisCents: 700,
    status: "BESTAETIGT",
    faelligAm: new Date("2015-12-31T23:59:59.999Z"),
    teilnehmer: { create: [{ vorname: "Zugangs", nachname: "Probe", typ: "SCHUELER" }] },
  },
});


const loeschSeite = await hole("/admin/loeschen", sitzung.cookie);
pruefe("Angemeldet ist /admin/loeschen erreichbar", loeschSeite.status === 200);
pruefe(
  "/admin/loeschen trägt noindex — Kennungen gehören in keine Suchmaschine",
  /name="robots"[^>]*noindex|noindex/i.test(loeschSeite.html),
);

const vorfallSeite = await hole("/admin/vorfaelle", sitzung.cookie);
pruefe("Angemeldet ist /admin/vorfaelle erreichbar", vorfallSeite.status === 200);
pruefe("/admin/vorfaelle trägt noindex", /noindex/i.test(vorfallSeite.html));

const sperreFelder = actionFelder(loeschSeite.html, 'name="zielId"');
const vorfallFelder = actionFelder(vorfallSeite.html, 'name="titel"');

/* ── Aktionen ohne Sitzung ────────────────────────────────────── */

console.log("\n── Server-Aktionen ohne Sitzung ──\n");

const sperrenVorher = await db.loeschsperre.count();
await sende(
  "/admin/loeschen",
  sperreFelder,
  { zielArt: "Registration", zielId: "erfunden", grund: "BESCHWERDE", notiz: "" },
  null,
);
pruefe(
  "Sperre setzen ohne Sitzung: nichts gespeichert",
  (await db.loeschsperre.count()) === sperrenVorher,
);

await sende(
  "/admin/loeschen",
  sperreFelder,
  { zielArt: "Registration", zielId: "erfunden", grund: "BESCHWERDE", notiz: "" },
  GEFAELSCHT,
);
pruefe(
  "Sperre setzen mit erfundenem Cookie: nichts gespeichert",
  (await db.loeschsperre.count()) === sperrenVorher,
);

const vorfaelleVorher = await db.vorfall.count();
await sende("/admin/vorfaelle", vorfallFelder, { titel: "EINGESCHLEUST" }, null);
pruefe(
  "Vorfall anlegen ohne Sitzung: nichts gespeichert",
  (await db.vorfall.count()) === vorfaelleVorher,
);

/* Der schärfste Fall: der Löschlauf selbst. Dafür wird ein echter,
   längst fälliger Datensatz angelegt — bliebe er nach dem Aufruf
   ohne Sitzung unverändert, hat der Zugangsschutz gehalten. */
const laufFelder = actionFelder(loeschSeite.html, 'name="bestaetigt"');
await sende("/admin/loeschen", laufFelder, { bestaetigt: "ja" }, null);
let stand = await db.registration.findUniqueOrThrow({ where: { id: opfer.id } });
pruefe(
  "Löschlauf ohne Sitzung: es wird NICHTS anonymisiert",
  stand.anonymisiertAm === null && stand.kontaktVorname === "Zugangs",
  "der schärfste Fall",
);

await sende("/admin/loeschen", laufFelder, { bestaetigt: "ja" }, GEFAELSCHT);
stand = await db.registration.findUniqueOrThrow({ where: { id: opfer.id } });
pruefe(
  "Löschlauf mit erfundenem Cookie: ebenfalls nichts",
  stand.anonymisiertAm === null,
);

/* ── Angemeldet, aber ohne Bestätigung ────────────────────────── */

console.log("\n── Angemeldet, aber ohne Häkchen ──\n");

await sende("/admin/loeschen", laufFelder, {}, sitzung.cookie);
stand = await db.registration.findUniqueOrThrow({ where: { id: opfer.id } });
pruefe(
  "Löschlauf ohne gesetztes Häkchen: nichts anonymisiert",
  stand.anonymisiertAm === null,
  "ein Fehlklick genügt nicht",
);

/* Der Probelauf dagegen ist gefahrlos — und muss das auch bleiben. */
const probeFelder = actionFelder(loeschSeite.html, "Probelauf");
await sende("/admin/loeschen", probeFelder, {}, sitzung.cookie);
stand = await db.registration.findUniqueOrThrow({ where: { id: opfer.id } });
pruefe(
  "Probelauf angemeldet: verändert den Datensatz nicht",
  stand.anonymisiertAm === null,
);
pruefe(
  "… und hinterlässt einen als Probe gekennzeichneten Protokolleintrag",
  (await db.loeschprotokoll.count({ where: { zielId: opfer.id, probelauf: true } })) > 0,
);

/* ── Mit Häkchen wirkt er ─────────────────────────────────────── */

console.log("\n── Mit Häkchen und Sitzung ──\n");

await sende("/admin/loeschen", laufFelder, { bestaetigt: "ja" }, sitzung.cookie);
stand = await db.registration.findUniqueOrThrow({ where: { id: opfer.id } });
pruefe(
  "Angemeldet und bestätigt: die fällige Anmeldung wird anonymisiert",
  stand.anonymisiertAm !== null && stand.kontaktVorname === "Gelöscht",
);

/* ── Aufräumen ────────────────────────────────────────────────── */

await db.loeschprotokoll.deleteMany({});
await db.loeschsperre.deleteMany({});
await db.participant.deleteMany({ where: { registrationId: opfer.id } });
await db.registration.deleteMany({ where: { eventId: event.id } });
await db.event.delete({ where: { id: event.id } });

console.log(
  schief.length === 0
    ? `\n${n} von ${n} in Ordnung. Testdaten entfernt.`
    : `\n${schief.length} von ${n} fehlgeschlagen:\n${schief.join("\n")}`,
);
await db.$disconnect();
process.exit(schief.length === 0 ? 0 : 1);
