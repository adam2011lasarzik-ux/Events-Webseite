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

import type Stripe from "stripe";
import { db } from "../lib/db";
import {
  stripe,
  erstattungAusloesen,
  markeZusammensetzen,
  markeFelder,
  markeFelderLeeren,
} from "../lib/zahlung";
import { markeDarfWeg } from "../lib/zahlungRegeln";
import { entschluesseln, MarkeUngueltig } from "../lib/anmeldeNutzlast";
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
let aufgeraeumt = 0;

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
    try {
      await eineSitzung(sitzung);
    } catch (e) {
      /* Dieselbe Überlegung wie bei den Erstattungen: Eine Sitzung,
         die aus der Reihe tanzt, darf die übrigen nicht mitnehmen. */
      console.log(`\n✗ ${sitzung.id} liess sich nicht abarbeiten: ${(e as Error).message}`);
      zuKlaeren++;
    }
  }
}

async function eineSitzung(sitzung: Stripe.Checkout.Session): Promise<void> {
  {
    /* Was wir über diese Bezahlseite schon wissen — EINMAL abgefragt.
       Beide Entscheidungen unten hängen daran: ob aufgeräumt werden
       darf, und ob eine Anmeldung nachzulegen ist. */
    const anmeldung = await db.registration.findUnique({
      where: { zahlungsReferenz: sitzung.id },
      select: { id: true },
    });
    const fehlbuchung = await db.fehlbuchung.findUnique({
      where: { sitzungId: sitzung.id },
      select: { id: true },
    });
    const verbucht = anmeldung !== null || fehlbuchung !== null;

    /* ── Aufräumen ────────────────────────────────────────────────
       
       Steht VOR dem Nachlegen und vor jedem `continue`. Bis zum
       26.09.2026 sprang die Schleife für verbuchte Sitzungen sofort
       weiter — genau die sind es aber, deren Marke entfernt werden
       muss.

       Das ist zugleich die Nachbereinigung für eine ausgefallene
       Rückmeldung: Bleibt `checkout.session.expired` aus, räumt kein
       Webhook auf, und die verschlüsselte Anmeldung läge unbegrenzt
       beim Anbieter. Dieser Lauf holt es nach — er sieht sich alle
       Bezahlseiten der letzten Tage an, nicht nur die bezahlten. */
    const felder = markeFelder(sitzung.metadata);
    if (
      markeDarfWeg({
        hatMarke: felder.length > 0,
        status: sitzung.status,
        bezahlt: sitzung.payment_status === "paid",
        verbucht,
        alterMs: Date.now() - sitzung.created * 1000,
      })
    ) {
      console.log(`\n🧹 Verschlüsselte Anmeldung entfernen: ${sitzung.id} (${sitzung.status})`);
      aufgeraeumt++;
      if (echt) {
        try {
          await markeFelderLeeren(sitzung.id, felder);
        } catch (e) {
          /* Nicht abbrechen: Ein hakendes Aufräumen darf den
             Abgleich nicht verhindern — der legt Anmeldungen nach,
             und das ist die wichtigere Aufgabe. Beim nächsten Lauf
             in einer Stunde wieder. */
          console.log(`   Fehlgeschlagen, wird nachgeholt: ${(e as Error).message}`);
        }
      }
    }

    /* ── Nachlegen ───────────────────────────────────────────────── */
    if (sitzung.payment_status !== "paid") return;
    if (verbucht) return;

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
      return;
    }

    /* Bezahlt, aber ohne Anmeldedaten. Daraus kann niemals eine
       Anmeldung werden: Jemand hat für nichts bezahlt. Die Zeile wird
       festgehalten; `erstattungenNachholen()` weiter unten im selben
       Lauf bucht das Geld zurück (Entscheidung vom 26.09.2026). */
    if (!eventId || !marke) {
      console.log("   Keine verschlüsselte Anmeldung dabei — wird vollständig erstattet.");
      if (echt) await fehlbuchungFesthalten(sitzung.id, betrag, "ohne-marke");
      else nacherstattet++;
      return;
    }

    let nutzlast;
    try {
      nutzlast = entschluesseln(marke, schluesselbund(), { eventId, preisCents: betrag });
    } catch (e) {
      /* Dieselbe Unterscheidung wie in der Rückmeldung: Eine
         abgelaufene Marke ist etwas anderes als ein nicht passender
         Betrag. Beim Alter ist die Lage klar und wird erstattet; bei
         allem anderen sieht ein Mensch hin. */
      const grund = e instanceof MarkeUngueltig ? e.grund : "unbekannt";
      const fehlgrund: Fehlbuchungsgrund =
        grund === "abgelaufen" ? "marke-abgelaufen" : "betrag-abweichend";
      console.log(`   Die Marke liess sich nicht aufschliessen (${grund}) — „${fehlgrund}".`);
      if (grund === "abgelaufen") nacherstattet++;
      else zuKlaeren++;
      if (echt) await fehlbuchungFesthalten(sitzung.id, betrag, fehlgrund);
      return;
    }

    if (!echt) {
      console.log(`   Würde angelegt: ${nutzlast.teilnehmer.length} Person(en).`);
      nachgelegt++;
      return;
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
      return;
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
      return;
    }

    /* Jede Erstattung für sich.
       
       Bis zum 26.09.2026 stand hier kein try/catch — eine einzige
       Erstattung, die der Anbieter abweist (etwa weil sie längst
       gelaufen ist), riss den ganzen Lauf mit sich. Damit wären auch
       alle noch offenen Anmeldungen liegengeblieben und das
       Aufräumen der Marken gleich mit. Ein stündlicher Lauf, den ein
       einzelner Sonderfall lahmlegt, ist keiner. */
    try {
      const erstattung = await erstattungAusloesen(zahlungId, f.sitzungId);
      await erstattungVermerken(f.sitzungId, erstattung.id);
      console.log(`   Erstattet: ${erstattung.id}`);
      nacherstattet++;
    } catch (e) {
      console.log(`   Erstattung abgewiesen: ${(e as Error).message}`);
      console.log("   Bleibt offen und wird beim nächsten Lauf erneut versucht.");
      zuKlaeren++;
    }
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
  console.log(`  Marken ${echt ? "entfernt" : "zu entfernen"}:              ${aufgeraeumt}`);
  if (!echt && nachgelegt + nacherstattet + aufgeraeumt > 0) {
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
