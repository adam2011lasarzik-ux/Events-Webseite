/* Welche Überschriften enthalten ein Wort, das bei 320 px nicht in
   seinen Kasten passt? Nur die müssen von Hand getrennt werden. */
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
const page = await ctx.newPage();
const seiten = ["/", "/events/padel-falkensee", "/events/probe-business", "/events/probe-premium",
  "/event/padel-falkensee", "/events/padel-falkensee/anmeldung", "/fuer-schulen", "/ueber-vera",
  "/faq", "/kontakt", "/impressum", "/datenschutz", "/anmeldung/danke"];
const gefunden = new Set();
for (const pfad of seiten) {
  await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
  const treffer = await page.evaluate(() => {
    const raus = [];
    for (const h of document.querySelectorAll("h1, h2, h3, h4")) {
      const s = getComputedStyle(h);
      const kasten = h.getBoundingClientRect().width;
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;white-space:nowrap;visibility:hidden";
      for (const eig of ["fontFamily","fontSize","fontWeight","fontStretch","letterSpacing"]) probe.style[eig] = s[eig];
      document.body.appendChild(probe);
      for (const wort of (h.textContent || "").split(/\s+/).filter(Boolean)) {
        probe.textContent = wort;
        const b = probe.getBoundingClientRect().width;
        if (b > kasten) raus.push({ wort, breite: Math.round(b), kasten: Math.round(kasten), zeile: h.textContent.slice(0, 40) });
      }
      probe.remove();
    }
    return raus;
  });
  for (const t of treffer) {
    const k = `${t.wort}`;
    if (gefunden.has(k)) continue;
    gefunden.add(k);
    console.log(`${pfad.padEnd(34)} „${t.wort}“ ${t.breite}px > Kasten ${t.kasten}px   (in „${t.zeile}…“)`);
  }
}
await browser.close();
console.log(`\n${gefunden.size} Wörter, die bei 320 px getrennt werden müssen.`);
