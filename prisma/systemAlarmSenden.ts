/* ---------------------------------------------------------------
   Schickt die Störungs- oder Entwarnungsmail der Serverüberwachung.
   Wird ausschließlich von /usr/local/bin/vera-wache.sh aufgerufen.

   Aufruf:
       npm run system:alarm -- "Befund 1" "Befund 2" …
       npm run system:alarm -- --entwarnung

   ANDERS als beim Sicherungs-Alarm wird hier die ABBRECHENDE Variante
   benutzt, und das ist der ganze Punkt: Bei einer Anmeldebestätigung
   darf ein Mail-Ausfall die Buchung nicht kaputtmachen — dort ist die
   Mail eine Zugabe. Hier ist der Versand die gesamte Aufgabe. Schluckt
   man den Fehler, bleibt eine Wache übrig, die brav ihren Zustand
   notiert und niemanden erreicht, und der Exit-Code sagt trotzdem
   "in Ordnung".

   Deshalb: Scheitert der Versand, endet dieses Skript mit Fehler. Die
   Wache meldet das ins Journal, und `systemctl status vera-wache`
   zeigt den Dienst als fehlgeschlagen.
   --------------------------------------------------------------- */

import { mailSenden, adminEmpfaenger } from "../lib/mail";
import { systemAlarmMail, systemEntwarnungMail } from "../lib/mailVorlagen";

async function haupt() {
  const argumente = process.argv.slice(2);
  const empfaenger = adminEmpfaenger();
  if (!empfaenger) {
    /* Kein Empfänger heißt: Die Wache kann niemanden erreichen. Das
       ist kein Randfall, den man wegloggt — das ist ein Ausfall der
       Überwachung selbst. */
    console.error("Überwachung: keine E-Mail-Adresse hinterlegt, kein Versand möglich.");
    process.exitCode = 1;
    return;
  }

  const entwarnung = argumente[0] === "--entwarnung";
  const befunde = argumente.filter((a) => a !== "--entwarnung").filter(Boolean);

  if (!entwarnung && befunde.length === 0) {
    console.error("Überwachung: keine Befunde übergeben, kein Versand.");
    return;
  }

  try {
    await mailSenden({
      an: empfaenger,
      ...(entwarnung ? systemEntwarnungMail() : systemAlarmMail(befunde)),
    });
  } catch (e) {
    console.error("Überwachung: Der Versand der Meldung ist fehlgeschlagen.", e);
    process.exitCode = 1;
  }
}

void haupt();
