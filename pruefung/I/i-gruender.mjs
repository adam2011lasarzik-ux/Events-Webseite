/* Der Gründerbereich: Anzeige, Schalter, Formular, Upload, Zugang. */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { anmelden, hole, sende, actionFelder, alsText, BASIS } from "./admin-senden.mjs";
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
const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "198.51.100.7");
const K = s.cookie;
if (!K) throw new Error("Anmeldung fehlgeschlagen");

/** Schickt das Gründer-Formular ab, mit oder ohne Datei und Sitzung. */
async function speichern(werte = {}, datei = null, cookie = K) {
  const seite = await hole("/admin/einstellungen", cookie ?? K);
  const felder = actionFelder(seite.html, 'name="gruenderName"');
  const daten = new FormData();
  for (const [k, v] of Object.entries(felder)) daten.append(k, v);
  const alle = {
    gruenderName: "Adam Lasarzik",
    gruenderRolle: "Gründer von VERA",
    gruenderText: "",
    gruenderAufStart: "an",
    ...werte,
  };
  for (const [k, v] of Object.entries(alle)) if (v !== null) daten.append(k, String(v));
  if (datei) {
    const inhalt = await readFile(path.join(BILDER, datei));
    daten.append("gruenderBild", new File([inhalt], datei, { type: "image/jpeg" }));
  }
  const kopf = { "x-forwarded-for": "198.51.100.7" };
  if (cookie) kopf.cookie = cookie;
  const a = await fetch(`${BASIS}/admin/einstellungen`, {
    method: "POST", body: daten, redirect: "manual", headers: kopf,
  });
  return { status: a.status, ziel: a.headers.get("x-action-redirect") ?? a.headers.get("location"), text: await a.text() };
}

const zeile = () => db.einstellungen.findUnique({ where: { id: "global" } });

// ── Zugangsschutz ──────────────────────────────────────────────
const ohne = await hole("/admin/einstellungen");
pruefe("Seite ohne Anmeldung führt zum Anmeldeformular",
  ohne.status >= 300 && ohne.status < 400 && (ohne.ziel ?? "").includes("/admin/login"),
  `${ohne.status} → ${ohne.ziel}`);

const vorherZeile = await zeile();
await speichern({ gruenderName: "Eindringling" }, null, null);
const nachEindringling = await zeile();
pruefe("Aktion ohne Sitzung speichert nichts",
  (nachEindringling?.gruenderName ?? null) === (vorherZeile?.gruenderName ?? null),
  nachEindringling?.gruenderName ?? "keine Zeile");

// ── Speichern ──────────────────────────────────────────────────
let a = await speichern({ gruenderText: "Erster Absatz.\n\nZweiter Absatz." });
let z = await zeile();
pruefe("Angaben werden gespeichert",
  z?.gruenderName === "Adam Lasarzik" && z?.gruenderRolle === "Gründer von VERA" &&
  (z?.gruenderText ?? "").includes("Zweiter Absatz"), a.ziel ?? "");

pruefe("Es gibt genau EINE Einstellungs-Zeile", (await db.einstellungen.count()) === 1);

a = await speichern({ gruenderName: "" });
pruefe("Leerer Name wird abgelehnt", a.text.includes("Der Name fehlt."));
z = await zeile();
pruefe("Nach der Ablehnung ist der alte Name unverändert", z?.gruenderName === "Adam Lasarzik");

a = await speichern({ gruenderText: "x".repeat(1300) });
pruefe("Zu langer Text wird abgelehnt", a.text.includes("Der Text ist zu lang"));

// ── Upload ─────────────────────────────────────────────────────
const vorherDateien = (await dateien()).length;
await speichern({}, "echt.jpg", null);
pruefe("Upload ohne Anmeldung legt keine Datei ab", (await dateien()).length === vorherDateien);

await speichern({}, "gross.jpg");
z = await zeile();
pruefe("JPEG wird angenommen", z?.gruenderBildUrl?.startsWith("/bilder/") === true, z?.gruenderBildUrl ?? "—");

const name1 = z.gruenderBildUrl.slice("/bilder/".length);
const vorhanden = await dateien();
pruefe("Beide Größen liegen auf dem Datenträger",
  vorhanden.includes(name1) && vorhanden.includes(name1.replace(/\.webp$/, "-klein.webp")));

const gross = await sharp(path.join(verzeichnis(), name1)).metadata();
const klein = await sharp(path.join(verzeichnis(), name1.replace(/\.webp$/, "-klein.webp"))).metadata();
pruefe("Große Fassung ist WebP mit 1800 px", gross.format === "webp" && gross.width === 1800, `${gross.width}px`);
pruefe("Kleine Fassung ist WebP mit 900 px", klein.format === "webp" && klein.width === 900, `${klein.width}px`);

