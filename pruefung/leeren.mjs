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

console.log("Anmeldungen, Bremsen, Zahlungsereignisse und Löschtabellen geleert.");
process.exit(0);
