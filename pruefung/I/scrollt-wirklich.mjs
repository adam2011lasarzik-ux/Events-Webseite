import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 375]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    window.scrollTo(9999, 0);
    const x = window.scrollX;
    const h = document.querySelector("h1").getBoundingClientRect();
    return { scrollX: x, h1Rechts: Math.round(h.right), sichtbar: document.documentElement.clientWidth };
  });
  console.log(`${w}px → tatsächlich seitwärts gescrollt: ${d.scrollX}px; H1-Kasten endet bei ${d.h1Rechts}, sichtbar ${d.sichtbar}`);
  await ctx.close();
}
await browser.close();
