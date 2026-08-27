import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3213/events/padel-falkensee/anmeldung", { waitUntil: "networkidle" });
const r = await page.evaluate(() => {
  let el = document.querySelector('[class*="summe"][class*="aufDunkel"]');
  const kette = [];
  while (el && el.tagName !== "HTML") {
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    kette.push(`${el.tagName}.${(el.className||"").toString().slice(0,45)} — ${Math.round(rect.width*100)/100}px, links ${Math.round(rect.left)}, display ${s.display}, width ${s.width}, minWidth ${s.minWidth}, padding ${s.padding}`);
    el = el.parentElement;
  }
  return kette;
});
console.log(r.join("\n"));
await browser.close();
