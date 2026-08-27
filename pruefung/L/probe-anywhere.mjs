/* Hypothese prüfen, BEVOR etwas geändert wird:
   Löst `overflow-wrap: anywhere` an Überschriften den Überlauf? */
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [pfad, name] of [["/event/probe-business", "Business Detail"], ["/events/probe-business", "Business Event"]]) {
  for (const breite of [320, 360, 375, 390]) {
    const ctx = await browser.newContext({ viewport: { width: breite, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
    const vorher = await page.evaluate(() => { window.scrollTo(9999, 0); return window.scrollX; });
    await page.addStyleTag({ content: "h1,h2,h3,h4{overflow-wrap:anywhere}" });
    await page.waitForTimeout(120);
    const nachher = await page.evaluate(() => { window.scrollTo(9999, 0); return window.scrollX; });
    const h1 = await page.evaluate(() => {
      const el = document.querySelector("h1");
      const r = el.getBoundingClientRect();
      return { breit: Math.round(r.width), zeilen: Math.round(r.height / parseFloat(getComputedStyle(el).lineHeight || "1")) };
    });
    console.log(`${name} ${breite}px: vorher ${vorher} px seitwärts → nachher ${nachher} px  (H1 ${h1.breit} breit)`);
    await ctx.close();
  }
}
await browser.close();
