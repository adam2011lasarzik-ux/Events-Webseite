/* Der Riegel vor der echten Datenbank — geprüft, nicht geglaubt.

   Diese Liste prüft den Schutz selbst. Sie ist die einzige, die das
   tut, und sie braucht dafür weder Datenbank noch Server noch Browser.

   Zwei Fragen stellt sie:

     1. Wirkt der Riegel? Dafür wird schutz.mjs in einem eigenen
        Prozess mit verschiedenen Umgebungen gestartet und geschaut,
        ob er durchlässt oder abbricht.

     2. Hat ihn jemand vergessen? Jede Liste, die löscht, muss ihn
        einbinden. Das lässt sich zählen — und genau daran ist der
        Schutz sonst irgendwann still vorbeigewachsen: Eine neue Liste
        mit einem deleteMany, und die Lücke ist wieder da.
*/

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, "..", "..");
const SCHUTZ = join(WURZEL, "pruefung", "schutz.mjs");

let gut = 0;
let schlecht = 0;
function pruefe(name, bedingung, zusatz = "") {
  if (bedingung) gut += 1;
  else schlecht += 1;
  console.log(`${bedingung ? "✓" : "✗"} ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
}

/** schutz.mjs in einem eigenen Prozess starten. Gibt true bei „durchgelassen". */
function laesstDurch(umgebung) {
  try {
    execFileSync(process.execPath, [SCHUTZ], {
      env: { ...process.env, ...umgebung },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

const OERTLICH = "http://127.0.0.1:3213";

/* ═══ Teil 1: Wirkt der Riegel? ═══════════════════════════════════ */

pruefe(
  "Prüfdatenbank auf dem eigenen Rechner: durchgelassen",
  laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/vera_dev",
    OEFFENTLICHE_ADRESSE: OERTLICH,
  }),
);

pruefe(
  "Die ECHTE Datenbank „vera\": abgewiesen",
  !laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/vera",
    OEFFENTLICHE_ADRESSE: OERTLICH,
  }),
  "das ist der Fall, um den es geht",
);

pruefe(
  "… auch mit Parametern an der Adresse",
  !laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/vera?connection_limit=5",
    OEFFENTLICHE_ADRESSE: OERTLICH,
  }),
);

pruefe(
  "… und auch von einem fremden Rechner aus",
  !laesstDurch({
    DATABASE_URL: "mysql://a:b@179.198.201.39:3306/vera",
    OEFFENTLICHE_ADRESSE: OERTLICH,
  }),
);

pruefe(
  "Ein unbekannter Datenbankname: abgewiesen",
  !laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/irgendwas",
    OEFFENTLICHE_ADRESSE: OERTLICH,
  }),
  "im Zweifel NEIN",
);

pruefe(
  "Fehlende DATABASE_URL: abgewiesen",
  !laesstDurch({ DATABASE_URL: "", OEFFENTLICHE_ADRESSE: OERTLICH }),
);

/* Der zweite, unabhängige Riegel: die öffentliche Adresse. */

pruefe(
  "Prüfdatenbankname, aber die ECHTE Adresse: trotzdem abgewiesen",
  !laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/vera_dev",
    OEFFENTLICHE_ADRESSE: "https://veraevents.de",
  }),
  "zwei Riegel, beide müssen zustimmen",
);

pruefe(
  "… auch bei einer beliebigen anderen öffentlichen Adresse",
  !laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/vera_dev",
    OEFFENTLICHE_ADRESSE: "https://beispiel.de",
  }),
);

pruefe(
  "localhost gilt als örtlich",
  laesstDurch({
    DATABASE_URL: "mysql://a:b@127.0.0.1:3306/vera_test",
    OEFFENTLICHE_ADRESSE: "http://localhost:3000",
  }),
);

/* ═══ Teil 2: Hat ihn jemand vergessen? ══════════════════════════ */

const loeschende = execSync("grep -rl deleteMany pruefung/", { cwd: WURZEL, encoding: "utf8" })
  .split("\n")
  .map((z) => z.trim())
  .filter((z) => z && !z.endsWith("schutz.mjs"));

const ohneRiegel = loeschende.filter(
  (datei) => !readFileSync(join(WURZEL, datei), "utf8").includes("schutz.mjs"),
);

pruefe(
  "Es gibt überhaupt löschende Listen zu schützen",
  loeschende.length > 0,
  `${loeschende.length} gefunden`,
);

pruefe(
  "JEDE löschende Liste bindet den Riegel ein",
  ohneRiegel.length === 0,
  ohneRiegel.length === 0 ? `${loeschende.length} von ${loeschende.length}` : ohneRiegel.join(" · "),
);

pruefe(
  "Die echte Datenbank steht nicht in der Erlaubnisliste",
  !/["']vera["']/.test(readFileSync(SCHUTZ, "utf8").split("ERLAUBTE_DATENBANKEN")[1].split("]")[0]),
);

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
