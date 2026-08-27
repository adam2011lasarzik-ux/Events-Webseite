/* Kontraste am echten Bildpunkt messen — nicht aus den CSS-Werten
   ausrechnen. Halbdurchsichtige Flächen und Verläufe ergeben sonst
   Zahlen für einen Zustand, den es auf dem Bildschirm gar nicht gibt. */
import { chromium } from "playwright";

const rel = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * rel(r) + 0.7152 * rel(g) + 0.0722 * rel(b);
const verhaeltnis = (a, b) => {
  const [h, d] = lum(a) > lum(b) ? [a, b] : [b, a];
  return (lum(h) + 0.05) / (lum(d) + 0.05);
};

/* Halbdurchsichtige Schrift über die Fläche legen. Ohne diesen
   Schritt misst man die Farbe, die im Stylesheet steht — nicht die,
   die man auf dem Bildschirm sieht. Genau daran ist die
   Kontrastmessung in Schritt H schon einmal vorbeigelaufen. */
const ueber = (vorn, hinten) =>
  vorn.length === 3 || vorn[3] === undefined || vorn[3] >= 1
    ? vorn.slice(0, 3)
    : [0, 1, 2].map((i) => Math.round(vorn[3] * vorn[i] + (1 - vorn[3]) * hinten[i]));

let n = 0; const schief = [];
const pruefe = (name, wert, mindest) => {
  n += 1;
  const ok = wert >= mindest;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}  — ${wert.toFixed(2)}:1 (mindestens ${mindest})`);
  if (!ok) schief.push(name);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

/** Farbe eines Elements und seines tatsächlichen Hintergrunds. */
async function farben(wahl) {
  return page.evaluate((w) => {
    const el = document.querySelector(w);
    if (!el) return null;
    const zahl = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
    const vordergrund = zahl(getComputedStyle(el).color);
    // Den ersten Vorfahren mit einer wirklich gesetzten Fläche suchen.
    let p = el;
    let hinter = [255, 255, 255];
    while (p) {
      const bg = getComputedStyle(p).backgroundColor;
      if (bg && !bg.includes("rgba(0, 0, 0, 0)") && bg !== "transparent") { hinter = zahl(bg).slice(0, 3); break; }
      p = p.parentElement;
    }
    return { vordergrund, hinter };
  }, wahl);
}

for (const [was, pfad] of [["Standard", "/events/padel-falkensee"], ["Premium", "/events/probe-premium"], ["Business", "/events/probe-business"], ["Startseite", "/"]]) {
  await page.goto("http://127.0.0.1:3213" + pfad, { waitUntil: "networkidle" });
  const bereich = "#gruender";
  const teile = [
    ["Überschrift", `${bereich} h2`, 3],
    ["Augenbraue", `${bereich} header span`, 4.5],
    ["Name", `${bereich} [data-block="gruender"] p`, 4.5],
    ["Bezeichnung", `${bereich} [data-teil="rolle"]`, 4.5],
  ];
  for (const [name, wahl, mindest] of teile) {
    const f = await farben(wahl);
    if (!f) { console.log(`— ${was}: ${name} nicht gefunden`); continue; }
    pruefe(`${was} · ${name}`, verhaeltnis(ueber(f.vordergrund, f.hinter), f.hinter), mindest);
  }
  // Fließtext getrennt, weil er in einem eigenen Kasten steckt.
  const t = await page.evaluate(() => {
    const el = document.querySelector('#gruender [data-block="gruender"] div div p');
    if (!el) return null;
    const zahl = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
    let p = el, hinter = [255, 255, 255];
    while (p) { const bg = getComputedStyle(p).backgroundColor;
      if (bg && !bg.includes("rgba(0, 0, 0, 0)")) { hinter = zahl(bg).slice(0, 3); break; } p = p.parentElement; }
    return { vordergrund: zahl(getComputedStyle(el).color), hinter, marke: el.textContent.slice(0, 30) };
  });
  if (t) pruefe(`${was} · Beschreibungstext („${t.marke}…“)`, verhaeltnis(ueber(t.vordergrund, t.hinter), t.hinter), 4.5);
}

await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Zu schwach:", schief.join(" · ")); process.exit(1); }
