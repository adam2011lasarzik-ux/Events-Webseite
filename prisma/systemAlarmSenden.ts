/* ---------------------------------------------------------------
   Schickt die Störungs- oder Entwarnungsmail der Serverüberwachung.
   Wird ausschließlich von /usr/local/bin/vera-wache.sh aufgerufen.

   Aufruf:
       npm run system:alarm -- "Befund 1" "Befund 2" …
       npm run system:alarm -- --entwarnung

   Wie beim Sicherungs-Alarm die schluckende Variante: Wenn schon der
   Server klemmt, soll nicht zusätzlich das Meldeskript abbrechen —
   der Fehler steht dann immer noch im Journal.
   --------------------------------------------------------------- */

import { mailSendenOhneAbbruch, adminEmpfaenger } from "../lib/mail";
import { systemAlarmMail, systemEntwarnungMail } from "../lib/mailVorlagen";

async function haupt() {
  const argumente = process.argv.slice(2);
  const empfaenger = adminEmpfaenger();
  if (!empfaenger) {
    console.error("Überwachung: keine E-Mail-Adresse hinterlegt, kein Versand.");
    return;
  }

  const entwarnung = argumente[0] === "--entwarnung";
  const befunde = argumente.filter((a) => a !== "--entwarnung").filter(Boolean);

  if (!entwarnung && befunde.length === 0) {
    console.error("Überwachung: keine Befunde übergeben, kein Versand.");
    return;
  }

  await mailSendenOhneAbbruch({
    an: empfaenger,
    ...(entwarnung ? systemEntwarnungMail() : systemAlarmMail(befunde)),
  });
}

void haupt();
