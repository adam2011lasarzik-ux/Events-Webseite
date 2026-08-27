import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [w, pfad, name] of [[390, "/", "start-390"], [320, "/fuer-schulen", "schulen-320"], [320, "/", "start-320"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
  await page.locator("main section").first().screenshot({
    path: `pruefung/.ausgabe/FIX/kopf-${name}.png` });
  await ctx.close();
}
await browser.close(); console.log("ok");
