/* Öffentliche Seiten vor und nach der Zahlungsanbindung.
   Erwartung: unverändert. Die Danke-Seite ist nicht Teil dieses
   Vergleichs — sie SOLL sich ändern. */
import sharp from "sharp";
import fs from "node:fs";
const O = "pruefung/.ausgabe/MARKE";
let gleich = 0; const anders = [];
for (const name of fs.readdirSync(`${O}/nach-l`).sort()) {
  const a = `${O}/nach-l/${name}`, b = `${O}/nach-k/${name}`;
  if (!fs.existsSync(b)) { console.log(`${name}: fehlt`); continue; }
  const [ia, ib] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) {
    console.log(`≠ ${name.padEnd(18)} Größe ${ia.info.width}×${ia.info.height} → ${ib.info.width}×${ib.info.height}`);
    anders.push(name); continue;
  }
  let ab = 0, oben = ia.info.height, unten = -1;
  const w = ia.info.width;
  for (let i = 0; i < ia.data.length; i += 4) {
    const d = Math.abs(ia.data[i]-ib.data[i]) + Math.abs(ia.data[i+1]-ib.data[i+1]) + Math.abs(ia.data[i+2]-ib.data[i+2]);
    if (d > 12) { ab += 1; const y = Math.floor(i / 4 / w); if (y < oben) oben = y; if (y > unten) unten = y; }
  }
  if (ab === 0) gleich += 1;
  else { console.log(`≠ ${name.padEnd(18)} ${((ab/(ia.data.length/4))*100).toFixed(3)} % · Zeilen ${oben}–${unten}`); anders.push(name); }
}
console.log(`\n${gleich} unverändert, ${anders.length} verändert.`);
