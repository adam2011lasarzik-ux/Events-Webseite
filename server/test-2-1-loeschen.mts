/* ---------------------------------------------------------------
   Eine Testanmeldung ENDGÜLTIG entfernen — der getrennte Weg.

   Dieses Skript löscht wirklich. Es ist absichtlich vom Prüfweg
   getrennt (server/test-2-1-pruefen.mts) und verlangt drei Dinge,
   bevor es etwas tut:

     1. die genaue Anmeldenummer — kein Suchbegriff, keine Auswahl
     2. die Bestätigung, dass kein Geld eingegangen ist (es prüft das
        selbst noch einmal und bricht sonst ab)
     3. den ausdrücklichen Schalter --wirklich

   Ohne --wirklich zeigt es nur, WAS es löschen würde.

   ── Warum so umständlich ────────────────────────────────────────

   Weil ein Löschbefehl, der auch ohne Nachdenken funktioniert,
   irgendwann ohne Nachdenken benutzt wird. Und weil eine gelöschte
   Buchung, zu der Geld eingegangen ist, ein Vorgang ohne Beleg wäre:
   Das Geld ist da, und niemand weiss mehr, wofür.

   ── Aufruf ──────────────────────────────────────────────────────

       cd /var/www/vera

       # Erst die Vorschau — löscht nichts:
       sudo -u vera npx tsx --env-file=.env ./test-2-1-loeschen.mts <nummer>

       # Dann, wenn die Vorschau stimmt:
       sudo -u vera npx tsx --env-file=.env ./test-2-1-loeschen.mts <nummer> --wirklich

   Vorher eine Sicherung ziehen. Der Befehl dafür steht im
   Ausrollplan (docs/stufe2-ausrollen.md, Schritt 2).
   --------------------------------------------------------------- */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client.ts";
import Stripe from "stripe";

const VERBINDUNG = process.env.DATABASE_URL;
if (!VERBINDUNG) {
  console.error("DATABASE_URL ist nicht gesetzt. Wurde --env-file=.env vergessen?");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaMariaDb(VERBINDUNG) });

const nummer = process.argv[2];
const wirklich = process.argv.includes("--wirklich");

if (!nummer || nummer.startsWith("--")) {
  console.error(
    "Aufruf: npx tsx --env-file=.env ./test-2-1-loeschen.mts <anmeldenummer> [--wirklich]\n" +
      "Die Anmeldenummer liefert ./test-2-1-pruefen.mts.",
  );
  process.exit(1);
}

const euro = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "—" : `${(cents / 100).toFixed(2).replace(".", ",")} €`;

