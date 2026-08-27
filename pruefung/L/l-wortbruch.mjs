/* Wo bricht eine Überschrift MITTEN IM WORT?

   `overflow-wrap: anywhere` verhindert Überlauf, kann ein Wort aber
   an beliebiger Stelle zerlegen. Diese Messung findet genau die
   Stellen, an denen das passiert: Für jedes Wort wird geprüft, ob
   seine Rechtecke auf mehr als einer Zeile liegen. */
import { chromium } from "playwright";

const SEITEN = [
  ["Startseite", "/"], ["Standard", "/events/padel-falkensee"],
  ["Business", "/events/probe-business"], ["Premium", "/events/probe-premium"],
  ["Standard Detail", "/event/padel-falkensee"], ["Business Detail", "/event/probe-business"],
  ["Premium Detail", "/event/probe-premium"],
  ["Anmeldung", "/events/padel-falkensee/anmeldung"],
  ["Premium Anmeldung", "/events/probe-premium/anmeldung"],
  ["FAQ", "/faq"], ["Schulen", "/fuer-schulen"], ["Über VERA", "/ueber-vera"],
  ["Kontakt", "/kontakt"], ["Impressum", "/impressum"], ["Datenschutz", "/datenschutz"],
];

const SUCHE = () => {
  const raus = [];
  for (const el of document.querySelectorAll("h1, h2, h3, h4, p, a, li, button, label, span, td, th")) {
    if (el.querySelector("h1,h2,h3,h4,p,a,li,button,label,span,td,th")) continue;
    for (const kn of el.childNodes) {
      if (kn.nodeType !== 3) continue;
      const txt = kn.textContent;
      const re = /[^\s­\-–—\/]{2,}/g;
      let m;
      while ((m = re.exec(txt))) {
        const r = document.createRange();
        r.setStart(kn, m.index); r.setEnd(kn, m.index + m[0].length);
        const oben = new Set([...r.getClientRects()].filter((x) => x.width > 0.5).map((x) => Math.round(x.top)));
        if (oben.size > 1) {
          raus.push({ tag: el.tagName.toLowerCase(), wort: m[0],
                      um: (el.textContent || "").trim().slice(0, 46) });
        }
      }
    }
  }
  return raus;
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const alle = [];
const BREITEN = []; for (let b = 320; b <= 1920; b += 20) BREITEN.push(b);
const ctx = await browser.newContext({ viewport: { width: 320, height: 900 } });
const page = await ctx.newPage();
for (const [name, pfad] of SEITEN) {
  /* Einmal laden, dann nur die Fensterbreite ändern: Die Umbrüche
     sind reines CSS, ein Neuladen je Breite wäre reine Wartezeit. */
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("http://127.0.0.1:3249" + pfad, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll("video").forEach((v) => v.pause()));
  for (const b of BREITEN) {
    await page.setViewportSize({ width: b, height: 900 });
    for (const f of await page.evaluate(SUCHE)) alle.push({ ...f, seite: name, breite: b });
  }
  process.stdout.write("·");
}
await ctx.close();
process.stdout.write("\n");
await browser.close();

const nach = new Map();
for (const f of alle) {
  const s = `${f.seite} · <${f.tag}> „${f.wort}"  (${f.um})`;
  if (!nach.has(s)) nach.set(s, []);
  nach.get(s).push(f.breite);
}
console.log(`${alle.length} Einzelfunde, ${nach.size} verschiedene Stellen:\n`);
for (const [s, br] of nach) console.log(`  ${s}\n      bei ${[...new Set(br)].join(", ")} px`);
