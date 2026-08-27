import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3249/events/padel-falkensee", { waitUntil: "networkidle" });
console.log(await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map((h) => ({
  t: h.textContent.trim().slice(0, 26), px: getComputedStyle(h).fontSize,
  kasten: Math.round(h.getBoundingClientRect().width),
  hoehe: Math.round(h.getBoundingClientRect().height),
}))));
await browser.close();
