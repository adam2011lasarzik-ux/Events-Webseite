/* Der Weg im Browser — so, wie ein Besucher ihn erlebt. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { chromium } from "playwright";
import fs from "node:fs";
import { db } from "../../lib/db.js";

const BASIS = "http://127.0.0.1:3213";
const AUS = "pruefung/.ausgabe/K";
fs.mkdirSync(AUS, { recursive: true });

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1; console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

/**
 * Ein Browserfenster mit EIGENER Absenderadresse.
 *
 * Die Bremse gegen Massen-Einsendungen zählt je IP-Adresse. Bis zum
 * 26.09.2026 zählte sie in der Datenbank und liess sich vor jedem
 * Durchlauf leeren; seitdem zählt sie im Arbeitsspeicher des Servers
 * (Entscheidung: kein Datenbankeintrag vor der Zahlung) und ist von
 * aussen nicht mehr zurückzusetzen. Also bekommt jedes Fenster eine
 * eigene Adresse. Der Bereich 198.18.0.0/15 ist für Messungen
 * reserviert und gehört niemandem.
 */
let fensterZaehler = 0;
const neuesFenster = (viewport) =>
  browser.newContext({
    viewport,
    extraHTTPHeaders: {
      "x-forwarded-for":
        `198.18.${Math.floor(Math.random() * 256)}.${((fensterZaehler += 1) % 250) + 1}`,
    },
  });

/** Füllt das Formular aus, ohne abzuschicken. */
async function formularAusfuellen(page, email, { familie = false } = {}) {
  await page.goto(`${BASIS}/events/padel-falkensee/anmeldung`, { waitUntil: "networkidle" });

  /* force: true — beim automatischen Scrollen schiebt Playwright das
     Element unter die haftende Kopfzeile. Ein Mensch tippt direkt
     darauf; das ist ein Kunstgriff der Prüfung, kein Fehler der
     Seite. */
  if (familie) {
    await page.getByRole("radio", { name: /Familienpaket/i }).check({ force: true });
    // Zähler auf 2 Schüler
    const plus = page.getByRole("button", { name: /Einen mehr/i }).first();
    await plus.click({ force: true });
    await page.waitForTimeout(150);
    const felder = page.locator('input[name^="person."][name$=".vorname"]');
    const anzahl = await felder.count();
    for (let i = 0; i < anzahl; i += 1) {
      await page.locator(`input[name="person.${i}.vorname"]`).fill(`Vor${i}`);
      await page.locator(`input[name="person.${i}.nachname"]`).fill(`Nach${i}`);
    }
    await page.locator('input[name="person.0.email"]').fill(email);
    await page.getByRole("checkbox", { name: /erziehungsberechtigt/i }).check({ force: true });
  } else {
    await page.getByRole("radio", { name: /Ich bin Schüler/i }).check({ force: true });
    await page.locator('input[name="person.0.vorname"]').fill("Test");
    await page.locator('input[name="person.0.nachname"]').fill("Person");
    await page.locator('input[name="person.0.email"]').fill(email);
  }
}

// ── Der Knopf nennt Vorgang UND Betrag ─────────────────────────
{
  const ctx = await neuesFenster({ width: 390, height: 844 });
  const page = await ctx.newPage();
  await formularAusfuellen(page, `knopf-${Date.now()}@example.org`);
  const knopf = page.getByRole("button", { name: /Zahlungspflichtig bestellen/i });
  const beschriftung = (await knopf.textContent()) ?? "";
  /* § 312j Abs. 3 BGB: Die Schaltfläche trägt NICHTS als den
     gesetzlichen Wortlaut. Der Betrag steht deshalb daneben, nicht
     darin — und genau das wird hier geprüft. */
  pruefe("Der Knopf trägt genau „Zahlungspflichtig bestellen“, ohne Zusatz",
    beschriftung.trim() === "Zahlungspflichtig bestellen", beschriftung.trim());
  pruefe("Der Betrag steht daneben auf der Seite",
    /7,00/.test(await page.locator("form").innerText()));

  await page.screenshot({ path: `${AUS}/knopf-einzel-handy.png`, fullPage: true });
  await ctx.close();
}

