/* ---------------------------------------------------------------
   Prüfliste T · Teil 1 — die Regel selbst und ihre Verdrahtung

   Hintergrund: Entscheidung 2.5 (18.09.2026) — ohne feststehenden
   Termin darf weder gebucht noch bezahlt werden. Die Klauseln, die
   den umgekehrten Fall regelten, sind gestrichen (Dokument 07,
   Abschnitte 2.4 und 3.3); die Sperre muss die Lücke schließen.

   Dieser Teil braucht weder Datenbank noch Server.
   --------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import { terminSteht, terminStehtAnzeige } from "../../lib/termin.js";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung) => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name); }
};

const lies = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

console.log("\nT1 · Die reine Regel");
pruefe("Datenbankform: mit Datum → buchbar", terminSteht({ startAt: new Date() }) === true);
pruefe("Datenbankform: ohne Datum → gesperrt", terminSteht({ startAt: null }) === false);
pruefe("Anzeigeform: mit Datum → buchbar", terminStehtAnzeige({ datum: "2026-05-12" }) === true);
pruefe("Anzeigeform: ohne Datum → gesperrt", terminStehtAnzeige({ datum: null }) === false);

console.log("\nT2 · Die Regel steht an EINER Stelle");
const termin = lies("lib/termin.ts");
pruefe("lib/termin.ts prüft startAt", /startAt !== null/.test(termin));
pruefe("lib/termin.ts prüft datum", /datum !== null/.test(termin));

console.log("\nT3 · Verdrahtung: jede Stelle benutzt die gemeinsame Regel");
const stellen = [
  ["Serveraktion (Anmeldung anlegen)", "app/(seite)/anmeldung/aktion.ts", "terminSteht("],
  ["Zahlungsstart", "lib/zahlungStart.ts", "terminSteht("],
  ["Anmeldeseite", "app/(seite)/events/[slug]/anmeldung/page.tsx", "terminStehtAnzeige("],
  ["Hero-Knopf", "components/Hero.tsx", "terminStehtAnzeige("],
  ["Premium-Hero-Knopf", "components/HeroPremium.tsx", "terminStehtAnzeige("],
  ["Abschlussband-Knopf", "components/CtaBand.tsx", "terminStehtAnzeige("],
];
for (const [name, datei, ruf] of stellen) {
  const q = lies(datei);
  pruefe(`${name} ruft die Regel auf`, q.includes(ruf));
  pruefe(`${name} importiert aus lib/termin`, /from "@\/lib\/termin"/.test(q));
}

console.log("\nT4 · Keine eigene Kopie der Bedingung");
/* Eine zweite, handgeschriebene Prüfung wäre der Weg, auf dem die
   Regel auseinanderläuft. Gesucht wird nach startAt-Vergleichen
   ausserhalb von lib/termin.ts an genau den Stellen, die die Sperre
   tragen. */
for (const [name, datei] of stellen) {
  const q = lies(datei);
  const eigeneKopie = /startAt\s*(===|!==|==|!=)\s*null/.test(q) || /!\s*event\.startAt/.test(q);
  pruefe(`${name} hat keine eigene startAt-Prüfung`, !eigeneKopie);
}

console.log("\nT5 · Der Ablehnungsgrund ist ein fester Wert, kein Text");
const regeln = lies("lib/zahlungRegeln.ts");
pruefe('ZahlungAbgelehnt kennt "kein-termin"', /"kein-termin"/.test(regeln));
const danke = lies("app/(seite)/anmeldung/danke/page.tsx");
pruefe("Abschluss-Seite behandelt kein-termin", /kein-termin/.test(danke));
pruefe("Abschluss-Seite blendet den Bezahlknopf aus", /!keinTermin/.test(danke));
const woerter = lies("content/de.ts");
pruefe("Wörterbuch hat einen Text dafür", /zahlungKeinTermin/.test(woerter));
pruefe("Wörterbuch hat einen Text für die Anmeldeseite", /keinTerminTitel/.test(woerter));

console.log(`\nErgebnis Teil 1: ${ok} bestanden, ${fehl} durchgefallen\n`);
process.exit(fehl === 0 ? 0 : 1);
