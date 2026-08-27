import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const b of [320, 340, 360, 375]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/faq", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("mitzumachen"));
    const kn = h.firstChild;               // Textknoten
    const txt = kn.textContent;
    const i = txt.indexOf("mitzumachen?");
    const r = document.createRange(); r.setStart(kn, i); r.setEnd(kn, i + 12);
    const rechtecke = [...r.getClientRects()].map((x) => Math.round(x.width));
    // Wie breit wäre das Wort in EINER Zeile? Über die Summe der Buchstaben schätzen ist
    // ungenau — stattdessen den Kasten kurz weit machen und erneut messen.
    const alt = h.style.cssText;
    h.style.width = "2000px"; h.style.maxWidth = "none";
    const r2 = document.createRange(); r2.setStart(kn, i); r2.setEnd(kn, i + 12);
    const ganz = Math.round(r2.getBoundingClientRect().width);
    h.style.cssText = alt;
    return { kasten: Math.round(h.getBoundingClientRect().width), zeilen: rechtecke, wortGanz: ganz,
             schrift: getComputedStyle(h).fontSize };
  });
  console.log(b, JSON.stringify(d));
  await ctx.close();
}
await browser.close();
