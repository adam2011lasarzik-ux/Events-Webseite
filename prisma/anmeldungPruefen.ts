/* ---------------------------------------------------------------
   Ist für diese Anmeldung jemals Geld geflossen?

   Aufruf:
       npm run anmeldung:pruefen -- <anmeldung-id>

   NUR LESEN. Dieses Programm ändert nichts, legt nichts an, storniert
   nichts und löscht nichts. Es beantwortet eine einzige Frage und gibt
   ein Protokoll aus, das man mitlesen kann.

   ── Warum es das gibt ───────────────────────────────────────────

   Eine übrig gebliebene Testbuchung endgültig zu entfernen ist der
   einzige Vorgang im Projekt, der Daten unwiederbringlich beseitigt.
   Die Regel dafür steht in lib/anmeldungLoeschbar.ts und ist streng.
   Sie stützt sich aber auf UNSERE Datenbank — und die allein ist kein
   Beweis: Wäre eine Rückmeldung des Zahlungsanbieters verloren
   gegangen, stünde dort „offen", obwohl längst bezahlt wurde. Genau
   diesen Fall soll dieses Programm ausschliessen, bevor jemand
   löscht.

   Deshalb zwei Quellen:

     A  unsere Datenbank  — vier Felder, die eine Zahlung festhalten
     B  der Anbieter      — die maßgebliche Quelle, direkt gefragt

   ── Was „unklar" bedeutet ───────────────────────────────────────

   Ist der Anbieter nicht erreichbar oder kein Schlüssel hinterlegt,
   lautet die Antwort UNKLAR — niemals „in Ordnung". Ein Fehler, der
   wie Entwarnung aussieht, wäre hier der teuerste von allen.
   --------------------------------------------------------------- */

import { db } from "../lib/db";
import { anmeldungLoeschbar } from "../lib/anmeldungLoeschbar";
import { zahlungsspurPruefen } from "../lib/zahlung";

/** Die drei möglichen Antworten. Mehr gibt es bewusst nicht. */
type Befund = "kein-geld" | "geld-geflossen" | "unklar";

function euro(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "—" : `${(cents / 100).toFixed(2)} €`;
}

function zeile(name: string, wert: string): void {
  console.log(`  ${name.padEnd(26)} ${wert}`);
}

