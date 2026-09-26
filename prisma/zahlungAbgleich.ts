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

/**
 * Wie weit zurück Anmeldungen NACHGELEGT werden.
 *
 * Zwei Tage, und das ist eine Obergrenze mit Absicht: Eine Zahlung,
 * die drei Tage alt ist und bei der bis heute keine Anmeldung
 * entstanden ist, will niemand mehr stillschweigend nachbuchen. Sie
 * gehört angesehen.
 */
const NACHBUCHEN_TAGE = 2;

/**
 * Wie weit zurück MARKEN GERÄUMT werden.
 *
 * Dreissig Tage, also deutlich länger — und das aus einem Grund, der
 * beim Formulieren des Datenschutztextes aufgefallen ist.
 *
 * Bis zum 26.09.2026 liefen beide Aufgaben über dieselbe Liste der
 * letzten zwei Tage. Im Normalbetrieb reicht das weit: Abgebrochenes
 * wird in Sekunden geräumt, Bezahltes nach 24 Stunden, und bis die
 * zwei Tage um sind, hatte dieser Lauf zwei Dutzend Gelegenheiten.
 *
 * Steht der Server aber länger als etwa einen Tag still und wird
 * genau in dieser Zeit eine Bezahlseite fällig, rutscht sie aus dem
 * Fenster und wird nie wieder angesehen — ihre Marke bliebe dauerhaft
 * beim Anbieter liegen. Der Datenschutztext gibt ein Versprechen ab,
 * und ein Versprechen mit einem Loch ist keins.
 *
 * Räumen ist billig: Nur eine Sitzung, die überhaupt noch eine Marke
 * trägt, erzeugt einen Aufruf nach draussen. Ein längeres Fenster
 * kostet also fast nichts und schliesst das Loch.
 */
const RAEUMEN_TAGE = 30;

const echt = process.argv.includes("--echt");
const euro = (c: number) => `${(c / 100).toFixed(2)} €`;

let nachgelegt = 0;
let nacherstattet = 0;
let zuKlaeren = 0;
let aufgeraeumt = 0;
let raeumFehler = 0;

/** Sekunden seit 1970 für „vor so vielen Tagen". */
const vorTagen = (tage: number) => Math.floor(Date.now() / 1000) - tage * 24 * 60 * 60;

