/* ---------------------------------------------------------------
   Prüfliste S, Teil 6 — die Bedienung der Löschsperren.

   Die Seite zeigte anfangs fast nur technische Kennungen. Im Betrieb
   war sie damit unbrauchbar: Man konnte nicht entscheiden, ob eine
   Sperre noch nötig ist, ohne jede Kennung einzeln nachzuschlagen.

   Geprüft wird beides — dass Menschen etwas Lesbares sehen UND dass
   intern weiterhin die eindeutige Kennung gespeichert wird. Das
   zweite ist der Punkt, an dem eine hübschere Oberfläche sonst
   heimlich kaputtgeht.

   Braucht den Server auf Port 3213.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { chromium } from "playwright";
import { actionFelder, alsText, anmelden, hole, sende } from "../H/admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

/* ── Ausgangslage ─────────────────────────────────────────────── */

await db.loeschsperre.deleteMany({});
await db.participant.deleteMany({});
await db.registration.deleteMany({ where: { kontaktEmail: { contains: "@sb-pruefung" } } });

const event = await db.event.findFirstOrThrow();

const offen = await db.registration.create({
  data: {
    eventId: event.id,
    kontaktVorname: "Erika",
    kontaktNachname: "Beispiel",
    kontaktEmail: "erika@sb-pruefung.invalid",
    kontaktTelefon: "0170 1234567",
    gesamtpreisCents: 1400,
    status: "BESTAETIGT",
    teilnehmer: { create: [{ vorname: "Erika", nachname: "Beispiel", typ: "ERWACHSENER" }] },
  },
});

const anonym = await db.registration.create({
  data: {
    eventId: event.id,
    kontaktVorname: "Gelöscht",
    kontaktNachname: "Anmeldung",
    kontaktEmail: "geloescht+alt@sb-pruefung.invalid",
    anonymisiertAm: new Date(),
    gesamtpreisCents: 700,
    status: "BESTAETIGT",
  },
});

/* Eine automatische Sperre, damit der Unterschied zur manuellen
   sichtbar wird. */
await db.loeschsperre.create({
  data: {
    zielArt: "Registration",
    zielId: anonym.id,
    grund: "RUECKBUCHUNG",
    automatisch: true,
    gesetztVon: "system",
    notiz: "Automatisch: Betrag wurde erstattet.",
  },
});

const sitzung = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
if (!sitzung.cookie) throw new Error("Anmeldung fehlgeschlagen — läuft der Server auf 3213?");

const seite = await hole("/admin/loeschen", sitzung.cookie);
const text = alsText(seite.html);

/* ── 1. Die Liste zeigt Klartext ──────────────────────────────── */

console.log("── Offene Löschsperren: Klartext statt Kennung ──\n");

pruefe("Die Seite ist erreichbar", seite.status === 200);
pruefe(
  "Der Name der anmeldenden Person steht in der Liste",
  text.includes("Gelöscht Anmeldung"),
);
pruefe(
  "Die E-Mail-Adresse steht dabei",
  text.includes("geloescht+alt@sb-pruefung.invalid"),
);
pruefe("Die Veranstaltung steht dabei", text.includes(event.titel));
pruefe(
  "Die Art steht in Klartext („Anmeldung“ statt „Registration“)",
  text.includes("Anmeldung") && !seite.html.includes(">Registration<"),
);
pruefe("Der Sperrgrund steht in Klartext", text.includes("Rückbuchung"));
pruefe("Die Notiz steht dabei", text.includes("Betrag wurde erstattet"));

pruefe(
  "Die technische Kennung ist weiterhin da — nur klein",
  seite.html.includes(anonym.id),
  "sie wird gebraucht, um den Datensatz wiederzufinden",
);
pruefe(
  "Zu jeder Kennung gibt es einen Kopieren-Knopf",
  seite.html.includes("Kopieren"),
);

/* ── 2. Automatisch und von Hand sind unterscheidbar ──────────── */

console.log("\n── Automatisch gegen von Hand ──\n");

pruefe("Die automatische Sperre ist als „automatisch“ gekennzeichnet", text.includes("automatisch"));
pruefe(
  "Die Seite erklärt den Unterschied",
  text.includes("verschwinden von selbst") || text.includes("bis du sie aufhebst"),
);

/* ── 3. Anonymisierte sind gekennzeichnet ─────────────────────── */

console.log("\n── Anonymisierte Anmeldungen ──\n");

pruefe(
  "Die anonymisierte Anmeldung trägt die Kennzeichnung „anonymisiert“",
  text.includes("anonymisiert"),
);

/* ── 4. Das Formular: Auswahl statt Kennung abtippen ──────────── */

console.log("\n── Das Formular ──\n");

