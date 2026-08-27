import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3213/events/padel-falkensee/anmeldung", { waitUntil: "networkidle" });
const r = await page.evaluate(() => {
  const form = document.querySelector('form[class*="rechner"]');
  const raus = [];
  for (const el of [...form.children, ...form.querySelectorAll("*")]) {
    const alt = el.style.width;
    el.style.width = "min-content";
    const mc = el.getBoundingClientRect().width;
    el.style.width = alt;
    raus.push({ tag: el.tagName, klasse: (el.className||"").toString().slice(0,40),
      minContent: Math.round(mc*100)/100, text: (el.textContent||"").trim().slice(0,28) });
  }
  return raus.sort((a,b)=>b.minContent-a.minContent).slice(0,10);
});
for (const t of r) console.log(`${String(t.minContent).padStart(8)}  ${t.tag}.${t.klasse}  „${t.text}“`);
await browser.close();
