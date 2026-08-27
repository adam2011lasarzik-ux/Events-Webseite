/* Führt die Messung über den ganzen Breitenbereich aus.
   Aufruf: node l-responsiv.mjs [schritt] [--kurz] */
import { chromium } from "playwright";
import fs from "node:fs";
import { MESSUNG } from "./messung.mjs";

const BASIS = "http://127.0.0.1:3249";
const SCHRITT = Number(process.argv[2] ?? 10);
const KURZ = process.argv.includes("--kurz");

const SEITEN = [
  ["Standard · Eventseite",   "/events/padel-falkensee"],
  ["Standard · Detailseite",  "/event/padel-falkensee"],
  ["Standard · Anmeldung",    "/events/padel-falkensee/anmeldung"],
  ["Business · Eventseite",   "/events/probe-business"],
  ["Business · Detailseite",  "/event/probe-business"],
  ["Business · Anmeldung",    "/events/probe-business/anmeldung"],
  ["Premium · Eventseite",    "/events/probe-premium"],
  ["Premium · Detailseite",   "/event/probe-premium"],
  ["Premium · Anmeldung",     "/events/probe-premium/anmeldung"],
  ["Startseite",              "/"],
  ["Für Schulen",             "/fuer-schulen"],
  ["Über VERA",               "/ueber-vera"],
  ["Fragen",                  "/faq"],
  ["Kontakt",                 "/kontakt"],
  ["Impressum",               "/impressum"],
  ["Datenschutz",             "/datenschutz"],
  ["AGB",                     "/agb"],
  ["Widerruf",                "/widerruf"],
];

const HOEHEN = KURZ ? [844] : [640, 844, 1180];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 844 } });
const page = await ctx.newPage();

const alleFunde = [];
let messungen = 0;

for (const [name, pfad] of SEITEN) {
  await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  // Videos anhalten: ein laufendes Video ändert nichts am Layout,
  // kostet aber Rechenzeit bei 161 Messungen.
  await page.evaluate(() => document.querySelectorAll("video").forEach((v) => v.pause()));

  for (const hoehe of HOEHEN) {
    for (let breite = 320; breite <= 1920; breite += SCHRITT) {
      await page.setViewportSize({ width: breite, height: hoehe });
      const funde = await page.evaluate(MESSUNG);
      messungen += 1;
      for (const f of funde) alleFunde.push({ seite: name, pfad, breite, hoehe, ...f });
    }
  }
  process.stdout.write(`· ${name}\n`);
}

await browser.close();

/* Zusammenfassen: Ein Fehler, der über 40 Breiten hinweg auftritt,
   ist EIN Fehler — nicht vierzig. Sonst erschlägt der Bericht. */
const gruppen = new Map();
for (const f of alleFunde) {
  const schluessel = [f.art, f.seite, f.klasse ?? "", f.eins ?? "", f.zwei ?? "", f.text ?? ""].join("|");
  const g = gruppen.get(schluessel) ?? { ...f, breiten: [], anzahl: 0 };
  g.breiten.push(f.breite);
  g.anzahl += 1;
  gruppen.set(schluessel, g);
}

const bereich = (b) => {
  const s = [...new Set(b)].sort((x, y) => x - y);
  const stuecke = [];
  let von = s[0], letzt = s[0];
  for (const w of s.slice(1)) {
    if (w - letzt <= SCHRITT) { letzt = w; continue; }
    stuecke.push(von === letzt ? `${von}` : `${von}–${letzt}`);
    von = w; letzt = w;
  }
  stuecke.push(von === letzt ? `${von}` : `${von}–${letzt}`);
  return stuecke.join(", ") + " px";
};

const sortiert = [...gruppen.values()].sort((a, b) => b.anzahl - a.anzahl);
console.log(`\n${messungen} Messungen, ${alleFunde.length} Einzelfunde, ${sortiert.length} verschiedene Stellen.\n`);

for (const g of sortiert) {
  const kopf = `[${g.art}] ${g.seite}`;
  const wo = g.art === "ueberlappt"
    ? `„${g.eins}" ⨯ „${g.zwei}" (${g.quer}×${g.hoch} px)`
    : `${g.tag}.${g.klasse} „${g.text}"` +
      (g.inhalt ? ` — Inhalt ${g.inhalt}, Kasten ${g.kasten}` : "") +
      (g.px ? ` — ${g.px}` : "") +
      (g.breit ? ` — ${g.breit}×${g.hoch} px` : "") +
      (g.rechts ? ` — rechte Kante ${g.rechts}, Rand ${g.rand}` : "");
  console.log(`${kopf}\n    ${wo}\n    bei ${bereich(g.breiten)}\n`);
}

fs.writeFileSync(
  "pruefung/.ausgabe/L-funde.json",
  JSON.stringify(sortiert, null, 1),
);
if (sortiert.length > 0) process.exit(1);
