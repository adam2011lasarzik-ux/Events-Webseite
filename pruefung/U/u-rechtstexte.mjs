/* ---------------------------------------------------------------
   Prüfliste U · Versionierte Rechtstexte (Bauauftrag B-27)

   Hintergrund: Entscheidung 6.7 vom 20.09.2026. Maßgeblich für einen
   Vertrag ist die Fassung, die bei VERTRAGSSCHLUSS galt. Diese Liste
   prüft, dass genau das passiert — und dass „unveränderbar" eine
   Eigenschaft ist und keine Absichtserklärung.

   Teil 1 braucht weder Datenbank noch Server.
   Teil 2 läuft gegen die echte Datenbank.

   Voraussetzungen für Teil 2: Datenbank läuft.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs.
   Diese Liste legt Fassungen und Buchungen an und löscht sie wieder. */
import "../schutz.mjs";

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { db } from "../../lib/db.js";
import {
  pruefsumme,
  naechsteVersion,
  geltendeFassung,
  fassungAnlegen,
  geltendeFassungJetzt,
  fassungenZurBuchung,
  fassungenUnversehrt,
  FassungUnveraenderbar,
} from "../../lib/rechtstexte.js";
import { bestaetigungsMail } from "../../lib/mailVorlagen.js";

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

/* ══ Teil 1 · Die reinen Regeln ═══════════════════════════════════ */

console.log("\nU1 · Prüfsumme");
pruefe(
  "Prüfsumme ist der SHA-256 über den Wortlaut",
  pruefsumme("Hallo") === createHash("sha256").update("Hallo", "utf8").digest("hex"),
);
pruefe("Gleicher Text, gleiche Prüfsumme", pruefsumme("abc") === pruefsumme("abc"));
pruefe("Ein geändertes Zeichen ändert die Prüfsumme", pruefsumme("abc") !== pruefsumme("abd"));
pruefe(
  "Ein geändertes LEERZEICHEN ändert sie ebenfalls — es wird nicht normalisiert",
  pruefsumme("a b") !== pruefsumme("a  b"),
);

console.log("\nU2 · Versionsnummern");
pruefe("Die erste Fassung ist Version 1", naechsteVersion([]) === 1);
pruefe("Nach v1 kommt v2", naechsteVersion([1]) === 2);
pruefe("Nach einer Lücke wird weitergezählt, nicht aufgefüllt", naechsteVersion([1, 2, 5]) === 6);

console.log("\nU3 · Welche Fassung gilt — die Kernregel");
const t = (s) => new Date(`2026-0${s}`);
const f1 = { id: "a", version: 1, gueltigAb: t("1-01T00:00:00Z") };
const f2 = { id: "b", version: 2, gueltigAb: t("6-01T00:00:00Z") };
const f3 = { id: "c", version: 3, gueltigAb: t("9-30T00:00:00Z") };
const alle = [f1, f2, f3];

pruefe(
  "Vor der ersten Fassung gilt keine",
  geltendeFassung(alle, new Date("2025-12-31")) === null,
);
pruefe("Im Januar gilt v1", geltendeFassung(alle, new Date("2026-03-01"))?.id === "a");
pruefe("Im Juli gilt v2", geltendeFassung(alle, new Date("2026-07-01"))?.id === "b");
pruefe(
  "Eine Fassung, die erst SPÄTER gilt, wird nicht gewählt — auch wenn sie die neueste ist",
  geltendeFassung(alle, new Date("2026-09-01"))?.id === "b",
  `gewählt: ${geltendeFassung(alle, new Date("2026-09-01"))?.id}`,
);
pruefe("Ab ihrem Stichtag gilt v3", geltendeFassung(alle, new Date("2026-10-01"))?.id === "c");
pruefe("Genau am Stichtag gilt die neue Fassung", geltendeFassung(alle, f2.gueltigAb)?.id === "b");
pruefe("Ohne Fassungen ist die Antwort null, nicht geraten", geltendeFassung([], new Date()) === null);

