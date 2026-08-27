import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const messe = async (pfad, teil, breiten) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
  for (const b of breiten) {
    await page.setViewportSize({ width: b, height: 900 });
    const d = await page.evaluate((teil) => {
      const el = [...document.querySelectorAll("h1,h2,h3")].find((e) => e.textContent.trim() === teil || e.textContent.includes(teil));
      const p = el.parentElement;
      const st = getComputedStyle(el);
      const alt = el.getAttribute("style") || "";
      el.style.width = "4000px"; el.style.maxWidth = "none";
      const kn = [...el.childNodes].find((n) => n.nodeType === 3);
      const i = kn.textContent.indexOf(teil);
      const r = document.createRange(); r.setStart(kn, i); r.setEnd(kn, i + teil.length);
      const wort = Math.round(r.getBoundingClientRect().width);
      el.setAttribute("style", alt);
      const kasten = Math.round(el.getBoundingClientRect().width);
      const f = parseFloat(st.fontSize);
      return { kasten, wort, f: Math.round(f * 10) / 10,
               noetig: Math.round(f * kasten / wort * 10) / 10,
               cqiNoetig: Math.round((f * kasten / wort) / kasten * 1000) / 10,
               eltern: p.className.split("_").pop() + " " + Math.round(p.getBoundingClientRect().width) };
    }, teil);
    console.log(pfad.padEnd(26), String(b).padStart(5), JSON.stringify(d));
  }
  await ctx.close();
};
await messe("/", "Unternehmerabend", [320, 340, 720, 800, 880, 1080, 1200, 1440, 1920]);
await messe("/events/padel-falkensee", "Ankommen", [820, 840, 860, 900, 1200]);
await messe("/event/probe-business", "Unternehmerabend", [1000, 1024, 1100, 1200, 1280]);
await browser.close();
