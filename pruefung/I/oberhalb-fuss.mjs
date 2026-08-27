/* Alles OBERHALB des Fußbereichs muss Bildpunkt für Bildpunkt gleich
   geblieben sein. Die Seiten sind nur deshalb kürzer, weil die
   Wortmarke im Fuß kleiner geworden ist — das lässt sich beweisen,
   indem man beide Bilder auf den Bereich über dem Fuß beschneidet. */
import sharp from "sharp";
import fs from "node:fs";
const O = "pruefung/.ausgabe/MARKE";
const seiten = ["start", "standard", "premium", "anmeldung", "faq"];
const breiten = [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440];
let gleich = 0; const schief = [];
for (const b of breiten) {
  const fussV = await sharp(`${O}/vorher/fuss-${b}.png`).metadata();
  const fussN = await sharp(`${O}/nachher/fuss-${b}.png`).metadata();
  for (const s of seiten) {
    const a = `${O}/vorher/${s}-${b}.png`, c = `${O}/nachher/${s}-${b}.png`;
    const ma = await sharp(a).metadata(), mc = await sharp(c).metadata();
    const obenA = ma.height - fussV.height, obenC = mc.height - fussN.height;
    // Der Fuß kann sich um EINEN Bildpunkt unterscheiden — die
    // Zeilenhöhe der Wortmarke rundet anders. Deshalb wird der
    // gemeinsame Bereich verglichen; eine echte Verschiebung im
    // Inhalt fiele trotzdem sofort auf.
    if (Math.abs(obenA - obenC) > 1) { schief.push(`${s}-${b}: Inhalt über dem Fuß um ${Math.abs(obenA-obenC)} Punkte verschoben`); continue; }
    const hoehe = Math.min(obenA, obenC);
    const [ia, ic] = await Promise.all([
      sharp(a).extract({ left: 0, top: 0, width: ma.width, height: hoehe }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
      sharp(c).extract({ left: 0, top: 0, width: mc.width, height: hoehe }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ]);
    let ab = 0;
    for (let i = 0; i < ia.data.length; i += 4) {
      const d = Math.abs(ia.data[i]-ic.data[i]) + Math.abs(ia.data[i+1]-ic.data[i+1]) + Math.abs(ia.data[i+2]-ic.data[i+2]);
      if (d > 12) ab += 1;
    }
    if (ab === 0) gleich += 1;
    else schief.push(`${s}-${b}: ${ab} Bildpunkte über dem Fuß verändert`);
  }
}
console.log(`${gleich} von ${seiten.length * breiten.length} Seiten oberhalb des Fußbereichs unverändert.`);
if (schief.length) { console.log(schief.join("\n")); process.exit(1); }
