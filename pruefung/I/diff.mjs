/* Pixelgenauer Vergleich zweier Bildschirmfotos.
   Meldet, wie viele Bildpunkte abweichen und in welchem Bereich. */
import sharp from "sharp";
import fs from "node:fs";

const ORDNER = "pruefung/.ausgabe/I";

for (const name of fs.readdirSync(`${ORDNER}/vorher`)) {
  const a = `${ORDNER}/vorher/${name}`;
  const b = `${ORDNER}/${process.argv[2] ?? "nachher"}/${name}`;
  if (!fs.existsSync(b)) { console.log(`${name}: fehlt im Nachher`); continue; }

  const [ia, ib] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) {
    console.log(`${name}: GRÖSSE unterschiedlich — ${ia.info.width}×${ia.info.height} vs ${ib.info.width}×${ib.info.height}`);
    continue;
  }

  const w = ia.info.width, h = ia.info.height;
  let abweichend = 0, oben = h, unten = -1, links = w, rechts = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      // Kleine Unterschiede in der Kantenglättung ignorieren.
      const d = Math.abs(ia.data[i] - ib.data[i]) + Math.abs(ia.data[i+1] - ib.data[i+1]) + Math.abs(ia.data[i+2] - ib.data[i+2]);
      if (d > 12) {
        abweichend += 1;
        if (y < oben) oben = y;
        if (y > unten) unten = y;
        if (x < links) links = x;
        if (x > rechts) rechts = x;
      }
    }
  }
  const anteil = ((abweichend / (w * h)) * 100).toFixed(3);
  console.log(
    abweichend === 0
      ? `✓ ${name.padEnd(24)} identisch (${w}×${h})`
      : `✗ ${name.padEnd(24)} ${abweichend} Punkte (${anteil} %) im Bereich y ${oben}–${unten}, x ${links}–${rechts}`,
  );
}
