import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3213/events/padel-falkensee/anmeldung", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const d = document.documentElement;
  const raus = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > d.clientWidth + 1) raus.push({
      tag: el.tagName, klasse: (el.className || "").toString().slice(0, 55),
      breite: Math.round(r.width), rechts: Math.round(r.right), text: (el.textContent || "").trim().slice(0, 30),
    });
  }
  return raus.slice(0, 8);
});
for (const t of info) console.log(`${t.tag}.${t.klasse} — breit ${t.breite}, rechte Kante ${t.rechts}  „${t.text}“`);
await browser.close();
