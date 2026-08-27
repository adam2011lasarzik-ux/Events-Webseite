/* Kann dieser Chromium überhaupt deutsch trennen?
   Zwei gleiche Kästen, einmal mit hyphens:auto, einmal ohne. */
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
await page.setContent(`<html lang="de"><body style="margin:0;font:16px sans-serif">
  <div id="a" style="width:90px;hyphens:auto">Unternehmerabend Silbentrennung</div>
  <div id="b" style="width:90px;hyphens:none">Unternehmerabend Silbentrennung</div>
</body></html>`);
console.log(await page.evaluate(() => ({
  mitTrennung: document.getElementById("a").getBoundingClientRect().height,
  ohneTrennung: document.getElementById("b").getBoundingClientRect().height,
  scrollA: document.getElementById("a").scrollWidth,
  scrollB: document.getElementById("b").scrollWidth,
})));
await browser.close();
