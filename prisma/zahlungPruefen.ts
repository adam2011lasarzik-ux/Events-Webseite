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

import { schluesselPruefen, istLiveschluessel, type SchluesselUrteil } from "../lib/zahlungRegeln";

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
const echtbetriebFreigegeben =
  (process.env.ZAHLUNG_ECHTBETRIEB ?? "").trim().toLowerCase() === "ja-echtes-geld";

/* Welchen Modus die hinterlegten Werte ergeben — für die Schlussmeldung
   und die Warnhinweise weiter unten. */
let urteil: SchluesselUrteil = { ok: false, grund: "fehlt" };

/* ── 1. Der Zahlungsschlüssel ─────────────────────────────────── */

if (
  pruefe(
    "Ein Zahlungsschlüssel ist hinterlegt",
    schluessel !== "",
    "ZAHLUNG_GEHEIMSCHLUESSEL setzen — im Stripe-Dashboard unter " +
      "„Entwickler → API-Schlüssel“ (siehe docs/stripe-einrichten.md).",
  )
) {
  /* Derselbe Riegel wie in lib/zahlung.ts, nur früher und deutlicher:
     niemand soll erst am fehlgeschlagenen Bezahlvorgang merken, dass der
     falsche Wert hinterlegt ist oder der Echtbetrieb versehentlich (nicht)
     freigegeben wurde. */
  urteil = schluesselPruefen(schluessel, echtbetriebFreigegeben);
  pruefe(
    "Der Zahlungsschlüssel ist gültig und zum Modus passend",
    urteil.ok,
    urteil.ok
      ? ""
      : {
          fehlt: "",
          ungueltig:
            "Der Schlüssel beginnt weder mit sk_test_ noch mit sk_live_. Vermutlich ist " +
            "beim Kopieren etwas verloren gegangen.",
          "live-ohne-freigabe":
            "ACHTUNG: Das ist ein Schlüssel für den ECHTBETRIEB, aber ZAHLUNG_ECHTBETRIEB " +
            "ist nicht gesetzt. Die Seite weist ihn ab — das ist so gewollt. Zum " +
            "Scharfschalten ZAHLUNG_ECHTBETRIEB=ja-echtes-geld setzen (erst, wenn wirklich " +
            "echtes Geld fließen soll), sonst einen Testschlüssel (sk_test_) eintragen.",
        }[urteil.grund],
  );

  /* Ein freigegebener Echtbetrieb ist kein Fehler, aber er gehört laut
     gesagt: Ab hier fließt echtes Geld. */
  if (urteil.ok && urteil.modus === "live") {
    console.log(
      "      ⚠️  ECHTBETRIEB freigegeben — mit diesem Schlüssel fließt ECHTES GELD.\n",
    );
  }
  /* Umgekehrt: Flag gesetzt, aber (noch) ein Testschlüssel. Harmlos,
     aber verwirrend — darum ein Hinweis, kein Fehler. */
  if (echtbetriebFreigegeben && !istLiveschluessel(schluessel)) {
    console.log(
      "      Hinweis: ZAHLUNG_ECHTBETRIEB ist gesetzt, aber es liegt ein Testschlüssel vor.\n" +
        "      Es bleibt beim Testbetrieb, bis ein Live-Schlüssel (sk_live_) eingetragen wird.\n",
    );
  }
}

/* ── 1b. Der Schlüssel für die Anmeldedaten ───────────────────── */

/* Neu am 25.09.2026. Zwischen dem Absenden des Formulars und der
   bestätigten Zahlung liegen die Anmeldedaten AUSSCHLIESSLICH
   verschlüsselt beim Zahlungsanbieter — in der VERA-Datenbank steht
   bis dahin nichts. Fehlt dieser Schlüssel, kommt keine Anmeldung mehr
   zustande; geht er verloren, während jemand bezahlt, ist das Geld da
   und die Anmeldung unlesbar.

   Deshalb steht er hier neben den Zahlungswerten und nicht in einer
   Nebenbemerkung: Wer diese Prüfung laufen lässt, soll ihn sehen. */

const anmeldeSchluessel = (process.env.ANMELDUNG_SCHLUESSEL ?? "").trim();
const anmeldeSchluesselAlt = (process.env.ANMELDUNG_SCHLUESSEL_ALT ?? "").trim();

if (
  pruefe(
    "Ein Schlüssel für die Anmeldedaten ist hinterlegt",
    anmeldeSchluessel !== "",
    "ANMELDUNG_SCHLUESSEL setzen. Neu erzeugen mit:  openssl rand -base64 32\n" +
      "     Ohne ihn kann keine Anmeldung mehr entstehen.",
  )
) {
  const bytes = Buffer.from(anmeldeSchluessel, "base64");
  pruefe(
    "Er ist 32 Byte lang (AES-256)",
    bytes.length === 32,
    `Gefunden sind ${bytes.length} Byte. Erwartet werden 32 Byte als base64 ` +
      "(44 Zeichen). Neu erzeugen mit:  openssl rand -base64 32",
  );
  /* Derselbe Wert wie ein Stripe-Schlüssel wäre kein Tippfehler,
     sondern zwei Geheimnisse mit einem Leben: Wer eines erfährt, hat
     beide. */
  pruefe(
    "Er ist nicht derselbe Wert wie ein Zahlungsschlüssel",
    anmeldeSchluessel !== schluessel && anmeldeSchluessel !== geheimnis,
    "Zwei verschiedene Zwecke brauchen zwei verschiedene Geheimnisse.",
  );

  if (anmeldeSchluesselAlt !== "") {
    const altBytes = Buffer.from(anmeldeSchluesselAlt, "base64");
    pruefe(
      "Der alte Schlüssel (Wechsel läuft) ist ebenfalls 32 Byte lang",
      altBytes.length === 32,
      `Gefunden sind ${altBytes.length} Byte.`,
    );
    pruefe(
      "Alter und neuer Schlüssel sind verschieden",
      anmeldeSchluesselAlt !== anmeldeSchluessel,
      "Sind sie gleich, ist der Wechsel nur zur Hälfte gemacht — er wirkt nicht.",
    );
    console.log(
      "     Hinweis: ANMELDUNG_SCHLUESSEL_ALT ist gesetzt. Nach 24 Stunden kann er weg —\n" +
        "     so lange lebt eine Bezahlseite beim Anbieter längstens.",
    );
  }
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
  const modus = urteil.ok && urteil.modus === "live" ? "im ECHTBETRIEB" : "im Testbetrieb";
  console.log(`\nAlles vollständig. Die Zahlung ist eingerichtet — ${modus}.\n`);
  process.exit(0);
}

console.log(`\n${schwer} Punkt(e) offen. Siehe die Hinweise oben.\n`);
process.exit(1);
