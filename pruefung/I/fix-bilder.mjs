/* Startseite in vier Breiten — vor und nach dem 360-Pixel-Fix. */
import { chromium } from "playwright";
import fs from "node:fs";
const AUS = `pruefung/.ausgabe/FIX/${process.argv[2]}`;
fs.mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const g of [
  { name: "320", width: 320, height: 720 },
  { name: "375", width: 375, height: 812 },
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  console.log(`${g.name}: scrollWidth ${d.scrollWidth}, sichtbar ${d.clientWidth}` +
    (d.scrollWidth > d.clientWidth + 1 ? "  ← scrollt seitwärts" : ""));
  await page.screenshot({ path: `${AUS}/start-${g.name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
