import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3213/events/padel-falkensee/anmeldung", { waitUntil: "networkidle" });
const r = await page.evaluate(() => {
  const raus = [];
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;white-space:nowrap;visibility:hidden";
  document.body.appendChild(probe);
  for (const el of document.querySelectorAll("body *")) {
    if (el.children.length > 0) continue;           // nur Blätter
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) continue;
    const s = getComputedStyle(el);
    for (const eig of ["fontFamily","fontSize","fontWeight","fontStretch","letterSpacing"]) probe.style[eig] = s[eig];
    for (const wort of (el.textContent || "").split(/\s+/).filter(Boolean)) {
      probe.textContent = wort;
      const b = probe.getBoundingClientRect().width;
      if (b > 150) raus.push({ wort, breite: Math.round(b), tag: el.tagName });
    }
  }
  probe.remove();
  return raus.sort((a, b) => b.breite - a.breite).slice(0, 10);
});
for (const t of r) console.log(`${String(t.breite).padStart(4)}px  ${t.tag}  „${t.wort}“`);
await browser.close();
