/* Titelbild-Upload: Annahme, Ablehnung, Datenschutz, Aufräumen. */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { anmelden, hole, sende, actionFelder, BASIS } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";
import { verzeichnis, kleineFassung } from "../../lib/bilder.js";
import sharp from "sharp";

const BILDER = "pruefung/.ausgabe/testbilder";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const dateien = async () => {
  try { return (await readdir(verzeichnis())).sort(); } catch { return []; }
};

await db.anmeldeVersuch.deleteMany({});
const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "198.51.100.5");
const K = s.cookie;
if (!K) throw new Error("Anmeldung fehlgeschlagen");

const event = await db.event.findFirstOrThrow({ where: { slug: "probe-premium" } });

/** Schickt das Event-Formular mit optionaler Datei ab. */
async function speichern(datei, extra = {}, cookie = K) {
  const seite = await hole(`/admin/events/${event.id}`, cookie ?? K);
  const felder = actionFelder(seite.html, 'name="titel"');
  const daten = new FormData();
  for (const [k, v] of Object.entries(felder)) daten.append(k, v);
  const werte = {
    eventId: event.id, titel: event.titel, slug: event.slug, stadt: event.stadt,
    ortName: event.ortName ?? "", karteTitel: event.karteTitel, karteKurz: event.karteKurz,
    kurz: event.kurz, beschreibung: event.beschreibung,
    preisSchueler: "0,00", preisErwachsener: "89,00",
    status: "VEROEFFENTLICHT", kategorie: "BUSINESS", theme: "PREMIUM",
    schwelleWenigPlaetze: "10", maxPersonen: "60",
    heroAugenbraue: event.heroAugenbraue ?? "", heroTitel: event.heroTitel ?? "",
    heroText: event.heroText ?? "", ...extra,
  };
  for (const [k, v] of Object.entries(werte)) daten.append(k, String(v));
  if (datei) {
    const inhalt = await readFile(path.join(BILDER, datei));
    daten.append("titelbild", new File([inhalt], datei, { type: "image/jpeg" }));
  }
  const kopf = { "x-forwarded-for": "198.51.100.5" };
  if (cookie) kopf.cookie = cookie;
  const a = await fetch(`${BASIS}/admin/events/${event.id}`, {
    method: "POST", body: daten, redirect: "manual", headers: kopf,
  });
  return { status: a.status, ziel: a.headers.get("x-action-redirect") ?? a.headers.get("location"), text: await a.text() };
}

// ── 1. Ohne Anmeldung wird nichts hochgeladen ──────────────────
const vorherDateien = (await dateien()).length;
await speichern("echt.jpg", {}, null);
pruefe("Upload ohne Anmeldung legt keine Datei ab",
  (await dateien()).length === vorherDateien);

// ── 2. Echtes JPEG ─────────────────────────────────────────────
await speichern("gross.jpg");
let e = await db.event.findUniqueOrThrow({ where: { id: event.id } });
pruefe("JPEG wird angenommen", e.bildUrl?.startsWith("/bilder/") === true, e.bildUrl ?? "—");

const name = e.bildUrl.slice("/bilder/".length);
const vorhanden = await dateien();
pruefe("… beide Größen liegen auf dem Datenträger",
  vorhanden.includes(name) && vorhanden.includes(name.replace(/\.webp$/, "-klein.webp")));

const grossMasse = await sharp(path.join(verzeichnis(), name)).metadata();
const kleinMasse = await sharp(path.join(verzeichnis(), name.replace(/\.webp$/, "-klein.webp"))).metadata();
pruefe("… als WebP in zwei Breiten", grossMasse.format === "webp" && grossMasse.width === 1800 && kleinMasse.width === 900,
  `${grossMasse.width}px und ${kleinMasse.width}px`);
pruefe("… und deutlich kleiner als die Quelle",
  (await stat(path.join(verzeichnis(), name))).size < (await stat(path.join(BILDER, "gross.jpg"))).size,
  `${Math.round((await stat(path.join(verzeichnis(), name))).size / 1024)} KB statt ${Math.round((await stat(path.join(BILDER, "gross.jpg"))).size / 1024)} KB`);

