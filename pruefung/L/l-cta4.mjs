/* Probe im laufenden Bild: weiches Trennzeichen einsetzen und
   Zeilen zählen. Der Server liefert einen fertigen Bau, deshalb
   wird der Text hier im Browser ersetzt statt in der Datei. */
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
console.log("Breite | ohne Trennzeichen | mit Trennzeichen");
for (const b of [320, 330, 340, 350, 360, 375, 390, 414, 430, 500, 900, 1024]) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3249/faq", { waitUntil: "networkidle" });
  const d = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("mitzu"));
    const zaehl = () => { const r = document.createRange(); r.selectNodeContents(h);
      return [...r.getClientRects()].filter((x) => x.width > 1).map((z) => Math.round(z.width)); };
    const ohne = zaehl();
    h.textContent = "Bereit mitzu­machen?";
    const mit = zaehl();
    return { ohne: ohne.join("+"), mit: mit.join("+") };
  });
  console.log(String(b).padStart(5), "|", d.ohne.padEnd(16), "|", d.mit);
  await ctx.close();
}
await browser.close();
