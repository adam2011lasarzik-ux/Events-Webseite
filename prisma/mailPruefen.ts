/* ---------------------------------------------------------------
   Selbstprüfung der E-Mail-Einrichtung.

   Aufruf:  npm run mail:pruefen

   Beantwortet: Sind die SMTP-Werte vollständig und plausibel
   hinterlegt — und wenn ja, nimmt das Postfach die Verbindung an?

   Anders als npm run zahlung:pruefen (bewusst OHNE Netzverkehr, weil
   es dort um einen geheimen Zahlungsschlüssel geht) darf dieser
   Befehl die Verbindung wirklich prüfen: Ein SMTP-Login kostet nichts
   und verrät kein Geheimnis, verhindert aber, dass ein falscher Port
   oder ein Tippfehler im Passwort erst bei der ersten echten Anmeldung
   auffällt.

   WICHTIG: Diese Datei gibt niemals das Passwort im Klartext aus.
   --------------------------------------------------------------- */

import { verbindungPruefen, zugangVergessen, adminEmpfaenger } from "../lib/mail";

interface Befund {
  name: string;
  gut: boolean;
  hinweis: string;
}

const befunde: Befund[] = [];
let schwer = 0;

function pruefe(name: string, gut: boolean, hinweis: string): boolean {
  befunde.push({ name, gut, hinweis });
  if (!gut) schwer += 1;
  return gut;
}

/**
 * Vom Passwort wird AUSSCHLIESSLICH die Zeichenzahl gezeigt.
 *
 * Kein Ausschnitt, kein Anfang, kein Ende: Diese Ausgabe landet in
 * Protokolldateien und auf Bildschirmfotos. Die Länge genügt für den
 * einzigen Zweck, den sie hier hat — zu erkennen, ob der Wert
 * unterwegs abgeschnitten wurde.
 */
function nurLaenge(wert: string): string {
  return `hinterlegt (${wert.length} Zeichen)`;
}

const server = (process.env.SMTP_SERVER ?? "").trim();
const portRoh = (process.env.SMTP_PORT ?? "").trim();
const benutzer = (process.env.SMTP_BENUTZER ?? "").trim();
const passwort = process.env.SMTP_PASSWORT ?? "";
const absender = (process.env.SMTP_ABSENDER ?? "").trim();
const adminZiel = (process.env.MAIL_ADMIN_EMPFAENGER ?? "").trim();

/* ── 1. Server und Port ───────────────────────────────────────── */

pruefe(
  "SMTP_SERVER ist hinterlegt",
  server !== "",
  "SMTP_SERVER setzen, z. B. „smtp.hostinger.com“ — zu finden unter „Apps und Geräte " +
    "verbinden → Erweiterte Einstellungen“ im Hostinger-Postfach.",
);

if (pruefe("SMTP_PORT ist hinterlegt", portRoh !== "", "SMTP_PORT setzen, z. B. 465.")) {
  const port = Number(portRoh);
  pruefe(
    "SMTP_PORT ist eine gültige Portnummer",
    Number.isInteger(port) && port > 0,
    `„${portRoh}“ ist keine gültige Portnummer.`,
  );
}

/* ── 2. Zugangsdaten ──────────────────────────────────────────── */

pruefe(
  "SMTP_BENUTZER ist hinterlegt",
  benutzer !== "",
  "SMTP_BENUTZER setzen — die volle Postfach-Adresse, z. B. kontakt@veraevents.de.",
);
if (
  pruefe(
    "SMTP_PASSWORT ist hinterlegt",
    passwort !== "",
    "SMTP_PASSWORT setzen. Niemals ins Repository oder in den Chat schreiben.",
  )
) {
  /* Die häufigste Ursache für „authentication failed" ist nicht ein
     falsches Passwort, sondern ein beim Eintippen oder Einfügen
     verändertes. Diese drei Prüfungen finden genau das — ohne das
     Passwort selbst zu zeigen. */
  pruefe(
    "SMTP_PASSWORT hat kein Leerzeichen am Anfang oder Ende",
    passwort === passwort.trim(),
    "Am Anfang oder Ende steht ein Leerzeichen (oder ein Zeilenumbruch). Beim " +
      "Einfügen auf dem iPad passiert das leicht — der Mailserver weist das Passwort " +
      "dann als falsch ab. In der .env-Datei die Anführungszeichen direkt an den " +
      "ersten und letzten Buchstaben setzen.",
  );
  /* Der eine Fall, der wirklich gefährlich ist — und der gemessen
     wurde, nicht vermutet: Next.js liest die .env-Datei mit einer
     Erweiterung, die "$name" durch andere Variablen ersetzt. Aus
     "ab$cdef" wird dabei "ab". Die Prüfskripte hier tun das NICHT.
     Ohne diese Prüfung wäre also alles grün, während die laufende
     Webseite mit einem verstümmelten Passwort abgewiesen wird —
     genau die Art Fehler, die erst der ersten echten Anmeldung
     auffällt. Ein "$" am Ende oder vor einem Sonderzeichen ist
     dagegen unbedenklich. */
  pruefe(
    "SMTP_PASSWORT enthält kein $, das die Webseite als Verweis liest",
    !/\$[A-Za-z0-9_{]/.test(passwort),
    "Das Passwort enthält ein $ mit einem Buchstaben, einer Ziffer oder { dahinter. " +
      "Next.js liest das als Verweis auf eine andere Einstellung und schneidet den " +
      "Rest weg — die Webseite käme also mit einem falschen Passwort an, obwohl " +
      "diese Prüfung sonst grün wäre. Bitte im Postfach ein Passwort ohne $ vergeben.",
  );
  pruefe(
    "SMTP_PASSWORT wirkt vollständig",
    passwort.length >= 8,
    `Es sind nur ${passwort.length} Zeichen angekommen — das sieht abgeschnitten aus. ` +
      "Enthält das Passwort ein #-Zeichen und stehen keine Anführungszeichen darum, " +
      "wird alles ab dem # als Kommentar verworfen.",
  );
}

/* ── 3. Absender ──────────────────────────────────────────────── */

if (
  pruefe(
    "SMTP_ABSENDER ist hinterlegt",
    absender !== "",
    "SMTP_ABSENDER setzen — die Adresse, die Empfänger als Absender sehen.",
  )
) {
  pruefe(
    "SMTP_ABSENDER sieht wie eine E-Mail-Adresse aus",
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(absender),
    `„${absender}“ enthält kein gültiges @-Muster.`,
  );
}

/* ── 4. Admin-Benachrichtigung (optional) ─────────────────────── */

if (adminZiel) {
  pruefe(
    "MAIL_ADMIN_EMPFAENGER sieht wie eine E-Mail-Adresse aus",
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminZiel),
    `„${adminZiel}“ enthält kein gültiges @-Muster.`,
  );
}

