import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const b of [320, 360, 375, 390]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/faq", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("mitzumachen"));
    const st = getComputedStyle(h);
    const r = document.createElement("span");
    r.textContent = "mitzumachen?";
    r.style.cssText = `position:absolute;white-space:nowrap;visibility:hidden;font:${st.font};font-stretch:${st.fontStretch};letter-spacing:${st.letterSpacing}`;
    h.after(r);
    const wortBreite = r.getBoundingClientRect().width;
    r.remove();
    return { kasten: h.getBoundingClientRect().width, schrift: st.fontSize, wortBreite: Math.round(wortBreite),
             lang: document.documentElement.lang, hoehe: h.getBoundingClientRect().height };
  });
  console.log(b, JSON.stringify(d));
  await ctx.close();
}
await browser.close();
