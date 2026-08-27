/* Der Weg im Browser: anmelden, bezahlen, zurückkommen.

   Der Anbieter ist eine Ersatzseite (Attrappe) — der Klick durch
   Stripes echte Bezahlseite bleibt offen, bis es ein Hosting gibt.
   Alles davor und danach ist echt. */
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

async function anmeldenImBrowser(page, email) {
  /* Die Bremse gegen Massen-Einsendungen zählt je IP-Adresse. Der
     Browser kann sich keine andere vortäuschen, deshalb wird der
     Zähler vor jedem Durchlauf geleert. Die Bremse selbst ist in der
     E-Prüfliste eigens geprüft. */
  await db.anmeldeVersuch.deleteMany({});
  await page.goto(`${BASIS}/events/padel-falkensee/anmeldung`, { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /Ich bin Schüler/i }).check();
  await page.locator('input[name="person.0.vorname"]').fill("Test");
  await page.locator('input[name="person.0.nachname"]').fill("Person");
  await page.locator('input[name="person.0.email"]').fill(email);
  await page.getByRole("button", { name: /anmelden & bezahlen|Anmeldung abschicken/i }).click();
  /* Die Weiterleitung führt auf eine FREMDE Adresse. Der Browser lädt
     dafür die ganze Seite neu; „networkidle" ist auf der alten Seite
     schon vorher erreicht und käme zu früh. */
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
}

// ── Weg 1: abbrechen ───────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await anmeldenImBrowser(page, `abbruch-${Date.now()}@example.org`);
  pruefe("Nach dem Absenden landet man beim Anbieter",
    page.url().includes("/bezahlseite/"), page.url());

  await page.click("#abbrechen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const text = await page.locator("body").innerText();
  pruefe("Abbrechen führt zurück zur Danke-Seite", page.url().includes("/anmeldung/danke"));
  /* Seit Schritt K heißt der unbezahlte Zustand nicht mehr „Platz
     reserviert", sondern klar „noch nicht abgeschlossen" — die
     Reservierung ist seitdem reine Technik und keine Bestätigung. */
  pruefe("Der Platz bleibt reserviert und es gibt einen zweiten Anlauf",
    text.includes("noch nicht abgeschlossen") && text.includes("Jetzt bezahlen"));
  pruefe("Der Betrag steht als offen da", text.includes("Noch offen"));
  await page.screenshot({ path: `${AUS}/danke-abgebrochen-handy.png`, fullPage: true });

  // Zweiter Anlauf über den Knopf
  await page.getByRole("button", { name: /Jetzt bezahlen/i }).click();
  await page.waitForURL(/\/bezahlseite\//, { timeout: 20000 });
  pruefe("Der Knopf „Jetzt bezahlen“ führt wieder zum Anbieter",
    page.url().includes("/bezahlseite/"), page.url());
  await ctx.close();
}

// ── Weg 2: bezahlen ────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await anmeldenImBrowser(page, `bezahlt-${Date.now()}@example.org`);
  await page.click("#bezahlen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const text = await page.locator("body").innerText();
  pruefe("Nach dem Bezahlen landet man auf der Danke-Seite",
    page.url().includes("/anmeldung/danke"), page.url());
  pruefe("Die Seite zeigt die Zahlung als eingegangen",
    text.includes("Bezahlt") && text.includes("fest gebucht"),
    text.split("\n").find((z) => z.includes("Bezahlt")) ?? "—");
  pruefe("Kein Bezahlknopf mehr", !text.includes("Jetzt bezahlen"));
  await page.screenshot({ path: `${AUS}/danke-bezahlt-handy.png`, fullPage: true });
  await ctx.close();
}

// ── Weg 3: gefälschte Rückkehr ─────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const email = `faelschung-${Date.now()}@example.org`;
  await anmeldenImBrowser(page, email);
  const sitzungId = new URL(page.url()).pathname.split("/").pop();
  // Die Rückkehr von Hand in die Adresszeile schreiben, ohne zu
  // bezahlen — genau das, was jemand tun würde, der sich den Platz
  // erschleichen will.
  const sitzungen = await (await fetch("http://127.0.0.1:4242/steuerung/sitzungen")).json();
  const meine = sitzungen.find((s) => s.id === sitzungId);
  await page.goto(`${BASIS}/anmeldung/danke?nr=${meine.metadata.anmeldungId}&zahlung=zurueck`,
    { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  pruefe("Eine selbst getippte Rückkehr macht NICHT bezahlt",
    !text.includes("fest gebucht") && text.includes("Jetzt bezahlen"));
  await ctx.close();
}

// ── Darstellung in allen drei Designs und drei Breiten ─────────
for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  await anmeldenImBrowser(page, `bild-${g.name}-${Date.now()}@example.org`);
  await page.click("#abbrechen");
  await page.waitForURL(/\/anmeldung\/danke/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const breiter = await page.evaluate(() => { window.scrollTo(9999, 0); return window.scrollX; });
  pruefe(`Danke-Seite ${g.name}: schiebt sich nicht seitwärts`, breiter === 0);
  await page.screenshot({ path: `${AUS}/danke-${g.name}.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
await db.$disconnect().catch(() => {});
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
