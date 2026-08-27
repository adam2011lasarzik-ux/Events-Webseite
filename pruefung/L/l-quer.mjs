/* Handy im Querformat und andere flache Fenster.

   Der Premium-Kopfbereich rechnet mit svh (Anteil der Fensterhöhe).
   Bei einem flachen Fenster wird er entsprechend flach — passt der
   Text dann noch hinein? Das prüft die normale Messung nicht, weil sie
   nur hohe Fenster benutzt. */
import { chromium } from "playwright";
import { MESSUNG } from "./messung.mjs";

const FENSTER = [
  ["iPhone quer",        844, 390],
  ["iPhone SE quer",     667, 375],
  ["kleines Fenster",    900, 500],
  ["iPad quer",         1180, 820],
  ["sehr flach",        1280, 360],
];
const SEITEN = [
  ["Standard", "/events/padel-falkensee"],
  ["Business", "/events/probe-business"],
  ["Premium",  "/events/probe-premium"],
  ["Premium Anmeldung", "/events/probe-premium/anmeldung"],
  ["Startseite", "/"],
];

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1; console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [fname, breite, hoehe] of FENSTER) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const page = await ctx.newPage();
  for (const [sname, pfad] of SEITEN) {
    await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("video").forEach((v) => v.pause()));
    const funde = await page.evaluate(MESSUNG);
    const schlimm = funde.filter((f) => f.art !== "schrift-klein" && f.art !== "tippziel-eng");
    pruefe(`${fname} (${breite}×${hoehe}) · ${sname}`, schlimm.length === 0,
      schlimm.slice(0, 2).map((f) => `${f.art} ${f.text ?? f.eins ?? ""}`).join(" · "));
  }
  await ctx.close();
}
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
