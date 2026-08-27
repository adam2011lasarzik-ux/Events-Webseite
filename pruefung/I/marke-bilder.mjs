/* Bildschirmfotos für den Wortmarken-Vergleich.
   Aufruf: node marke-bilder.mjs <ordner> */
import { chromium } from "playwright";
import fs from "node:fs";
const AUS = `pruefung/.ausgabe/MARKE/${process.argv[2]}`;
fs.mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const seiten = [["start", "/"], ["standard", "/events/padel-falkensee"], ["premium", "/events/probe-premium"],
  ["anmeldung", "/events/padel-falkensee/anmeldung"], ["faq", "/faq"]];
for (const g of [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: g, height: 800 } });
  const page = await ctx.newPage();
  for (const [name, pfad] of seiten) {
    await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("video").forEach((v) => { v.pause(); v.currentTime = 0; }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${AUS}/${name}-${g}.png`, fullPage: true });
    if (name === "start") await page.locator("footer").screenshot({ path: `${AUS}/fuss-${g}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log("fertig:", AUS);
