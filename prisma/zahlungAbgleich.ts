/* ---------------------------------------------------------------
   Nachsehen, ob eine bezahlte Zahlung ohne Anmeldung dasteht.

   Aufruf:
       npm run zahlung:abgleich            zeigt nur
       npm run zahlung:abgleich -- --echt  legt nach und erstattet

   ── Warum es diesen Lauf gibt, und warum er Pflicht ist ─────────

   Seit dem Umbau vom 25.09.2026 entsteht eine Anmeldung erst mit der
   bestätigten Zahlung. Vorher steht in der VERA-Datenbank NICHTS.
   Das hat eine Kehrseite, die man kennen muss: Bleibt die Rückmeldung
   des Anbieters aus — Netzstörung, Dienst gerade neu gestartet, ein
   Fehler in unserem Code —, dann ist Geld geflossen und es gibt
   nirgends bei uns eine Spur davon. Früher lag wenigstens eine
   unbezahlte Anmeldung herum, an der es auffiel.

   Dieser Lauf ist der Ersatz dafür. Er fragt beim Anbieter nach den
   bezahlten Bezahlseiten der letzten Tage und vergleicht sie mit
   unserer Datenbank. Was fehlt, legt er nach — über DIESELBE
   Funktion, die auch die Rückmeldung benutzt.

   Er ist damit kein Komfort, sondern Teil der Funktion. Läuft er
   nicht, ist der Ausfall der Rückmeldung unbemerkt.

   ── Zwei Dinge, die er zusätzlich erledigt ──────────────────────

   1. Steckengebliebene Erstattungen. Eine Fehlbuchung wird erst
      festgehalten und dann erstattet. Stürzt der Dienst dazwischen ab,
      bleibt die Zeile offen — dieser Lauf holt die Erstattung nach.
   2. Melden, was ein Mensch ansehen muss: `betrag-abweichend` wird
      bewusst nicht automatisch erstattet.

   ── Warum er ohne --echt nichts tut ─────────────────────────────

   Dasselbe Vorgehen wie beim Löschlauf: Erst zeigen, dann handeln.
   Ein Lauf, der beim ersten Aufruf Geld bewegt, ist einer, den
   niemand gefahrlos ausprobieren kann.
   --------------------------------------------------------------- */

import { db } from "../lib/db";
import { stripe, erstattungAusloesen, markeZusammensetzen } from "../lib/zahlung";
import { entschluesseln } from "../lib/anmeldeNutzlast";
import { schluesselbund } from "../lib/anmeldeSchluessel";
import {
  anmeldungAusZahlung,
  fehlbuchungFesthalten,
  erstattungVermerken,
  SOFORT_ERSTATTEN,
  ZUR_KLAERUNG,
  type Fehlbuchungsgrund,
} from "../lib/anmeldungAnlegen";

/** Wie weit zurück gesehen wird. */
const TAGE = 2;

const echt = process.argv.includes("--echt");
const euro = (c: number) => `${(c / 100).toFixed(2)} €`;

let nachgelegt = 0;
let nacherstattet = 0;
let zuKlaeren = 0;

async function sitzungenNacharbeiten(): Promise<void> {
  const seit = Math.floor(Date.now() / 1000) - TAGE * 24 * 60 * 60;

  /* `autoPagingEach` blättert selbst weiter. Eine feste Obergrenze
     wäre die Stelle, an der nach einem geschäftigen Wochenende genau
     die Zahlung durchrutscht, die man sucht. */
  const sitzungen = stripe().checkout.sessions.list({
    created: { gte: seit },
    limit: 100,
  });

  for await (const sitzung of sitzungen) {
    if (sitzung.payment_status !== "paid") continue;

    const schonDa = await db.registration.findUnique({
      where: { zahlungsReferenz: sitzung.id },
      select: { id: true },
    });
    if (schonDa) continue;

    const schonGemeldet = await db.fehlbuchung.findUnique({
      where: { sitzungId: sitzung.id },
      select: { id: true },
    });
    if (schonGemeldet) continue;

    const betrag = sitzung.amount_total;
    const eventId = sitzung.metadata?.event ?? null;
    const marke = markeZusammensetzen(sitzung.metadata as Record<string, string> | null);

    console.log(`\n⚠ Bezahlt, aber ohne Anmeldung: ${sitzung.id} (${euro(betrag ?? 0)})`);

    /* Ein bezahlter Vorgang ohne gemeldeten Betrag. Das sollte es
       beim Anbieter nicht geben, und solange unklar ist, WIE VIEL
       eingegangen ist, wird hier weder eine Zeile mit einem
       erfundenen Betrag geschrieben noch erstattet. Er wird gemeldet
       und beim nächsten Lauf wieder gemeldet — genau das ist bei
       etwas Unverstandenem das richtige Verhalten. */
    if (betrag === null) {
      console.log("   Der Anbieter meldet keinen Betrag — gehört angesehen.");
      zuKlaeren++;
      continue;
    }

    /* Bezahlt, aber ohne Anmeldedaten. Daraus kann niemals eine
       Anmeldung werden: Jemand hat für nichts bezahlt. Die Zeile wird
       festgehalten; `erstattungenNachholen()` weiter unten im selben
       Lauf bucht das Geld zurück (Entscheidung vom 26.09.2026). */
    if (!eventId || !marke) {
      console.log("   Keine verschlüsselte Anmeldung dabei — wird vollständig erstattet.");
      if (echt) await fehlbuchungFesthalten(sitzung.id, betrag, "ohne-marke");
      else nacherstattet++;
      continue;
    }

    let nutzlast;
    try {
      nutzlast = entschluesseln(marke, schluesselbund(), { eventId, preisCents: betrag });
    } catch {
      console.log("   Die Marke liess sich nicht aufschliessen — gehört angesehen.");
      zuKlaeren++;
      if (echt) await fehlbuchungFesthalten(sitzung.id, betrag, "betrag-abweichend");
      continue;
    }

    if (!echt) {
      console.log(`   Würde angelegt: ${nutzlast.teilnehmer.length} Person(en).`);
      nachgelegt++;
      continue;
    }

    const zahlungId =
      typeof sitzung.payment_intent === "string"
        ? sitzung.payment_intent
        : (sitzung.payment_intent?.id ?? null);

    const ergebnis = await anmeldungAusZahlung(nutzlast, {
      sitzungId: sitzung.id,
      zahlungId,
      bezahlterBetragCents: betrag,
    });

    if (ergebnis.lage === "fehlbuchung") {
      console.log(`   Kein Platz mehr (${ergebnis.grund}) — Fehlbuchung festgehalten.`);
      await fehlbuchungFesthalten(sitzung.id, betrag, ergebnis.grund);
      zuKlaeren++;
    } else {
      console.log("   Angelegt.");
      nachgelegt++;
    }
  }
}

