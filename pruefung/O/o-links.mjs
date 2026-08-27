/* Jeder Link und jeder Knopf auf jeder öffentlichen Seite.

   Bisher wurde geprüft, ob Seiten sauber aussehen — nicht, ob jedes
   Ziel überhaupt existiert. Ein toter Link fällt beim Ansehen eines
   Bildschirmfotos nicht auf; er fällt dem Besucher auf.

   Vorgehen: von der Startseite aus alle internen Links verfolgen
   (Breitensuche), jede gefundene Adresse einmal abrufen und ihren
   Status prüfen. Zusätzlich alle Knöpfe zählen und prüfen, ob sie
   entweder ein Ziel haben oder Teil eines Formulars sind — ein Knopf
   ohne beides tut nichts.
*/
import { chromium } from "playwright";

const BASIS = "http://127.0.0.1:3249";
/* Der Adminbereich ist absichtlich geschützt und leitet ohne Sitzung
   weiter — er gehört nicht in die Prüfung der öffentlichen Seiten. */
const AUSGENOMMEN = /^\/(admin|bilder|zahlung)\b/;

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const gesehen = new Set(["/"]);
const warteschlange = ["/"];
const seiten = [];
const externe = new Set();
const knopfProbleme = [];

while (warteschlange.length) {
  const pfad = warteschlange.shift();
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  const status = antwort ? antwort.status() : 0;
  seiten.push({ pfad, status });

  if (status !== 200) continue;

  const gefunden = await page.evaluate(() => {
    const ziele = [...document.querySelectorAll("a")].map((a) => ({
      href: a.getAttribute("href"),
      aufgeloest: a.href,
      text: (a.textContent || "").trim().slice(0, 40),
    }));
    /* Ein Knopf, der weder Typ „submit" hat noch in einem Formular
       steht noch einen Klick-Empfänger, ist eine Attrappe. */
    const knoepfe = [...document.querySelectorAll("button")].map((b) => ({
      text: (b.textContent || "").trim().slice(0, 40),
      typ: b.getAttribute("type"),
      imFormular: Boolean(b.closest("form")),
      hatAria: Boolean(b.getAttribute("aria-controls") || b.getAttribute("aria-expanded")),
      deaktiviert: b.disabled,
    }));
    return { ziele, knoepfe };
  });

  for (const k of gefunden.knoepfe) {
    const tutEtwas = k.imFormular || k.typ === "submit" || k.hatAria;
    if (!tutEtwas) knopfProbleme.push(`${pfad}: „${k.text}"`);
  }

  for (const z of gefunden.ziele) {
    if (!z.href) {
      knopfProbleme.push(`${pfad}: Link ohne Ziel „${z.text}"`);
      continue;
    }
    if (z.href.startsWith("#")) continue;
    let u;
    try {
      u = new URL(z.aufgeloest);
    } catch {
      continue;
    }
    if (u.origin !== BASIS) {
      externe.add(u.origin + u.pathname);
      continue;
    }
    const rein = u.pathname;
    if (AUSGENOMMEN.test(rein)) continue;
    if (!gesehen.has(rein)) {
      gesehen.add(rein);
      warteschlange.push(rein);
    }
  }
}

console.log(`\n${seiten.length} öffentliche Adressen von der Startseite aus erreichbar:\n`);
for (const s of seiten.sort((a, b) => a.pfad.localeCompare(b.pfad))) {
  console.log(`   ${String(s.status).padStart(3)}  ${s.pfad}`);
}
console.log("");

const kaputt = seiten.filter((s) => s.status !== 200);
pruefe(
  "Jede verlinkte Seite antwortet mit 200",
  kaputt.length === 0,
  kaputt.map((s) => `${s.pfad} → ${s.status}`).join(" · ") || `${seiten.length} Adressen`,
);
pruefe(
  "Kein Link ohne Ziel, kein Knopf ohne Wirkung",
  knopfProbleme.length === 0,
  knopfProbleme.slice(0, 4).join(" · ") || "geprüft",
);

/* Die Pflichtseiten müssen von jeder Seite aus erreichbar sein — sie
   stehen im Fußbereich, der überall gleich ist. */
for (const p of ["/impressum", "/datenschutz", "/agb", "/widerruf"]) {
  pruefe(`Pflichtseite ${p} ist verlinkt und erreichbar`, gesehen.has(p) && seiten.some((s) => s.pfad === p && s.status === 200));
}

/* Fremde Ziele: Es soll KEINE geben — die Seite lädt bewusst nichts
   von fremden Servern und verlinkt (ausser evtl. Karten) nichts. */
console.log(`\nFremde Ziele: ${externe.size === 0 ? "keine" : [...externe].join(", ")}`);
pruefe("Keine unerwarteten fremden Verlinkungen", externe.size === 0, [...externe].join(", ") || "keine");

/* Ein 404 muss eine echte 404-Antwort liefern, keine 200-Seite mit
   „nicht gefunden" — sonst indexieren Suchmaschinen Geisterseiten. */
const vier = await page.goto(BASIS + "/gibt-es-nicht-xyz", { waitUntil: "domcontentloaded" });
pruefe("Unbekannte Adresse liefert echten 404", vier.status() === 404, `Antwort ${vier.status()}`);

const entwurf = await page.goto(BASIS + "/events/gibt-es-nicht-xyz", { waitUntil: "domcontentloaded" });
pruefe("Unbekanntes Event liefert 404", entwurf.status() === 404, `Antwort ${entwurf.status()}`);

await ctx.close();
await browser.close();

if (knopfProbleme.length) {
  console.log("\nAlle Beanstandungen:");
  knopfProbleme.forEach((k) => console.log("   · " + k));
}

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
