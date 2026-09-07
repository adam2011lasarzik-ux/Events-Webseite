import { db } from "../lib/db.js";
import { chromium } from "playwright";

const event = await db.event.findFirst({ where: { status: "VEROEFFENTLICHT" } });
const a = await db.registration.create({
  data: {
    eventId: event.id, kontaktVorname: "Test", kontaktNachname: "Person",
    kontaktEmail: "textprobe@beispiel.example", buchungsart: "EINZEL",
    status: "RESERVIERT", reserviertBis: new Date(Date.now() + 30 * 60000),
    einwilligungVormund: false, einwilligungFotos: false, gesamtpreisCents: 1400,
    teilnehmer: { create: [{ vorname: "Test", nachname: "Person", typ: "ERWACHSENER" }] },
  },
});

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage();
for (const [name, q] of [["Nach Abbruch", "&zahlung=abgebrochen"], ["Zahlung offen", ""]]) {
  await p.goto(`http://127.0.0.1:3213/anmeldung/danke?nr=${a.id}${q}`, { waitUntil: "networkidle" });
  const t = await p.locator("body").innerText();
  console.log(`\n──── ${name} ────`);
  console.log(t.split("\n").filter((z) => z.trim()).slice(0, 5).join("\n"));
  const lage = t.slice(t.indexOf("Bezahlung") >= 0 ? t.indexOf("Bezahlung") : 0);
  console.log(`   → "reserviert" irgendwo: ${/reserviert|Reservierung/i.test(t) ? "JA (Fehler!)" : "nein"}`);
  console.log(`   → "{minuten}" sichtbar:  ${t.includes("{minuten}") ? "JA (Fehler!)" : "nein"}`);
}
await b.close();
await db.registration.delete({ where: { id: a.id } });
console.log("\nTestanmeldung wieder entfernt.");
