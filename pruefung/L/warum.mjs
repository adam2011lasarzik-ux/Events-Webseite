/* Wer genau macht die Seite breiter als das Fenster? */
import { chromium } from "playwright";
const [, , pfad, breiteRoh] = process.argv;
const breite = Number(breiteRoh ?? 320);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: breite, height: 844 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
const r = await page.evaluate(() => {
  const d = document.documentElement;
  const raus = [];
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT","STYLE"].includes(el.tagName)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= d.clientWidth + 1) continue;
    // nur die TIEFSTEN: kein Kind ragt ebenfalls hinaus
    const kindRagt = [...el.children].some((k) => k.getBoundingClientRect().right > d.clientWidth + 1);
    if (kindRagt) continue;
    const s = getComputedStyle(el);
    const probe = () => { const alt = el.style.width; el.style.width = "min-content";
      const mc = el.getBoundingClientRect().width; el.style.width = alt; return Math.round(mc); };
    raus.push({ tag: el.tagName, klasse: (el.className||"").toString().slice(0,55),
      breit: Math.round(rect.width), rechts: Math.round(rect.right),
      minContent: probe(), minWidth: s.minWidth, width: s.width, display: s.display,
      text: (el.textContent||"").trim().slice(0,40) });
  }
  return { sichtbar: d.clientWidth, scrollX: (window.scrollTo(9999,0), window.scrollX), raus: raus.slice(0,8) };
});
console.log(`Fenster ${r.sichtbar}, seitwärts schiebbar um ${r.scrollX} px\n`);
for (const t of r.raus) {
  console.log(`${t.tag}.${t.klasse}`);
  console.log(`   breit ${t.breit}, rechte Kante ${t.rechts}, min-content ${t.minContent}, min-width ${t.minWidth}, display ${t.display}`);
  console.log(`   „${t.text}"\n`);
}
await browser.close();
