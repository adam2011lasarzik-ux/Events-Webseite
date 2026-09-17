/* ---------------------------------------------------------------
   Prüfliste S, Teil 4 — die monatliche Papiererinnerung.

   Zwei Dinge sind hier wichtig und werden beide geprüft:

     1. Ohne fällige Unterlagen wird NICHT gemailt. Eine monatliche
        Mail „nichts zu tun" wird nach dem dritten Mal ungelesen
        weggeklickt — und dann auch die vierte, in der etwas steht.
     2. Die Mail enthält keine Teilnehmernamen. Eine Erinnerung, die
        selbst eine Namensliste ist, verlängert genau das Problem,
        das sie lösen soll.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { db } from "../../lib/db.js";
import { papiererinnerungen } from "../../lib/loeschlauf.js";
import { papiererinnerungsMail } from "../../lib/mailVorlagen.js";

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

async function aufraeumen() {
  const proben = await db.event.findMany({
    where: { slug: { startsWith: "s-papier" } },
    select: { id: true },
  });
  for (const p of proben) {
    await db.participant.deleteMany({ where: { anmeldung: { eventId: p.id } } });
    await db.registration.deleteMany({ where: { eventId: p.id } });
    await db.event.delete({ where: { id: p.id } });
  }
}

await aufraeumen();

/* ── Ohne fällige Unterlagen ──────────────────────────────────── */

const kuenftig = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
const eventKuenftig = await db.event.create({
  data: {
    slug: "s-papier-kuenftig", titel: "S-Papier künftig", beschreibung: "x", kurz: "x",
    karteTitel: "x", karteKurz: "x", karteZielgruppe: "x",
    startAt: kuenftig, endAt: kuenftig, stadt: "Falkensee",
    maxPersonen: 100, schwelleWenigPlaetze: 10, schuelerAktiv: true,
    preisSchuelerCents: 700, preisErwachsenerCents: 1400, status: "ENTWURF",
  },
});

/* Nur die EIGENEN Veranstaltungen betrachten.

   papiererinnerungen() sieht alle Events an — im Sammellauf stehen
   daneben die Probe-Events der Listen G und H, und deren Termine
   liegen teils in der Vergangenheit. Eine Prüfung, die auf die globale
   Liste zählt, bestünde einzeln und fiele im Sammellauf durch: genau
   die gegenseitige Beeinflussung, die schon einmal wie ein
   Produktfehler aussah und keiner war. */
const eigene = async () =>
  (await papiererinnerungen()).filter((f) => f.eventTitel.startsWith("S-Papier"));

pruefe(
  "Veranstaltung in der Zukunft: nichts fällig",
  (await eigene()).length === 0,
);

/* ── Mit fälligen Unterlagen ──────────────────────────────────── */

const VERGANGEN = new Date("2018-06-15T12:00:00Z");
const eventAlt = await db.event.create({
  data: {
    slug: "s-papier-alt", titel: "S-Papier vergangen", beschreibung: "x", kurz: "x",
    karteTitel: "x", karteKurz: "x", karteZielgruppe: "x",
    startAt: VERGANGEN, endAt: VERGANGEN, stadt: "Falkensee",
    maxPersonen: 100, schwelleWenigPlaetze: 10, schuelerAktiv: true,
    preisSchuelerCents: 700, preisErwachsenerCents: 1400, status: "ENTWURF",
  },
});
await db.registration.create({
  data: {
    eventId: eventAlt.id, kontaktVorname: "Erika", kontaktNachname: "Mustermann",
    kontaktEmail: "papier@s-pruefung.invalid", kontaktTelefon: "0170 1234567",
    gesamtpreisCents: 1400, status: "BESTAETIGT",
    teilnehmer: { create: [{ vorname: "Erika", nachname: "Mustermann", typ: "ERWACHSENER" }] },
  },
});

const faellig = await eigene();
pruefe(
  "Lange vergangene Veranstaltung: beide Papierklassen fällig",
  faellig.length === 2 &&
    faellig.some((f) => f.klasse === "GESUNDHEITSANGABEN") &&
    faellig.some((f) => f.klasse === "EINVERSTAENDNIS_VOLL"),
  faellig.map((f) => f.klasse).join(", "),
);
pruefe(
  "Die Zahl der betroffenen Anmeldungen steht dabei",
  faellig.every((f) => f.anzahl === 1),
);

/* ── Die Mail ─────────────────────────────────────────────────── */

const mail = papiererinnerungsMail(
  faellig.map((f) => ({
    klasse: f.klasse,
    eventTitel: f.eventTitel,
    faelligSeit: f.faelligAm.toISOString().slice(0, 10),
    anzahl: f.anzahl,
  })),
);

pruefe("Die Mail nennt die Zahl der Posten im Betreff", /2 Papierunterlagen/.test(mail.betreff));
pruefe(
  "Die Mail benennt beide Klassen im Klartext",
  mail.text.includes("Gesundheits- und Notfallangaben") &&
    mail.text.includes("Vollständige Einverständniserklärungen"),
);
pruefe(
  "Die Mail nennt die Veranstaltung und seit wann es fällig ist",
  mail.text.includes("S-Papier vergangen") && /fällig seit:/.test(mail.text),
);
pruefe(
  "Die Mail sagt, dass Gesundheitsangaben geschreddert gehören",
  /schreddern/i.test(mail.text),
);
pruefe(
  "Die Mail weist auf die Löschsperre bei laufendem Vorfall hin",
  /Löschsperre/i.test(mail.text) && mail.text.includes("/admin/loeschen"),
);
pruefe(
  "Die Mail enthält KEINEN Teilnehmernamen",
  !mail.text.includes("Erika") && !mail.text.includes("Mustermann"),
);
pruefe(
  "Die Mail enthält KEINE E-Mail-Adresse und keine Telefonnummer der Teilnehmer",
  !mail.text.includes("@s-pruefung.invalid") && !mail.text.includes("0170"),
);

/* ── Der Löschlauf rührt Papier nicht an ──────────────────────── */

const { loeschlauf } = await import("../../lib/loeschlauf.js");
const lauf = await loeschlauf(true);
pruefe(
  "Der Löschlauf behauptet NICHT, Papierklassen zu löschen",
  lauf.eintraege.every(
    (e) => e.klasse !== "GESUNDHEITSANGABEN" && e.klasse !== "EINVERSTAENDNIS_VOLL",
  ),
  "Papier kann er nicht vernichten",
);

await db.loeschprotokoll.deleteMany({});
await db.loeschsperre.deleteMany({});
await aufraeumen();
void eventKuenftig;

console.log(
  schief.length === 0
    ? `\n${n} von ${n} in Ordnung. Testdaten entfernt.`
    : `\n${schief.length} von ${n} fehlgeschlagen:\n${schief.join("\n")}`,
);
await db.$disconnect();
process.exit(schief.length === 0 ? 0 : 1);
