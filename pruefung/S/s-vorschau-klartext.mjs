/* ---------------------------------------------------------------
   Prüfliste S, Teil 7 — Klartext in „Jetzt fällig" und „Demnächst
   fällig".

   Dieselbe Verbesserung wie bei den Löschsperren (s-sperr-bedienung),
   jetzt für die beiden Vorschau-Tabellen: Name, E-Mail, Veranstaltung
   und Datum statt nur einer Kennung. Die Kennung bleibt — klein, mit
   Kopierfunktion.

   Braucht den Server auf Port 3213.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { alsText, anmelden, hole } from "../H/admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

/* ── Ausgangslage: je ein längst fälliger Datensatz jeder Art ───── */

await db.loeschprotokoll.deleteMany({});
await db.loeschsperre.deleteMany({});
await db.vorfall.deleteMany({});
await db.checkliste.deleteMany({});
await db.zustimmungsnachweis.deleteMany({});
await db.participant.deleteMany({});
await db.registration.deleteMany({ where: { kontaktEmail: { contains: "@vk-pruefung" } } });

const event = await db.event.findFirstOrThrow();
const LANGE_HER = new Date("2015-06-15T12:00:00Z");
const FAELLIG = new Date("2018-12-31T23:59:59.999Z");

const anmeldung = await db.registration.create({
  data: {
    eventId: event.id,
    kontaktVorname: "Erika",
    kontaktNachname: "Beispiel",
    kontaktEmail: "erika@vk-pruefung.invalid",
    gesamtpreisCents: 1400,
    status: "BESTAETIGT",
    faelligAm: FAELLIG,
    teilnehmer: { create: [{ vorname: "Erika", nachname: "Beispiel", typ: "ERWACHSENER" }] },
  },
});

const checkliste = await db.checkliste.create({
  data: {
    eventId: event.id,
    durchgefuehrtAm: LANGE_HER,
    einweisungKuerzel: "AL",
    einweisungErfolgt: true,
    teilnehmerAnzahl: 42,
    faelligAm: FAELLIG,
  },
});

const nachweis = await db.zustimmungsnachweis.create({
  data: {
    eventId: event.id,
    veranstaltungAm: LANGE_HER,
    teilnehmerName: "Max Beispiel",
    faelligAm: FAELLIG,
  },
});

const vorfall = await db.vorfall.create({
  data: {
    titel: "Sturz auf der Anlage",
    status: "ABGESCHLOSSEN",
    einstufung: "LEICHT",
    abgeschlossenAm: new Date("2018-07-01T10:00:00Z"),
    faelligAm: new Date("2018-08-01T10:00:00Z"),
    erstelltVon: "vk-pruefung",
  },
});

/* ── Seite laden ──────────────────────────────────────────────── */

const sitzung = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
if (!sitzung.cookie) throw new Error("Anmeldung fehlgeschlagen — läuft der Server auf 3213?");

const seite = await hole("/admin/loeschen", sitzung.cookie);
const text = alsText(seite.html);

pruefe("Die Seite ist erreichbar", seite.status === 200);

/* ── Anmeldung: Name, E-Mail, Veranstaltung ──────────────────── */

console.log("\n── Anmeldung (K4) ──\n");

pruefe("Der Name der anmeldenden Person steht in der Tabelle", text.includes("Erika Beispiel"));
pruefe("Die E-Mail-Adresse steht dabei", text.includes("erika@vk-pruefung.invalid"));
pruefe("Die Veranstaltung steht dabei", text.includes(event.titel));
pruefe(
  "Die Art steht in Klartext („Anmeldung“, nicht „Registration“)",
  text.includes("Anmeldung") && !seite.html.includes(">Registration<"),
);

/* ── Checkliste: sachliche Bezeichnung, kein Name ────────────── */

console.log("\n── Checkliste (K5) ──\n");

pruefe(
  "Eine Checkliste trägt die sachliche Bezeichnung „Veranstaltungscheckliste“",
  text.includes("Veranstaltungscheckliste"),
);
pruefe(
  "Das Durchführungsdatum steht dabei (15.6.2015)",
  text.includes("15.6.2015"),
);

/* ── Zustimmungsnachweis: Name der minderjährigen Person ─────── */

console.log("\n── Zustimmungsnachweis (K3) ──\n");

pruefe("Der Name der minderjährigen Person steht in der Tabelle", text.includes("Max Beispiel"));

/* ── Vorfall: Titel statt Kennung ─────────────────────────────── */

console.log("\n── Vorfall (K6) ──\n");

pruefe("Der Titel des Vorfalls steht in der Tabelle", text.includes("Sturz auf der Anlage"));

/* ── Die Kennung bleibt — klein, mit Kopierfunktion ──────────── */

console.log("\n── Kennungen bleiben erhalten ──\n");

for (const [name, id] of [
  ["Anmeldung", anmeldung.id],
  ["Checkliste", checkliste.id],
  ["Zustimmungsnachweis", nachweis.id],
  ["Vorfall", vorfall.id],
]) {
  pruefe(`Die Kennung der ${name} steht weiterhin auf der Seite`, seite.html.includes(id));
}
pruefe(
  "Jede Zeile hat einen Kopieren-Knopf für die Kennung",
  seite.html.split("Kopieren").length - 1 >= 4,
  `${seite.html.split("Kopieren").length - 1} Knöpfe`,
);

/* ── Aufräumen ────────────────────────────────────────────────── */

await db.loeschsperre.deleteMany({});
await db.loeschprotokoll.deleteMany({});
await db.vorfall.deleteMany({ where: { id: vorfall.id } });
await db.checkliste.deleteMany({ where: { id: checkliste.id } });
await db.zustimmungsnachweis.deleteMany({ where: { id: nachweis.id } });
await db.participant.deleteMany({ where: { registrationId: anmeldung.id } });
await db.registration.deleteMany({ where: { kontaktEmail: { contains: "@vk-pruefung" } } });

console.log(
  schief.length === 0
    ? `\n${n} von ${n} in Ordnung. Testdaten entfernt.`
    : `\n${schief.length} von ${n} fehlgeschlagen:\n${schief.join("\n")}`,
);
await db.$disconnect();
process.exit(schief.length === 0 ? 0 : 1);
