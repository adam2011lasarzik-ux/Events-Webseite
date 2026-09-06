/* ---------------------------------------------------------------
   Schickt EINE Alarm-Mail, wenn die nächtliche Datenbank-Sicherung
   fehlgeschlagen ist. Wird ausschließlich von server/vera-sicherung.sh
   im Fehlerfall aufgerufen (ERR-Trap) — bei einer erfolgreichen
   Sicherung passiert hier nichts, das ist ausdrücklicher Wunsch.

   Aufruf:  npm run sicherung:alarm -- "<Meldung>"

   Verschickt bewusst über die schluckende Variante: Fehlt die
   E-Mail-Einrichtung (noch) selbst, soll das Backup-Skript deshalb
   nicht zusätzlich fehlschlagen — es hat sein eigenes Problem schon.
   --------------------------------------------------------------- */

import { mailSendenOhneAbbruch, adminEmpfaenger } from "../lib/mail";
import { sicherungsAlarmMail } from "../lib/mailVorlagen";

async function haupt() {
  const meldung = process.argv.slice(2).join(" ") || "Unbekannter Fehler (keine Meldung übergeben).";
  const empfaenger = adminEmpfaenger();
  if (!empfaenger) {
    console.error("Sicherungs-Alarm: keine E-Mail-Adresse hinterlegt, kein Versand.");
    return;
  }
  await mailSendenOhneAbbruch({
    an: empfaenger,
    ...sicherungsAlarmMail(new Date().toISOString(), meldung),
  });
}

void haupt();
