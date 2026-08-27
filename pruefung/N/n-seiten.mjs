/* Die zwei neuen Pflichtseiten: erreichbar, sichtbar als Platzhalter
   gekennzeichnet, im Fußbereich verlinkt — und ohne erfundenen
   Rechtstext. */
import { chromium } from "playwright";
const BASIS = "http://127.0.0.1:3249";
let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

for (const [name, pfad, ueberschrift] of [
  ["AGB", "/agb", "Allgemeine Geschäftsbedingungen"],
  ["Widerruf", "/widerruf", "Widerrufsbelehrung"],
]) {
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  pruefe(`${name}: Seite ist erreichbar`, antwort.status() === 200, `Antwort ${antwort.status()}`);
  const text = await page.locator("body").innerText();
  pruefe(
    `${name}: trägt die richtige Hauptüberschrift`,
    (await page.locator("h1").innerText()) === ueberschrift,
  );
  /* Die Marke wird per CSS in Grossbuchstaben gesetzt (text-transform),
     und innerText gibt den GERENDERTEN Text zurück — deshalb ohne
     Rücksicht auf Gross- und Kleinschreibung vergleichen. */
  pruefe(
    `${name}: ist sichtbar als Platzhalter gekennzeichnet`,
    /platzhalter/i.test(text) && text.includes("noch nicht ausgefüllt"),
  );
  pruefe(`${name}: verweist auf fachkundige Prüfung`, text.includes("fachkundige"));
  pruefe(`${name}: Seitentitel gesetzt`, (await page.title()).includes(ueberschrift), await page.title());
}

/* Der Punkt, der leicht übersehen wird — und der Grund, warum die
   Seite überhaupt jetzt schon entsteht. */
await page.goto(BASIS + "/widerruf", { waitUntil: "networkidle" });
pruefe(
  "Widerruf: benennt die zu prüfende Ausnahme für Freizeitveranstaltungen",
  (await page.locator("body").innerText()).includes("312g"),
);

await page.goto(BASIS + "/agb", { waitUntil: "networkidle" });
pruefe(
  "AGB: die Stornobedingungen sind darin genannt",
  (await page.locator("body").innerText()).toLowerCase().includes("storno"),
);

// Datenschutz: die Tatsache zur Zahlung ist ergänzt
await page.goto(BASIS + "/datenschutz", { waitUntil: "networkidle" });
const dsText = await page.locator("body").innerText();
pruefe("Datenschutz: nennt jetzt den Zahlungsanbieter", dsText.includes("Stripe"));
pruefe(
  "Datenschutz: sagt, dass Kartendaten diese Seite nie erreichen",
  dsText.includes("Kartennummern"),
);

// Fußbereich auf einer beliebigen Seite
await page.goto(BASIS + "/", { waitUntil: "networkidle" });
for (const [beschriftung, ziel] of [
  ["Impressum", "/impressum"],
  ["Datenschutz", "/datenschutz"],
  ["AGB", "/agb"],
  ["Widerruf", "/widerruf"],
]) {
  const treffer = page.locator(`footer a[href="${ziel}"]`);
  pruefe(`Fußbereich verlinkt „${beschriftung}“`, (await treffer.count()) === 1);
}

await ctx.close();
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
