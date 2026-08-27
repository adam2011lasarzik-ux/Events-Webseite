/* Die Testbilder für die Upload-Prüfungen erzeugen.

   Aufruf:  node pruefung/testbilder-erzeugen.mjs

   Warum erzeugt statt mitgeliefert: Die Sammlung ist zusammen rund
   14 MB, allein „zu-gross.jpg" macht 11 davon aus — eine Datei, deren
   einziger Zweck es ist, die Obergrenze zu überschreiten. Solche
   Dateien in ein Repository zu legen, das sonst aus Text besteht,
   wäre Ballast bei jedem Klonen. Erzeugt sind sie in Sekunden da und
   jedes Mal identisch.

   Die Bilder landen in `pruefung/.ausgabe/testbilder/` (von Git
   ausgeschlossen). */
import sharp from "sharp";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const ZIEL = "pruefung/.ausgabe/testbilder";
await mkdir(ZIEL, { recursive: true });

/** Ein buntes Testbild — Rauschen lässt sich schlecht komprimieren,
    das brauchen wir für „gross.jpg". */
function rauschen(breite, hoehe) {
  const daten = Buffer.alloc(breite * hoehe * 3);
  let z = 12345;
  for (let i = 0; i < daten.length; i += 1) {
    z = (z * 1103515245 + 12345) & 0x7fffffff;
    daten[i] = z % 256;
  }
  return sharp(daten, { raw: { width: breite, height: hoehe, channels: 3 } });
}

/* Ein gewöhnliches, gültiges JPEG. */
await rauschen(1400, 1000).jpeg({ quality: 80 }).toFile(path.join(ZIEL, "echt.jpg"));

/* Deutlich grösser — die verkleinerte Fassung muss kleiner sein als das. */
await rauschen(3000, 2200).jpeg({ quality: 92 }).toFile(path.join(ZIEL, "gross.jpg"));

/* PNG und WebP: Die beiden anderen erlaubten Formate. */
await rauschen(900, 700).png().toFile(path.join(ZIEL, "klein.png"));
await rauschen(900, 700).webp().toFile(path.join(ZIEL, "klein.webp"));

/* Ein Foto mit Aufnahmeort. Nach dem Hochladen dürfen die
   GPS-Angaben nicht mehr enthalten sein — iPhone-Fotos tragen sie,
   und auf einer öffentlichen Seite haben sie nichts verloren. */
await rauschen(1200, 900)
  .withExif({
    IFD0: { Make: "VERA-Pruefung", Model: "Testgeraet" },
    GPS: { GPSLatitudeRef: "N", GPSLatitude: "52/1 32/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "13/1 5/1 0/1" },
  })
  .jpeg({ quality: 85 })
  .toFile(path.join(ZIEL, "mit-gps.jpg"));

/* Ein querformatiges Bild mit Drehmarke 6 („90° nach rechts drehen").
   Nach der Verarbeitung muss es hochkant vorliegen.

   `withMetadata({ orientation })` statt `withExif`: Nur damit schreibt
   sharp die Marke so, dass sie beim Wiedereinlesen auch dasteht. */
for (const name of ["quer-gedreht.jpg", "gedreht.jpg"]) {
  await rauschen(800, 400)
    .withMetadata({ orientation: 6 })
    .jpeg({ quality: 85 })
    .toFile(path.join(ZIEL, name));
}

/* Kein Bild, sondern ein Skript mit Bild-Endung. Muss abgewiesen
   werden — die Endung entscheidet nicht, der Inhalt entscheidet. */
await writeFile(path.join(ZIEL, "getarnt.jpg"), '#!/bin/sh\necho "kein Bild"\n');

/* Zu gross — aber mit Bedacht.

   Die Datei muss ZWISCHEN zwei Grenzen liegen:
     - über 10 MB (MAX_BYTES in lib/bilder.ts), damit sie abgewiesen wird
     - unter 12 MB (serverActions.bodySizeLimit in next.config.mjs),
       damit sie überhaupt bis zu unserem Code kommt

   Darüber bricht schon der Transport ab, und geprüft wäre dann nur die
   Grenze von Next.js statt unserer verständlichen Meldung. 11 MB
   treffen genau dazwischen. */
const ZIELGROESSE = 11 * 1024 * 1024;
const grundlage = await rauschen(4000, 3000).jpeg({ quality: 100 }).toBuffer();
const zuGross = Buffer.alloc(ZIELGROESSE);
for (let i = 0; i < ZIELGROESSE; i += grundlage.length) {
  grundlage.copy(zuGross, i, 0, Math.min(grundlage.length, ZIELGROESSE - i));
}
await writeFile(path.join(ZIEL, "zu-gross.jpg"), zuGross);

const dateien = [
  "echt.jpg", "gross.jpg", "klein.png", "klein.webp",
  "mit-gps.jpg", "quer-gedreht.jpg", "gedreht.jpg",
  "getarnt.jpg", "zu-gross.jpg",
];
console.log(`Testbilder in ${ZIEL}:`);
for (const d of dateien) {
  const s = await stat(path.join(ZIEL, d));
  console.log(`  ${d.padEnd(18)} ${(s.size / 1024).toFixed(0).padStart(6)} KB`);
}
