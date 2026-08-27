import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 360, 375, 390, 414]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    const h = document.querySelector("h1");
    const s = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    // Breite des längsten Wortes einzeln messen.
    const probe = document.createElement("span");
    probe.textContent = "Veranstaltungen";
    probe.style.cssText = `position:absolute;white-space:nowrap;font:${s.font};letter-spacing:${s.letterSpacing};font-stretch:${s.fontStretch};font-family:${s.fontFamily};font-size:${s.fontSize};font-weight:${s.fontWeight}`;
    document.body.appendChild(probe);
    const wort = probe.getBoundingClientRect().width;
    probe.remove();
    return {
      text: h.textContent, fontSize: s.fontSize, kasten: Math.round(r.width),
      inhalt: h.scrollWidth, wort: Math.round(wort), zeilen: Math.round(r.height / parseFloat(s.lineHeight || "0") || 0),
      seite: document.documentElement.scrollWidth,
    };
  });
  console.log(`${w}px → Schriftgröße ${d.fontSize}, Kasten ${d.kasten}, Textbreite ${d.inhalt}, Wort „Veranstaltungen" ${d.wort}, Seite scrollt bis ${d.seite}`);
  await ctx.close();
}
await browser.close();
