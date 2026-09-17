/* ---------------------------------------------------------------
   Monatliche Erinnerung an Papierunterlagen.

   Klasse 1 (Gesundheits- und Notfallangaben) und Klasse 2
   (vollständige Einverständniserklärungen) liegen nicht in der
   Datenbank, sondern im Ordner. Der Löschlauf kann sie nicht
   vernichten — deshalb dieser Weg.

   Aufruf:
       npm run papier:erinnern            schickt die Mail
       npm run papier:erinnern -- --zeigen   zeigt nur, mailt nicht

   Ohne fällige Unterlagen passiert NICHTS. Eine monatliche Mail
   „nichts zu tun" wird nach dem dritten Mal ungelesen weggeklickt —
   und dann auch die vierte, in der etwas steht.
   --------------------------------------------------------------- */

import { db } from "../lib/db";
import { adminEmpfaenger, mailSenden } from "../lib/mail";
import { papiererinnerungsMail } from "../lib/mailVorlagen";
import { papiererinnerungen } from "../lib/loeschlauf";

function datum(d: Date): string {
  return d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
}

async function main() {
  const nurZeigen = process.argv.includes("--zeigen");

  const faellig = await papiererinnerungen();

  if (faellig.length === 0) {
    console.log("Keine Papierunterlagen fällig. Es wird nicht gemailt.");
    return;
  }

  const posten = faellig.map((p) => ({
    klasse: p.klasse,
    eventTitel: p.eventTitel,
    faelligSeit: datum(p.faelligAm),
    anzahl: p.anzahl,
  }));

  const mail = papiererinnerungsMail(posten);

  if (nurZeigen) {
    console.log(`Betreff: ${mail.betreff}\n`);
    console.log(mail.text);
    console.log("\n(Nur angezeigt — nichts verschickt.)");
    return;
  }

  const empfaenger = adminEmpfaenger();
  if (!empfaenger) {
    console.error("Keine E-Mail-Adresse hinterlegt — nichts verschickt.");
    process.exitCode = 1;
    return;
  }

  /* Die ABBRECHENDE Variante, anders als beim Sicherungs-Alarm: Hier
     IST der Versand die ganze Aufgabe. Schluckt man den Fehler, bleibt
     eine Erinnerung übrig, die niemanden erreicht — und der Timer
     meldet trotzdem Erfolg. */
  await mailSenden({ an: empfaenger, ...mail });
  console.log(`Erinnerung an ${empfaenger} verschickt: ${posten.length} Posten.`);
}

main()
  .catch((e) => {
    console.error("Papiererinnerung fehlgeschlagen:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
