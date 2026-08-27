import { chromium } from "playwright";
import fs from "node:fs";
const AUS = "pruefung/.ausgabe/L/bruch";
fs.mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, pfad, b, teil] of [
  ["nachher-start-h1-320", "/", 320, "Unsere"],
  ["nachher-karte-1440", "/", 1440, "Unternehmerabend"],
  ["nachher-karte-800", "/", 800, "Unternehmerabend"],
  ["nachher-detail-1024", "/event/probe-business", 1024, "Unternehmerabend"],
  ["nachher-detail-390", "/event/probe-business", 390, "Unternehmerabend"],
  ["nachher-cta-320", "/faq", 320, "mitzumachen"],
  ["nachher-ablauf-850", "/events/padel-falkensee", 850, "Ankommen"],
  ["nachher-schulen-320", "/fuer-schulen", 320, "Schulklassen"],
]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
  const k = await page.evaluate((teil) => {
    const el = [...document.querySelectorAll("h1,h2,h3")].find((e) => e.textContent.includes(teil));
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(r.width + 20, innerWidth), height: r.height + 20 };
  }, teil);
  await page.screenshot({ path: `${AUS}/${name}.png`, clip: k });
  await ctx.close();
}
await browser.close(); console.log("fertig");