async function hauptlauf() {
  const a = await db.registration.findUnique({
    where: { id: nummer },
    include: { teilnehmer: true, event: { select: { titel: true } }, aufnahmewidersprueche: true },
  });

  if (!a) {
    console.error(`Keine Anmeldung mit der Nummer ${nummer}. Nichts getan.`);
    process.exitCode = 1;
    return;
  }

  console.log("\nDas würde entfernt:");
  console.log("─".repeat(64));
  console.log(`Anmeldenummer   ${a.id}`);
  console.log(`Veranstaltung   ${a.event.titel}`);
  console.log(`Kontakt         ${a.kontaktVorname} ${a.kontaktNachname} <${a.kontaktEmail}>`);
  console.log(`Teilnehmer      ${a.teilnehmer.length}: ${a.teilnehmer.map((t) => `${t.vorname} ${t.nachname}`).join(", ")}`);
  console.log(`Status          ${a.status} / Zahlung: ${a.zahlungsStatus}`);
  console.log(`Preis           ${euro(a.gesamtpreisCents)}`);
  console.log(`Bezahlt         ${euro(a.bezahlterBetragCents)}`);
  console.log(`Aufnahme-Widersprüche  ${a.aufnahmewidersprueche.length}`);
  console.log("─".repeat(64));

  /* ── Der Riegel ──────────────────────────────────────────────
     Wird hier ein zweites Mal geprüft, obwohl der Prüfweg es schon
     getan hat. Zwischen beiden Läufen kann Zeit vergangen sein, und
     eine verspätete Zahlung ändert die Antwort. */
  if (a.zahlungsStatus === "BEZAHLT" || a.zahlungsStatus === "TEILWEISE_ERSTATTET") {
    console.error(
      `\nABBRUCH: Diese Buchung steht auf „${a.zahlungsStatus}". Es ist Geld eingegangen.\n` +
        "Eine bezahlte Buchung wird nicht gelöscht, sondern storniert und erstattet.",
    );
    process.exitCode = 1;
    return;
  }

  const schluessel = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
  if (a.zahlungsReferenz) {
    if (!schluessel) {
      console.error(
        "\nABBRUCH: Zu dieser Buchung gehört eine Bezahlseite " +
          `(${a.zahlungsReferenz}), aber ohne ZAHLUNG_GEHEIMSCHLUESSEL lässt sich nicht\n` +
          "prüfen, ob Geld eingegangen ist. Bitte erst im Stripe-Dashboard nachsehen.",
      );
      process.exitCode = 1;
      return;
    }
    try {
      const sitzung = await new Stripe(schluessel).checkout.sessions.retrieve(a.zahlungsReferenz);
      console.log(
        `Beim Anbieter   Zustand ${sitzung.status}, Zahlung ${sitzung.payment_status}, ` +
          `Betrag ${euro(sitzung.amount_total)}`,
      );
      if (sitzung.payment_status === "paid") {
        console.error("\nABBRUCH: Beim Anbieter gilt diese Bezahlseite als BEZAHLT. Nicht löschen.");
        process.exitCode = 1;
        return;
      }
    } catch (e) {
      console.error(
        `\nABBRUCH: Die Bezahlseite liess sich nicht abrufen (${(e as Error).message}).\n` +
          "Solange das unklar ist, wird nichts gelöscht.",
      );
      process.exitCode = 1;
      return;
    }
  }

  /* Ein Aufnahmewiderspruch ist KEIN Teil der Buchung.
     
     Er ist ein eigener Widerspruch nach Art. 21 DS-GVO, mit eigener
     Löschklasse und eigener Frist (K8). Die Beziehung zur Anmeldung
     steht im Schema auf `onDelete: SetNull` — der Widerspruch bliebe
     also stehen, nur ohne Buchung daneben. Für eine Testanmeldung
     darf es das gar nicht erst geben; gibt es doch einen, ist das
     kein Testfall mehr und gehört angesehen. */
  if (a.aufnahmewidersprueche.length > 0) {
    console.error(
      `\nABBRUCH: An dieser Anmeldung hängen ${a.aufnahmewidersprueche.length} ` +
        "Aufnahme-Widersprüche nach Art. 21 DS-GVO.\n" +
        "Sie gehören nicht zur Buchung und dürfen nicht mit ihr verschwinden.\n" +
        "Bitte im Adminbereich ansehen und getrennt entscheiden.",
    );
    process.exitCode = 1;
    return;
  }

  if (!wirklich) {
    console.log(
      "\nVORSCHAU — es wurde NICHTS gelöscht.\n" +
        "Wenn das oben stimmt, denselben Befehl noch einmal mit --wirklich aufrufen.\n",
    );
    return;
  }

  /* Teilnehmer und Anmeldung in EINER Transaktion. Bricht etwas ab,
     bleibt nichts halb gelöscht zurück. */
  const ergebnis = await db.$transaction(async (tx) => {
    const teilnehmer = await tx.participant.deleteMany({ where: { registrationId: a.id } });
    await tx.registration.delete({ where: { id: a.id } });
    return { teilnehmer: teilnehmer.count };
  });

  console.log(`\nGELÖSCHT: 1 Anmeldung, ${ergebnis.teilnehmer} Teilnehmer.`);

  const rest = await db.registration.count({ where: { id: a.id } });
  console.log(rest === 0 ? "Gegenprobe: die Zeile ist fort.\n" : "ACHTUNG: die Zeile ist noch da!\n");
}

hauptlauf()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
