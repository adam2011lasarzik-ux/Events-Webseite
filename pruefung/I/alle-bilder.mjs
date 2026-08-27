/* Alle öffentlichen Seiten in fünf Breiten. Aufruf: node alle-bilder.mjs <ordner> */
import { chromium } from "playwright";
import fs from "node:fs";
const AUS = `pruefung/.ausgabe/FIX/${process.argv[2]}`;
fs.mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const seiten = [
  ["start", "/"], ["standard", "/events/padel-falkensee"], ["business", "/events/probe-business"],
  ["premium", "/events/probe-premium"], ["detail", "/event/padel-falkensee"],
  ["anmeldung", "/events/padel-falkensee/anmeldung"], ["schulen", "/fuer-schulen"],
  ["ueber", "/ueber-vera"], ["faq", "/faq"], ["kontakt", "/kontakt"],
];
for (const g of [
  { name: "320", width: 320, height: 720 }, { name: "375", width: 375, height: 812 },
  { name: "handy", width: 390, height: 844 }, { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  for (const [name, pfad] of seiten) {
    await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("video").forEach((v) => { v.pause(); v.currentTime = 0; }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${AUS}/${name}-${g.name}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log("Bilder in", AUS);
