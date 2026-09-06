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

/* Die Stornobedingungen sind seit der Selbstbedienung verbindlich —
   und müssen beschreiben, was die Seite WIRKLICH tut. Stünde hier
   noch der alte Satz „genügt eine E-Mail an …", wäre er schlicht
   falsch. */
pruefe("Widerruf: nennt die 24-Stunden-Frist", wText.includes("24 Stunden"));
pruefe(
  "Widerruf: nennt den Weg über den Link in der Bestätigungsmail",
  wText.includes("Link in der Bestätigungsmail"),
);
pruefe(
  "Widerruf: verspricht NICHT mehr den alten Weg per E-Mail an uns",
  !/genügt eine E-Mail an kontakt@/.test(wText),
);
pruefe(
  "Widerruf: sagt, dass der volle Betrag erstattet wird",
  wText.includes("volle Betrag"),
);
pruefe(
  "Widerruf: regelt den Fall ohne feststehenden Termin",
  wText.includes("noch kein Termin feststeht"),
);
pruefe(
  "Widerruf: schliesst die Übertragung auf eine andere Person aus",
  wText.includes("nicht auf eine andere Person übertragen"),
);
pruefe(
  "Widerruf: hat einen eigenen Abschnitt zur Absage durch VERA",
  wText.includes("Absage durch VERA"),
);

/* Die Platzhalter-Markierung darf NICHT mehr für die ganze Seite
   gelten: Abschnitt 2 und 3 sind geltende Bedingungen. */
pruefe(
  "Widerruf: bezeichnet sich nicht mehr pauschal als unausgefüllt",
  !wText.includes("Diese Seite ist noch nicht ausgefüllt"),
);
pruefe(
  "Widerruf: markiert aber weiterhin den offenen Abschnitt 1",
  wText.includes("Dieser Abschnitt ist noch nicht ausgefüllt"),
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

/* ── Umsatzsteuer: keine Seite darf welche behaupten ─────────────

   VERA ist Kleinunternehmen nach § 19 UStG. Wer als Kleinunternehmer
   Umsatzsteuer AUSWEIST, schuldet sie dem Finanzamt (§ 14c Abs. 2
   UStG) — auch wenn er sie nie eingenommen hat. Ein versehentlich
   wieder eingebautes „inkl. MwSt." ist deshalb kein Schönheitsfehler,
   sondern kostet Geld. Darum wird es hier bei jedem Lauf gesucht.

   Geprüft wird auf JEDER öffentlichen Seite, nicht nur auf den
   Rechtsseiten: Die alte Angabe stand unter anderem in der
   Preis-Einleitung und im Preisrechner. */

const VERBOTEN = [
  /inkl\.?\s*(MwSt|USt|Mehrwertsteuer|Umsatzsteuer)/i,
  /inklusive\s+(Mehrwert|Umsatz)steuer/i,
  /zzgl\.?\s*(MwSt|USt|Mehrwertsteuer|Umsatzsteuer)/i,
  /enthaltene[rn]?\s+(Mehrwert|Umsatz)steuer/i,
  /\d+\s*%\s*(MwSt|USt|Mehrwertsteuer|Umsatzsteuer)/i,
];

/* Kleine Breitensuche über die internen Links — dieselbe Idee wie in
   Prüfliste O, nur ohne deren Knopfprüfung. */
const gesehen = new Set(["/"]);
const offen = ["/"];
const mitSteuer = [];
let besucht = 0;

while (offen.length) {
  const pfad = offen.shift();
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) continue;
  besucht += 1;

  const text = await page.locator("body").innerText();
  for (const muster of VERBOTEN) {
    const treffer = text.match(muster);
    if (treffer) mitSteuer.push(`${pfad}: „${treffer[0]}"`);
  }

  const ziele = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const ziel of ziele) {
    if (!ziel || !ziel.startsWith("/")) continue;
    const rein = ziel.split("#")[0].split("?")[0];
    if (!rein || gesehen.has(rein)) continue;
    if (/^\/(admin|bilder|zahlung)\b/.test(rein)) continue;
    gesehen.add(rein);
    offen.push(rein);
  }
}

pruefe(`Umsatzsteuer: ${besucht} öffentliche Seiten durchsucht`, besucht >= 8, `${besucht} Seiten`);
pruefe(
  "Keine öffentliche Seite weist Umsatzsteuer aus",
  mitSteuer.length === 0,
  mitSteuer.join(" · "),
);

/* Die Gegenprobe: Es reicht nicht, dass nichts Falsches dasteht —
   der Grund muss auch genannt sein, sonst wirkt der Preis unerklärt. */
await page.goto(BASIS + "/", { waitUntil: "networkidle" });
const startLinks = await page.$$eval("a[href^='/events/']", (as) => as.map((a) => a.getAttribute("href")));
if (startLinks.length) {
  await page.goto(BASIS + startLinks[0].split("#")[0], { waitUntil: "networkidle" });
  const eventText = await page.locator("body").innerText();
  pruefe(
    "Die Eventseite nennt § 19 UStG als Grund",
    /§\s*19\s*UStG/.test(eventText) && /keine Umsatzsteuer/i.test(eventText),
  );
} else {
  pruefe("Die Eventseite nennt § 19 UStG als Grund", false, "kein Event zum Prüfen gefunden");
}

await ctx.close();
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
