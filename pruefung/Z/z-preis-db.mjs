/* Schutz bestehender Buchungen und das Preis-Änderungsprotokoll auf
   Datenbankebene — ohne Server, damit die Prüfung robust bleibt.

   Zeigt: Eine Preisänderung am Event lässt den eingefrorenen Preis
   einer bereits gespeicherten Buchung unberührt, und eine
   PreisAenderung-Zeile hält den Übergang alt→neu mit Admin und
   Zeitpunkt fest. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { db } from "../../lib/db.js";
import { alsPreisStand, preisAenderungen } from "../../lib/preisProtokoll.js";

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const SLUG = "z-preis-db-testevent";

// Reste abräumen.
for (const e of await db.event.findMany({ where: { slug: SLUG }, select: { id: true } })) {
  await db.registration.deleteMany({ where: { eventId: e.id } });
  await db.preisAenderung.deleteMany({ where: { eventId: e.id } });
  await db.event.delete({ where: { id: e.id } });
}

// Einen Testadmin sicherstellen (für adminId im Protokoll).
let admin = await db.adminUser.findFirst();
if (!admin) {
  admin = await db.adminUser.create({
    data: { email: "z-preis-db@vera.example", passwortHash: "x" },
  });
}

// Event mit Erwachsenenpreis 14,00 € anlegen.
const event = await db.event.create({
  data: {
    slug: SLUG, titel: "Preis-DB-Testevent", kategorie: "SONSTIGES",
    karteTitel: "T", karteKurz: "K", kurz: "K", beschreibung: "B", stadt: "S",
    preisErwachsenerCents: 1400, schuelerAktiv: true, preisSchuelerCents: 700,
    maxErwachsene: 4,
  },
});

// Eine bezahlte Buchung mit eingefrorenem Preis 1400.
const buchung = await db.registration.create({
  data: {
    eventId: event.id, kontaktVorname: "A", kontaktNachname: "B",
    kontaktEmail: "a@b.de", buchungsart: "EINZEL", status: "BESTAETIGT",
    gesamtpreisCents: 1400, zahlungsStatus: "BEZAHLT", bezahlterBetragCents: 1400,
    agbAkzeptiert: true, kenntnisAufnahmen: true,
  },
});

// Preisänderung 14,00 → 16,00 wie die Aktion: Diff bilden, Event
// aktualisieren, Protokoll schreiben.
const alt = alsPreisStand(event);
await db.event.update({ where: { id: event.id }, data: { preisErwachsenerCents: 1600 } });
const neu = alsPreisStand(await db.event.findUniqueOrThrow({ where: { id: event.id } }));
const aenderungen = preisAenderungen(alt, neu);
await db.preisAenderung.createMany({
  data: aenderungen.map((a) => ({ ...a, eventId: event.id, adminId: admin.id })),
});

// 1. Eingefrorener Preis der Buchung unverändert.
const buchungDanach = await db.registration.findUniqueOrThrow({ where: { id: buchung.id } });
pruefe("Bereits bezahlte Buchung behält den eingefrorenen Preis (1400)",
  buchungDanach.gesamtpreisCents === 1400, `${buchungDanach.gesamtpreisCents}`);

// 2. Protokolleintrag mit alt→neu, Admin und Zeitpunkt.
const eintrag = await db.preisAenderung.findFirst({
  where: { eventId: event.id, ticketart: "erwachsener" },
  orderBy: { geaendertAm: "desc" },
});
pruefe("Preisänderung steht im Protokoll (1400 → 1600) mit Admin und Zeitpunkt",
  eintrag !== null && eintrag.altCents === 1400 && eintrag.neuCents === 1600 &&
  Boolean(eintrag.adminId) && eintrag.geaendertAm instanceof Date,
  eintrag ? `alt=${eintrag.altCents}, neu=${eintrag.neuCents}` : "kein Eintrag");

// Aufräumen.
await db.registration.deleteMany({ where: { eventId: event.id } });
await db.preisAenderung.deleteMany({ where: { eventId: event.id } });
await db.event.delete({ where: { id: event.id } });
if (admin.email === "z-preis-db@vera.example") {
  await db.adminUser.delete({ where: { id: admin.id } }).catch(() => {});
}

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);

// Prisma hält die Verbindung offen und damit den Node-Prozess am
// Leben; ohne Trennen liefe die Liste nie zu Ende. Erst trennen, dann
// mit dem passenden Code beenden.
await db.$disconnect();
process.exit(schief.length ? 1 : 0);
