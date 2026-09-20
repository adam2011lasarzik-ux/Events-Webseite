/* Den Datenstand auf Anfang stellen.

   Wird zwischen zwei Prüflisten aufgerufen: Jede Liste erwartet einen
   bekannten Ausgangszustand, und was die vorige hinterlassen hat,
   würde die nächste sonst als Fehler melden.

   EVENTS BLEIBEN BEWUSST STEHEN. Einige Listen bauen aufeinander auf:
   `G/g1` legt die Probe-Events an, `G/g2` meldet sich bei ihnen an.
   Würde hier zwischendurch alles abgeräumt, nähme man g2 seine
   Grundlage. Jede Liste, die einen bestimmten Event-Zustand braucht,
   stellt ihn deshalb selbst her — so wie g1 es tut.

   Die echte Veranstaltung, die Einstellungen und die Adminzugänge
   bleiben ebenfalls unberührt.

   Zum Aufräumen VOR dem Livegang gibt es `pruefung/aufraeumen.mjs` —
   der entfernt auch die Testevents.

   Aufruf:  npx tsx --env-file=.env pruefung/leeren.mjs
   (`.mjs` wie die übrigen Prüfskripte — nur so ist `await` auf oberster
   Ebene erlaubt.) */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "./schutz.mjs";

import { db } from "../lib/db.js";

await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.anmeldeVersuch.deleteMany({});
await db.zahlungsEreignis.deleteMany({});

/* Die Tabellen des Löschkonzepts ebenfalls. Bliebe hier eine Sperre
   aus einem vorigen Lauf stehen, hielte sie in der nächsten Liste
   einen Datensatz fest, der eigentlich gelöscht werden müsste — und
   die Liste meldete einen Fehler, den es nicht gibt. */
await db.loeschsperre.deleteMany({});
await db.loeschprotokoll.deleteMany({});
await db.vorfall.deleteMany({});
await db.checkliste.deleteMany({});
await db.zustimmungsnachweis.deleteMany({});

/* ── Termin der Prüfveranstaltung sicherstellen ──────────────────
   Seit Entscheidung 2.5 (umgesetzt am 20.09.2026) ist eine Buchung
   ohne feststehenden Termin gesperrt — im Formular wie in der
   Serveraktion. Der Startdatensatz legt `padel-falkensee` bewusst
   OHNE Datum an („Termin folgt"), weil der echte Termin noch nicht
   feststeht.

   Beides zusammen heißt: Die Prüflisten, die eine Anmeldung absenden,
   hätten kein Formular mehr, an das sie sich wenden könnten. Deshalb
   bekommt die Veranstaltung hier einen Termin in der Zukunft.

   Das ist eine **Anpassung der Prüfung an die neue Regel, keine
   Abschwächung**: Die Sperre selbst wird in Prüfliste T eigens geprüft,
   und zwar mit einer Veranstaltung, die bewusst keinen Termin hat. */
const inDreissigTagen = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const { count: termine } = await db.event.updateMany({
  where: { startAt: null },
  data: { startAt: inDreissigTagen },
});

console.log(
  `Anmeldungen, Bremsen, Zahlungsereignisse und Löschtabellen geleert. ` +
    `Termin gesetzt bei ${termine} Veranstaltung(en).`,
);
process.exit(0);
