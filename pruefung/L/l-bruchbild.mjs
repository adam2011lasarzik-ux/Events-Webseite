import { chromium } from "playwright";
import fs from "node:fs";
const AUS = "pruefung/.ausgabe/L/bruch";
fs.mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, pfad, b, teil] of [
  ["business-detail-390", "/event/probe-business", 390, "Unternehmerabend"],
  ["business-detail-320", "/event/probe-business", 320, "Unternehmerabend"],
  ["cta-320", "/faq", 320, "mitzumachen"],
  ["start-karte-320", "/", 320, "Unternehmerabend"],
  ["schulen-320", "/fuer-schulen", 320, "Schulklassen"],
]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
  const kasten = await page.evaluate((teil) => {
    const el = [...document.querySelectorAll("h1,h2,h3")].find((e) => e.textContent.includes(teil));
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - 8), y: r.y - 8, width: Math.min(r.width + 16, innerWidth), height: r.height + 16 };
  }, teil);
  await page.screenshot({ path: `${AUS}/${name}.png`, clip: kasten });
  await ctx.close();
}
await browser.close();
console.log("fertig");
