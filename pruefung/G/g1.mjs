/* Themes: anlegen, wechseln, serverseitig prüfen. */
import { anmelden, hole, sende, actionFelder, alsText } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

await db.anmeldeVersuch.deleteMany({});
// Reste eines früheren Laufs entfernen, damit die Prüfung immer vom
// selben Stand aus startet.
await db.eventAbschnitt.deleteMany({ where: { event: { slug: { startsWith: "probe-" } } } });
await db.event.deleteMany({ where: { slug: { startsWith: "probe-" } } });
const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "198.51.100.1");
const K = s.cookie;
if (!K) throw new Error("Anmeldung fehlgeschlagen");

const neuSeite = await hole("/admin/events/neu", K);
const F = actionFelder(neuSeite.html, 'name="titel"');

const grund = (titel, slug, theme) => ({
  eventId: "", titel, slug, theme, stadt: "Falkensee",
  karteTitel: titel, karteKurz: "Kurztext für die Karte.",
  kurz: "Kurzbeschreibung.", beschreibung: "Ein Absatz.\n\nNoch einer.",
  preisSchueler: "0,00", preisErwachsener: "20,00",
  status: "VEROEFFENTLICHT", kategorie: "NETWORKING", schwelleWenigPlaetze: "10",
  heroAugenbraue: "Netzwerken · Falkensee",
  heroTitel: "Wer kommt, bleibt hängen. Im besten Sinn.",
  heroText: "Ein Abend für Leute, die etwas vorhaben.",
  "block.vorstellung.titel": "Worum es geht",
  "block.vorstellung.inhalt": "Erster Absatz zum Abend.\n\nZweiter Absatz.\n* 40 | Plätze\n* 3 | Stunden",
  "block.ablauf.titel": "Der Abend",
  "block.ablauf.inhalt": "18:30 | Ankommen | Getränk und erste Gespräche.\n19:00 | Kurzvorträge | Drei Beiträge, je zehn Minuten.\n20:00 | Offener Teil | Reden, wen man treffen will.",
  "block.faq.titel": "Häufige Fragen",
  "block.faq.inhalt": "Was ziehe ich an? | Was Sie möchten.\nGibt es Essen? | Fingerfood ist dabei.",
});

// ── Drei Events, drei Themes ───────────────────────────────────
for (const [theme, slug] of [["STANDARD", "probe-standard"], ["BUSINESS", "probe-business"], ["PREMIUM", "probe-premium"]]) {
  await sende("/admin/events/neu", F, grund(`Probe ${theme}`, slug, theme), K);
  const e = await db.event.findUnique({ where: { slug } });
  pruefe(`Event mit Theme ${theme} angelegt`, e?.theme === theme, `gespeichert: ${e?.theme}`);
}

// ── Das Theme landet als Attribut im HTML ──────────────────────
for (const [slug, erwartet] of [["probe-standard", "standard"], ["probe-business", "business"], ["probe-premium", "premium"]]) {
  const seite = await hole(`/events/${slug}`);
  pruefe(`/events/${slug} trägt data-theme="${erwartet}"`,
    seite.html.includes(`data-theme="${erwartet}"`), `Antwort ${seite.status}`);
}

// ── Erfundenes Theme wird abgewiesen ───────────────────────────
await sende("/admin/events/neu", F, grund("Probe Unsinn", "probe-unsinn", "GLITZER"), K);
const unsinn = await db.event.findUnique({ where: { slug: "probe-unsinn" } });
pruefe("Ein erfundenes Theme fällt auf STANDARD zurück", unsinn?.theme === "STANDARD",
  `gespeichert: ${unsinn?.theme}`);

// ── Theme wechseln ändert NUR das Aussehen ─────────────────────
const vorher = await db.event.findUniqueOrThrow({ where: { slug: "probe-standard" }, include: { abschnitte: true } });
const bearbeiten = await hole(`/admin/events/${vorher.id}`, K);
const BF = actionFelder(bearbeiten.html, 'name="titel"');
await sende(`/admin/events/${vorher.id}`, BF,
  { ...grund("Probe STANDARD", "probe-standard", "PREMIUM"), eventId: vorher.id }, K);
const nachher = await db.event.findUniqueOrThrow({ where: { slug: "probe-standard" }, include: { abschnitte: true } });

pruefe("Theme gewechselt", nachher.theme === "PREMIUM");
pruefe("… Preise unverändert",
  nachher.preisSchuelerCents === vorher.preisSchuelerCents &&
  nachher.preisErwachsenerCents === vorher.preisErwachsenerCents,
  `${nachher.preisErwachsenerCents} Cent`);
pruefe("… Plätze und Status unverändert",
  nachher.maxPersonen === vorher.maxPersonen && nachher.status === vorher.status);
pruefe("… Inhaltsblöcke unverändert",
  nachher.abschnitte.length === vorher.abschnitte.length);

// ── Inhaltsblöcke erscheinen auf der Seite ─────────────────────
const bSeite = await hole("/events/probe-business");
const bText = alsText(bSeite.html);
pruefe("Vorstellungstext erscheint", bText.includes("Erster Absatz zum Abend"));
pruefe("Zahlenkacheln erscheinen", bText.includes("40") && bText.includes("Plätze"));
pruefe("Ablauf mit Uhrzeiten erscheint",
  bText.includes("18:30") && bText.includes("Kurzvorträge"));
pruefe("Fragen erscheinen", bText.includes("Was ziehe ich an?"));
// „Für Schulen" steht auch in der Navigation von Kopf- und Fußbereich —
// das ist die Marken-Hülle und gehört dort hin. Geprüft wird deshalb auf
// die ÜBERSCHRIFTEN der Padel-Blöcke, die es nur als Inhalt gibt.
pruefe("KEIN Padel-Inhalt auf dem Netzwerkabend",
  !bText.includes("Was ist Padel überhaupt?") &&
  !bText.includes("So läuft der Tag ab") &&
  !bText.includes("Keine Vorkenntnisse nötig"),
  "die alten Wörterbuch-Blöcke sind wirklich weg");

// ── Padel-Event unverändert ────────────────────────────────────
const pText = alsText((await hole("/events/padel-falkensee")).html);
pruefe("Padel-Seite zeigt weiterhin ihre eigenen Inhalte",
  pText.includes("Was ist Padel überhaupt?") && pText.includes("So läuft der Tag ab") &&
  pText.includes("Für Schulen") && pText.includes("Häufige Fragen"));
pruefe("… und die Kopfzeile aus dem Event",
  pText.includes("Nie gespielt?") && pText.includes("Padel · Falkensee"));

console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
