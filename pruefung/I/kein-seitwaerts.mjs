/* Auf KEINER Seite und in KEINER Breite darf sich die Seite seitwärts
   schieben lassen. Gemessen wird das tatsächliche Scrollen, nicht nur
   scrollWidth — body hat overflow-x: hidden, das täuscht sonst. */
import { chromium } from "playwright";
const seiten = ["/", "/events/padel-falkensee", "/events/probe-business", "/events/probe-premium",
  "/event/padel-falkensee", "/events/padel-falkensee/anmeldung", "/fuer-schulen", "/ueber-vera",
  "/faq", "/kontakt", "/impressum", "/datenschutz"];
const breiten = [320, 344, 360, 375, 390, 402, 414, 428, 430, 768, 810, 820, 1024, 1180, 1280, 1440, 1920];
let n = 0; const schief = [];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of breiten) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  let schlimmster = 0, wo = "";
  for (const pfad of seiten) {
    await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
    const x = await page.evaluate(() => { window.scrollTo(9999, 0); return window.scrollX; });
    n += 1;
    if (x > 0) { schief.push(`${pfad} @ ${w}px (${x}px)`); if (x > schlimmster) { schlimmster = x; wo = pfad; } }
  }
  console.log(`${schlimmster === 0 ? "✓" : "✗"} ${w}px — ${seiten.length} Seiten` + (schlimmster ? `, schlimmster Fall ${wo} mit ${schlimmster}px` : ", nichts schiebt sich seitwärts"));
  await ctx.close();
}
await browser.close();
console.log(`\n${n - schief.length} von ${n} Kombinationen in Ordnung.`);
if (schief.length) { console.log(schief.join("\n")); process.exit(1); }