console.log("\nU4 · Es gibt keinen Weg, eine Fassung zu ändern");
const modul = lies("lib/rechtstexte.ts");
pruefe(
  "lib/rechtstexte.ts ruft NIE rechtstext.update auf",
  !modul.includes("rechtstext.update"),
);
pruefe(
  "… und auch kein upsert oder delete",
  !modul.includes("rechtstext.upsert") && !modul.includes("rechtstext.delete"),
);
const quellen = ["app", "lib", "components", "prisma"];
const { execSync } = await import("node:child_process");
const treffer = execSync(
  `grep -rn "rechtstext\\.\\(update\\|upsert\\|delete\\)" ${quellen.join(" ")} || true`,
  { cwd: new URL("../../", import.meta.url).pathname, encoding: "utf8" },
).trim();
pruefe(
  "Im GESAMTEN Projekt ändert oder löscht niemand eine Fassung",
  treffer === "",
  treffer,
);

console.log("\nU5 · Die Versionskennungen stehen an der Buchung");
const schema = lies("prisma/schema.prisma");
pruefe("Registration trägt agbFassungId", schema.includes("agbFassungId"));
pruefe("Registration trägt datenschutzFassungId", schema.includes("datenschutzFassungId"));
/* Den Registration-Block herauslösen, statt quer durch die Datei zu
   suchen: Ein `[\s\S]*?` findet sonst das `inhalt` des Rechtstext-
   Modells und meldet einen Fehler, den es nicht gibt. */
const registrationBlock = (() => {
  const start = schema.indexOf("model Registration {");
  return start < 0 ? "" : schema.slice(start, schema.indexOf("\n}", start));
})();
pruefe(
  "Der Registration-Block wurde gefunden",
  registrationBlock.length > 0,
);
pruefe(
  "Der Wortlaut steht NICHT an der Buchung — nur die Kennung",
  !/\binhalt\s+String/.test(registrationBlock),
);
pruefe(
  "Die Anmeldeaktion hält beide Fassungen fest",
  (() => {
    const a = lies("app/(seite)/anmeldung/aktion.ts");
    return a.includes("agbFassungId:") && a.includes("datenschutzFassungId:");
  })(),
);
pruefe(
  "… und fragt nach der JETZT geltenden Fassung, nicht nach der neuesten",
  lies("app/(seite)/anmeldung/aktion.ts").includes("geltendeFassungJetzt"),
);

/* ══ Teil 2 · Gegen die echte Datenbank ══════════════════════════ */

console.log("\nU6 · Anlegen, und nur anlegen");

await db.registration.deleteMany({ where: { kontaktEmail: { contains: "@pruef-u.example" } } });
await db.rechtstext.deleteMany({});

const TEXT1 = "Teilnahmebedingungen, Fassung eins.\n\n1. Ein Satz.\n";
const TEXT2 = "Teilnahmebedingungen, Fassung zwei.\n\n1. Ein anderer Satz.\n";

const v1 = await fassungAnlegen("AGB_B2C", TEXT1, new Date("2026-01-01"));
pruefe("Die erste Fassung bekommt Version 1", v1.version === 1, `v${v1.version}`);

const v2 = await fassungAnlegen("AGB_B2C", TEXT2, new Date("2026-06-01"));
pruefe("Die zweite bekommt Version 2", v2.version === 2, `v${v2.version}`);

const beide = await db.rechtstext.findMany({ where: { art: "AGB_B2C" } });
pruefe("Beide Fassungen stehen nebeneinander — nichts überschrieben", beide.length === 2);
pruefe(
  "Die erste Fassung trägt unverändert ihren Wortlaut",
  beide.find((f) => f.version === 1)?.inhalt === TEXT1,
);
pruefe(
  "Die Prüfsumme wird beim Anlegen gesetzt",
  beide.every((f) => f.pruefsumme === pruefsumme(f.inhalt)),
);

let doppeltAbgewiesen = false;
try {
  await db.rechtstext.create({
    data: {
      art: "AGB_B2C",
      version: 1,
      datum: new Date(),
      gueltigAb: new Date(),
      inhalt: "Schmuggelware",
      pruefsumme: "x",
    },
  });
} catch {
  doppeltAbgewiesen = true;
}
pruefe(
  "Eine zweite Fassung mit derselben Nummer weist die Datenbank ab",
  doppeltAbgewiesen,
);

