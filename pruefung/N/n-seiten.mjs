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

/* ── Impressum: echte Angaben statt erfundener ──────────────────

   Die Adresse „kontakt@beispiel.de" stand monatelang im Fussbereich
   JEDER Seite — und dort, anders als auf der Kontaktseite, ohne
   Platzhalter-Markierung. Sie las sich wie eine gueltige Adresse.
   Genau das darf nicht zurueckkommen, deshalb wird bei jedem Lauf
   ueber alle oeffentlichen Seiten danach gesucht. */

const erfunden = [];
for (const pfad of gesehen) {
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) continue;
  const text = await page.locator("body").innerText();
  if (/beispiel\.de/i.test(text)) erfunden.push(pfad);
}
pruefe(
  "Keine oeffentliche Seite zeigt eine erfundene Kontaktadresse",
  erfunden.length === 0,
  erfunden.join(" · "),
);

/* Der Satz „Beide Texte sollten vor der Veroeffentlichung von einer
   fachkundigen Person geprueft werden" stand auf Impressum, AGB und
   Datenschutz. Er war nie fuer Besucher gedacht, sondern eine Notiz an
   den Betreiber — und auf einem fertigen Impressum las er sich wie ein
   Zettel aus der Werkstatt. Sein Platz ist docs/rechtliches.md.

   Die seitenspezifische Fassung auf der Widerrufsseite bleibt
   ausdruecklich bestehen: Sie sagt, welcher Abschnitt noch offen ist
   UND dass die Stornobedingungen so gelten, wie sie dort stehen. Das
   ist eine Aussage fuer Besucher, keine Arbeitsnotiz. */
const arbeitsnotiz = [];
for (const pfad of gesehen) {
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) continue;
  const text = await page.locator("body").innerText();
  if (text.includes("Beide Texte sollten vor der Veröffentlichung")) arbeitsnotiz.push(pfad);
}
pruefe(
  "Keine oeffentliche Seite zeigt den internen Arbeitshinweis",
  arbeitsnotiz.length === 0,
  arbeitsnotiz.join(" · "),
);

/* Gegenprobe: Die Widerrufsseite behaelt ihren eigenen, inhaltlichen
   Hinweis. Ohne diese Zeile koennte ihn jemand beim naechsten
   Aufraeumen versehentlich mitloeschen. */
await page.goto(BASIS + "/widerruf", { waitUntil: "networkidle" });
const widText = await page.locator("body").innerText();
pruefe(
  "Widerruf: eigener Hinweis zu Abschnitt 1 bleibt bestehen",
  widText.includes("Abschnitt 1") && widText.includes("fachkundigen Person"),
);

await page.goto(BASIS + "/impressum", { waitUntil: "networkidle" });
const impText = await page.locator("body").innerText();

pruefe("Impressum: nennt § 5 DDG", /§\s*5\s*DDG/.test(impText));
pruefe("Impressum: nennt den Anbieter namentlich", impText.includes("Adam Maurice Lasarzik"));
pruefe("Impressum: nennt die echte E-Mail-Adresse", impText.includes("kontakt@veraevents.de"));
pruefe(
  "Impressum: erklaert die Kleinunternehmerregelung",
  /§\s*19\s*UStG/.test(impText) && /keine Umsatzsteuer/i.test(impText),
);

/* Die beiden offenen Felder muessen ERKENNBAR offen sein — und sie
   muessen vor dem Livegang verschwinden. Solange sie da sind, sind
   sie markiert; das ist der Zweck dieser beiden Pruefungen. */
pruefe("Impressum: Anschrift ist als Platzhalter markiert", /Geschäftsanschrift folgt/.test(impText));
pruefe("Impressum: Telefonnummer ist als Platzhalter markiert", /Telefonnummer folgt/.test(impText));

/* Der Aufbau der Seite ist der endgueltige. Ein Banner „diese Seite
   ist noch nicht ausgefuellt" gehoert deshalb NICHT darauf — anders
   als bei AGB und Widerruf, wo der ganze Text noch fehlt. */
pruefe(
  "Impressum: traegt keinen Unfertig-Banner mehr",
  !impText.includes("noch nicht ausgefüllt"),
);

/* Keine erfundene Steuernummer und keine erfundene USt-IdNr.:
   Solange ungeklaert ist, ob eine vorliegt, darf keine dastehen. */
pruefe(
  "Impressum: keine erfundene Umsatzsteuer-Identifikationsnummer",
  !/\bDE\s?\d{9}\b/.test(impText),
);

/* ── Kein Reservierungsversprechen an den Kunden ────────────────

   VERA bietet keine Reservierung an: Anmeldung und Bezahlung sind ein
   Vorgang, gekauft ist erst mit erfolgreicher Zahlung. Der Platz wird
   zwar 30 Minuten lang mitgezaehlt, damit er waehrend des laufenden
   Zahlungsvorgangs nicht weggeht — das ist eine technische
   Absicherung, keine Leistung, die zugesagt wird.

   Die Abschluss-Seite sagte dem Kunden aber genau das Gegenteil
   ("Dein Platz ist fuer kurze Zeit reserviert"). Diese Pruefung
   verhindert, dass so eine Formulierung zurueckkehrt. */
const versprechen = [];
for (const pfad of gesehen) {
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) continue;
  const text = await page.locator("body").innerText();
  const treffer = text.match(/reserviert|Reservierung/i);
  if (treffer) versprechen.push(`${pfad}: „${treffer[0]}"`);
}
pruefe(
  "Keine oeffentliche Seite verspricht dem Kunden eine Reservierung",
  versprechen.length === 0,
  versprechen.join(" · "),
);

await ctx.close();
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