async function hauptlauf(): Promise<void> {
  const [id] = process.argv.slice(2);
  if (!id) {
    console.error("Aufruf: npm run anmeldung:pruefen -- <anmeldung-id>");
    process.exit(1);
  }

  const anmeldung = await db.registration.findUnique({
    where: { id },
    include: {
      event: { select: { titel: true, slug: true } },
      _count: { select: { teilnehmer: true } },
    },
  });

  if (!anmeldung) {
    console.error(`\nKeine Anmeldung mit der Kennung „${id}" gefunden.\n`);
    process.exit(1);
  }

  console.log("\n── Die Anmeldung ───────────────────────────────────────");
  zeile("Kennung", anmeldung.id);
  zeile("Veranstaltung", `${anmeldung.event.titel} (${anmeldung.event.slug})`);
  zeile("Angemeldet am", anmeldung.angemeldetAm.toISOString());
  zeile("Teilnehmer", String(anmeldung._count.teilnehmer));
  zeile("Anmeldestatus", anmeldung.status);
  zeile("Gesamtpreis", euro(anmeldung.gesamtpreisCents));
  zeile("Anonymisiert am", anmeldung.anonymisiertAm?.toISOString() ?? "— (noch nicht)");

  console.log("\n── A · Was UNSERE Datenbank sagt ───────────────────────");
  zeile("Zahlungsstatus", anmeldung.zahlungsStatus);
  zeile("Zahlungsreferenz", anmeldung.zahlungsReferenz ?? "— (keine Bezahlseite)");
  zeile("Zahlungskennung", anmeldung.zahlungsAbsicht ?? "—");
  zeile("Bezahlter Betrag", euro(anmeldung.bezahlterBetragCents));
  zeile("Bezahlt am", anmeldung.bezahltAm?.toISOString() ?? "—");

  const datenbankSauber =
    anmeldung.zahlungsStatus === "OFFEN" &&
    anmeldung.zahlungsAbsicht === null &&
    anmeldung.bezahlterBetragCents === null &&
    anmeldung.bezahltAm === null;

  console.log(
    `\n  → ${datenbankSauber ? "Kein Zahlungseingang vermerkt." : "ACHTUNG: Es ist eine Zahlung vermerkt."}`,
  );

  console.log("\n── B · Was der ZAHLUNGSANBIETER sagt ───────────────────");
  let befund: Befund;

  if (!anmeldung.zahlungsReferenz) {
    /* Kein Verweis auf eine Bezahlseite heisst: Es wurde nie eine
       erzeugt. Das ausdrücklich zu sagen ist wichtiger, als es
       stillschweigend als Entwarnung zu verbuchen — der Leser soll
       wissen, dass hier NICHT beim Anbieter nachgefragt wurde. */
    console.log("  Für diese Anmeldung wurde nie eine Bezahlseite erzeugt.");
    console.log("  Es gibt daher nichts, wonach sich beim Anbieter fragen liesse.");
    befund = datenbankSauber ? "kein-geld" : "geld-geflossen";
  } else {
    try {
      const spur = await zahlungsspurPruefen(anmeldung.zahlungsReferenz);
      zeile("Lage der Bezahlseite", spur.lage ?? "—");
      zeile("Zahlungslage", spur.zahlungslage ?? "—");
      zeile("Betrag", euro(spur.betragCents));
      zeile("Zahlungskennung", spur.zahlungId ?? "— (nie eine Zahlung begonnen)");

      if (spur.buchungen.length === 0) {
        zeile("Abbuchungen", "keine");
      } else {
        for (const b of spur.buchungen) {
          zeile(
            "Abbuchung",
            `${b.id} · ${euro(b.betragCents)} · ` +
              `${b.erfolgreich ? "ERFOLGREICH" : "fehlgeschlagen"}` +
              (b.erstattet > 0 ? ` · davon erstattet ${euro(b.erstattet)}` : ""),
          );
        }
      }

      const geldGeflossen =
        spur.zahlungslage === "paid" || spur.buchungen.some((b) => b.erfolgreich);
      befund = geldGeflossen ? "geld-geflossen" : datenbankSauber ? "kein-geld" : "geld-geflossen";
    } catch (e) {
      console.log(`  Der Anbieter liess sich nicht fragen: ${e instanceof Error ? e.message : e}`);
      befund = "unklar";
    }
  }

  console.log("\n── Ergebnis ────────────────────────────────────────────");
  if (befund === "kein-geld") {
    console.log("  ✓ KEIN GELDEINGANG — weder bei VERA noch beim Anbieter.");
    console.log("    Ein endgültiges Entfernen ist vertretbar.");
  } else if (befund === "geld-geflossen") {
    console.log("  ✗ ES IST GELD GEFLOSSEN oder eine Zahlung ist vermerkt.");
    console.log("    NICHT entfernen. Diese Buchung gehört zur Buchhaltung.");
  } else {
    console.log("  ? UNKLAR — der Anbieter konnte nicht gefragt werden.");
    console.log("    NICHT entfernen, solange das nicht geklärt ist.");
  }

  /* Die eigentliche Löschregel zusätzlich zeigen. Sie beantwortet eine
     andere Frage als dieses Programm ("darf entfernt werden?" statt
     "ist Geld geflossen?"), und beide gemeinsam ergeben erst das Bild:
     Hier steht dann schwarz auf weiß, welcher Schritt noch fehlt. */
  const entscheidung = anmeldungLoeschbar(anmeldung);
  console.log("\n── Und was die Löschregel dazu sagt ────────────────────");
  if (entscheidung.loeschbar) {
    console.log("  Die Regel in lib/anmeldungLoeschbar.ts stimmt dem Entfernen zu.");
    console.log("  Nächster Schritt:  npm run anmeldung:loeschen -- " + anmeldung.id);
  } else {
    console.log(`  Noch nicht löschbar (${entscheidung.grund}): ${entscheidung.erklaerung}`);
    if (entscheidung.grund === "nicht-storniert") {
      console.log("  Nächster Schritt: im Adminbereich den Status auf STORNIERT setzen.");
    } else if (entscheidung.grund === "nicht-anonymisiert") {
      console.log('  Nächster Schritt: im Adminbereich „Personendaten löschen".');
    }
  }

  console.log("\n  Es wurde nichts geändert.\n");
  await db.$disconnect();
  process.exit(befund === "kein-geld" ? 0 : 2);
}

hauptlauf().catch(async (fehler) => {
  console.error(`\n✗ ${fehler instanceof Error ? fehler.message : String(fehler)}\n`);
  await db.$disconnect();
  process.exit(1);
});