console.log("\nU7 · Welche Fassung gilt jetzt");
const jetztGilt = await geltendeFassungJetzt("AGB_B2C", new Date("2026-03-01"));
pruefe("Im März gilt v1", jetztGilt?.version === 1, `v${jetztGilt?.version}`);
const spaeter = await geltendeFassungJetzt("AGB_B2C", new Date("2026-09-20"));
pruefe("Im September gilt v2", spaeter?.version === 2, `v${spaeter?.version}`);
const keine = await geltendeFassungJetzt("AGB_B2B", new Date());
pruefe("Für eine Art ohne Fassung ist die Antwort null", keine === null);

console.log("\nU8 · Die Buchung hält ihre Fassung fest");

const event = await db.event.findFirst({ where: { startAt: { not: null } }, select: { id: true } });
if (!event) {
  console.log("  ✗ Keine Veranstaltung mit Termin vorhanden — Teil 2 kann nicht laufen.");
  fehl++;
} else {
  const buchung = await db.registration.create({
    data: {
      eventId: event.id,
      kontaktVorname: "Uta",
      kontaktNachname: "Probe",
      kontaktEmail: "uta@pruef-u.example",
      gesamtpreisCents: 700,
      agbFassungId: v1.id,
      teilnehmer: { create: [{ vorname: "Uta", nachname: "Probe", typ: "ERWACHSENER" }] },
    },
    select: { id: true },
  });

  const fassungen = await fassungenZurBuchung(buchung.id);
  pruefe("Die Buchung liefert ihre Fassung", fassungen.length === 1, `${fassungen.length}`);
  pruefe("… und zwar v1, nicht die inzwischen neuere v2", fassungen[0]?.version === 1);
  pruefe("… mit dem Wortlaut von damals", fassungen[0]?.inhalt === TEXT1);

  const mail = bestaetigungsMail(
    {
      id: buchung.id,
      kontaktVorname: "Uta",
      kontaktNachname: "Probe",
      kontaktEmail: "uta@pruef-u.example",
      kontaktTelefon: null,
      gesamtpreisCents: 700,
      teilnehmer: [{ vorname: "Uta", nachname: "Probe" }],
    },
    { titel: "Probe", startAt: new Date(), ortName: "Halle", stadt: "Falkensee" },
    null,
    fassungen,
  );
  pruefe("Die Bestätigungsmail enthält den VOLLTEXT, keinen Link", mail.text.includes(TEXT1.trim()));
  pruefe("… und nennt Fassung und Stand", mail.text.includes("Fassung 1"));
  pruefe("… und nicht den Wortlaut der neueren Fassung", !mail.text.includes(TEXT2.trim()));

  const ohne = bestaetigungsMail(
    {
      id: "x",
      kontaktVorname: "Ohne",
      kontaktNachname: "Fassung",
      kontaktEmail: "ohne@pruef-u.example",
      kontaktTelefon: null,
      gesamtpreisCents: 0,
      teilnehmer: [{ vorname: "Ohne", nachname: "Fassung" }],
    },
    { titel: "Probe", startAt: new Date(), ortName: "Halle", stadt: "Falkensee" },
    null,
    [],
  );
  pruefe(
    "Ohne hinterlegte Fassung geht die Mail ohne Anhang hinaus, statt zu scheitern",
    !ohne.text.includes("Bestandteil deines Vertrags"),
  );

  await db.registration.delete({ where: { id: buchung.id } });
}

console.log("\nU9 · Der Wächter gegen die unbeabsichtigte Änderung");
pruefe("Alle Fassungen sind unversehrt", (await fassungenUnversehrt()).length === 0);

/* Von aussen am Wortlaut vorbeigeschrieben — genau der Fall, den die
   Prüfsumme sichtbar machen soll. Der Anwendungscode kann das nicht,
   hier wird es bewusst erzwungen. */
await db.rechtstext.update({ where: { id: v1.id }, data: { inhalt: TEXT1 + "heimlich" } });
const beschaedigt = await fassungenUnversehrt();
pruefe(
  "Eine nachträglich veränderte Fassung wird erkannt",
  beschaedigt.length === 1 && beschaedigt[0].version === 1,
  `${beschaedigt.length} gefunden`,
);

/* ── Aufräumen ─────────────────────────────────────────────────── */
await db.registration.deleteMany({ where: { kontaktEmail: { contains: "@pruef-u.example" } } });
await db.rechtstext.deleteMany({});
pruefe("Testdaten wieder entfernt", (await db.rechtstext.count()) === 0);

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen`);
await db.$disconnect();
process.exit(fehl === 0 ? 0 : 1);
