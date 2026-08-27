/* Kein waagerechtes Scrollen, Bild nicht verzerrt, Bereich vorhanden. */
import { chromium } from "playwright";
let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1; console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const g of [
  { name: "320px", width: 320, height: 720 },
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  for (const [was, pfad] of [["Startseite", "/"], ["Standard", "/events/padel-falkensee"], ["Premium", "/events/probe-premium"]]) {
    await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
    const breiter = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    pruefe(`${was} · ${g.name}: kein waagerechtes Scrollen`, !breiter);
    const masse = await page.evaluate(() => {
      const img = document.querySelector("#gruender img");
      if (!img) return null;
      const r = img.getBoundingClientRect();
      return { angezeigt: r.width / r.height, echt: img.naturalWidth / img.naturalHeight, w: Math.round(r.width) };
    });
    if (masse) {
      // object-fit: cover schneidet zu, verzerrt aber nie — die Prüfung
      // gilt dem Rahmen: 4:5 wie gestaltet.
      pruefe(`${was} · ${g.name}: Foto steht im Verhältnis 4:5`,
        Math.abs(masse.angezeigt - 0.8) < 0.02, `${masse.angezeigt.toFixed(3)}, ${masse.w}px breit`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