/**
 * Erstattungen, die steckengeblieben sind.
 *
 * Nur die drei Gründe, die automatisch erstattet werden.
 * `betrag-abweichend` bleibt ausdrücklich liegen — dort ist die
 * fehlende Erstattung kein Versehen, sondern die Entscheidung vom
 * 25.09.2026.
 *
 * `ohne-marke` gehörte bis zum 26.09.2026 auch dazu und wird seitdem
 * mit erstattet: Ohne Anmeldedaten kann daraus niemals eine Anmeldung
 * werden, also hat jemand für nichts bezahlt.
 */
async function erstattungenNachholen(): Promise<void> {
  const offen = await db.fehlbuchung.findMany({
    where: { erstattetAm: null, grund: { in: [...SOFORT_ERSTATTEN] } },
  });

  for (const f of offen) {
    console.log(`\n⚠ Offene Erstattung: ${f.sitzungId} (${euro(f.betragCents)}, ${f.grund})`);
    if (!echt) {
      nacherstattet++;
      continue;
    }

    /* Die Zahlungskennung steht nicht in der Fehlbuchung — bewusst
       nicht, die Tabelle soll so wenig wie möglich enthalten. Sie
       wird beim Anbieter nachgeschlagen. */
    const sitzung = await stripe().checkout.sessions.retrieve(f.sitzungId);
    const zahlungId =
      typeof sitzung.payment_intent === "string"
        ? sitzung.payment_intent
        : (sitzung.payment_intent?.id ?? null);

    if (!zahlungId) {
      console.log("   Keine Zahlungskennung — bitte von Hand im Dashboard erstatten.");
      zuKlaeren++;
      continue;
    }

    const erstattung = await erstattungAusloesen(zahlungId, f.sitzungId);
    await erstattungVermerken(f.sitzungId, erstattung.id);
    console.log(`   Erstattet: ${erstattung.id}`);
    nacherstattet++;
  }
}

/** Was ein Mensch ansehen muss. */
async function zuKlaerendeMelden(): Promise<void> {
  /* Abgehakte Zeilen sind hier fertig. Sie stehen weiterhin in der
     Tabelle — abhaken löscht nichts —, aber ein stündlicher Lauf, der
     einen längst geklärten Vorgang jede Stunde erneut meldet, macht
     seine eigene Ausgabe wertlos. */
  const liegen = await db.fehlbuchung.findMany({
    where: { erstattetAm: null, erledigtAm: null, grund: { in: [...ZUR_KLAERUNG] } },
  });
  for (const f of liegen) {
    console.log(
      `\n✋ Gehört angesehen: ${f.sitzungId} (${euro(f.betragCents)}, ${f.grund}) — ` +
        "bewusst NICHT automatisch erstattet.",
    );
    zuKlaeren++;
  }
}

async function hauptlauf(): Promise<void> {
  console.log(
    echt
      ? `\n── Abgleich der letzten ${TAGE} Tage — ECHT ──`
      : `\n── Abgleich der letzten ${TAGE} Tage — nur zeigen (--echt fehlt) ──`,
  );

  await sitzungenNacharbeiten();
  await erstattungenNachholen();
  await zuKlaerendeMelden();

  console.log("\n── Ergebnis ──");
  console.log(`  Anmeldungen ${echt ? "nachgelegt" : "nachzulegen"}: ${nachgelegt}`);
  console.log(`  Erstattungen ${echt ? "nachgeholt" : "nachzuholen"}: ${nacherstattet}`);
  console.log(`  Von Hand anzusehen:                ${zuKlaeren}`);
  if (!echt && nachgelegt + nacherstattet > 0) {
    console.log("\n  Wirklich ausführen:  npm run zahlung:abgleich -- --echt");
  }
  console.log("");

  await db.$disconnect();
  /* Exitcode 2, wenn etwas offen ist: Der systemd-Dienst wertet das
     aus und schickt eine Mail. Ein Lauf, der schweigt, obwohl Geld
     ungeklärt herumliegt, wäre wertlos. */
  process.exit(zuKlaeren > 0 ? 2 : 0);
}

hauptlauf().catch(async (fehler) => {
  console.error(`\n✗ ${fehler instanceof Error ? fehler.message : String(fehler)}\n`);
  await db.$disconnect();
  process.exit(1);
});
