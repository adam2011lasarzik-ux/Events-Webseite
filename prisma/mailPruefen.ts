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

/** Nur so viel vom Wert zeigen, dass er wiedererkennbar bleibt. */
function angedeutet(wert: string): string {
  return wert.length <= 4 ? "…" : `${wert.slice(0, 3)}…${wert.slice(-6)}`;
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
pruefe(
  "SMTP_PASSWORT ist hinterlegt",
  passwort !== "",
  "SMTP_PASSWORT setzen. Niemals ins Repository oder in den Chat schreiben.",
);

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
console.log(`  Passwort            ${passwort ? angedeutet(passwort) : "— fehlt —"}`);
console.log(`  Absender            ${absender || "— fehlt —"}`);
console.log(`  Admin-Empfänger     ${adminEmpfaenger() ?? "— fehlt (fällt auf den Absender zurück) —"}`);

/* ── Verbindung wirklich prüfen, wenn alles hinterlegt ist ────── */

async function haupt() {
  if (schwer > 0) {
    console.log(`\n${schwer} Punkt(e) offen. Siehe die Hinweise oben.\n`);
    process.exit(1);
  }

  console.log("\nVerbindung zum Postfach wird geprüft …");
  try {
    await verbindungPruefen();
    console.log("✓ Verbindung und Anmeldung erfolgreich.\n");
    console.log("Alles vollständig. Der E-Mail-Versand ist eingerichtet.\n");
    process.exit(0);
  } catch (e) {
    console.log("✗ Verbindung oder Anmeldung fehlgeschlagen.");
    console.log(`  → ${e instanceof Error ? e.message : String(e)}`);
    console.log(
      "\n  Mögliche Ursachen: falscher Port, falsches Passwort, oder die Zugangsdaten\n" +
        "  gehören zu einem anderen Postfach als angenommen. Das Passwort selbst wird\n" +
        "  hier nie angezeigt.\n",
    );
    process.exit(1);
  } finally {
    zugangVergessen();
  }
}

void haupt();
