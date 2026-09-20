/* ---------------------------------------------------------------
   Der Löschlauf von der Kommandozeile.

   Zwei Aufrufe, und der Unterschied ist Absicht:

       npm run loeschen:vorschau     zeigt NUR, was geschähe
       npm run loeschen              führt es wirklich aus

   Der Vorschaulauf verändert keine personenbezogenen Daten. Er
   frischt lediglich Fälligkeitsdaten und automatische Sperren auf —
   beides sind Verwaltungsangaben ohne Personenbezug, und ohne sie
   zeigte die Vorschau ein Bild von gestern.

   Dieselben Funktionen benutzt der Adminbereich. Es gibt keine
   zweite Umsetzung des Löschlaufs, die auseinanderlaufen könnte.

   WAS HIER NIEMALS PASSIERT: Steuerrelevante Unterlagen anzufassen.
   Die Prüfung dafür steht an erster Stelle in entscheide()
   (lib/loeschfristen.ts) und lässt sich von hier aus nicht umgehen.
   --------------------------------------------------------------- */

import { db } from "../lib/db";
import { AKTION_JE_KLASSE, type Loeschklasse } from "../lib/loeschfristen";
import { loeschlauf, papiererinnerungen } from "../lib/loeschlauf";

/** Deutsche Namen der Klassen — nur für die Ausgabe. */
const KLASSENNAME: Record<Loeschklasse, string> = {
  GESUNDHEITSANGABEN: "K1 Gesundheits- und Notfallangaben",
  EINVERSTAENDNIS_VOLL: "K2 Vollständige Einverständniserklärungen",
  ZUSTIMMUNGSNACHWEIS: "K3 Reduzierte Zustimmungsnachweise",
  ANMELDEDATEN: "K4 Anmelde- und Check-in-Daten",
  CHECKLISTE: "K5 Veranstaltungs- und Sicherheitschecklisten",
  VORFALLAKTE: "K6 Vorfall- und Versicherungsakten",
  STEUERUNTERLAGEN: "K7 Steuerunterlagen",
  AUFNAHMEWIDERSPRUCH: "K8 Widerspruch gegen Aufnahmen",
};

function datum(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const probelauf = !process.argv.includes("--echt");

  console.log(
    probelauf
      ? "PROBELAUF — es wird nichts verändert.\n"
      : "ECHTER LAUF — Daten werden anonymisiert und gelöscht.\n",
  );

  const ergebnis = await loeschlauf(probelauf);

  console.log(`Lauf-Kennung:  ${ergebnis.laufId}`);
  console.log(`Begonnen:      ${ergebnis.begonnenAm.toISOString()}`);
  console.log(`Entscheidungen: ${ergebnis.eintraege.length}\n`);

  if (ergebnis.eintraege.length === 0) {
    console.log("Nichts fällig, nichts gesperrt. Es gibt heute nichts zu tun.");
  } else {
    /* Gruppiert nach Klasse ausgeben, nicht als lange Liste von
       Kennungen: Wer das liest, will wissen "welche Art Daten und
       wie viele", nicht 400 einzelne Zeilen. */
    const nachKlasse = new Map<string, Record<string, number>>();
    for (const e of ergebnis.eintraege) {
      const zeile = nachKlasse.get(e.klasse) ?? {};
      zeile[e.aktion] = (zeile[e.aktion] ?? 0) + 1;
      nachKlasse.set(e.klasse, zeile);
    }

    for (const [klasse, zeile] of nachKlasse) {
      const name = KLASSENNAME[klasse as Loeschklasse] ?? klasse;
      const aktion = AKTION_JE_KLASSE[klasse as Loeschklasse];
      console.log(`${name}  (vorgesehen: ${aktion})`);
      for (const [was, anzahl] of Object.entries(zeile)) {
        console.log(`    ${was.padEnd(14)} ${anzahl}`);
      }
      console.log();
    }

    console.log("Zusammenfassung:");
    for (const [was, anzahl] of Object.entries(ergebnis.zusammenfassung)) {
      console.log(`    ${was.padEnd(14)} ${anzahl}`);
    }
    console.log();
  }

  /* Papier kann diese Anwendung nicht vernichten. Sie kann nur
     sagen, was ansteht — und genau das gehört in dieselbe Ausgabe,
     sonst wird es vergessen. */
  const papier = await papiererinnerungen();
  if (papier.length > 0) {
    console.log("AUF PAPIER — von Hand zu vernichten:");
    for (const p of papier) {
      console.log(
        `    ${KLASSENNAME[p.klasse]}\n` +
          `        Veranstaltung: ${p.eventTitel}` +
          `${p.veranstaltungAm ? ` (${datum(p.veranstaltungAm)})` : ""}\n` +
          `        fällig seit:   ${datum(p.faelligAm)}\n` +
          `        Anmeldungen:   ${p.anzahl}`,
      );
    }
    console.log();
  }

  if (probelauf) {
    console.log("Nichts verändert. Für den echten Lauf: npm run loeschen");
  } else {
    console.log("Fertig. Das Protokoll steht in der Tabelle Loeschprotokoll.");
  }
}

main()
  .catch((e) => {
    console.error("Löschlauf fehlgeschlagen:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
