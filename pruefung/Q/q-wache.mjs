/* ---------------------------------------------------------------
   Die Überwachung: Mail-Texte und die Entscheidungslogik der Wache.

       npx tsx pruefung/Q/q-wache.mjs

   Die Wache selbst ist ein Shell-Skript. Geprüft wird deshalb, was
   sich ohne Server prüfen lässt: die Mail-Texte, die Syntax des
   Skripts, und — das Wichtigste — dass es NUR beim Zustandswechsel
   meldet. Der Rest gehört auf den Server und steht in
   docs/ueberwachung.md als Prüfliste.
   --------------------------------------------------------------- */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { systemAlarmMail, systemEntwarnungMail } from "../../lib/mailVorlagen.ts";

let gut = 0, schlecht = 0;
const pruefe = (name, ok, zusatz = "") => {
  if (ok) gut += 1; else schlecht += 1;
  console.log(`${ok ? "✓" : "✗"} ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
};

/* ── Die Störungsmail ──────────────────────────────────────────── */

const eine = systemAlarmMail(["Der Dienst vera läuft nicht."]);
pruefe("Betreff nennt die Zahl der Befunde in der Einzahl",
  eine.betreff === "VERA: Störung auf dem Server (1 Befund)", eine.betreff);

const zwei = systemAlarmMail(["A", "B"]);
pruefe("… und in der Mehrzahl", zwei.betreff.includes("(2 Befunde)"), zwei.betreff);

pruefe("Jeder Befund steht im Text", zwei.text.includes("- A") && zwei.text.includes("- B"));
pruefe("Die Mail sagt, wie man nachsieht", eine.text.includes("vera-status"));
pruefe("Die Mail erklärt, dass nicht wiederholt gemailt wird",
  eine.text.includes("nicht erneut gemailt"));

const entwarnung = systemEntwarnungMail();
pruefe("Die Entwarnung ist als solche erkennbar",
  entwarnung.betreff === "VERA: Störung behoben", entwarnung.betreff);
pruefe("Die Entwarnung verspricht nichts zu tun", entwarnung.text.includes("nichts weiter zu tun"));

/* ── Das Skript ────────────────────────────────────────────────── */

const wache = readFileSync(new URL("../../server/vera-wache.sh", import.meta.url), "utf8");

execFileSync("bash", ["-n", "server/vera-wache.sh"]);
pruefe("vera-wache.sh ist syntaktisch gültig", true);
execFileSync("bash", ["-n", "server/vera-status.sh"]);
pruefe("vera-status.sh ist syntaktisch gültig", true);

pruefe("Die Wache prüft alle drei Dienste",
  ["vera", "nginx", "mariadb"].every((d) => wache.includes(d)));
/* Beim ersten Lauf schlug diese Prüfung fehl — sie fand "127.0.0.1"
   in einem KOMMENTAR, der gerade erklärt, warum dort nicht localhost
   steht. Der Produktcode war richtig, die Prüfung war zu grob.
   Deshalb werden Kommentarzeilen vorher entfernt. */
const wacheOhneKommentare = wache
  .split("\n")
  .filter((z) => !z.trim().startsWith("#"))
  .join("\n");
pruefe("Sie prüft über die ÖFFENTLICHE Adresse, nicht über localhost",
  wacheOhneKommentare.includes('${VERA_WACHE_ADRESSE:-https://veraevents.de/}') &&
    !wacheOhneKommentare.includes("127.0.0.1") &&
    wacheOhneKommentare.includes('"$ADRESSE"'));
pruefe("Sie prüft den Speicherplatz", wache.includes("df -P /"));
pruefe("Sie prüft die Restlaufzeit des Zertifikats", wache.includes("openssl x509 -enddate"));

/* Der eigentliche Grund für diese Prüfung: Die Sicherung meldet sich
   NUR bei einem Fehler. Läuft ihr Timer gar nicht, schweigt sie —
   und ohne diese Zeile würde das monatelang niemand merken. */
pruefe("Sie merkt, wenn die Sicherung ausbleibt",
  wache.includes(".vera-sicherung-status") && wache.includes("SICHERUNG_STUNDEN"));

/* Alarm-Müdigkeit ist der häufigste Grund, warum Überwachung
   nutzlos wird. Deshalb ist "nur beim Wechsel" kein Detail. */
pruefe("Sie meldet nur beim Wechsel des Zustands",
  wache.includes('[ "$jetzt" = "$vorher" ] && exit 0'));
pruefe("Ein zusätzlicher Befund gilt als neuer Zustand",
  wache.includes("sha256sum"));
pruefe("Es gibt einen Probelauf ohne Versand", wache.includes("--probe"));
pruefe("Die Adresse laesst sich fuer einen Test ueberschreiben",
  wache.includes("VERA_WACHE_ADRESSE"));
pruefe("Der Mailversand läuft als vera, nicht als root",
  wache.includes("runuser -u vera"));

console.log("");
if (schlecht === 0) { console.log(`Alle ${gut} Prüfungen bestanden.\n`); process.exit(0); }
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
