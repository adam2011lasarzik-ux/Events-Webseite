import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const b of [320, 340, 360, 375, 390, 414, 430, 500, 640, 768, 900, 1024, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/faq", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("mitzu"));
    const r = document.createRange(); r.selectNodeContents(h);
    const zeilen = [...r.getClientRects()].filter((x) => x.width > 1);
    return { zeilen: zeilen.length, text: zeilen.map((z) => Math.round(z.width)).join("+"),
             kasten: Math.round(h.getBoundingClientRect().width) };
  });
  console.log(String(b).padStart(5), JSON.stringify(d));
  await ctx.close();
}
await browser.close();
