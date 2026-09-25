/* ---------------------------------------------------------------
   Prüfliste X2 · Die flüchtige Bremse

   Reine Regeln, kein Netz, keine Datenbank — und das ist hier der
   eigentliche Punkt: Diese Bremse existiert, WEIL vor einer Zahlung
   nichts in die Datenbank geschrieben werden darf (Entscheidung vom
   25.09.2026). Eine Prüfung, die dafür eine Datenbank bräuchte, hätte
   die Sache verfehlt.
   --------------------------------------------------------------- */

import {
  versuchErlaubt,
  bremseLeeren,
  bremseGroesse,
  MAX_VERSUCHE,
  FENSTER_MINUTEN,
  MAX_SCHLUESSEL,
} from "../../lib/bremseFluechtig.ts";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name, zusatz); }
};

const T0 = 1_790_000_000_000;

console.log("\nX2.1 · Zählen und abweisen");
bremseLeeren();
const ergebnisse = [];
for (let i = 0; i < MAX_VERSUCHE + 3; i++) ergebnisse.push(versuchErlaubt("a", MAX_VERSUCHE, FENSTER_MINUTEN, T0));
pruefe(`Die ersten ${MAX_VERSUCHE} Versuche sind erlaubt`,
  ergebnisse.slice(0, MAX_VERSUCHE).every((e) => e === true));
pruefe("Danach wird abgewiesen",
  ergebnisse.slice(MAX_VERSUCHE).every((e) => e === false), JSON.stringify(ergebnisse));

console.log("\nX2.2 · Abgewiesene Versuche verlängern die Sperre NICHT");
/* Sonst käme, wer einmal zu oft getippt hat, eine Stunde lang nicht
   mehr hinein — dieselbe Regel wie in lib/ratelimit.ts. */
bremseLeeren();
for (let i = 0; i < MAX_VERSUCHE; i++) versuchErlaubt("b", MAX_VERSUCHE, 60, T0);
for (let i = 0; i < 50; i++) versuchErlaubt("b", MAX_VERSUCHE, 60, T0 + 1000);
pruefe("Nach Ablauf des Fensters geht es wieder",
  versuchErlaubt("b", MAX_VERSUCHE, 60, T0 + 61 * 60_000) === true);

console.log("\nX2.3 · Schlüssel sind voneinander unabhängig");
bremseLeeren();
for (let i = 0; i < MAX_VERSUCHE; i++) versuchErlaubt("c", MAX_VERSUCHE, 60, T0);
pruefe("Ein erschöpfter Schlüssel ist erschöpft",
  versuchErlaubt("c", MAX_VERSUCHE, 60, T0) === false);
pruefe("… ein anderer aber nicht", versuchErlaubt("d", MAX_VERSUCHE, 60, T0) === true);

console.log("\nX2.4 · Das Zeitfenster gleitet");
bremseLeeren();
for (let i = 0; i < MAX_VERSUCHE; i++) versuchErlaubt("e", MAX_VERSUCHE, 60, T0 + i * 1000);
pruefe("Voll ist voll", versuchErlaubt("e", MAX_VERSUCHE, 60, T0 + 5000) === false);
pruefe("Eine Minute später immer noch",
  versuchErlaubt("e", MAX_VERSUCHE, 60, T0 + 60_000) === false);
pruefe("Nach dem Fenster wieder frei",
  versuchErlaubt("e", MAX_VERSUCHE, 60, T0 + 61 * 60_000) === true);

console.log("\nX2.5 · Die Karte wächst nicht unbegrenzt");
/* Die Obergrenze ist der Schutz der Bremse vor sich selbst: Ohne sie
   wäre sie mit vielen verschiedenen Adressen selbst der Angriffsweg. */
bremseLeeren();
for (let i = 0; i < MAX_SCHLUESSEL + 500; i++) {
  versuchErlaubt(`schluessel-${i}`, MAX_VERSUCHE, 60, T0 + i);
}
pruefe(`Höchstens ${MAX_SCHLUESSEL} Schlüssel bleiben stehen`,
  bremseGroesse() <= MAX_SCHLUESSEL, `${bremseGroesse()} Schlüssel`);
pruefe("Die zuletzt gesehenen Schlüssel überleben das Aufräumen",
  versuchErlaubt(`schluessel-${MAX_SCHLUESSEL + 499}`, MAX_VERSUCHE, 60, T0 + MAX_SCHLUESSEL + 600) === true);

console.log("\nX2.6 · Abgelaufene Einträge verschwinden von selbst");
bremseLeeren();
for (let i = 0; i < 50; i++) versuchErlaubt(`alt-${i}`, MAX_VERSUCHE, 60, T0);
const vorher = bremseGroesse();
for (let i = 0; i < MAX_SCHLUESSEL + 100; i++) {
  versuchErlaubt(`neu-${i}`, MAX_VERSUCHE, 60, T0 + 120 * 60_000 + i);
}
pruefe("Die alten Schlüssel sind beim Aufräumen weggefallen",
  bremseGroesse() <= MAX_SCHLUESSEL && vorher === 50, `${bremseGroesse()} übrig`);

console.log("\nX2.7 · Vergessen nach einem Neustart");
/* Nachgestellt durch frisches Laden des Moduls: Ein Neustart des
   Dienstes leert die Karte. Das ist zugelassen — der Preis dafür, dass
   nichts auf der Festplatte landet. */
bremseLeeren();
for (let i = 0; i < MAX_VERSUCHE; i++) versuchErlaubt("f", MAX_VERSUCHE, 60, T0);
pruefe("Vor dem Neustart erschöpft", versuchErlaubt("f", MAX_VERSUCHE, 60, T0) === false);
const frisch = await import("../../lib/bremseFluechtig.ts?neustart=" + Date.now());
pruefe("Nach dem Neustart wieder frei — und das ist Absicht",
  frisch.versuchErlaubt("f", MAX_VERSUCHE, 60, T0) === true);

console.log("\nX2.8 · Die Bremse schreibt nichts in die Datenbank");
/* Die Gegenprobe zur eigentlichen Anforderung: Die Datei darf lib/db
   nicht einmal kennen. Ein Import wäre die Tür, durch die eine Zeile
   doch wieder entstünde. */
const { readFileSync } = await import("node:fs");
const quelle = readFileSync(new URL("../../lib/bremseFluechtig.ts", import.meta.url), "utf8");
pruefe("lib/bremseFluechtig.ts bindet keine Datenbank ein",
  !quelle.includes("from \"./db\"") && !quelle.includes("@/lib/db"));
pruefe("… und kennt auch die Tabelle AnmeldeVersuch nicht",
  !quelle.includes("anmeldeVersuch"));

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen`);
process.exit(fehl === 0 ? 0 : 1);