async function sitzungenNacharbeiten(): Promise<void> {
  const seit = vorTagen(NACHBUCHEN_TAGE);

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
    /* Was wir über diese Bezahlseite schon wissen. */
    const anmeldung = await db.registration.findUnique({
      where: { zahlungsReferenz: sitzung.id },
      select: { id: true },
    });
    const fehlbuchung = await db.fehlbuchung.findUnique({
      where: { sitzungId: sitzung.id },
      select: { id: true },
    });
    const verbucht = anmeldung !== null || fehlbuchung !== null;

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
 * Die verschlüsselten Anmeldungen bei Bezahlseiten entfernen, die sie
 * nicht mehr brauchen.
 *
 * EIGENE Liste, eigenes Fenster (`RAEUMEN_TAGE`), getrennt vom
 * Nachlegen. Die Begründung steht oben bei der Konstante.
 *
 * Der Lauf ist wiederholbar: Eine Sitzung ohne `marke_*`-Felder
 * erzeugt gar keinen Aufruf, und ein bereits leeres Feld noch einmal
 * zu leeren wäre folgenlos. Er fasst ausschliesslich die
 * `marke_*`-Felder an — `event`, Betrag, Adresse, Zahlung,
 * Erstattungen und Posten bleiben unberührt.
 */
async function markenRaeumen(): Promise<void> {
  const sitzungen = stripe().checkout.sessions.list({
    created: { gte: vorTagen(RAEUMEN_TAGE) },
    limit: 100,
  });

  for await (const sitzung of sitzungen) {
    /* Nur Sitzungen, die überhaupt noch etwas tragen. Alles andere
       kostet nicht einmal eine Datenbankabfrage. */
    const felder = markeFelder(sitzung.metadata);
    if (felder.length === 0) continue;

    try {
      const anmeldung = await db.registration.findUnique({
        where: { zahlungsReferenz: sitzung.id },
        select: { id: true },
      });
      const fehlbuchung = await db.fehlbuchung.findUnique({
        where: { sitzungId: sitzung.id },
        select: { id: true },
      });

      const darf = markeDarfWeg({
        hatMarke: true,
        status: sitzung.status,
        bezahlt: sitzung.payment_status === "paid",
        verbucht: anmeldung !== null || fehlbuchung !== null,
        alterMs: Date.now() - sitzung.created * 1000,
      });
      if (!darf) continue;

      console.log(
        `\n🧹 Verschlüsselte Anmeldung entfernen: ${sitzung.id} ` +
          `(${sitzung.status}, ${felder.length} Felder)`,
      );
      aufgeraeumt++;
      if (echt) await markeFelderLeeren(sitzung.id, felder);
    } catch (e) {
      /* Deutlich, und mit allem, was zum Nachsehen nötig ist.

         Eine fehlgeschlagene Räumung heisst: Personenbezogene Daten
         liegen weiter bei einem Dritten, obwohl sie dort nicht mehr
         hingehören. Das ist kein Schönheitsfehler, und es darf nicht
         in einer Zeile untergehen. Zugleich reisst es den Lauf nicht
         ab — die übrigen Sitzungen werden weiter geräumt, und beim
         nächsten Lauf in einer Stunde wird es erneut versucht. */
      raeumFehler++;
      console.log(`\n✗ RÄUMEN FEHLGESCHLAGEN: ${sitzung.id}`);
      console.log(`   Felder:  ${felder.join(", ")}`);
      console.log(`   Zustand: ${sitzung.status} / ${sitzung.payment_status}`);
      console.log(`   Grund:   ${(e as Error).message}`);
      console.log("   Die verschlüsselte Anmeldung liegt weiterhin beim Anbieter.");
      console.log("   Wird beim nächsten Lauf erneut versucht.");
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
      ? `\n── Abgleich: nachbuchen ${NACHBUCHEN_TAGE} Tage, räumen ${RAEUMEN_TAGE} Tage — ECHT ──`
      : `\n── Abgleich: nachbuchen ${NACHBUCHEN_TAGE} Tage, räumen ${RAEUMEN_TAGE} Tage — ` +
        "nur zeigen (--echt fehlt) ──",
  );

  /* Erst nachlegen, dann räumen: Eine Sitzung, die in diesem Lauf
     verbucht wird und schon älter als 24 Stunden ist, lässt sich dann
     gleich mit räumen, statt eine Stunde zu warten. */
  await sitzungenNacharbeiten();
  await markenRaeumen();
  await erstattungenNachholen();
  await zuKlaerendeMelden();

  console.log("\n── Ergebnis ──");
  console.log(`  Anmeldungen ${echt ? "nachgelegt" : "nachzulegen"}: ${nachgelegt}`);
  console.log(`  Erstattungen ${echt ? "nachgeholt" : "nachzuholen"}: ${nacherstattet}`);
  console.log(`  Von Hand anzusehen:                ${zuKlaeren}`);
  console.log(`  Marken ${echt ? "entfernt" : "zu entfernen"}:              ${aufgeraeumt}`);
  if (raeumFehler > 0) {
    console.log(`  RÄUMEN FEHLGESCHLAGEN:             ${raeumFehler}  ← bitte ansehen`);
  }
  if (!echt && nachgelegt + nacherstattet + aufgeraeumt > 0) {
    console.log("\n  Wirklich ausführen:  npm run zahlung:abgleich -- --echt");
  }
  console.log("");

  await db.$disconnect();
  /* Exitcode 2, wenn etwas offen ist: Der systemd-Dienst wertet das
     aus und schickt eine Mail. Ein Lauf, der schweigt, obwohl Geld
     ungeklärt herumliegt, wäre wertlos.
     
     Eine fehlgeschlagene Räumung zählt ausdrücklich dazu. Sie kostet
     kein Geld, aber sie lässt personenbezogene Daten bei einem
     Dritten liegen — und bleibt sie bestehen, kommt die Mail jede
     Stunde wieder. Das ist gewollt: Genau dieser Druck sorgt dafür,
     dass jemand hinsieht. */
  process.exit(zuKlaeren > 0 || raeumFehler > 0 ? 2 : 0);
}

hauptlauf().catch(async (fehler) => {
  console.error(`\n✗ ${fehler instanceof Error ? fehler.message : String(fehler)}\n`);
  await db.$disconnect();
  process.exit(1);
});
