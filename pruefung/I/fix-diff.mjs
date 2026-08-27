import sharp from "sharp";
import fs from "node:fs";
const ORDNER = "pruefung/.ausgabe/FIX";
let gleich = 0; const anders = [];
for (const name of fs.readdirSync(`${ORDNER}/vorher-fix`).sort()) {
  const a = `${ORDNER}/vorher-fix/${name}`, b = `${ORDNER}/nachher-fix/${name}`;
  if (!fs.existsSync(b)) { console.log(`${name}: fehlt im Nachher`); continue; }
  const [ia, ib] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) {
    console.log(`≠ ${name.padEnd(22)} Größe ${ia.info.width}×${ia.info.height} → ${ib.info.width}×${ib.info.height}`);
    anders.push(name); continue;
  }
  const w = ia.info.width, h = ia.info.height;
  let ab = 0, oben = h, unten = -1;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    const i = (y * w + x) * 4;
    const d = Math.abs(ia.data[i]-ib.data[i]) + Math.abs(ia.data[i+1]-ib.data[i+1]) + Math.abs(ia.data[i+2]-ib.data[i+2]);
    if (d > 12) { ab += 1; if (y < oben) oben = y; if (y > unten) unten = y; }
  }
  if (ab === 0) { gleich += 1; }
  else { console.log(`≠ ${name.padEnd(22)} ${((ab/(w*h))*100).toFixed(3)} % abweichend, Zeilen ${oben}–${unten}`); anders.push(name); }
}
console.log(`\n${gleich} unverändert, ${anders.length} verändert.`);
