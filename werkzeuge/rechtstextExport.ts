/* ---------------------------------------------------------------
   Den Wortlaut der Rechtstexte aus content/de.ts in Dateien schreiben.

   Aufruf:
     npm run rechtstext:export            schreibt die Dateien
     npm run rechtstext:export -- --pruefen   prüft nur, ändert nichts

   Warum es diesen Zwischenschritt gibt: `npm run rechtstext` legt eine
   Fassung aus einer Datei an — bewusst, damit niemand einen
   Vertragstext nebenbei im Browser ändert. Die Texte selbst stehen
   aber in content/de.ts, weil die Seiten sie anzeigen. Ohne dieses
   Werkzeug müsste jemand sie abtippen; die Abschrift und das Original
   liefen ab der ersten Korrektur auseinander, ohne dass es auffiele.

   `--pruefen` ist der Riegel dagegen. Er meldet, wenn die Dateien nicht
   mehr zu content/de.ts passen — also wenn jemand einen Rechtstext
   geändert, den Export aber vergessen hat. Prüfliste U ruft ihn auf.

   Dieses Werkzeug legt KEINE Fassung in der Datenbank an. Das bleibt
   `npm run rechtstext`, und zwar bewusst als eigener Schritt: Eine
   neue Fassung entsteht, wenn jemand sie anlegt — nicht, wenn jemand
   eine Datei schreibt.
   --------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { agbWortlaut, datenschutzWortlaut, FASSUNGSDATEIEN } from "@/lib/rechtstextFassung";
import { pruefsumme } from "@/lib/rechtstexteRegeln";

const nurPruefen = process.argv.includes("--pruefen");

const aufgaben = [
  { name: "Teilnahmebedingungen (Verbraucher)", datei: FASSUNGSDATEIEN.AGB_B2C, text: agbWortlaut() },
  {
    name: "Datenschutzerklärung",
    datei: FASSUNGSDATEIEN.DATENSCHUTZ,
    text: datenschutzWortlaut(),
  },
];

let abweichung = false;

for (const a of aufgaben) {
  const pfad = resolve(process.cwd(), a.datei);

  if (nurPruefen) {
    let vorhanden: string | null = null;
    try {
      vorhanden = readFileSync(pfad, "utf8");
    } catch {
      vorhanden = null;
    }
    if (vorhanden === null) {
      console.error(`✗ ${a.datei} fehlt. Anlegen mit: npm run rechtstext:export`);
      abweichung = true;
    } else if (vorhanden !== a.text) {
      console.error(
        `✗ ${a.datei} stimmt nicht mehr mit content/de.ts überein.\n` +
          `  Datei:       ${pruefsumme(vorhanden).slice(0, 16)}…\n` +
          `  content/de:  ${pruefsumme(a.text).slice(0, 16)}…\n` +
          `  Neu erzeugen mit: npm run rechtstext:export\n` +
          `  ACHTUNG: Ein geänderter Wortlaut ist eine NEUE Fassung.\n` +
          `  Nach dem Export gehört sie mit npm run rechtstext angelegt.`,
      );
      abweichung = true;
    } else {
      console.log(`✓ ${a.datei} — unverändert (${a.text.length} Zeichen)`);
    }
    continue;
  }

  mkdirSync(dirname(pfad), { recursive: true });
  writeFileSync(pfad, a.text, "utf8");
  console.log(`✓ ${a.name}`);
  console.log(`  Datei:     ${a.datei}`);
  console.log(`  Zeichen:   ${a.text.length}`);
  console.log(`  Prüfsumme: ${pruefsumme(a.text)}`);
  console.log("");
}

if (nurPruefen && abweichung) process.exit(1);

if (!nurPruefen) {
  console.log("Die Dateien sind geschrieben. Eine Fassung in der Datenbank");
  console.log("entsteht daraus erst mit npm run rechtstext — siehe");
  console.log("docs/rechtstexte-fassungen.md.");
}
