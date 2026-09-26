/* Der Weg im Browser: anmelden, bezahlen, zurückkommen.

   Der Anbieter ist eine Ersatzseite (Attrappe) — der Klick durch
   Stripes echte Bezahlseite bleibt offen, bis es ein Hosting gibt.
   Alles davor und danach ist echt. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { chromium } from "playwright";
import fs from "node:fs";
import { db } from "../../lib/db.js";

const BASIS = "http://127.0.0.1:3213";
const AUS = "pruefung/.ausgabe/J";
fs.mkdirSync(AUS, { recursive: true });

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
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
 * eigene Adresse — dieselbe Lösung wie in den Listen ohne Browser.
 * Der Bereich 198.18.0.0/15 ist für Messungen reserviert.
 */
let fensterZaehler = 0;
const neuesFenster = (browser, viewport) =>
  browser.newContext({
    viewport,
    extraHTTPHeaders: {
      "x-forwarded-for": `198.18.${Math.floor(Math.random() * 256)}.${(fensterZaehler += 1) % 250 + 1}`,
    },
  });

async function anmeldenImBrowser(page, email) {
  await page.goto(`${BASIS}/events/padel-falkensee/anmeldung`, { waitUntil: "load" });
  await page.getByRole("radio", { name: /Ich bin Schüler/i }).check();
  await page.locator('input[name="person.0.vorname"]').fill("Test");
  await page.locator('input[name="person.0.nachname"]').fill("Person");
  await page.locator('input[name="person.0.email"]').fill(email);
  /* Die beiden Pflichthaken (B-29, B-17). Ohne sie lehnt der Server
     ab — zu Recht. Liste V prüft sie eigens, auch ihr Fehlen. */
  await page.getByRole("checkbox", { name: /Teilnahmebedingungen/i }).check({ force: true });
  await page.getByRole("checkbox", { name: /zur Kenntnis genommen/i }).check({ force: true });
  await page.getByRole("button", { name: /Zahlungspflichtig bestellen/i }).click();
  /* Die Weiterleitung führt auf eine FREMDE Adresse. Der Browser lädt
     dafür die ganze Seite neu; „networkidle" ist auf der alten Seite
     schon vorher erreicht und käme zu früh. */
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
}

