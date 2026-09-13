/* ---------------------------------------------------------------
   Eine einzelne Anmeldung ENDGÜLTIG entfernen — für übrig gebliebene
   Testbuchungen, nicht für den laufenden Betrieb.

   Es gibt bewusst KEINEN Knopf dafür im Adminbereich. Anonymisieren
   (Personendaten löschen) ist dort vorgesehen und bleibt die richtige
   Antwort auf ein echtes Löschrecht — Betrag und Datum bleiben dabei
   für die Buchhaltung stehen, wie es sein muss. Dieses Skript
   beantwortet die seltenere Frage: Darf die ganze Zeile weg, weil sie
   nie eine echte Zahlung war? Die Regel dafür steht getrennt in
   lib/anmeldungLoeschbar.ts und lässt sich dort einzeln nachlesen und
   prüfen.

   Aufruf:
       npm run anmeldung:loeschen -- <anmeldung-id>

   Das Skript ändert NICHTS, wenn die Regel ablehnt — auch nicht
   teilweise. Es meldet nur den Grund.
   --------------------------------------------------------------- */

import { db } from "../lib/db";
import { anmeldungLoeschbar } from "../lib/anmeldungLoeschbar";

async function main() {
  const [id] = process.argv.slice(2);
  if (!id) {
    console.error("Aufruf: npm run anmeldung:loeschen -- <anmeldung-id>");
    process.exit(1);
  }

  const anmeldung = await db.registration.findUnique({
    where: { id },
    include: { event: { select: { titel: true } }, _count: { select: { teilnehmer: true } } },
  });

  if (!anmeldung) {
    console.error(`Keine Anmeldung mit der Kennung "${id}" gefunden. Nichts geändert.`);
    process.exit(1);
  }

  const entscheidung = anmeldungLoeschbar(anmeldung);

  if (!entscheidung.loeschbar) {
    console.error(`Abgelehnt (${entscheidung.grund}): ${entscheidung.erklaerung}`);
    console.error("Nichts geändert.");
    process.exit(1);
  }

  console.log("Wird entfernt:");
  console.log(`  Veranstaltung:     ${anmeldung.event.titel}`);
  console.log(`  Angemeldet am:     ${anmeldung.angemeldetAm.toISOString()}`);
  console.log(`  Storniert am:      ${anmeldung.storniertAm?.toISOString() ?? "—"}`);
  console.log(`  Anonymisiert am:   ${anmeldung.anonymisiertAm?.toISOString() ?? "—"}`);
  console.log(`  Teilnehmer:        ${anmeldung._count.teilnehmer}`);
  console.log(`  Zahlungsstatus:    ${anmeldung.zahlungsStatus} (nie eine echte Zahlung)`);

  // Eine Transaktion, damit nie nur die Teilnehmer oder nur die
  // Anmeldung verschwinden, falls mittendrin etwas schiefgeht.
  await db.$transaction([
    db.participant.deleteMany({ where: { registrationId: anmeldung.id } }),
    db.registration.delete({ where: { id: anmeldung.id } }),
  ]);

  console.log("\nEndgültig entfernt.");
}

main()
  .catch((e) => {
    console.error("Fehlgeschlagen:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