// ── 3. Ausgeliefert wird es auch ───────────────────────────────
const geliefert = await fetch(`${BASIS}${e.bildUrl}`);
pruefe("Das Bild wird ausgeliefert",
  geliefert.status === 200 && geliefert.headers.get("content-type") === "image/webp",
  `${geliefert.status} ${geliefert.headers.get("content-type")}`);

// ── 4. GPS-Daten verschwinden ──────────────────────────────────
const vorGps = await sharp(path.join(BILDER, "mit-gps.jpg")).metadata();
await speichern("mit-gps.jpg");
e = await db.event.findUniqueOrThrow({ where: { id: event.id } });
const nachGps = await sharp(path.join(verzeichnis(), e.bildUrl.slice(8))).metadata();
pruefe("Aufnahmeort und andere versteckte Angaben sind entfernt",
  !!vorGps.exif && !nachGps.exif,
  `vorher ${vorGps.exif?.length ?? 0} Bytes EXIF, nachher ${nachGps.exif?.length ?? 0}`);

// ── 5. Alte Datei wird beim Ersetzen gelöscht ──────────────────
pruefe("Beim Ersetzen verschwinden die alten Dateien",
  !(await dateien()).includes(name), `${name} ist weg`);

// ── 6. PNG und WebP ────────────────────────────────────────────
for (const [datei, art] of [["klein.png", "PNG"], ["klein.webp", "WebP"]]) {
  await speichern(datei);
  const jetzt = await db.event.findUniqueOrThrow({ where: { id: event.id } });
  pruefe(`${art} wird angenommen`, jetzt.bildUrl?.startsWith("/bilder/") === true);
}

// ── 7. Drehmarke wird angewendet ───────────────────────────────
// Die Quelle ist QUERFORMAT mit der Drehmarke „um 90° drehen". Wird
// sie richtig angewendet, kommt HOCHFORMAT heraus. Ohne Anwendung
// läge das Foto auf der Seite quer.
const vorDrehung = await sharp(path.join(BILDER, "quer-gedreht.jpg")).metadata();
await speichern("quer-gedreht.jpg");
e = await db.event.findUniqueOrThrow({ where: { id: event.id } });
const gedreht = await sharp(path.join(verzeichnis(), e.bildUrl.slice(8))).metadata();
pruefe("Die Drehmarke des Fotos wird angewendet",
  vorDrehung.width > vorDrehung.height && gedreht.height > gedreht.width,
  `Quelle ${vorDrehung.width}×${vorDrehung.height} (Marke ${vorDrehung.orientation}) → ${gedreht.width}×${gedreht.height}`);

// ── 8. Getarnte Datei ──────────────────────────────────────────
const vorGetarnt = await db.event.findUniqueOrThrow({ where: { id: event.id } });
const getarnt = await speichern("getarnt.jpg");
const nachGetarnt = await db.event.findUniqueOrThrow({ where: { id: event.id } });
pruefe("Als Bild getarnte Datei wird abgewiesen",
  nachGetarnt.bildUrl === vorGetarnt.bildUrl &&
  getarnt.text.includes("lässt sich nicht als Bild lesen"));

// ── 9. Zu große Datei ──────────────────────────────────────────
const zuGross = await speichern("zu-gross.jpg");
const nachGross = await db.event.findUniqueOrThrow({ where: { id: event.id } });
pruefe("Zu große Datei wird abgewiesen",
  nachGross.bildUrl === vorGetarnt.bildUrl &&
  (zuGross.text.includes("zu groß") || zuGross.status >= 400),
  `Antwort ${zuGross.status}`);

// ── 10. Bild entfernen ─────────────────────────────────────────
const vorEntfernen = nachGross.bildUrl.slice(8);
await speichern(null, { bildEntfernen: "an" });
e = await db.event.findUniqueOrThrow({ where: { id: event.id } });
pruefe("„Bild entfernen\" leert das Feld", e.bildUrl === null);
pruefe("… und löscht die Dateien", !(await dateien()).includes(vorEntfernen));

// ── 11. Ausbruch aus dem Verzeichnis ───────────────────────────
for (const versuch of [
  "../../.env", "..%2F..%2F.env", "../package.json", "unsinn.webp", "a".repeat(24) + ".webp",
]) {
  const a = await fetch(`${BASIS}/bilder/${versuch}`, { redirect: "manual" });
  pruefe(`Auslieferung weist „${versuch}\" ab`, a.status === 404, `Antwort ${a.status}`);
}

console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
