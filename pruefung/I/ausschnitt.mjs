/* Nur den Gründerbereich fotografieren — sonst sieht man auf einer
   6000 px hohen Seite nichts. */
import { chromium } from "playwright";
import fs from "node:fs";
const AUS = "pruefung/.ausgabe/I/bereich";
fs.mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const seiten = [
  ["start", "/"],
  ["standard", "/events/padel-falkensee"],
  ["business", "/events/probe-business"],
  ["premium", "/events/probe-premium"],
];
for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  for (const [name, pfad] of seiten) {
    await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
    const bereich = page.locator("#gruender");
    if ((await bereich.count()) === 0) { console.log(`${name}/${g.name}: kein Bereich`); continue; }
    await bereich.screenshot({ path: `${AUS}/${name}-${g.name}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log("fertig");