// ── Familienpaket: der Betrag im Knopf passt zur Auswahl ───────
{
  const ctx = await neuesFenster({ width: 390, height: 844 });
  const page = await ctx.newPage();
  const email = `fam-${Date.now()}@example.org`;
  await formularAusfuellen(page, email, { familie: true });

  const summe = (await page.locator('[class*="summeBetrag"]').first().textContent()) ?? "";
  const knopf = page.getByRole("button", { name: /Zahlungspflichtig bestellen/i });
  const beschriftung = (await knopf.textContent()) ?? "";
  const betrag = summe.replace(/\s/g, "");
  /* Der Betrag steht seit B-28 NEBEN dem Knopf, nicht darin
     (§ 312j Abs. 3 BGB — die Schaltfläche trägt nichts als den
     gesetzlichen Wortlaut). Geprüft wird deshalb, dass er im
     Formular steht und mit der Summe übereinstimmt. */
  const formularText = (await page.locator("form").innerText()).replace(/\s/g, "");
  pruefe("Familienpaket: der Betrag neben dem Knopf ist derselbe wie in der Summe",
    formularText.includes(betrag), `Summe ${summe.trim()}`);
  pruefe("Der Knopf selbst trägt genau den gesetzlichen Wortlaut",
    beschriftung.trim() === "Zahlungspflichtig bestellen", beschriftung.trim());
  await page.screenshot({ path: `${AUS}/knopf-familie-handy.png`, fullPage: true });

  // Abschicken → direkt zum Anbieter
  /* Die beiden Pflichthaken (B-29, B-17). Ohne sie lehnt der Server
     ab — zu Recht. Liste V prüft sie eigens, auch ihr Fehlen. */
  await page.getByRole("checkbox", { name: /Teilnahmebedingungen/i }).check({ force: true });
  await page.getByRole("checkbox", { name: /zur Kenntnis genommen/i }).check({ force: true });
  await knopf.click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  pruefe("Familienpaket geht direkt zur Bezahlseite", page.url().includes("/bezahlseite/"));

  // Bezahlen
  await page.click("#bezahlen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  /* „load" statt „networkidle": Die Abschluss-Seite fragt beim
     Anbieter nach und hält dabei eine Verbindung offen; „networkidle"
     wartet dann bis zum Zeitablauf, obwohl die Seite längst da ist. */
  await page.waitForLoadState("load");
  const text = await page.locator("body").innerText();
  pruefe("Nach dem Bezahlen: „Zahlung erfolgreich“ im Plural",
    text.includes("Zahlung erfolgreich") && text.includes("Ihr seid für das Event angemeldet"),
    text.split("\n")[0]);
  pruefe("… und kein Bezahlknopf mehr",
    (await page.getByRole("button", { name: "Bezahlen", exact: true }).count()) === 0);
  await page.screenshot({ path: `${AUS}/bezahlt-familie-handy.png`, fullPage: true });
  await ctx.close();
}

// ── Einzelperson: Einzahl ──────────────────────────────────────
{
  const ctx = await neuesFenster({ width: 390, height: 844 });
  const page = await ctx.newPage();
  await formularAusfuellen(page, `einzel-${Date.now()}@example.org`);
  /* Die beiden Pflichthaken (B-29, B-17). Ohne sie lehnt der Server
     ab — zu Recht. Liste V prüft sie eigens, auch ihr Fehlen. */
  await page.getByRole("checkbox", { name: /Teilnahmebedingungen/i }).check({ force: true });
  await page.getByRole("checkbox", { name: /zur Kenntnis genommen/i }).check({ force: true });
  await page.getByRole("button", { name: /Zahlungspflichtig bestellen/i }).click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  await page.click("#bezahlen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  /* „load" statt „networkidle": Die Abschluss-Seite fragt beim
     Anbieter nach und hält dabei eine Verbindung offen; „networkidle"
     wartet dann bis zum Zeitablauf, obwohl die Seite längst da ist. */
  await page.waitForLoadState("load");
  const text = await page.locator("body").innerText();
  pruefe("Einzelperson: „Deine Anmeldung ist bestätigt“ in der Einzahl",
    text.includes("Zahlung erfolgreich") && text.includes("Deine Anmeldung ist bestätigt"),
    (text.match(/Deine Anmeldung ist bestätigt[^\n]*/) ?? ["—"])[0]);
  await ctx.close();
}

// ── Abbruch: es bleibt NICHTS zurück ──────────────────────────
{
  const ctx = await neuesFenster({ width: 390, height: 844 });
  const page = await ctx.newPage();
  const email = `abbruch-${Date.now()}@example.org`;
  await formularAusfuellen(page, email);
  /* Die beiden Pflichthaken (B-29, B-17). Ohne sie lehnt der Server
     ab — zu Recht. Liste V prüft sie eigens, auch ihr Fehlen. */
  await page.getByRole("checkbox", { name: /Teilnahmebedingungen/i }).check({ force: true });
  await page.getByRole("checkbox", { name: /zur Kenntnis genommen/i }).check({ force: true });
  await page.getByRole("button", { name: /Zahlungspflichtig bestellen/i }).click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  await page.click("#abbrechen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("load");
  const text = await page.locator("body").innerText();

  /* Bis zum 26.09.2026 stand hier „Deine Anmeldung ist noch nicht
     abgeschlossen" samt einem Knopf, der zur alten Bezahlseite
     zurückführte. Beides setzte voraus, dass es einen Vorgang gibt,
     den man fortsetzen kann. Den gibt es nicht mehr: Vor der Zahlung
     wird nichts gespeichert. Die Seite sagt jetzt, was wirklich
     geschehen ist. */
  pruefe("Nach Abbruch sagt die Seite, dass nichts abgebucht wurde",
    text.includes("nichts abgebucht"), text.split("\n").slice(0, 3).join(" / "));
  pruefe("… und dass die Angaben nicht gespeichert wurden",
    text.includes("nicht gespeichert"));
  pruefe("… kein „Danke“ und kein „bestätigt“",
    !text.includes("Danke —") && !text.includes("Anmeldung ist bestätigt"));
  pruefe("… und KEIN Knopf „Bezahlen“, der einen Vorgang fortsetzen würde",
    (await page.getByRole("button", { name: "Bezahlen", exact: true }).count()) === 0);
  pruefe("In der Datenbank steht nichts",
    (await db.registration.count({ where: { kontaktEmail: email } })) === 0);
  await page.screenshot({ path: `${AUS}/offen-handy.png`, fullPage: true });

  /* Der zweite Anlauf ist eine gewöhnliche neue Anmeldung. Dass sie
     möglich ist, ist zugleich der Beweis, dass der Abbruch nichts
     hinterlassen hat, das im Weg stünde. */
  await formularAusfuellen(page, email);
  await page.getByRole("checkbox", { name: /Teilnahmebedingungen/i }).check({ force: true });
  await page.getByRole("checkbox", { name: /zur Kenntnis genommen/i }).check({ force: true });
  await page.getByRole("button", { name: /Zahlungspflichtig bestellen/i }).click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  pruefe("Dieselbe Person kann sich danach neu anmelden",
    page.url().includes("/bezahlseite/"), page.url());
  await ctx.close();
}

// ── Darstellung in drei Breiten ────────────────────────────────
for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await neuesFenster({ width: g.width, height: g.height });
  const page = await ctx.newPage();
  await formularAusfuellen(page, `bild-${g.name}-${Date.now()}@example.org`);
  await page.screenshot({ path: `${AUS}/formular-${g.name}.png`, fullPage: true });
  const breiter = await page.evaluate(() => { window.scrollTo(9999, 0); return window.scrollX; });
  pruefe(`Anmeldeseite ${g.name}: schiebt sich nicht seitwärts`, breiter === 0);
  await ctx.close();
}

await browser.close();
await db.$disconnect().catch(() => {});
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
