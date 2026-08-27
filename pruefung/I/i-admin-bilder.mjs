/* Adminbereich im Browser: anmelden, Gründerbereich ansehen,
   Bildschirmfotos in drei Breiten, waagerechtes Scrollen prüfen. */
import { chromium } from "playwright";
import fs from "node:fs";
const AUS = "pruefung/.ausgabe/I/admin";
fs.mkdirSync(AUS, { recursive: true });
const BASIS = "http://127.0.0.1:3213";

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1; console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

for (const g of [
  { name: "handy", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: g.width, height: g.height } });
  const page = await ctx.newPage();
  await page.goto(`${BASIS}/admin/login`);
  await page.fill('input[name="email"]', "test-admin@vera.example");
  await page.fill('input[name="passwort"]', "Sonnenblume-Kaffee-Regen");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 15000 });

  await page.click('a[href="/admin/einstellungen"]');
  await page.waitForURL("**/admin/einstellungen");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${AUS}/einstellungen-${g.name}.png`, fullPage: true });

  const breiter = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  pruefe(`Gründerbereich-Seite ohne waagerechtes Scrollen (${g.name})`, !breiter);

  const datei = await page.locator('input[type="file"][name="gruenderBild"]').count();
  pruefe(`Dateiauswahl vorhanden (${g.name})`, datei === 1);

  if (g.name === "desktop") {
    // Der Haken im Event-Formular
    await page.goto(`${BASIS}/admin`);
    await page.click("a[href^='/admin/events/']");
    await page.waitForLoadState("networkidle");
    const haken = page.locator('input[name="gruenderZeigen"]');
    pruefe("Haken im Event-Formular vorhanden", (await haken.count()) === 1);
    await haken.scrollIntoViewIfNeeded();
    const karte = page.locator('input[name="gruenderZeigen"]').locator("xpath=ancestor::div[1]/..");
    await karte.screenshot({ path: `${AUS}/event-haken.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) process.exit(1);
