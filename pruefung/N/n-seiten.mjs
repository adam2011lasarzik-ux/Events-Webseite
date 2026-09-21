/* Die zwei neuen Pflichtseiten: erreichbar, sichtbar als Platzhalter
   gekennzeichnet, im Fußbereich verlinkt — und ohne erfundenen
   Rechtstext. */
import { chromium } from "playwright";
import zlib from "node:zlib";
const BASIS = "http://127.0.0.1:3249";

/** Adobe-Basis-85 (PDF-Variante von ASCII85) dekodieren — ohne
 *  Fremdpaket, nur die paar Zeilen, die reportlab-Streams brauchen.
 *  "z" steht für eine Nullgruppe, ein "~>"-Terminator wird ignoriert. */
function entpackeAscii85(text) {
  const bereinigt = text.replace(/~>[\s\S]*$/, "").replace(/\s+/g, "");
  const bytes = [];
  let gruppe = [];
  for (const zeichen of bereinigt) {
    if (zeichen === "z" && gruppe.length === 0) {
      bytes.push(0, 0, 0, 0);
      continue;
    }
    gruppe.push(zeichen.charCodeAt(0) - 33);
    if (gruppe.length === 5) {
      let wert = 0;
      for (const g of gruppe) wert = wert * 85 + g;
      bytes.push((wert >>> 24) & 0xff, (wert >>> 16) & 0xff, (wert >>> 8) & 0xff, wert & 0xff);
      gruppe = [];
    }
  }
  if (gruppe.length > 0) {
    // Ein Rest aus n Zeichen (2..4) kodiert n-1 Bytes: mit "u" (Wert 84)
    // auf 5 auffuellen, wie eine volle Gruppe entschluesseln, aber nur
    // die ersten n-1 der vier entstehenden Bytes behalten.
    const echte = gruppe.length - 1;
    while (gruppe.length < 5) gruppe.push(84);
    let wert = 0;
    for (const g of gruppe) wert = wert * 85 + g;
    const alle = [(wert >>> 24) & 0xff, (wert >>> 16) & 0xff, (wert >>> 8) & 0xff, wert & 0xff];
    bytes.push(...alle.slice(0, echte));
  }
  return Buffer.from(bytes);
}

/** Die Seiteninhalte einer PDF auspacken, damit der Text prüfbar wird.
 *  Generatoren kodieren Streams unterschiedlich — reportlab verkettet
 *  bei den Seiteninhalten ASCII85Decode vor FlateDecode, ältere
 *  Generatoren nutzten reines FlateDecode. Deshalb wird die Filterliste
 *  gelesen und in der angegebenen Reihenfolge entschlüsselt, statt nur
 *  ein festes Muster zu erwarten — sonst prüft dieser Test nach dem
 *  nächsten Generatorwechsel wieder nur sich selbst.
 *
 *  Frühere Fassungen dieser Datei nutzten inkrementelle Updates,
 *  deshalb wird JEDER Stream gelesen. Ein überschatteter alter Stand
 *  fiele dabei mit auf, und genau das ist gewollt: Eine gestrichene
 *  Zusage darf auch als Leiche nicht in der Datei liegen bleiben. */