/* ── Ausgabe der statischen Prüfung ───────────────────────────── */

console.log("\nE-Mail-Einrichtung — Selbstprüfung\n");
for (const b of befunde) {
  console.log(`  ${b.gut ? "✓" : "✗"} ${b.name}`);
  if (!b.gut) console.log(`      → ${b.hinweis}\n`);
}

console.log("\nHinterlegt:");
console.log(`  Server              ${server || "— fehlt —"}`);
console.log(`  Port                ${portRoh || "— fehlt —"}`);
console.log(`  Benutzer            ${benutzer || "— fehlt —"}`);
console.log(`  Passwort            ${passwort ? nurLaenge(passwort) : "— fehlt —"}`);
console.log(`  Absender            ${absender || "— fehlt —"}`);
console.log(`  Admin-Empfänger     ${adminEmpfaenger() ?? "— fehlt (fällt auf den Absender zurück) —"}`);

/* ── Verbindung wirklich prüfen ───────────────────────────────── */

/*
 * Die Verbindung wird IMMER geprüft, sobald alle fünf Werte da sind —
 * auch dann, wenn oben etwas bemängelt wurde.
 *
 * Das war anfangs anders herum gebaut und damit falsch: Ein einzelner
 * Hinweis hat den eigentlichen Test verhindert, obwohl die Anmeldung
 * längst nachweislich funktionierte. Ein Hinweis ist eine Vermutung,
 * die Anmeldung beim Mailserver ist die Antwort — die Antwort darf
 * nicht an der Vermutung scheitern.
 */
async function haupt() {
  const vollstaendig = server !== "" && portRoh !== "" && benutzer !== "" && passwort !== "" && absender !== "";

  if (!vollstaendig) {
    console.log("\nEs fehlen Werte — ohne sie lässt sich die Verbindung nicht prüfen.");
    console.log(`${schwer} Punkt(e) offen. Siehe die Hinweise oben.\n`);
    process.exit(1);
  }

  console.log("\nVerbindung zum Postfach wird geprüft …");
  let verbindungOk = false;
  try {
    await verbindungPruefen();
    verbindungOk = true;
    console.log("✓ Verbindung und Anmeldung erfolgreich.");
  } catch (e) {
    console.log("✗ Verbindung oder Anmeldung fehlgeschlagen.");
    console.log(`  → ${e instanceof Error ? e.message : String(e)}`);
    console.log(
      "\n  Mögliche Ursachen: falscher Port, falsches Passwort, oder die Zugangsdaten\n" +
        "  gehören zu einem anderen Postfach als angenommen. Das Passwort selbst wird\n" +
        "  hier nie angezeigt.",
    );
  } finally {
    zugangVergessen();
  }

  console.log("");
  if (verbindungOk && schwer === 0) {
    console.log("Alles vollständig. Der E-Mail-Versand ist eingerichtet.\n");
    process.exit(0);
  }
  if (verbindungOk) {
    console.log(
      `Die Anmeldung funktioniert, aber ${schwer} Punkt(e) sind offen — siehe oben.\n` +
        "Solange einer davon das Einlesen des Passworts betrifft, kann die laufende\n" +
        "Webseite trotzdem scheitern, obwohl dieser Test hier gelingt.\n",
    );
  } else {
    console.log(`${schwer} weitere(r) Punkt(e) offen. Siehe die Hinweise oben.\n`);
  }
  process.exit(1);
}

void haupt();
