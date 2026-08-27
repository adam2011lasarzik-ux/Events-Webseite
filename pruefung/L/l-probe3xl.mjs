/* Vorher messen, ohne Code zu ändern: Was macht die neue Formel? */
import { chromium } from "playwright";
const NEU = ":root { --gr-3xl: clamp(2rem, min(1.5rem + 4.4vw, 0.7rem + 6.2vw), 4.3rem); }";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
console.log("Breite | Schrift alt → neu | Zeilen alt → neu (h1)");
for (const b of [320, 340, 360, 375, 390, 414, 430, 500, 640, 768, 900, 1024, 1280, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/event/probe-business", { waitUntil: "networkidle" });
  const mess = () => {
    const h = document.querySelector("h1");
    const kn = [...h.childNodes].find((n) => n.nodeType === 3);
    const i = kn.textContent.indexOf("Unternehmerabend");
    const r = document.createRange(); r.setStart(kn, i); r.setEnd(kn, i + 16);
    const zeilen = new Set([...r.getClientRects()].filter((x) => x.width > 0.5).map((x) => Math.round(x.top))).size;
    const g = document.createRange(); g.selectNodeContents(h);
    return { px: +getComputedStyle(h).fontSize.replace("px", "").slice(0, 5),
             wortZeilen: zeilen,
             hoehe: Math.round(h.getBoundingClientRect().height) };
  };
  const alt = await page.evaluate(mess);
  const neu = await page.evaluate((css) => {
    const s = document.createElement("style"); s.textContent = css; document.head.append(s);
    const h = document.querySelector("h1");
    const kn = [...h.childNodes].find((n) => n.nodeType === 3);
    const i = kn.textContent.indexOf("Unternehmerabend");
    const r = document.createRange(); r.setStart(kn, i); r.setEnd(kn, i + 16);
    const zeilen = new Set([...r.getClientRects()].filter((x) => x.width > 0.5).map((x) => Math.round(x.top))).size;
    return { px: +getComputedStyle(h).fontSize.replace("px", "").slice(0, 5), wortZeilen: zeilen,
             hoehe: Math.round(h.getBoundingClientRect().height) };
  }, NEU);
  const flag = neu.wortZeilen > 1 ? "  ⚠ bricht noch" : "";
  console.log(String(b).padStart(5), "|", String(alt.px).padStart(5), "→", String(neu.px).padStart(5),
    "|", alt.wortZeilen, "→", neu.wortZeilen, "| Höhe", alt.hoehe, "→", neu.hoehe, flag);
  await ctx.close();
}
await browser.close();
