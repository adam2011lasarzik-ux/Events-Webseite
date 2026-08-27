/* Wie breit ist die große Wortmarke, und wie viel Platz hat sie? */
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    const marke = document.querySelector('[class*="grosseMarke"] [class*="marke"]');
    const halter = document.querySelector('[class*="grosseMarke"]');
    const s = getComputedStyle(marke);
    return {
      schrift: Math.round(parseFloat(s.fontSize) * 10) / 10,
      markeBreit: Math.round(marke.getBoundingClientRect().width),
      platz: Math.round(halter.getBoundingClientRect().width),
    };
  });
  const ueber = d.markeBreit - d.platz;
  console.log(`${String(w).padStart(5)}px → Schrift ${String(d.schrift).padStart(6)}px, Marke ${String(d.markeBreit).padStart(5)}px, Platz ${String(d.platz).padStart(5)}px  ${ueber > 1 ? `✗ ${ueber}px abgeschnitten` : "✓ passt"}`);
  await ctx.close();
}
await browser.close();
