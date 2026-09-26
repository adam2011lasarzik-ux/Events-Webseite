/* ---------------------------------------------------------------
   „Test 2.1" ansehen — REIN LESEND.

   Dieses Skript ändert nichts. Es legt nichts an, es löscht nichts,
   es schreibt keine Zeile. Es beantwortet genau eine Frage:

       Ist zu dieser Anmeldung jemals Geld eingegangen?

   ── Warum es ein eigenes Skript ist ─────────────────────────────

   Der dafür vorgesehene Weg heisst `npm run anmeldung:pruefen`. Den
   gibt es auf dem Server noch nicht: Er kommt mit Stufe 1/2, und die
   sind noch nicht ausgerollt. Die Anmeldung soll aber VOR der
   Migration angesehen und entfernt werden — sonst setzt die Migration
   sie stillschweigend auf STORNIERT, und die Testdaten blieben
   liegen.

   Deshalb dieses Skript: Es läuft mit dem Stand, der HEUTE auf dem
   Server liegt, und bringt alles mit, was es braucht.

   ── Aufruf ──────────────────────────────────────────────────────

       cd /var/www/vera
       sudo -u vera npx tsx --env-file=.env ./test-2-1-pruefen.mts "Test 2.1"

   Die Datei liegt bewusst IM Projektordner und nicht in /tmp: Von
   dort aus fände Node die Pakete `@prisma/adapter-mariadb` und
   `stripe` nicht. Sie ändert keine vorhandene Datei und wird nach
   dem Lauf wieder entfernt.

   Der Suchbegriff wird gegen Vor- und Nachnamen der anmeldenden
   Person UND der Teilnehmer geprüft. Ohne Argument werden alle
   unbezahlten Anmeldungen gezeigt.
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

const suche = process.argv[2] ?? null;

/* `reserviertBis` gibt es nur VOR der Migration. Das Skript soll vor
   und nach ihr laufen können, ohne umgeschrieben zu werden — also
   wird nachgesehen, statt es vorauszusetzen. */