function entpackePdfText(roh) {
  let text = "";
  const muster = /\/Filter\s*\[\s*([^\]]+?)\s*\]\s*\/Length\s+(\d+)(?:\s*\/\w+\s+\d+)*\s*>>\s*stream\r?\n/g;
  const latin = roh.toString("latin1");
  let treffer;
  while ((treffer = muster.exec(latin)) !== null) {
    const filter = treffer[1].split(/\s+/).filter(Boolean);
    const laenge = Number(treffer[2]);
    const start = treffer.index + treffer[0].length;
    try {
      let daten = roh.subarray(start, start + laenge);
      for (const stufe of filter) {
        if (stufe === "/ASCII85Decode") daten = entpackeAscii85(daten.toString("latin1"));
        else if (stufe === "/FlateDecode") daten = zlib.inflateSync(daten);
      }
      text += daten.toString("latin1");
    } catch {
      /* Schriftschnitte und andere Binaerdaten — nicht von Belang. */
    }
  }
  return text;
}
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
  pruefe(
    `${name}: bezeichnet sich nicht mehr pauschal als unausgefüllt`,
    !text.includes("Diese Seite ist noch nicht ausgefüllt"),
  );
  pruefe(`${name}: Seitentitel gesetzt`, (await page.title()).includes(ueberschrift), await page.title());
}
/* Die Marke wird per CSS in Grossbuchstaben gesetzt (text-transform),
   und innerText gibt den GERENDERTEN Text zurück — deshalb ohne
   Rücksicht auf Gross- und Kleinschreibung vergleichen.

   Seit 21.09.2026 gilt das nur noch für Widerruf: Dort ist Abschnitt 1
   (das gesetzliche Widerrufsrecht) weiterhin offen — die Frage nach
   § 312g Abs. 2 Nr. 9 BGB ist ungeklärt. Die AGB sind seitdem
   VOLLSTÄNDIG ausgefüllt (Doc03) und tragen deshalb KEINE
   Platzhalter-Markierung mehr — eine Seite, die geltende Bedingungen
   enthält und sich zugleich als „noch nicht ausgefüllt" bezeichnet,
   wäre in beide Richtungen irreführend. */
await page.goto(BASIS + "/widerruf", { waitUntil: "networkidle" });
const widerrufOffenText = await page.locator("body").innerText();
pruefe(
  "Widerruf: markiert den offenen Abschnitt 1 sichtbar als Platzhalter",
  /platzhalter/i.test(widerrufOffenText) &&
    widerrufOffenText.includes("Dieser Abschnitt ist noch nicht ausgefüllt"),
);
await page.goto(BASIS + "/agb", { waitUntil: "networkidle" });
const agbKeinPlatzhalterText = await page.locator("body").innerText();
pruefe(
  "AGB: enthält KEINE Platzhalter-Markierung mehr — vollständig ausgefüllt",
  !/platzhalter/i.test(agbKeinPlatzhalterText) &&
    !agbKeinPlatzhalterText.includes("Dieser Abschnitt ist noch nicht ausgefüllt"),
);

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
/* Entfernt am 21.09.2026: Seit Entscheidung 2.5 lässt sich ohne
   feststehenden Termin gar nicht erst buchen — die Klausel regelte
   einen Fall, den es nicht mehr geben kann, und blieb als tote
   Textleiche stehen. Diese Prüfung hält sie jetzt fern, statt sie zu
   verlangen. */
pruefe(
  "Widerruf: die tote Klausel zum fehlenden Termin ist entfernt",
  !wText.includes("noch kein Termin feststeht"),
);
/* Ergänzt am 21.09.2026 (§ 309 Nr. 5 BGB): Die Pauschalverweigerung
   nach Fristablauf braucht Anrechnung und einen Nachweisvorbehalt,
   sonst wäre sie angreifbar. */
