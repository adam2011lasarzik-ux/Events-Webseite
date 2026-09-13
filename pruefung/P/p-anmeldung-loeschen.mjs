/* ---------------------------------------------------------------
   Endgültiges Löschen einer Anmeldung — die Sicherheitsregel und der
   damit vollzogene Vorgang.

   Der eigentliche Zweck dieser Liste: BEWEISEN, dass eine Buchung mit
   echter Zahlung unter keinem der geprüften Umstände gelöscht wird —
   nicht nur behaupten. Jede der vier Ablehnungsbedingungen wird
   einzeln durchgespielt, dazu der einzige Fall, in dem gelöscht
   werden darf.

   Voraussetzungen: Datenbank läuft. Kein Server, kein Browser nötig.
   --------------------------------------------------------------- */

import { db } from "../../lib/db.ts";
import { anmeldungLoeschbar } from "../../lib/anmeldungLoeschbar.ts";
import { execSync } from "node:child_process";

let gut = 0;
let schlecht = 0;

function pruefe(name, bedingung, zusatz = "") {
  if (bedingung) gut += 1;
  else schlecht += 1;
  console.log(`${bedingung ? "✓" : "✗"} ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
}

/* ═══ Teil 1: die reine Regel ═════════════════════════════════════ */

const sicherAnonymStorniertUnbezahlt = {
  status: "STORNIERT",
  zahlungsStatus: "OFFEN",
  zahlungsAbsicht: null,
  bezahlterBetragCents: null,
  bezahltAm: null,
  anonymisiertAm: new Date(),
};

pruefe(
  "Storniert, unbezahlt, anonymisiert: loeschbar",
  anmeldungLoeschbar(sicherAnonymStorniertUnbezahlt).loeschbar === true,
);

pruefe(
  "Nicht storniert (RESERVIERT): abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, status: "RESERVIERT" });
    return e.loeschbar === false && e.grund === "nicht-storniert";
  })(),
);

pruefe(
  "Nicht storniert (BESTAETIGT): abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, status: "BESTAETIGT" });
    return e.loeschbar === false && e.grund === "nicht-storniert";
  })(),
);

pruefe(
  "Noch nicht anonymisiert: abgelehnt, SELBST wenn storniert und unbezahlt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, anonymisiertAm: null });
    return e.loeschbar === false && e.grund === "nicht-anonymisiert";
  })(),
  "eine Zeile mit echtem Namen und echter E-Mail wird nie automatisch entfernt",
);

/* Der eigentliche Kern dieser Liste: JEDE Spur einer echten Zahlung
   fuehrt fuer sich allein schon zur Ablehnung. */

pruefe(
  "zahlungsStatus BEZAHLT: abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, zahlungsStatus: "BEZAHLT" });
    return e.loeschbar === false && e.grund === "zahlung-vorhanden";
  })(),
  "Geld ist geflossen, der Datensatz gehoert zur Buchhaltung",
);

pruefe(
  "zahlungsStatus ERSTATTET: abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, zahlungsStatus: "ERSTATTET" });
    return e.loeschbar === false && e.grund === "zahlung-vorhanden";
  })(),
);

pruefe(
  "zahlungsStatus TEILWEISE_ERSTATTET: abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({
      ...sicherAnonymStorniertUnbezahlt,
      zahlungsStatus: "TEILWEISE_ERSTATTET",
    });
    return e.loeschbar === false && e.grund === "zahlung-vorhanden";
  })(),
);

pruefe(
  "zahlungsAbsicht gesetzt (echte Zahlung beim Anbieter angestossen): abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, zahlungsAbsicht: "pi_echt" });
    return e.loeschbar === false && e.grund === "zahlung-vorhanden";
  })(),
  "selbst wenn zahlungsStatus noch OFFEN steht",
);

pruefe(
  "bezahlterBetragCents gesetzt: abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, bezahlterBetragCents: 2500 });
    return e.loeschbar === false && e.grund === "zahlung-vorhanden";
  })(),
);

pruefe(
  "bezahltAm gesetzt: abgelehnt",
  (() => {
    const e = anmeldungLoeschbar({ ...sicherAnonymStorniertUnbezahlt, bezahltAm: new Date() });
    return e.loeschbar === false && e.grund === "zahlung-vorhanden";
  })(),
);

/* ═══ Teil 2: der Vorgang, wirklich gegen die Datenbank ═══════════ */

const event = await db.event.findFirst({ where: { status: "VEROEFFENTLICHT" } });
if (!event) {
  console.error("Kein veröffentlichtes Event vorhanden — bitte erst db:seed laufen lassen.");
  process.exit(1);
}

async function anlegen(email, felder) {
  await db.registration.deleteMany({ where: { eventId: event.id, kontaktEmail: email } });
  return db.registration.create({
    data: {
      eventId: event.id,
      kontaktVorname: "Test",
      kontaktNachname: "Löschprüfung",
      kontaktEmail: email,
      gesamtpreisCents: 2500,
      teilnehmer: { create: [{ vorname: "Test", nachname: "Löschprüfung", typ: "ERWACHSENER" }] },
      ...felder,
    },
  });
}

/* 2a: die sichere Testbuchung — muss verschwinden */
const sicher = await anlegen("loesch-sicher@pruefung.example", {
  status: "STORNIERT",
  zahlungsStatus: "OFFEN",
  storniertAm: new Date(),
  anonymisiertAm: new Date(),
});

const teilnehmerVorher = await db.participant.count({ where: { registrationId: sicher.id } });
pruefe("Testbuchung hat Teilnehmer, bevor gelöscht wird", teilnehmerVorher === 1);

const ausgabeSicher = execSync(
  `npx tsx --env-file=.env prisma/anmeldungLoeschen.ts ${sicher.id}`,
  { cwd: new URL("../..", import.meta.url).pathname, encoding: "utf8" },
);
pruefe(
  "Meldet den Erfolg",
  ausgabeSicher.includes("Endgültig entfernt."),
  ausgabeSicher.trim().split("\n").pop(),
);

const nachSicher = await db.registration.findUnique({ where: { id: sicher.id } });
pruefe("Die Anmeldung ist wirklich weg", nachSicher === null);

const teilnehmerNachher = await db.participant.count({ where: { registrationId: sicher.id } });
pruefe("… und ihre Teilnehmer auch", teilnehmerNachher === 0);

/* 2b: eine ECHT bezahlte, stornierte, anonymisierte Buchung — darf
   das Skript unter KEINEN Umständen anfassen. Das ist der Fall, der
   in der Praxis zaehlt: eine Testbuchung sieht am Ende oft genauso
   aus wie eine stornierte, anonymisierte ECHTE Buchung — der einzige
   Unterschied ist, ob wirklich Geld floss. */
const bezahlt = await anlegen("loesch-bezahlt@pruefung.example", {
  status: "STORNIERT",
  zahlungsStatus: "ERSTATTET",
  zahlungsAbsicht: "pi_wirklich_bezahlt_gewesen",
  bezahlterBetragCents: 2500,
  bezahltAm: new Date(),
  storniertAm: new Date(),
  anonymisiertAm: new Date(),
});

let abgelehntRichtig = false;
let abgelehntMeldung = "";
try {
  execSync(`npx tsx --env-file=.env prisma/anmeldungLoeschen.ts ${bezahlt.id}`, {
    cwd: new URL("../..", import.meta.url).pathname,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  abgelehntRichtig = e.status !== 0;
  abgelehntMeldung = (e.stderr ?? "").toString().trim().split("\n")[0];
}
pruefe(
  "Eine ECHT bezahlte Buchung wird mit Fehler-Exitcode abgelehnt",
  abgelehntRichtig,
  abgelehntMeldung,
);

const nachBezahlt = await db.registration.findUnique({ where: { id: bezahlt.id } });
pruefe(
  "… und ist danach UNVERÄNDERT noch da",
  nachBezahlt !== null && nachBezahlt.zahlungsStatus === "ERSTATTET",
  nachBezahlt ? "noch vorhanden" : "GELÖSCHT — das wäre der schlimmste Fall",
);

/* 2c: eine unbekannte Kennung */
let unbekanntAbgelehnt = false;
try {
  execSync("npx tsx --env-file=.env prisma/anmeldungLoeschen.ts gibt-es-nicht", {
    cwd: new URL("../..", import.meta.url).pathname,
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  unbekanntAbgelehnt = e.status !== 0;
}
pruefe("Eine unbekannte Kennung wird abgelehnt", unbekanntAbgelehnt);

/* 2d: ohne Argument */
let ohneArgumentAbgelehnt = false;
try {
  execSync("npx tsx --env-file=.env prisma/anmeldungLoeschen.ts", {
    cwd: new URL("../..", import.meta.url).pathname,
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  ohneArgumentAbgelehnt = e.status !== 0;
}
pruefe("Ohne Kennung: abgelehnt statt zu raten", ohneArgumentAbgelehnt);

/* ── Aufraeumen ─────────────────────────────────────────────────── */
await db.registration.deleteMany({ where: { id: bezahlt.id } });
console.log("\nTestbuchungen entfernt.");

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