async function spalteDa(tabelle: string, spalte: string): Promise<boolean> {
  const treffer = await db.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tabelle} AND COLUMN_NAME = ${spalte}`;
  return Number(treffer[0]?.n ?? 0) > 0;
}

const euro = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "—" : `${(cents / 100).toFixed(2).replace(".", ",")} €`;

async function hauptlauf() {
  const hatReserviertBis = await spalteDa("Registration", "reserviertBis");

  const alle = await db.registration.findMany({
    include: { teilnehmer: true, event: { select: { titel: true, slug: true } } },
    orderBy: { angemeldetAm: "desc" },
  });

  const passt = (a: (typeof alle)[number]) => {
    if (!suche) return a.zahlungsStatus !== "BEZAHLT";
    const n = suche.toLowerCase();
    /* Auch der ZUSAMMENGESETZTE Name wird geprüft. Wer im
       Adminbereich „Test 2.1" liest, tippt genau das — in der
       Datenbank steht es aber als Vor- und Nachname getrennt
       („Test" / „2.1"), und ein Vergleich Feld für Feld fände
       nichts. Beim ersten Anlauf war genau das der Fall. */
    const felder = [
      a.kontaktVorname, a.kontaktNachname, a.kontaktEmail,
      `${a.kontaktVorname} ${a.kontaktNachname}`,
      ...a.teilnehmer.flatMap((t) => [t.vorname, t.nachname, `${t.vorname} ${t.nachname}`]),
    ];
    return felder.some((f) => (f ?? "").toLowerCase().includes(n));
  };

  const treffer = alle.filter(passt);

  console.log(`\nDatenbank insgesamt: ${alle.length} Anmeldungen.`);
  console.log(
    suche
      ? `Suche nach „${suche}": ${treffer.length} Treffer.\n`
      : `Nicht bezahlte Anmeldungen: ${treffer.length}.\n`,
  );

  if (treffer.length === 0) {
    console.log("Nichts gefunden. Es gibt nichts zu entfernen.");
    return;
  }

  /* Der Zugang zum Zahlungsanbieter ist freiwillig: Fehlt der
     Schlüssel, wird die Datenbankseite trotzdem vollständig gezeigt
     und für die Zahlungsseite auf das Dashboard verwiesen. Ein
     Abbruch wäre hier das Falsche — die halbe Antwort ist besser als
     keine. */
  const schluessel = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
  const stripe = schluessel ? new Stripe(schluessel) : null;
  if (!stripe) {
    console.log(
      "HINWEIS: ZAHLUNG_GEHEIMSCHLUESSEL steht nicht in .env. Die Zahlungsseite\n" +
        "         lässt sich von hier aus nicht prüfen — bitte die unten genannte\n" +
        "         Sitzungskennung im Stripe-Dashboard nachschlagen.\n",
    );
  }

  for (const a of treffer) {
    console.log("─".repeat(64));
    console.log(`Anmeldenummer   ${a.id}`);
    console.log(`Veranstaltung   ${a.event.titel}  (/${a.event.slug})`);
    console.log(`Angemeldet am   ${a.angemeldetAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`);
    console.log(`Kontakt         ${a.kontaktVorname} ${a.kontaktNachname} <${a.kontaktEmail}>`);
    console.log(`Teilnehmer      ${a.teilnehmer.map((t) => `${t.vorname} ${t.nachname}`).join(", ") || "—"}`);
    console.log(`Status          ${a.status} / Zahlung: ${a.zahlungsStatus} (${a.zahlungsWeg})`);
    console.log(`Preis           ${euro(a.gesamtpreisCents)}`);
    console.log(`Bezahlt         ${euro(a.bezahlterBetragCents)}  am ${a.bezahltAm?.toISOString() ?? "—"}`);
    console.log(`Bezahlseite     ${a.zahlungsReferenz ?? "—"}`);
    console.log(`Zahlung         ${a.zahlungsAbsicht ?? "—"}`);
    if (hatReserviertBis) {
      const roh = await db.$queryRaw<{ reserviertBis: Date | null }[]>`
        SELECT reserviertBis FROM Registration WHERE id = ${a.id}`;
      console.log(`Reserviert bis  ${roh[0]?.reserviertBis?.toISOString() ?? "—"}`);
    }

    /* Die eigentliche Frage. Die Datenbank allein beantwortet sie
       NICHT: Bliebe eine Rückmeldung aus, stünde dort „offen",
       obwohl das Geld längst da ist. Gefragt wird deshalb beim
       Anbieter. */
    let geldEingegangen: boolean | null = null;
    if (stripe && a.zahlungsReferenz) {
      try {
        const sitzung = await stripe.checkout.sessions.retrieve(a.zahlungsReferenz);
        geldEingegangen = sitzung.payment_status === "paid";
        console.log(
          `Beim Anbieter   Zustand ${sitzung.status}, Zahlung ${sitzung.payment_status}, ` +
            `Betrag ${euro(sitzung.amount_total)}`,
        );
      } catch (e) {
        console.log(`Beim Anbieter   NICHT ABRUFBAR (${(e as Error).message})`);
      }
    } else if (!a.zahlungsReferenz) {
      // Ohne Bezahlseite gab es nie einen Vorgang, über den Geld
      // hätte fliessen können.
      geldEingegangen = false;
      console.log("Beim Anbieter   keine Bezahlseite angelegt — es gab keinen Zahlungsvorgang");
    }

    console.log("");
    if (geldEingegangen === false && a.zahlungsStatus !== "BEZAHLT") {
      console.log("URTEIL          Es ist KEIN Geld eingegangen. Löschen ist unbedenklich.");
    } else if (geldEingegangen === true || a.zahlungsStatus === "BEZAHLT") {
      console.log("URTEIL          ACHTUNG: Hier ist Geld geflossen. NICHT löschen.");
      console.log("                Erst erstatten, dann über den Storno-Weg gehen.");
    } else {
      console.log("URTEIL          Unklar — die Zahlungsseite liess sich nicht prüfen.");
      console.log("                Bitte die Bezahlseite oben im Stripe-Dashboard nachschlagen.");
    }
  }
  console.log("─".repeat(64));
  console.log("\nEs wurde NICHTS verändert. Dieses Skript liest nur.\n");
}

hauptlauf()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
