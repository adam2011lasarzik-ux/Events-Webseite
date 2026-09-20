/* ---------------------------------------------------------------
   Eine neue Fassung eines Rechtstexts anlegen.

   Der EINZIGE Weg, einen Rechtstext in die Datenbank zu bringen. Es
   gibt bewusst keinen Adminbereich dafür: Ein Rechtstext wird nicht
   nebenbei im Browser geändert, sondern bewusst, mit Datum, und
   nachdem jemand ihn gelesen hat.

   Aufruf:
     npm run rechtstext -- <art> <datei> <datum> [gueltigAb]

   Beispiel:
     npm run rechtstext -- AGB_B2C docs/agb-v1.md 2026-09-20

   `art` ist AGB_B2C, AGB_B2B oder DATENSCHUTZ.
   `datei` enthält den vollständigen Wortlaut.
   `datum` ist das Stand-Datum, das im Text selbst genannt wird.
   `gueltigAb` ist optional — ohne Angabe gilt die Fassung ab dem
   Stand-Datum. Mit Angabe lässt sich eine Fassung vorbereiten, die
   erst später greift.

   Bestehende Fassungen werden NIE verändert. Ein zweiter Aufruf legt
   Version 2 an, nicht eine überschriebene Version 1.
   --------------------------------------------------------------- */

import { readFileSync } from "node:fs";
import { fassungAnlegen, RECHTSTEXTARTEN, ARTNAME, type Rechtstextart } from "../lib/rechtstexte";
import { db } from "../lib/db";

function abbruch(satz: string): never {
  console.error(`\n✗ ${satz}\n`);
  console.error("Aufruf: npm run rechtstext -- <art> <datei> <datum> [gueltigAb]");
  console.error(`Arten:  ${RECHTSTEXTARTEN.join(", ")}\n`);
  process.exit(1);
}

const [art, datei, datumRoh, gueltigAbRoh] = process.argv.slice(2);

if (!art || !datei || !datumRoh) abbruch("Es fehlen Angaben.");
if (!RECHTSTEXTARTEN.includes(art as Rechtstextart)) abbruch(`Unbekannte Art: ${art}`);

const datum = new Date(`${datumRoh}T00:00:00Z`);
if (Number.isNaN(datum.getTime())) abbruch(`Kein gültiges Datum: ${datumRoh}`);

const gueltigAb = gueltigAbRoh ? new Date(`${gueltigAbRoh}T00:00:00Z`) : datum;
if (Number.isNaN(gueltigAb.getTime())) abbruch(`Kein gültiges Datum: ${gueltigAbRoh}`);

let inhalt: string;
try {
  inhalt = readFileSync(datei, "utf8");
} catch {
  abbruch(`Die Datei ${datei} liess sich nicht lesen.`);
}

if (inhalt.trim().length === 0) abbruch("Die Datei ist leer.");

const neu = await fassungAnlegen(art as Rechtstextart, inhalt, datum, gueltigAb);

console.log(`\n✓ ${ARTNAME[art as Rechtstextart]} — Version ${neu.version} angelegt.`);
console.log(`  Stand:     ${datumRoh}`);
console.log(`  Gültig ab: ${gueltigAb.toISOString().slice(0, 10)}`);
console.log(`  Zeichen:   ${inhalt.length}`);
console.log(`  Kennung:   ${neu.id}\n`);
console.log("Bestehende Fassungen bleiben unverändert — sie werden von");
console.log("Buchungen referenziert, die unter ihnen zustande kamen.\n");

await db.$disconnect();
