/* ---------------------------------------------------------------
   Legt einen Zugang für den Adminbereich an oder ändert dessen
   Passwort.

   Aufruf:
       npm run admin -- <e-mail> <passwort>

   Es gibt bewusst KEINE Selbstregistrierung im Browser. Eine
   öffentlich erreichbare Seite, über die man sich einen Admin-Zugang
   anlegen kann, wäre genau die Tür, die der Adminbereich verschließen
   soll.

   Das Passwort steht als Aufrufparameter da und landet damit in der
   Befehlsgeschichte der Kommandozeile. Auf dem eigenen Rechner ist das
   vertretbar; auf dem Server danach die Sitzung schließen oder die
   Geschichte leeren.
   --------------------------------------------------------------- */

import { db } from "../lib/db";
import { hashen, passwortZuSchwach } from "../lib/passwort";

async function main() {
  const [email, passwort] = process.argv.slice(2);

  if (!email || !passwort) {
    console.error("Aufruf: npm run admin -- <e-mail> <passwort>");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    console.error("Das sieht nicht nach einer E-Mail-Adresse aus.");
    process.exit(1);
  }
  const schwach = passwortZuSchwach(passwort);
  if (schwach) {
    console.error(schwach);
    process.exit(1);
  }

  const passwortHash = await hashen(passwort);
  const sauber = email.trim().toLowerCase();

  const vorhanden = await db.adminUser.findUnique({ where: { email: sauber } });

  if (vorhanden) {
    /* Zusammen mit dem Passwort auch den zweiten Faktor abschalten.
       Diese Kommandozeile ist der Notausgang, wenn jemand sich selbst
       ausgesperrt hat — und der häufigste Grund dafür ist, dass sowohl
       das Gerät mit der Authenticator-App als auch die Backup-Codes
       nicht mehr zu erreichen sind. Bliebe der zweite Faktor aktiv,
       wäre der Zugang trotz neuem Passwort weiterhin verschlossen. */
    await db.$transaction([
      db.adminUser.update({
        where: { id: vorhanden.id },
        data: { passwortHash, zweiterFaktorGeheimnis: null, zweiterFaktorAktiv: false },
      }),
      db.adminZweiterFaktorCode.deleteMany({ where: { adminId: vorhanden.id } }),
    ]);
    // Alle offenen Sitzungen beenden: Wer das Passwort ändert, will in
    // aller Regel genau das — jemanden aussperren.
    const weg = await db.adminSession.deleteMany({ where: { adminId: vorhanden.id } });
    console.log(
      `Passwort für ${sauber} geändert. ${weg.count} offene Sitzung(en) beendet. ` +
        `Der zweite Faktor wurde dabei deaktiviert — er muss nach dem Anmelden neu eingerichtet werden.`,
    );
  } else {
    await db.adminUser.create({ data: { email: sauber, passwortHash } });
    console.log(`Zugang für ${sauber} angelegt.`);
  }
}

main()
  .catch((e) => {
    console.error("Fehlgeschlagen:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
