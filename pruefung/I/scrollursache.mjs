import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 375]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3213/", { waitUntil: "networkidle" });
  const info = await page.evaluate(() => {
    const d = document.documentElement;
    const raus = [];
    for (const el of [d, document.body, ...document.querySelectorAll("body *")]) {
      if (el.scrollWidth > el.clientWidth + 1) {
        const s = getComputedStyle(el);
        raus.push({
          tag: el.tagName, klasse: (el.className || "").toString().slice(0, 50),
          scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
          overflowX: s.overflowX, minWidth: s.minWidth, width: s.width,
        });
      }
    }
    return { clientWidth: d.clientWidth, raus: raus.slice(0, 10) };
  });
  console.log(`\n=== ${w}px (sichtbar ${info.clientWidth}) ===`);
  for (const t of info.raus)
    console.log(`  ${t.tag}.${t.klasse} — scrollWidth ${t.scrollWidth}, clientWidth ${t.clientWidth}, overflow-x ${t.overflowX}, min-width ${t.minWidth}, width ${t.width}`);
  await ctx.close();
}
await browser.close();
