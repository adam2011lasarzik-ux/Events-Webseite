import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [pfad, teil] of [["/event/probe-business", "Unternehmerabend"], ["/", "Unternehmerabend"], ["/fuer-schulen", "Schulklassen"]]) {
  for (const b of [320, 360, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
    const d = await page.evaluate((teil) => {
      const el = [...document.querySelectorAll("h1,h3")].find((e) => e.textContent.includes(teil));
      if (!el) return null;
      const st = getComputedStyle(el);
      const kn = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.includes(teil));
      const i = kn.textContent.indexOf(teil);
      const r = document.createRange(); r.setStart(kn, i); r.setEnd(kn, i + teil.length);
      const alt = el.getAttribute("style") || "";
      el.style.width = "3000px"; el.style.maxWidth = "none";
      const r2 = document.createRange(); r2.setStart(kn, i); r2.setEnd(kn, i + teil.length);
      const wort = Math.round(r2.getBoundingClientRect().width);
      el.setAttribute("style", alt);
      const eltern = el.parentElement;
      return { tag: el.tagName, kasten: Math.round(el.getBoundingClientRect().width),
               eltern: eltern.tagName + " " + Math.round(eltern.getBoundingClientRect().width),
               schrift: st.fontSize, maxWidth: st.maxWidth, wort };
    }, teil);
    console.log(pfad.padEnd(24), String(b).padStart(4), JSON.stringify(d));
    await ctx.close();
  }
}
await browser.close();