pruefe(
  "Widerruf: rechnet ersparte Aufwendungen auf den einbehaltenen Betrag an",
  /anrechnen lassen, was an Aufwendungen erspart/i.test(wText),
);
pruefe(
  "Widerruf: lässt den Nachweis eines geringeren Schadens ausdrücklich zu",
  /Nachweis vorbehalten, dass VERA kein oder ein wesentlich geringerer Schaden/i.test(wText),
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
/* "storno" ist NICHT in "Stornierung" enthalten (…stor-n-I-erung, nicht
   …stor-n-O) — die alte Prüfung suchte nach einem Wortstamm, der seit
   der vollständigen AGB-Konsolidierung (21.09.2026, Ziffer 7) gar
   nicht mehr vorkommt. Geprüft wird jetzt die tatsächlich verwendete
   Form. */
pruefe(
  "AGB: die Stornierungsbedingungen sind darin genannt",
  (await page.locator("body").innerText()).toLowerCase().includes("stornierung"),
);

// Datenschutz: die Tatsache zur Zahlung ist ergänzt
await page.goto(BASIS + "/datenschutz", { waitUntil: "networkidle" });
/* Weiche Trennstellen (­) raus: Sie stehen in den Überschriften,
   damit lange Komposita auf dem Handy mit Bindestrich umbrechen. Für
   einen Wortlaut-Vergleich wären sie unsichtbare Stolperfallen. */
const dsText = (await page.locator("body").innerText()).replace(/­/g, "");
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

/* ── Einverständniserklärungen für Minderjährige ─────────────────

   Dieser Abschnitt ist verbindlich und muss mit der
   Datenschutzinformation auf Seite 2 des Papierformulars
   übereinstimmen. Geprüft werden die Punkte, an denen ein
   Auseinanderlaufen teuer wäre: Gesundheitsdaten, Rechtsgrundlage
   dafür, die Rolle der Halle und die Löschfrist für
   Gesundheitsangaben. */
pruefe(
  "Datenschutz: hat einen eigenen Abschnitt zu den Einverständniserklärungen",
  dsText.includes("Einverständniserklärungen für minderjährige Teilnehmer"),
);
pruefe(
  "Datenschutz: nennt die Gesundheitsangaben als freiwillig",
  /Allergien, Erkrankungen oder erforderlichen Notfallmedikamenten sind[\s\S]{0,20}freiwillig/i.test(
    dsText,
  ),
);
pruefe(
  "Datenschutz: nennt die Einwilligung nach Art. 9 Abs. 2 Buchst. a DSGVO",
  /Art\.\s*9\s*Abs\.\s*1?\s*2?\s*Buchst\.\s*a/i.test(dsText),
);
pruefe(
  "Datenschutz: nennt Art. 6 Abs. 1 Buchst. b und f DSGVO",
  /Art\.\s*6\s*Abs\.\s*1\s*Buchst\.\s*b/i.test(dsText) &&
    /Art\.\s*6\s*Abs\.\s*1\s*Buchst\.\s*f/i.test(dsText),
);
pruefe(
  "Datenschutz: stellt klar, dass die Location keine Kopie behält",
  /behält keine Kopie und verwendet die Angaben nicht für eigene Zwecke/i.test(dsText),
);
/* Frist geändert am 17.09.2026: Das Löschkonzept setzt SIEBEN Tage um
   (lib/loeschfristen.ts → GESUNDHEIT_TAGE), die Seite nannte vorher
   „spätestens 30 Tage". Sieben liegen innerhalb von dreißig — falsch
   war die alte Angabe also nicht, nur ungenau. Geprüft wird jetzt die
   Frist, die tatsächlich gilt.

   Das unterschriebene Papierformular nennt weiterhin dreißig Tage;
   beim nächsten Neusatz gehört die Zahl angeglichen. Solange das nicht
   geschehen ist, prüft diese Liste bewusst NICHT auf Wortgleichheit
   mit dem Formular — sie prüft, dass die Seite die Frist nennt, die
   der Code einhält. */
pruefe(
  "Datenschutz: nennt die Löschfrist für Gesundheitsangaben (sieben Tage)",
  /spätestens sieben Tage nach Veranstaltungsende/i.test(dsText),
);
pruefe(
  "Datenschutz: hat einen Abschnitt zu Speicherdauer und Löschung",
  dsText.includes("Speicherdauer und Löschung"),
);
pruefe(
  "Datenschutz: nennt die Aufbewahrung der Steuerunterlagen ausdrücklich getrennt",
  /§ 147 der Abgabenordnung/i.test(dsText) &&
    /von der automatischen Löschung ausdrücklich nicht erfasst/i.test(dsText),
);
pruefe(
  "Datenschutz: benennt die Löschsperren mit Grund, Datum und Person",
  /Grund, Datum und verantwortlicher Person/i.test(dsText),
);
pruefe(
  "Datenschutz: sagt, was mit Sicherungen und Wiederherstellungen passiert",
  /180 Tagen automatisch gelöscht/i.test(dsText) &&
    /wird die Löschung unmittelbar danach erneut ausgeführt/i.test(dsText),
);
pruefe(
  "Datenschutz: sagt, dass das Löschprotokoll keine Namen enthält",
  /keine Namen, E-Mail-Adressen oder Telefonnummern/i.test(dsText),
);
pruefe(
  "Datenschutz: grenzt den Abschnitt auf das Formular ein",
  /Angaben auf der Einverständniserklärung/i.test(dsText),
);

/* Seit 21.09.2026 vollständig ausgefüllt (Doc03), kein Platzhalter
   mehr — geprüft wird jetzt der tatsächliche Geltungsbereich statt
   des früheren Platzhalter-Hinweises "nicht vorgeschrieben". */
await page.goto(BASIS + "/agb", { waitUntil: "networkidle" });
const agbText = await page.locator("body").innerText();
pruefe(
  "AGB: legen den Geltungsbereich fest (Verbraucher/Unternehmer)",
  /Verbraucher ist, wer den Vertrag zu Zwecken abschließt/i.test(agbText),
);
pruefe(
  "AGB: unterscheiden Stornierung vom gesetzlichen Widerrufsrecht",
  /wird durch ein etwaiges Widerrufsrecht nicht berührt/i.test(agbText),
);

/* ── Anmeldung Minderjähriger ────────────────────────────────────

   Der Abschnitt ist verbindlich, nicht Platzhalter. Geprüft wird
   nicht nur, DASS er da ist, sondern dass die tragenden Aussagen
   darin stehen — und dass die alte Fassung mit pauschalem
   Haftungsausschluss nicht zurückkehrt.

   Überschrift seit der vollständigen AGB-Konsolidierung (21.09.2026)
   "6. Anmeldung Minderjähriger" statt vormals "Teilnahme
   Minderjähriger" — mit Ziffer 3 (Vertragsschluss) und Ziffer 9
   (Pflichten während der Veranstaltung) abgestimmt, die den Begriff
   "Anmeldung" bzw. "Teilnahme" jeweils konsequent nutzen. */
pruefe(
  "AGB: enthalten den Abschnitt „Anmeldung Minderjähriger“",
  agbText.includes("Anmeldung Minderjähriger"),
);
pruefe(
  "AGB: verlangen die Zustimmung einer erziehungsberechtigten Person",
  /nur mit Zustimmung einer erziehungsberechtigten Person/i.test(agbText),
);
pruefe(
  "AGB: nennen die Abgabe spätestens beim Check-in",
  /spätestens beim Check-in abgegeben/i.test(agbText),
);
/* Umgedreht am 16.09.2026: Hier stand einmal, die AGB müssten eine
   elektronische Übermittlung ausdrücklich zulassen. Es gibt keine —
   weder eine Upload-Funktion noch eine Einreichung per Mail. Der Satz
   hätte Eltern nach einem Weg suchen lassen, den es nicht gibt, und
   ist auf allen vier Stellen gestrichen. Diese Prüfung hält ihn fern. */
pruefe(
  "AGB: versprechen KEINE elektronische Übermittlung",
  !/elektronische Übermittlung/i.test(agbText),
);
pruefe(
  "AGB: weisen Hin- und Rückweg der erziehungsberechtigten Person zu",
  /Hin- und Rückwegs ist die erziehungsberechtigte Person verantwortlich/i.test(agbText),
);
/* Korrigiert am 21.09.2026 auf das Anlagenmodell (Entscheidung 3.20).
   Die frühere Fassung sagte eine Betreuung/Aufsicht durch VERA zu
   ("Betreuung beginnt mit dem Check-in und endet mit dem offiziellen
   Veranstaltungsende") — das widersprach der späteren Entscheidung,
   dass VERA KEINE Aufsicht übernimmt, und stand als Widerspruch
   sowohl in den AGB als auch im unterschriebenen Papierformular.
   Diese Prüfung hält die falsche Zusage jetzt fern, genau wie die
   Prüfung zur "elektronischen Übermittlung" darüber. */
pruefe(
  "AGB: sagen KEINE Betreuung/Aufsicht durch VERA mehr zu (Anlagenmodell)",
  !/Betreuung durch VERA Events beginnt mit dem vereinbarten Check-in/i.test(agbText),
);
pruefe(
  "AGB: übernehmen ausdrücklich keine Aufsicht über unbegleitete Minderjährige",
  /VERA übernimmt keine Aufsicht über unbegleitete minderjährige Teilnehmende/i.test(agbText),
);
pruefe(
  "AGB: schuldet stattdessen eine Sicherheitseinweisung",
  /Sicherheitseinweisung vor dem ersten Spielen/i.test(agbText),
);
pruefe(
  "AGB: schliessen die Haftung für Leben, Körper und Gesundheit NICHT aus",
  /VERA haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit/i.test(
    agbText,
  ),
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

/* Diese beiden Pruefungen standen frueher andersherum: Sie
   kontrollierten, dass die zwei offenen Felder ERKENNBAR offen sind.
   Seit dem 15.09.2026 liegen die echten Angaben vor — jetzt
   kontrollieren sie, dass die Angaben wirklich dastehen UND der
   Platzhalter verschwunden ist.

   Beide Haelften sind noetig. Nur auf die Anschrift zu pruefen wuerde
   uebersehen, wenn daneben weiterhin „folgt" steht; nur auf das
   Fehlen des Platzhalters zu pruefen wuerde ein leeres Feld
   durchlassen. Ein Impressum ohne ladungsfaehige Anschrift ist der
   Fehler, den diese Liste verhindern soll. */
pruefe(
  "Impressum: die Geschäftsanschrift steht vollständig da",
  impText.includes("Mühlenstr. 8a") && impText.includes("14167 Berlin"),
);
pruefe(
  "Impressum: kein Anschrift-Platzhalter mehr",
  !/Geschäftsanschrift folgt/.test(impText),
);
pruefe("Impressum: die Telefonnummer steht da", impText.includes("+49 3323 0219825"));
pruefe(
  "Impressum: kein Telefon-Platzhalter mehr",
  !/Telefonnummer folgt/.test(impText),
);

/* Die Nummer soll auf dem Handy waehlbar sein. Geprueft wird das
   Ziel des Links, nicht nur seine Anwesenheit: Leerzeichen darin
   wuerden das Waehlen verhindern. */
pruefe(
  "Impressum: die Telefonnummer ist ein wählbarer tel:-Link",
  (await page.locator('a[href="tel:+4933230219825"]').count()) > 0,
);

/* Der Aufbau der Seite ist der endgueltige. Ein Banner „diese Seite
   ist noch nicht ausgefuellt" gehoert deshalb NICHT darauf — anders
   als bei Widerruf, wo Abschnitt 1 (das gesetzliche Widerrufsrecht)
   weiterhin offen ist. Die AGB sind seit 21.09.2026 ebenfalls
   vollstaendig ausgefuellt und tragen deshalb ebenso keinen Banner
   mehr. */
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

/* ── Dieselbe Nummer auf der Kontaktseite ───────────────────────

   Die Telefonnummer steht im Woerterbuch an einer Stelle, wird aber
   an ZWEI Stellen angezeigt — Impressum und Kontaktseite. Der
   tel:-Link ist dabei in beiden Seiten eigener Code; genau so etwas
   laeuft mit der Zeit auseinander. Deshalb wird die Kontaktseite
   hier mitgeprueft, obwohl sie keine Rechtsseite ist. */
await page.goto(BASIS + "/kontakt", { waitUntil: "networkidle" });
const kontaktText = await page.locator("body").innerText();
pruefe("Kontakt: nennt dieselbe Telefonnummer", kontaktText.includes("+49 3323 0219825"));
pruefe(
  "Kontakt: die Nummer ist auch dort wählbar",
  (await page.locator('a[href="tel:+4933230219825"]').count()) > 0,
);
pruefe("Kontakt: kein Telefon-Platzhalter mehr", !/Telefonnummer folgt/.test(kontaktText));

/* ── Kein Reservierungsversprechen an den Kunden ────────────────

   VERA bietet keine Reservierung an: Anmeldung und Bezahlung sind ein
   Vorgang, gekauft ist erst mit erfolgreicher Zahlung. Der Platz wird
   zwar 30 Minuten lang mitgezaehlt, damit er waehrend des laufenden
   Zahlungsvorgangs nicht weggeht — das ist eine technische
   Absicherung, keine Leistung, die zugesagt wird.

   Die Abschluss-Seite sagte dem Kunden aber genau das Gegenteil
   ("Dein Platz ist fuer kurze Zeit reserviert"). Diese Pruefung
   verhindert, dass so eine Formulierung zurueckkehrt.

   Ausnahme seit der AGB-Konsolidierung (21.09.2026): /agb selbst
   beschreibt in Ziffer 3.5 wahrheitsgemaess den technischen
   30-Minuten-Reservierungsmechanismus — UND stellt in derselben
   Ziffer sowie in 3.8 sofort klar, dass daraus kein Anspruch auf
   einen Platz entsteht. Das ist die korrekte, transparente
   Offenlegung des Mechanismus, nicht das Versprechen, das diese
   Pruefung verhindern soll — genau deshalb gehoert die Erklaerung
   dorthin, wo Kunden den Vertragstext nachlesen. */
const versprechen = [];
for (const pfad of gesehen) {
  if (pfad === "/agb") continue;
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

/* ── Die Einverständniserklärung als Datei ───────────────────────

   Das Formular ist ein Rechtsdokument und wird deshalb hier
   mitgeprüft, nicht in einer der Anmelde-Listen. Geprüft wird die
   Auslieferung selbst — dass die Adresse im Text steht, sagt nichts
   darüber, ob dahinter wirklich eine PDF liegt. */
const PDF_PFAD = "/dokumente/einverstaendniserklaerung-minderjaehrige.pdf";
const pdfAntwort = await ctx.request.get(BASIS + PDF_PFAD);
pruefe("Einverständniserklärung: Datei wird ausgeliefert", pdfAntwort.status() === 200,
  `Antwort ${pdfAntwort.status()}`);
pruefe(
  "Einverständniserklärung: wird als PDF ausgeliefert",
  (pdfAntwort.headers()["content-type"] ?? "").includes("application/pdf"),
  pdfAntwort.headers()["content-type"],
);
const pdfRoh = await pdfAntwort.body();
pruefe("Einverständniserklärung: ist eine gültige PDF", pdfRoh.subarray(0, 5).toString() === "%PDF-");
/* Zwei Seiten: Formular und Datenschutzinformation nach Art. 13
   DSGVO. Eine einseitige Datei wäre die alte Fassung — genau der
   Fehler, den ein „hat ja funktioniert" durchrutschen liesse. */
const seitenZahl = (pdfRoh.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
pruefe("Einverständniserklärung: hat zwei Seiten", seitenZahl === 2, `${seitenZahl} Seiten`);

/* ── Eine Domain, eine E-Mail-Adresse ────────────────────────────

   Das Formular kam mit `vera-events.de` und `info@vera-events.de` —
   beides gibt es nicht. In Betrieb sind `veraevents.de` (DNS,
   Zertifikat, OEFFENTLICHE_ADRESSE) und `kontakt@veraevents.de`
   (Impressum, Mailversand). Zwei Schreibweisen derselben Marke sind
   der Fehler, den niemand bemerkt, bis eine Antwort ausbleibt:
   Deshalb wird die PDF hier mitgeprüft, nicht nur die Seiten. */
const pdfText = pdfRoh.toString("latin1");
pruefe(
  "Einverständniserklärung: keine abweichende Domain-Schreibweise",
  !/vera-events\.de/i.test(pdfText),
);
/* Der Text der PDF liegt komprimiert in den Seiteninhalten. Ohne das
   Entpacken würde diese Prüfung auch dann bestehen, wenn der Satz
   wieder darin stünde — sie prüfte dann nämlich gar nichts. */
const pdfSeitentext = entpackePdfText(pdfRoh);
pruefe(
  "Einverständniserklärung: Seitentext lesbar entpackt",
  /Check-in/i.test(pdfSeitentext),
  `${pdfSeitentext.length} Zeichen`,
);
pruefe(
  "Einverständniserklärung: verspricht KEINE elektronische Übermittlung",
  !/elektronische/i.test(pdfSeitentext) && !/bermittlung bleibt/i.test(pdfSeitentext),
);
pruefe(
  "Einverständniserklärung: keine fremde VERA-Adresse",
  !/(info|hallo|mail)@vera[-a-z0-9]*\.de/i.test(pdfText),
);

const domainTreffer = [];
for (const pfad of gesehen) {
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) continue;
  const text = await page.locator("body").innerText();
  const falsch = text.match(/vera-events\.de|(?:info|hallo|mail)@vera[-a-z0-9]*\.de/i);
  if (falsch) domainTreffer.push(`${pfad}: „${falsch[0]}"`);
}
pruefe(
  "Keine öffentliche Seite nennt eine abweichende Domain oder Adresse",
  domainTreffer.length === 0,
  domainTreffer.join(" · "),
);

/* ── Der Hinweis im Anmeldebereich ───────────────────────────────

   Er darf ausschliesslich bei den Wegen mit Minderjährigen
   erscheinen. Bei „Mich selbst" wäre er falsch — dort ist der
   Teilnehmer volljährig. */
await page.goto(BASIS + "/", { waitUntil: "networkidle" });
const eventLinks = await page.$$eval("a[href^='/events/']", (as) => as.map((a) => a.getAttribute("href")));
const eventPfad = eventLinks.length ? eventLinks[0].split("#")[0].replace(/\/$/, "") : null;

if (!eventPfad) {
  pruefe("Anmeldebereich: Event zum Prüfen gefunden", false, "kein Event verlinkt");
} else {
  await page.goto(`${BASIS + eventPfad}/anmeldung`, { waitUntil: "networkidle" });
  const HINWEIS = "Einverständniserklärung für Minderjährige erforderlich";

  // „Mich selbst" ist der Startzustand.
  const selbstText = await page.locator("body").innerText();
  pruefe(
    "Anmeldebereich: kein Minderjährigen-Hinweis bei „Mich selbst“",
    !selbstText.includes(HINWEIS),
  );

  for (const weg of ["Mein Kind", "Familienpaket"]) {
    const wahl = page.getByText(weg, { exact: true });
    if ((await wahl.count()) === 0) {
      pruefe(`Anmeldebereich: Weg „${weg}“ vorhanden`, false, "Auswahl nicht gefunden");
      continue;
    }
    await wahl.first().click();
    await page.waitForTimeout(200);
    const text = await page.locator("body").innerText();
    pruefe(`Anmeldebereich: Hinweis erscheint bei „${weg}“`, text.includes(HINWEIS));
    pruefe(
      `Anmeldebereich: Hinweis verlangt die Abgabe beim Check-in („${weg}“)`,
      /spätestens beim Check-in abgegeben/i.test(text),
    );
    pruefe(
      `Anmeldebereich: Hinweis sagt, dass die Online-Anmeldung nicht genügt („${weg}“)`,
      /Online-Anmeldung allein ersetzt die unterschriebene Erklärung nicht/i.test(text),
    );
    const link = page.locator(`a[href="${PDF_PFAD}"]`);
    pruefe(`Anmeldebereich: Download-Link zeigt auf die Datei („${weg}“)`, (await link.count()) === 1);
  }
}

/* ── Formulierungen, die nicht zurückkehren dürfen ────────────────

   Die erste Fassung der Einverständniserklärung kam von einem
   anderen Werkzeug und enthielt einen pauschalen Haftungsverzicht
   samt Personenschäden sowie die Forderung nach einem Original auf
   Papier. Beides ist ersetzt. Ein Text, der beides wieder behauptet,
   widerspräche dem Formular und den AGB — deshalb wird bei jedem
   Lauf über alle öffentlichen Seiten danach gesucht. */
const ALTFORMULIERUNGEN = [
  /Haftungsverzicht/i,
  /keine Haftung (wird )?übernommen/i,
  /keine Haftung für (Sach|Personen)schäden/i,
  /Original[^.]{0,40}(mitbringen|mitgebracht)/i,
  /Online-Einwilligung genügt/i,
  /Hin- und Rückweg[^.]{0,60}durch VERA/i,
];
const altTreffer = [];
for (const pfad of gesehen) {
  const antwort = await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  if (!antwort || antwort.status() !== 200) continue;
  const text = await page.locator("body").innerText();
  for (const muster of ALTFORMULIERUNGEN) {
    const treffer = text.match(muster);
    if (treffer) altTreffer.push(`${pfad}: „${treffer[0]}"`);
  }
}
pruefe(
  "Keine öffentliche Seite enthält die ersetzten Formulierungen",
  altTreffer.length === 0,
  altTreffer.join(" · "),
);

await ctx.close();
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