// ── Weg 1: abbrechen — es bleibt NICHTS zurück ────────────────
{
  const ctx = await neuesFenster(browser, { width: 390, height: 844 });
  const page = await ctx.newPage();
  const email = `abbruch-${Date.now()}@example.org`;
  await anmeldenImBrowser(page, email);
  pruefe("Nach dem Absenden landet man beim Anbieter",
    page.url().includes("/bezahlseite/"), page.url());
  pruefe("… und in der Datenbank steht dabei NICHTS",
    (await db.registration.count({ where: { kontaktEmail: email } })) === 0);

  await page.click("#abbrechen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  /* „load" statt „networkidle": Die Abschluss-Seite fragt beim
     Anbieter nach und hält dabei eine Verbindung offen; „networkidle"
     wartet dann bis zum Zeitablauf, obwohl die Seite längst da ist. */
  await page.waitForLoadState("load");
  const text = await page.locator("body").innerText();
  pruefe("Abbrechen führt zurück zur Danke-Seite", page.url().includes("/anmeldung/danke"));
  /* Bis zum 26.09.2026 stand hier „Der Platz bleibt reserviert und es
     gibt einen zweiten Anlauf" — mit einem Knopf, der zur alten
     Bezahlseite zurückführte. Beides ist fort: Es gibt keinen Platz,
     der bliebe, und keinen Vorgang, den ein Knopf fortsetzen könnte.
     Die Seite sagt jetzt, was wirklich geschehen ist. */
  pruefe("Die Seite sagt, dass nichts gespeichert und nichts abgebucht wurde",
    text.includes("nichts abgebucht") && text.includes("nicht gespeichert"),
    text.split("\n").find((z) => z.includes("abgebucht")) ?? "—");
  pruefe("… und bietet keinen Bezahlknopf mehr",
    (await page.getByRole("button", { name: "Bezahlen", exact: true }).count()) === 0);
  pruefe("… und behauptet nicht, die Anmeldung sei angekommen",
    !text.includes("Danke — wir haben deine Anmeldung"));
  pruefe("Und es ist immer noch nichts gespeichert",
    (await db.registration.count({ where: { kontaktEmail: email } })) === 0);
  await page.screenshot({ path: `${AUS}/danke-abgebrochen-handy.png`, fullPage: true });

  // Der Weg zurück führt über das Formular, nicht über einen Knopf.
  const zurueck = await page.getByRole("link", { name: /Zurück zu den Veranstaltungen/i }).count();
  pruefe("Es gibt einen Weg zurück zu den Veranstaltungen", zurueck >= 1, `${zurueck} Links`);
  await ctx.close();
}

// ── Weg 2: bezahlen ───────────────────────────────────────────
{
  const ctx = await neuesFenster(browser, { width: 390, height: 844 });
  const page = await ctx.newPage();
  const email = `bezahlt-${Date.now()}@example.org`;
  await anmeldenImBrowser(page, email);
  await page.click("#bezahlen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  /* „load" statt „networkidle": Die Abschluss-Seite fragt beim
     Anbieter nach und hält dabei eine Verbindung offen; „networkidle"
     wartet dann bis zum Zeitablauf, obwohl die Seite längst da ist. */
  await page.waitForLoadState("load");
  const text = await page.locator("body").innerText();
  pruefe("Nach dem Bezahlen landet man auf der Danke-Seite",
    page.url().includes("/anmeldung/danke"), page.url());
  pruefe("Die Seite zeigt die Zahlung als eingegangen",
    text.includes("Bezahlt") && text.includes("fest gebucht"),
    text.split("\n").find((z) => z.includes("Bezahlt")) ?? "—");
  pruefe("Kein Bezahlknopf mehr",
    (await page.getByRole("button", { name: "Bezahlen", exact: true }).count()) === 0);
  /* Der eigentliche Beweis: Erst jetzt gibt es die Anmeldung. Die
     Abschluss-Seite hat sie selbst angelegt — sie fragt beim Anbieter
     nach und ist damit schneller als dessen Rückmeldung. */
  const angelegt = await db.registration.findFirst({
    where: { kontaktEmail: email }, include: { teilnehmer: true },
  });
  pruefe("Erst jetzt steht die Anmeldung in der Datenbank",
    angelegt !== null && angelegt.status === "BESTAETIGT" && angelegt.zahlungsStatus === "BEZAHLT",
    `${angelegt?.status} / ${angelegt?.zahlungsStatus}`);
  pruefe("… mit dem angemeldeten Teilnehmer", angelegt?.teilnehmer.length === 1);
  await page.screenshot({ path: `${AUS}/danke-bezahlt-handy.png`, fullPage: true });
  await ctx.close();
}

// ── Weg 3: gefälschte Rückkehr ─────────────────────────────────
{
  const ctx = await neuesFenster(browser, { width: 390, height: 844 });
  const page = await ctx.newPage();
  const email = `faelschung-${Date.now()}@example.org`;
  await anmeldenImBrowser(page, email);
  const sitzungId = new URL(page.url()).pathname.split("/").pop();

  /* Die Rückkehr von Hand in die Adresszeile schreiben, OHNE zu
     bezahlen — genau das, was jemand tun würde, der sich den Platz
     erschleichen will. Die Seite fragt selbst beim Anbieter nach;
     dem Browser glaubt sie nichts. */
  await page.goto(`${BASIS}/anmeldung/danke?sitzung=${sitzungId}&zahlung=zurueck`,
    { waitUntil: "load" });
  const text = await page.locator("body").innerText();
  pruefe("Eine selbst getippte Rückkehr macht NICHT bezahlt",
    !text.includes("fest gebucht"),
    text.split("\n").find((z) => z.includes("gebucht")) ?? "—");
  pruefe("… und legt vor allem KEINE Anmeldung an",
    (await db.registration.count({ where: { kontaktEmail: email } })) === 0);

  // Und auch eine frei erfundene Sitzungskennung ändert daran nichts.
  await page.goto(`${BASIS}/anmeldung/danke?sitzung=cs_test_frei_erfunden&zahlung=zurueck`,
    { waitUntil: "load" });
  pruefe("Eine erfundene Sitzungskennung führt zu keiner Anmeldung",
    (await db.registration.count({ where: { zahlungsReferenz: "cs_test_frei_erfunden" } })) === 0);
  await ctx.close();
}

// ── Darstellung in allen drei Designs und drei Breiten ─────────
for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await neuesFenster(browser, { width: g.width, height: g.height });
  const page = await ctx.newPage();
  await anmeldenImBrowser(page, `bild-${g.name}-${Date.now()}@example.org`);
  await page.click("#abbrechen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  /* „load" statt „networkidle": Die Abschluss-Seite fragt beim
     Anbieter nach und hält dabei eine Verbindung offen; „networkidle"
     wartet dann bis zum Zeitablauf, obwohl die Seite längst da ist. */
  await page.waitForLoadState("load");
  const breiter = await page.evaluate(() => { window.scrollTo(9999, 0); return window.scrollX; });
  pruefe(`Danke-Seite ${g.name}: schiebt sich nicht seitwärts`, breiter === 0);
  await page.screenshot({ path: `${AUS}/danke-${g.name}.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
await db.$disconnect().catch(() => {});
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
