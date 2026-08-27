import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const b of [320, 360, 390]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/", { waitUntil: "networkidle" });
  const karte = page.locator("article").filter({ hasText: "Unternehmerabend" }).first();
  if (await karte.count()) {
    await karte.screenshot({ path: `pruefung/.ausgabe/L/karte-${b}.png` });
    console.log(b + " px aufgenommen");
  } else { console.log(b + " px: Karte nicht gefunden"); }
  await ctx.close();
}
await browser.close();
