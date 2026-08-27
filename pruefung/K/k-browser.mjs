/* Der Weg im Browser — so, wie ein Besucher ihn erlebt. */
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

/** Füllt das Formular aus, ohne abzuschicken. */
async function formularAusfuellen(page, email, { familie = false } = {}) {
  await db.anmeldeVersuch.deleteMany({});
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await formularAusfuellen(page, `knopf-${Date.now()}@example.org`);
  const knopf = page.getByRole("button", { name: /anmelden & bezahlen/i });
  const beschriftung = (await knopf.textContent()) ?? "";
  pruefe("Der Knopf sagt „anmelden & bezahlen“ und nennt den Betrag",
    /anmelden & bezahlen/i.test(beschriftung) && /7,00/.test(beschriftung), beschriftung.trim());

  await page.screenshot({ path: `${AUS}/knopf-einzel-handy.png`, fullPage: true });
  await ctx.close();
}

// ── Familienpaket: der Betrag im Knopf passt zur Auswahl ───────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const email = `fam-${Date.now()}@example.org`;
  await formularAusfuellen(page, email, { familie: true });

  const summe = (await page.locator('[class*="summeBetrag"]').first().textContent()) ?? "";
  const knopf = page.getByRole("button", { name: /anmelden & bezahlen/i });
  const beschriftung = (await knopf.textContent()) ?? "";
  const betrag = summe.replace(/\s/g, "");
  pruefe("Familienpaket: der Betrag im Knopf ist derselbe wie in der Summe",
    beschriftung.replace(/\s/g, "").includes(betrag), `Knopf „${beschriftung.trim()}“, Summe ${summe.trim()}`);
  await page.screenshot({ path: `${AUS}/knopf-familie-handy.png`, fullPage: true });

  // Abschicken → direkt zum Anbieter
  await knopf.click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  pruefe("Familienpaket geht direkt zur Bezahlseite", page.url().includes("/bezahlseite/"));

  // Bezahlen
  await page.click("#bezahlen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const text = await page.locator("body").innerText();
  pruefe("Nach dem Bezahlen: „Zahlung erfolgreich“ im Plural",
    text.includes("Zahlung erfolgreich") && text.includes("Ihr seid für das Event angemeldet"),
    text.split("\n")[0]);
  pruefe("… und kein Bezahlknopf mehr", !text.includes("Jetzt bezahlen"));
  await page.screenshot({ path: `${AUS}/bezahlt-familie-handy.png`, fullPage: true });
  await ctx.close();
}

// ── Einzelperson: Einzahl ──────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await formularAusfuellen(page, `einzel-${Date.now()}@example.org`);
  await page.getByRole("button", { name: /anmelden & bezahlen/i }).click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  await page.click("#bezahlen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const text = await page.locator("body").innerText();
  pruefe("Einzelperson: „Deine Anmeldung ist bestätigt“ in der Einzahl",
    text.includes("Zahlung erfolgreich") && text.includes("Deine Anmeldung ist bestätigt"),
    (text.match(/Deine Anmeldung ist bestätigt[^\n]*/) ?? ["—"])[0]);
  await ctx.close();
}

// ── Abbruch: keine Zwischenbestätigung ─────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await formularAusfuellen(page, `abbruch-${Date.now()}@example.org`);
  await page.getByRole("button", { name: /anmelden & bezahlen/i }).click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  await page.click("#abbrechen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const text = await page.locator("body").innerText();
  pruefe("Nach Abbruch: „Deine Anmeldung ist noch nicht abgeschlossen“",
    text.includes("noch nicht abgeschlossen"), text.split("\n")[0]);
  pruefe("… kein „Danke“ und kein „bestätigt“",
    !text.includes("Danke —") && !text.includes("Anmeldung ist bestätigt"));
  pruefe("… und ein Knopf „Jetzt bezahlen“", text.includes("Jetzt bezahlen"));
  await page.screenshot({ path: `${AUS}/offen-handy.png`, fullPage: true });

  // Zweiter Anlauf
  await page.getByRole("button", { name: /Jetzt bezahlen/i }).click({ force: true });
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  pruefe("Der Knopf führt zurück zum Anbieter", page.url().includes("/bezahlseite/"));
  await ctx.close();
}

// ── Darstellung in drei Breiten ────────────────────────────────
for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
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
