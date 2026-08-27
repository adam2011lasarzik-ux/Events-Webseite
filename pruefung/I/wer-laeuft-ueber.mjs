/* Wer genau ragt über den sichtbaren Bereich hinaus? */
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 375, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  const info = await page.evaluate(() => {
    const d = document.documentElement;
    const treffer = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > d.clientWidth + 1) {
        // Nur den ÄUSSERSTEN Übeltäter je Zweig melden.
        treffer.push({
          tag: el.tagName,
          klasse: (el.className || "").toString().slice(0, 60),
          rechts: Math.round(r.right),
          breite: Math.round(r.width),
          eltern: (el.parentElement?.className || "").toString().slice(0, 40),
        });
      }
    }
    return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, treffer: treffer.slice(0, 8) };
  });
  console.log(`\n=== ${w}px — scrollWidth ${info.scrollWidth} ===`);
  for (const t of info.treffer) console.log(`  ${t.tag}.${t.klasse}  breit ${t.breite}, rechte Kante ${t.rechts}  (in ${t.eltern})`);
  await ctx.close();
}
await browser.close();
