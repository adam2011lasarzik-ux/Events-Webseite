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
  ["Widerruf", "/widerruf", "Widerruf und Stornierung"],
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
const wText = await page.locator("body").innerText();
pruefe(
  "Widerruf: benennt die zu prüfende Ausnahme für Freizeitveranstaltungen",
  wText.includes("312g"),
);
/* Der Titel darf die Frage nicht vorwegnehmen: „Widerrufsbelehrung"
   setzt voraus, dass ein Widerrufsrecht besteht — und genau das ist
   offen. */
pruefe(
  "Widerruf: nennt sich NICHT „Widerrufsbelehrung“",
  !wText.includes("Widerrufsbelehrung") || wText.includes("KEINE Widerrufsbelehrung"),
);
pruefe(
  "Widerruf: trennt gesetzliches Widerrufsrecht und Stornierung",
  wText.includes("Widerrufsrecht") && wText.includes("Stornierung"),
);
pruefe(
  "Widerruf: baut KEINE 14-Tage-Belehrung ein",
  !/14\s*Tag/i.test(wText),
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
/* Vollständigkeit: An Stripe gehen auch Titel und Personenzahl. */
pruefe(
  "Datenschutz: nennt auch Titel und Personenzahl",
  dsText.includes("Titel der Veranstaltung") && dsText.includes("Anzahl"),
);
/* Die frühere Fassung behauptete pauschal „setzt keine Cookies" —
   das Admin-Cookie gibt es aber. */
pruefe(
  "Datenschutz: behauptet NICHT mehr pauschal „keine Cookies“",
  !/setzt keine Cookies/i.test(dsText),
);
pruefe(
  "Datenschutz: benennt das Cookie des Verwaltungsbereichs",
  /technisch notwendig/i.test(dsText),
);

// AGB: dürfen nicht als Pflicht dargestellt werden
await page.goto(BASIS + "/agb", { waitUntil: "networkidle" });
const agbText = await page.locator("body").innerText();
pruefe(
  "AGB: stellen klar, dass eigene AGB nicht vorgeschrieben sind",
  /nicht für jede Webseite vorgeschrieben/i.test(agbText),
);
pruefe(
  "AGB: unterscheiden Stornierung vom gesetzlichen Widerrufsrecht",
  /etwas anderes als das gesetzliche Widerrufsrecht/i.test(agbText),
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
