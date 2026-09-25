/* ---------------------------------------------------------------
   Prüfliste S, Teil 5 — die Server-Skripte gegen eine Falle, die
   wirklich zugeschnappt hat.

   Am 18.09.2026 schlug der Löschlauf auf dem Produktivserver beim
   allerersten Lauf fehl. Beide Durchgänge waren sauber; gestorben ist
   das Skript an der Zeile DANACH:

       ZUSAMMEN=$(echo "$AUSGABE" | grep -E '…' | tr … )

   grep liefert Exitcode 1, wenn es nichts findet — und "nichts
   gefunden" ist hier der Normalfall, nämlich "nichts zu löschen".
   Mit `set -e` und `pipefail` beendet das den Dienst mit Fehler und
   löst über den ERR-Trap eine Alarmmail aus.

   Das Tückische: Der Fehler tritt NUR im guten Fall auf. Wäre an dem
   Tag etwas zu löschen gewesen, wäre er nie aufgefallen — und später
   dann an einem beliebigen ruhigen Tag.

   Diese Liste sucht das Muster in allen Server-Skripten.
   --------------------------------------------------------------- */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SERVER = join(WURZEL, "server");

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const skripte = readdirSync(SERVER)
  .filter((d) => d.endsWith(".sh"))
  .map((d) => ({ name: d, inhalt: readFileSync(join(SERVER, d), "utf8") }));

pruefe("Es gibt Server-Skripte zu prüfen", skripte.length > 0, `${skripte.length} gefunden`);

/* Befehle, die "nichts gefunden" mit Exitcode 1 melden — völlig
   normal und trotzdem unter `set -e` tödlich. */
const HEIKEL = /\b(grep|rg)\b/;

for (const s of skripte) {
  const streng = /set -[a-z]*e/.test(s.inhalt);
  if (!streng) continue;

  const zeilen = s.inhalt.split("\n");
  const verdaechtig = [];

  zeilen.forEach((zeile, i) => {
    // Kommentare zählen nicht.
    if (/^\s*#/.test(zeile)) return;
    // Nur Zuweisungen aus einer Befehlsersetzung: dort schlägt der
    // Exitcode auf die Zuweisung durch.
    if (!/^\s*\w+=\$\(/.test(zeile)) return;
    if (!HEIKEL.test(zeile)) return;
    // Abgesichert, wenn die Zeile mit `|| true` oder `|| echo …` endet.
    if (/\|\|\s*(true|:|echo)/.test(zeile)) return;
    verdaechtig.push(`Zeile ${i + 1}`);
  });

  pruefe(
    `${s.name}: keine ungesicherte grep-Zuweisung unter "set -e"`,
    verdaechtig.length === 0,
    verdaechtig.length ? verdaechtig.join(", ") : "sauber",
  );
}

/* Die konkrete Zeile, an der es geknallt hat — ausdrücklich
   nachgeprüft, damit sie nicht beim nächsten Umbau wieder ohne
   Absicherung dasteht. */
const loeschlauf = skripte.find((s) => s.name === "vera-loeschlauf.sh");
pruefe("vera-loeschlauf.sh ist vorhanden", Boolean(loeschlauf));
if (loeschlauf) {
  pruefe(
    "vera-loeschlauf.sh: die Zusammenfassungs-Zeile ist mit „|| true“ abgesichert",
    /ZUSAMMEN=\$\([\s\S]*?\|\|\s*true\)/.test(loeschlauf.inhalt),
  );
  pruefe(
    "vera-loeschlauf.sh: schreibt weiterhin eine Statuszeile",
    loeschlauf.inhalt.includes('>> "$STATUS"'),
  );
  pruefe(
    "vera-loeschlauf.sh: hat weiterhin einen ERR-Trap für echte Fehler",
    /trap alarm ERR/.test(loeschlauf.inhalt),
    "der Alarm soll bleiben — nur nicht im Normalfall auslösen",
  );
}

/* ── Die Nginx-Bremse ────────────────────────────────────────────

   Neu am 25.09.2026. Sie ersetzt für den Anmeldeweg die Bremse, die
   bisher eine Zeile in die Datenbank schrieb — vor einer erfolgreichen
   Zahlung darf dort nichts entstehen. Zwei Eigenschaften dieser Datei
   sind nicht verhandelbar, und beide sind leicht zu verlieren, wenn
   jemand sie später überarbeitet:

     1. Der Weg, auf dem der Zahlungsanbieter meldet, ist ausgenommen.
        Eine gebremste Rückmeldung wäre eine verlorene Zahlung.
     2. Gezählt wird nur POST. Sonst bremste sie auch Seitenaufrufe.  */
{
  const bremse = readFileSync(join(SERVER, "vera-bremse.conf"), "utf8");

  pruefe("vera-bremse.conf ist vorhanden", bremse.length > 0);
  pruefe(
    "vera-bremse.conf: der Weg des Zahlungsanbieters ist ausgenommen",
    /POST\/zahlung\/rueckmeldung\s+""/.test(bremse),
    "eine gebremste Rückmeldung wäre eine verlorene Zahlung",
  );
  pruefe(
    "vera-bremse.conf: gezählt wird nur POST",
    /~\^POST\s+\$binary_remote_addr/.test(bremse),
  );
  pruefe(
    "vera-bremse.conf: legt eine Zone mit Begrenzung an",
    /limit_req_zone\s+\$vera_bremse_schluessel\s+zone=vera_anmeldung/.test(bremse),
  );
  pruefe(
    "vera-bremse.conf: antwortet mit 429, nicht mit 503",
    /limit_req_status\s+429/.test(bremse),
  );
  pruefe(
    "vera-bremse.conf: sagt, wie sie eingebaut wird",
    bremse.includes("limit_req zone=vera_anmeldung"),
    "ohne die Zeile in sites-available wirkt die Zone nicht",
  );
}

console.log(
  schief.length === 0
    ? `\n${n} von ${n} in Ordnung.`
    : `\n${schief.length} von ${n} fehlgeschlagen:\n${schief.join("\n")}`,
);
process.exit(schief.length === 0 ? 0 : 1);
