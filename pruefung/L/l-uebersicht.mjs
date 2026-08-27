/* Übersichtsbilder: die drei Designs auf vier Gerätegrößen. */
import { chromium } from "playwright";
import fs from "node:fs";
const AUS = "pruefung/.ausgabe/L/uebersicht";
fs.mkdirSync(AUS, { recursive: true });

const GERAETE = [
  ["smartphone", 390, 844],
  ["tablet",     768, 1024],
  ["laptop",     1024, 768],
  ["desktop",    1440, 900],
];
const DESIGNS = [
  ["standard", "/events/padel-falkensee"],
  ["business", "/events/probe-business"],
  ["premium",  "/events/probe-premium"],
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [gname, breite, hoehe] of GERAETE) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const page = await ctx.newPage();
  for (const [dname, pfad] of DESIGNS) {
    await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("video").forEach((v) => { v.pause(); v.currentTime = 0; }));
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${AUS}/${dname}-${gname}.png`, fullPage: true });
  }
  console.log(`· ${gname} (${breite}×${hoehe})`);
  await ctx.close();
}
await browser.close();
console.log("Bilder in", AUS);
