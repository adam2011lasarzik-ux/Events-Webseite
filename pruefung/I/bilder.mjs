/* Bildschirmfotos aller betroffenen Seiten.
   Aufruf: node bilder.mjs <port> <zielordner> */
import { chromium } from "playwright";
import fs from "node:fs";
const [, , port, ordner] = process.argv;
const BASIS = `http://127.0.0.1:${port}`;
const AUS = `pruefung/.ausgabe/I/${ordner}`;
fs.mkdirSync(AUS, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const seiten = [
  ["standard", "/events/padel-falkensee"],
  ["business", "/events/probe-business"],
  ["premium", "/events/probe-premium"],
  ["detail", "/event/padel-falkensee"],
  ["start", "/"],
];
for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  for (const [name, pfad] of seiten) {
    await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("video").forEach((v) => { v.pause(); v.currentTime = 0; }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${AUS}/${name}-${g.name}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log("Bilder in", AUS);
