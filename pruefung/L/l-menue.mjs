/* Das aufgeklappte Mobil-Menü — es steht in keinem Seitenaufruf offen
   und wäre in der normalen Messung deshalb nie geprüft worden. */
import { chromium } from "playwright";
import { MESSUNG } from "./messung.mjs";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1; console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

for (const breite of [320, 360, 390, 430, 640, 768, 820, 960]) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: 700 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/events/probe-premium", { waitUntil: "networkidle" });
  const knopf = page.locator("button", { hasText: /Menü|Menu/ }).first();
  const alternativ = page.locator("header button").first();
  const ziel = (await knopf.count()) ? knopf : alternativ;
  if (!(await ziel.count()) || !(await ziel.isVisible())) {
    console.log(`— ${breite} px: kein Menüknopf (Vollnavigation)`);
    await ctx.close();
    continue;
  }
  await ziel.click({ force: true });
  await page.waitForTimeout(250);

  const funde = await page.evaluate(MESSUNG);
  const schlimm = funde.filter((f) => f.art !== "schrift-klein");
  pruefe(`Menü offen bei ${breite} px: keine Fehler`, schlimm.length === 0,
    schlimm.slice(0, 3).map((f) => f.art + " " + (f.text ?? f.eins ?? "")).join(" · "));

  const links = await page.evaluate(() => {
    const l = [...document.querySelectorAll("header a")].filter((a) => a.getBoundingClientRect().height > 0);
    return l.map((a) => ({ text: a.textContent.trim().slice(0, 20),
      hoch: Math.round(a.getBoundingClientRect().height),
      breit: Math.round(a.getBoundingClientRect().width) }));
  });
  const zuKlein = links.filter((l) => l.hoch < 24);
  pruefe(`Menü offen bei ${breite} px: Einträge groß genug`, zuKlein.length === 0,
    zuKlein.length ? zuKlein.map((l) => `„${l.text}" ${l.breit}×${l.hoch}` ).join(", ") : `${links.length} Einträge`);
  await ctx.close();
}
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) process.exit(1);