pruefe(
  "Es gibt KEIN Freitextfeld mehr für die Kennung",
  !/name="zielId"[^>]*type="text"/.test(seite.html) &&
    !/<input[^>]*name="zielId"(?![^>]*type="hidden")/.test(seite.html),
);
pruefe(
  "Stattdessen eine Auswahlliste mit dem Namen zielId",
  /<select[^>]*name="zielId"/.test(seite.html),
);
pruefe(
  "Die Auswahl trägt die Kennung als Wert, den Namen als Beschriftung",
  seite.html.includes(`value="${offen.id}"`) && text.includes("Erika Beispiel"),
);
pruefe(
  "Die Beschriftung enthält Name, Veranstaltung, Datum und E-Mail",
  text.includes("Erika Beispiel — " + event.titel) &&
    text.includes("erika@sb-pruefung.invalid"),
);
pruefe(
  "Anonymisierte stehen in einer eigenen, benannten Gruppe",
  /<optgroup[^>]*label="Bereits anonymisiert[^"]*"/.test(seite.html),
);
pruefe(
  "Es gibt ein Suchfeld zum Eingrenzen",
  seite.html.includes('id="anmeldung-suche"'),
);

/* ── 5. Gespeichert wird weiterhin die Kennung ────────────────── */

console.log("\n── Was tatsächlich gespeichert wird ──\n");

const felder = actionFelder(seite.html, 'name="zielId"');
await sende(
  "/admin/loeschen",
  felder,
  { zielArt: "Registration", zielId: offen.id, grund: "RECHTSSTREIT", notiz: "Prüfung" },
  sitzung.cookie,
);

const neu = await db.loeschsperre.findFirst({
  where: { zielId: offen.id, grund: "RECHTSSTREIT", aufgehobenAm: null },
});
pruefe(
  "Über die Auswahl gesetzt: die Sperre trägt die eindeutige Anmelde-Kennung",
  neu !== null && neu.zielId === offen.id,
  neu ? neu.zielId : "keine Sperre entstanden",
);
pruefe("… und ist als NICHT automatisch gespeichert", neu !== null && neu.automatisch === false);
pruefe("… mit der eingegebenen Notiz", neu !== null && neu.notiz === "Prüfung");

/* ── 6. Bestehende Sperren bleiben unberührt ──────────────────── */

const automatisch = await db.loeschsperre.findFirst({
  where: { zielId: anonym.id, grund: "RUECKBUCHUNG" },
});
pruefe(
  "Die vorher vorhandene automatische Sperre ist unverändert offen",
  automatisch !== null && automatisch.aufgehobenAm === null && automatisch.automatisch === true,
  "die Umbauten fassen bestehende Sperren nicht an",
);

/* ── 7. Das Suchfeld grenzt wirklich ein ──────────────────────── */

console.log("\n── Suchfeld im Browser ──\n");

const [keksName, keksWert] = sitzung.cookie.split("=");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addCookies([{ name: keksName, value: keksWert, domain: "127.0.0.1", path: "/" }]);
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3213/admin/loeschen", { waitUntil: "networkidle" });

const alle = await page.locator("#anmeldung-auswahl option").count();
await page.fill("#anmeldung-suche", "erika");
await page.waitForTimeout(150);
const gefiltert = await page.locator("#anmeldung-auswahl option").count();

pruefe(
  "Ohne Suche stehen alle Anmeldungen zur Wahl",
  alle >= 3,
  `${alle} Einträge (inkl. „bitte auswählen")`,
);
pruefe(
  "Mit Suchbegriff wird die Liste kürzer",
  gefiltert < alle,
  `${gefiltert} statt ${alle}`,
);
pruefe(
  "Die gesuchte Person ist noch dabei",
  (await page.locator("#anmeldung-auswahl").innerText()).includes("Erika Beispiel"),
);

await page.fill("#anmeldung-suche", "gibtesnicht");
await page.waitForTimeout(150);
pruefe(
  "Ein Suchbegriff ohne Treffer lässt nur den Platzhalter übrig",
  (await page.locator("#anmeldung-auswahl option").count()) === 1,
);

await browser.close();

/* ── Aufräumen ────────────────────────────────────────────────── */

await db.loeschsperre.deleteMany({});
await db.participant.deleteMany({ where: { registrationId: offen.id } });
await db.registration.deleteMany({ where: { kontaktEmail: { contains: "@sb-pruefung" } } });

console.log(
  schief.length === 0
    ? `\n${n} von ${n} in Ordnung. Testdaten entfernt.`
    : `\n${schief.length} von ${n} fehlgeschlagen:\n${schief.join("\n")}`,
);
await db.$disconnect();
process.exit(schief.length === 0 ? 0 : 1);
