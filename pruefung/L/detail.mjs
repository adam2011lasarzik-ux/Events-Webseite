import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

// 1. Der abgeschnittene Kasten auf der Startseite bei 320 px
{
  const ctx = await browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/", { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll("div")].find(
      (d) => (d.className || "").toString().includes("bild") && d.textContent.includes("VERAnstaltung"));
    if (!el) return null;
    const s = getComputedStyle(el);
    const kind = el.firstElementChild;
    const ks = kind ? getComputedStyle(kind) : null;
    return {
      klasse: el.className, kasten: Math.round(el.getBoundingClientRect().width) + "×" + Math.round(el.getBoundingClientRect().height),
      clientH: el.clientHeight, scrollH: el.scrollHeight, aspect: s.aspectRatio, overflow: s.overflow,
      kind: kind ? kind.className + " " + Math.round(kind.getBoundingClientRect().width) + "×" + Math.round(kind.getBoundingClientRect().height) : "—",
      kindPadding: ks ? ks.padding : "—",
      wortmarke: (() => { const w = el.querySelector("span"); const wr = w?.getBoundingClientRect();
        return wr ? Math.round(wr.width) + "×" + Math.round(wr.height) : "—"; })(),
    };
  });
  console.log("Startseite 320 px, Kasten mit Wortmarke:"); console.log(r); console.log();
  await ctx.close();
}

// 2. Fußzeilen-Links: Wie viel Platz liegt wirklich zwischen ihnen?
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/", { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const links = [...document.querySelectorAll("footer a")].slice(0, 6);
    return links.map((a, i) => {
      const r = a.getBoundingClientRect();
      const naechster = links[i + 1]?.getBoundingClientRect();
      return { text: a.textContent.trim().slice(0, 18),
        hoch: Math.round(r.height),
        abstandZumNaechsten: naechster ? Math.round(naechster.top - r.bottom) : null,
        effektiv: naechster ? Math.round(r.height + (naechster.top - r.bottom)) : null };
    });
  });
  console.log("Fußzeilen-Links bei 390 px:");
  for (const l of r) console.log(`  „${l.text}"  ${l.hoch} px hoch, ${l.abstandZumNaechsten} px Abstand → effektiv ${l.effektiv} px`);
  await ctx.close();
}
await browser.close();
