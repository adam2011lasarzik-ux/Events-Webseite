/* ---------------------------------------------------------------
   Selbstprüfung der Zahlungseinrichtung.

   Aufruf:  npm run zahlung:pruefen

   Beantwortet eine einzige Frage: Sind die Werte, die diese Seite zum
   Bezahlen braucht, vollständig und plausibel hinterlegt?

   Bewusst OHNE Netzverkehr. Es wird nichts beim Anbieter abgefragt,
   nichts gesendet und nichts angelegt. Der Befehl lässt sich deshalb
   überall gefahrlos laufen — auch auf dem Server beim Hoster, direkt
   nach dem Setzen der Umgebungsvariablen.

   WICHTIG: Diese Datei gibt niemals einen vollständigen Schlüssel aus.
   Ausgaben landen in Protokolldateien, und ein Protokoll ist kein
   sicherer Ort für ein Geheimnis. Gezeigt wird nur der Anfang, damit
   sich zwei Schlüssel voneinander unterscheiden lassen.
   --------------------------------------------------------------- */

import { istTestschluessel } from "../lib/zahlungRegeln";

interface Befund {
  name: string;
  gut: boolean;
  /** Was zu tun ist, wenn es nicht gut ist. */
  hinweis: string;
}

const befunde: Befund[] = [];
let schwer = 0;

function pruefe(name: string, gut: boolean, hinweis: string): boolean {
  befunde.push({ name, gut, hinweis });
  if (!gut) schwer += 1;
  return gut;
}

/** Nur so viel vom Wert zeigen, dass er wiedererkennbar bleibt. */
function angedeutet(wert: string): string {
  return wert.length <= 12 ? "…" : `${wert.slice(0, 8)}… (${wert.length} Zeichen)`;
}

const schluessel = (process.env.ZAHLUNG_GEHEIMSCHLUESSEL ?? "").trim();
const geheimnis = (process.env.ZAHLUNG_WEBHOOK_GEHEIMNIS ?? "").trim();
const adresse = (process.env.OEFFENTLICHE_ADRESSE ?? "").trim();

/* ── 1. Der Zahlungsschlüssel ─────────────────────────────────── */

if (
  pruefe(
    "Ein Zahlungsschlüssel ist hinterlegt",
    schluessel !== "",
    "ZAHLUNG_GEHEIMSCHLUESSEL setzen — im Stripe-Dashboard bei eingeschaltetem " +
      "Testmodus unter „Entwickler → API-Schlüssel“ (siehe docs/stripe-einrichten.md).",
  )
) {
  /* Der Riegel. Ein echter Schlüssel wird von lib/zahlung.ts ohnehin
     abgewiesen — hier wird es nur früher und deutlicher gesagt, damit
     niemand erst am fehlgeschlagenen Bezahlvorgang merkt, dass der
     falsche Wert hinterlegt ist. */
  const echt = /^(sk|rk)_live_/.test(schluessel);
  pruefe(
    "Es ist ein TESTschlüssel, kein echter",
    istTestschluessel(schluessel),
    echt
      ? "ACHTUNG: Das ist ein Schlüssel für den Echtbetrieb. Die Seite weist ihn ab — " +
          "das ist so gewollt. Bitte den Testschlüssel eintragen (beginnt mit sk_test_)."
      : "Der Schlüssel beginnt weder mit sk_test_ noch mit rk_test_. Vermutlich ist " +
          "etwas beim Kopieren verloren gegangen.",
  );
}

/* ── 2. Das Webhook-Geheimnis ─────────────────────────────────── */

if (
  pruefe(
    "Ein Webhook-Geheimnis ist hinterlegt",
    geheimnis !== "",
    "ZAHLUNG_WEBHOOK_GEHEIMNIS setzen. Diesen Wert gibt es erst, wenn die Seite unter " +
      "einer öffentlichen Adresse erreichbar ist und der Webhook bei Stripe eingetragen " +
      "wurde. Ohne ihn wird KEINE Rückmeldung verarbeitet — dann bliebe jede Zahlung " +
      "unbestätigt.",
  )
) {
  pruefe(
    "Das Webhook-Geheimnis sieht richtig aus",
    geheimnis.startsWith("whsec_"),
    "Ein Webhook-Geheimnis von Stripe beginnt mit whsec_. Hier steht etwas anderes — " +
      "womöglich wurde versehentlich ein API-Schlüssel eingetragen.",
  );
}

/* ── 3. Die öffentliche Adresse ───────────────────────────────── */

if (
  pruefe(
    "Die öffentliche Adresse ist hinterlegt",
    adresse !== "",
    "OEFFENTLICHE_ADRESSE setzen. Daraus werden die Rücksprungadressen der Bezahlseite " +
      "gebaut. Bewusst eine eigene Angabe: Der Host-Kopf einer Anfrage lässt sich fälschen.",
  )
) {
  pruefe(
    "Die Adresse endet ohne Schrägstrich",
    !adresse.endsWith("/"),
    `„${adresse}“ endet auf einen Schrägstrich. Sonst entstehen Adressen mit zwei ` +
      "Schrägstrichen hintereinander.",
  );
  pruefe(
    "Die Adresse ist vollständig (mit http:// oder https://)",
    /^https?:\/\//.test(adresse),
    `„${adresse}“ beginnt nicht mit http:// oder https://.`,
  );
}

/* ── Ausgabe ──────────────────────────────────────────────────── */

console.log("\nZahlungseinrichtung — Selbstprüfung\n");
for (const b of befunde) {
  console.log(`  ${b.gut ? "✓" : "✗"} ${b.name}`);
  if (!b.gut) console.log(`      → ${b.hinweis}\n`);
}

console.log("\nHinterlegt:");
console.log(`  Schlüssel        ${schluessel ? angedeutet(schluessel) : "— fehlt —"}`);
console.log(`  Webhook-Geheimnis ${geheimnis ? angedeutet(geheimnis) : "— fehlt —"}`);
console.log(`  Öffentliche Adresse ${adresse || "— fehlt —"}`);

/* Der Hinweis zum Echtbetrieb ist kein Fehler, sondern eine
   Standortbestimmung: Solange die Adresse örtlich ist, kann Stripe
   diese Seite nicht erreichen — der Webhook kommt dann nie an. */
const oertlich = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/.test(adresse);
if (oertlich) {
  console.log(
    "\nHinweis: Die Adresse ist örtlich. Stripe kann diese Seite von aussen nicht\n" +
      "erreichen, eine echte Rückmeldung kommt also nie an. Das ist bis zum Hosting\n" +
      "normal und kein Fehler.",
  );
}

if (schwer === 0) {
  console.log("\nAlles vollständig. Die Zahlung ist eingerichtet — im Testbetrieb.\n");
  process.exit(0);
}

console.log(`\n${schwer} Punkt(e) offen. Siehe die Hinweise oben.\n`);
process.exit(1);
