import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3213/events/padel-falkensee/anmeldung", { waitUntil: "networkidle" });
const r = await page.evaluate(() => {
  const d = document.documentElement;
  const zu = [];
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT","STYLE"].includes(el.tagName)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) continue;
    if (rect.right <= d.clientWidth + 1) continue;
    // Nur die TIEFSTEN: kein Kind ragt ebenfalls hinaus
    const kindRagt = [...el.children].some((k) => k.getBoundingClientRect().right > d.clientWidth + 1);
    if (kindRagt) continue;
    const s = getComputedStyle(el);
    zu.push({ tag: el.tagName, klasse: (el.className||"").toString().slice(0,50),
      breite: Math.round(rect.width), minWidth: s.minWidth, width: s.width, display: s.display,
      text: (el.textContent||"").trim().slice(0,45) });
  }
  return zu.slice(0, 10);
});
for (const t of r) console.log(`${t.tag}.${t.klasse}\n    breit ${t.breite}, min-width ${t.minWidth}, width ${t.width}, display ${t.display}\n    „${t.text}“`);
await browser.close();
