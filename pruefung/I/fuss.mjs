import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  await page.locator("footer").screenshot({ path: `pruefung/.ausgabe/FIX/fuss-${w}.png` });
  await ctx.close();
}
await browser.close();
console.log("ok");