// GPS-Daten
await speichern({}, "mit-gps.jpg");
z = await zeile();
const gpsName = z.gruenderBildUrl.slice("/bilder/".length);
const roh = await sharp(path.join(BILDER, "mit-gps.jpg")).metadata();
const neu = await sharp(path.join(verzeichnis(), gpsName)).metadata();
pruefe("Quelle trägt überhaupt EXIF-Daten", roh.exif !== undefined);
pruefe("Im abgelegten Bild sind keine EXIF-/GPS-Daten mehr", neu.exif === undefined);

pruefe("Beim Ersetzen ist die alte Fassung vom Datenträger verschwunden",
  !(await dateien()).includes(name1));

// Getarnte Datei
const vorTarn = z.gruenderBildUrl;
a = await speichern({}, "getarnt.jpg");
z = await zeile();
pruefe("Als Bild getarnte Datei wird abgewiesen",
  a.text.includes("lässt sich nicht als Bild lesen") && z.gruenderBildUrl === vorTarn);

// Zu große Datei
a = await speichern({}, "zu-gross.jpg");
z = await zeile();
pruefe("Datei über 10 MB wird abgewiesen",
  (a.text.includes("ist zu groß") || a.status >= 400) && z.gruenderBildUrl === vorTarn,
  `Status ${a.status}`);

// ── Anzeige auf der Webseite ───────────────────────────────────
await speichern({ gruenderText: "Ich bin Adam und mache VERA." }, "echt.jpg");
z = await zeile();
const bildName = z.gruenderBildUrl.slice("/bilder/".length);

let start = alsText((await hole("/")).html);
pruefe("Startseite zeigt Überschrift, Name und Bezeichnung",
  start.includes("Wer hinter VERA steht") && start.includes("Adam Lasarzik") &&
  start.includes("Gründer von VERA"));
pruefe("Startseite zeigt den eigenen Text statt des Platzhalters",
  start.includes("Ich bin Adam und mache VERA.") && !start.includes("Hier stellt sich Adam"));

const startRoh = (await hole("/")).html;
const srcSet = (startRoh.match(/srcSet="([^"]*)"|srcset="([^"]*)"/g) ?? []).join(" ");
pruefe("Foto wird in zwei Größen angeboten (srcset 900w und 1800w)",
  srcSet.includes(`/bilder/${bildName} 1800w`) &&
  srcSet.includes(`${kleineFassung(`/bilder/${bildName}`)} 900w`),
  srcSet.slice(0, 120));

const bild = await fetch(`${BASIS}/bilder/${bildName}`);
pruefe("Das Foto wird ausgeliefert", bild.status === 200 && bild.headers.get("content-type") === "image/webp");

// Platzhalter, wenn kein Text hinterlegt ist
await speichern({ gruenderText: "" });
start = alsText((await hole("/")).html);
pruefe("Ohne Text erscheint ein sichtbar markierter Platzhalter",
  start.includes("Platzhalter") && start.includes("Hier stellt sich Adam Lasarzik"));

// ── Schalter ───────────────────────────────────────────────────
await speichern({ gruenderAufStart: null });
start = alsText((await hole("/")).html);
pruefe("Häkchen aus → Bereich verschwindet von der Startseite",
  !start.includes("Wer hinter VERA steht"));
await speichern({ gruenderAufStart: "an" });
start = alsText((await hole("/")).html);
pruefe("Häkchen an → Bereich ist wieder da", start.includes("Wer hinter VERA steht"));

// Je Event
await db.event.updateMany({ data: { gruenderZeigen: false } });
let seite = alsText((await hole("/events/padel-falkensee")).html);
pruefe("Eventseite ohne Haken zeigt den Bereich NICHT", !seite.includes("Wer hinter VERA steht"));

await db.event.updateMany({ where: { slug: "padel-falkensee" }, data: { gruenderZeigen: true } });
seite = alsText((await hole("/events/padel-falkensee")).html);
pruefe("Eventseite mit Haken zeigt den Bereich", seite.includes("Wer hinter VERA steht"));

const andere = alsText((await hole("/events/probe-business")).html);
pruefe("Der Haken wirkt nur auf das eine Event", !andere.includes("Wer hinter VERA steht"));

const detail = alsText((await hole("/event/padel-falkensee")).html);
pruefe("Die kompakte Detailseite bleibt unverändert ohne Bereich",
  !detail.includes("Wer hinter VERA steht"));

// ── Erfundene Werte ────────────────────────────────────────────
a = await speichern({ gruenderAufStart: "vielleicht" });
z = await zeile();
pruefe("Erfundener Wert für das Häkchen zählt als „aus“", z?.gruenderAufStart === false);
await speichern({ gruenderAufStart: "an" });

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
