/* ---------------------------------------------------------------
   Die reinen Regeln der Selbstbedienungs-Stornierung.

   Braucht weder Datenbank noch Server noch Stripe:
       npx tsx pruefung/P/p-storno-regeln.mjs
   --------------------------------------------------------------- */

import {
  STORNO_VORLAUF_STUNDEN,
  stornoFristEnde,
  innerhalbFrist,
  stornoEntscheidung,
} from "../../lib/storno.ts";

let gut = 0;
let schlecht = 0;

function pruefe(name, bedingung, zusatz = "") {
  if (bedingung) {
    gut += 1;
    console.log(`✓ ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
  } else {
    schlecht += 1;
    console.log(`✗ ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
  }
}

const stunde = 60 * 60 * 1000;
const jetzt = new Date("2026-09-06T12:00:00Z");
const bezahlt = { status: "BESTAETIGT", zahlungsStatus: "BEZAHLT", gesamtpreisCents: 2500 };

/* ── Die Frist selbst ───────────────────────────────────────────── */

pruefe("Die Frist beträgt 24 Stunden", STORNO_VORLAUF_STUNDEN === 24, `${STORNO_VORLAUF_STUNDEN} h`);

const start = new Date("2026-09-10T18:00:00Z");
pruefe(
  "Das Fristende liegt genau 24 Stunden vor Beginn",
  stornoFristEnde(start).toISOString() === "2026-09-09T18:00:00.000Z",
  stornoFristEnde(start).toISOString(),
);

pruefe("Ohne Termin gibt es kein Fristende", stornoFristEnde(null) === null);

/* ── innerhalbFrist ─────────────────────────────────────────────── */

pruefe("Weit vor dem Termin: innerhalb der Frist", innerhalbFrist(start, jetzt));

pruefe(
  "Genau 24 Stunden und eine Minute vorher: noch innerhalb",
  innerhalbFrist(start, new Date(start.getTime() - 24 * stunde - 60_000)),
);

pruefe(
  "Genau auf die Sekunde 24 Stunden vorher: NICHT mehr innerhalb",
  !innerhalbFrist(start, new Date(start.getTime() - 24 * stunde)),
);

pruefe(
  "Eine Stunde vor Beginn: nicht mehr innerhalb",
  !innerhalbFrist(start, new Date(start.getTime() - stunde)),
);

pruefe(
  "Nach dem Termin: nicht mehr innerhalb",
  !innerhalbFrist(start, new Date(start.getTime() + stunde)),
);

pruefe("Ohne Termin immer innerhalb der Frist", innerhalbFrist(null, jetzt));

/* ── Die Entscheidung ───────────────────────────────────────────── */

const e1 = stornoEntscheidung({ ...bezahlt, startAt: start }, jetzt);
pruefe("Bezahlte Buchung rechtzeitig: erlaubt", e1.erlaubt === true);
pruefe("… und es wird erstattet", e1.erlaubt && e1.erstatten === true);

const e2 = stornoEntscheidung({ ...bezahlt, startAt: start }, new Date(start.getTime() - stunde));
pruefe("Bezahlte Buchung zu spät: abgelehnt", e2.erlaubt === false);
pruefe("… mit dem Grund „zu-spaet“", !e2.erlaubt && e2.grund === "zu-spaet", e2.grund);

const e3 = stornoEntscheidung(
  { status: "RESERVIERT", zahlungsStatus: "OFFEN", gesamtpreisCents: 2500, startAt: start },
  jetzt,
);
pruefe("Unbezahlte Reservierung: erlaubt", e3.erlaubt === true);
pruefe("… aber OHNE Erstattung", e3.erlaubt && e3.erstatten === false);

const e4 = stornoEntscheidung(
  { status: "BESTAETIGT", zahlungsStatus: "BEZAHLT", gesamtpreisCents: 0, startAt: start },
  jetzt,
);
pruefe("Kostenloses Event: erlaubt", e4.erlaubt === true);
pruefe("… und ohne Erstattung (es floss kein Geld)", e4.erlaubt && e4.erstatten === false);

const e5 = stornoEntscheidung({ ...bezahlt, status: "STORNIERT", startAt: start }, jetzt);
pruefe("Bereits storniert: abgelehnt", !e5.erlaubt && e5.grund === "bereits-storniert", e5.grund);

const e6 = stornoEntscheidung(
  { ...bezahlt, zahlungsStatus: "ERSTATTET", startAt: start },
  jetzt,
);
pruefe("Bereits erstattet: abgelehnt", !e6.erlaubt && e6.grund === "bereits-erstattet", e6.grund);

const e7 = stornoEntscheidung(
  { ...bezahlt, zahlungsStatus: "TEILWEISE_ERSTATTET", startAt: start },
  jetzt,
);
pruefe(
  "Teilweise erstattet: ebenfalls abgelehnt — keine zweite Erstattung obendrauf",
  !e7.erlaubt && e7.grund === "bereits-erstattet",
  e7.grund,
);

/* Die Reihenfolge der Gründe: „schon storniert“ schlägt „zu spät“. */
const e8 = stornoEntscheidung(
  { ...bezahlt, status: "STORNIERT", startAt: start },
  new Date(start.getTime() - stunde),
);
pruefe(
  "Storniert UND zu spät: meldet „bereits-storniert“, nicht „zu-spaet“",
  !e8.erlaubt && e8.grund === "bereits-storniert",
  e8.grund,
);

const e9 = stornoEntscheidung({ ...bezahlt, startAt: null }, jetzt);
pruefe("Ohne Termin: erlaubt", e9.erlaubt === true);
pruefe("… und mit Erstattung", e9.erlaubt && e9.erstatten === true);

/* Der Betrag entscheidet, nicht der Status allein. */
const e10 = stornoEntscheidung(
  { status: "BESTAETIGT", zahlungsStatus: "OFFEN", gesamtpreisCents: 0, startAt: null },
  jetzt,
);
pruefe("Kostenlos und unbezahlt: erlaubt, ohne Erstattung", e10.erlaubt && e10.erstatten === false);

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
