/* ---------------------------------------------------------------
   Prüfliste T · Teil 1 — die Regel selbst und ihre Verdrahtung

   Hintergrund: Entscheidung 2.5 (18.09.2026) — ohne feststehenden
   Termin darf weder gebucht noch bezahlt werden. Erweitert am
   10.10.2026: Auch eine bereits vergangene Veranstaltung und ein
   überschrittener Anmeldeschluss sperren die Buchung (anmeldeStatus
   in lib/termin.ts). Die Klauseln, die den umgekehrten Fall regelten,
   sind gestrichen (Dokument 07, Abschnitte 2.4 und 3.3); die Sperre
   muss die Lücke schließen.

   Dieser Teil braucht weder Datenbank noch Server.
   --------------------------------------------------------------- */
import { readFileSync } from "node:fs";
import {
  terminSteht,
  terminStehtAnzeige,
  anmeldeStatus,
  anmeldungOffen,
  anmeldungOffenAnzeige,
} from "../../lib/termin.js";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung) => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name); }
};

const lies = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

console.log("\nT1 · Die reine Regel");
pruefe("Datenbankform: mit Datum → buchbar", terminSteht({ startAt: new Date() }) === true);
pruefe("Datenbankform: ohne Datum → gesperrt", terminSteht({ startAt: null }) === false);
pruefe("Anzeigeform: mit Datum → buchbar", terminStehtAnzeige({ datum: "2026-05-12" }) === true);
pruefe("Anzeigeform: ohne Datum → gesperrt", terminStehtAnzeige({ datum: null }) === false);

console.log("\nT1b · Das Anmeldefenster");
const tag = 24 * 60 * 60 * 1000;
const jetzt = new Date("2026-06-15T12:00:00Z");
const leer = { startAt: null, endAt: null, anmeldungAb: null, anmeldungBis: null };
const zukunft = {
  startAt: new Date(jetzt.getTime() + 7 * tag),
  endAt: null,
  anmeldungAb: null,
  anmeldungBis: null,
};
pruefe("ohne Termin → kein-termin", anmeldeStatus(leer, jetzt) === "kein-termin");
pruefe("Termin in der Zukunft → offen", anmeldeStatus(zukunft, jetzt) === "offen");
pruefe(
  "Termin in der Vergangenheit → vorbei",
  anmeldeStatus(
    { startAt: new Date(jetzt.getTime() - 7 * tag), endAt: null, anmeldungAb: null, anmeldungBis: null },
    jetzt,
  ) === "vorbei",
);
pruefe(
  "läuft noch (Ende in der Zukunft) → offen",
  anmeldeStatus(
    {
      startAt: new Date(jetzt.getTime() - 2 * 60 * 60 * 1000),
      endAt: new Date(jetzt.getTime() + 2 * 60 * 60 * 1000),
      anmeldungAb: null,
      anmeldungBis: null,
    },
    jetzt,
  ) === "offen",
);
pruefe(
  "vor Anmeldebeginn → noch-nicht-offen",
  anmeldeStatus({ ...zukunft, anmeldungAb: new Date(jetzt.getTime() + 1 * tag) }, jetzt) ===
    "noch-nicht-offen",
);
pruefe(
  "nach Anmeldeschluss → anmeldeschluss",
  anmeldeStatus({ ...zukunft, anmeldungBis: new Date(jetzt.getTime() - 1 * tag) }, jetzt) ===
    "anmeldeschluss",
);
pruefe("vorbei schlägt Anmeldeschluss (treffendste Auskunft)",
  anmeldeStatus(
    {
      startAt: new Date(jetzt.getTime() - 7 * tag),
      endAt: null,
      anmeldungAb: null,
      anmeldungBis: new Date(jetzt.getTime() - 8 * tag),
    },
    jetzt,
  ) === "vorbei",
);
pruefe("anmeldungOffen: offen → true", anmeldungOffen(zukunft, jetzt) === true);
pruefe("anmeldungOffen: vorbei → false", anmeldungOffen(leer, jetzt) === false);
pruefe("anmeldungOffenAnzeige: Feld offen → true", anmeldungOffenAnzeige({ anmeldeStatus: "offen" }) === true);
pruefe("anmeldungOffenAnzeige: Feld vorbei → false", anmeldungOffenAnzeige({ anmeldeStatus: "vorbei" }) === false);

console.log("\nT2 · Die Regel steht an EINER Stelle");
const termin = lies("lib/termin.ts");
pruefe("lib/termin.ts prüft startAt", /startAt !== null/.test(termin));
pruefe("lib/termin.ts prüft datum", /datum !== null/.test(termin));
pruefe("lib/termin.ts kennt das Anmeldefenster", /export function anmeldeStatus\(/.test(termin));
const events = lies("lib/events.ts");
pruefe("lib/events.ts leitet anmeldeStatus zentral ab", /ermittleAnmeldeStatus\(e\)/.test(events));

console.log("\nT3 · Verdrahtung: jede Stelle benutzt die gemeinsame Regel");
/* Server: entscheidet verbindlich über anmeldeStatus/anmeldungOffen.
   Anzeige-Knöpfe: fragen das zentral abgeleitete Feld über
   anmeldungOffenAnzeige. Beide kommen aus lib/termin. */
const serverStellen = [
  ["Serveraktion (Anmeldung anlegen)", "app/(seite)/anmeldung/aktion.ts", "anmeldeStatus("],
  ["Zahlungsstart", "lib/zahlungStart.ts", "anmeldeStatus("],
];
const anzeigeStellen = [
  ["Hero-Knopf", "components/Hero.tsx", "anmeldungOffenAnzeige("],
  ["Premium-Hero-Knopf", "components/HeroPremium.tsx", "anmeldungOffenAnzeige("],
  ["Abschlussband-Knopf", "components/CtaBand.tsx", "anmeldungOffenAnzeige("],
];
for (const [name, datei, ruf] of [...serverStellen, ...anzeigeStellen]) {
  const q = lies(datei);
  pruefe(`${name} ruft die Regel auf`, q.includes(ruf));
  pruefe(`${name} importiert aus lib/termin`, /from "@\/lib\/termin"/.test(q));
}
/* Die Anmeldeseite gatet auf dem zentral abgeleiteten Feld — nur bei
   "offen" erscheint das Formular. */
const seite = lies("app/(seite)/events/[slug]/anmeldung/page.tsx");
pruefe("Anmeldeseite prüft event.anmeldeStatus", /event\.anmeldeStatus/.test(seite));
pruefe('Anmeldeseite zeigt das Formular nur bei "offen"', /status !== "offen"/.test(seite));

console.log("\nT4 · Keine eigene Kopie der Bedingung");
/* Eine zweite, handgeschriebene Prüfung wäre der Weg, auf dem die
   Regel auseinanderläuft. Gesucht wird nach Datums-Vergleichen
   ausserhalb von lib/termin.ts an genau den Stellen, die die Sperre
   tragen. (Ein `startAt: true` im Prisma-select ist kein Vergleich.) */
for (const [name, datei] of [...serverStellen, ...anzeigeStellen]) {
  const q = lies(datei);
  const eigeneKopie =
    /startAt\s*(===|!==|==|!=)\s*null/.test(q) ||
    /!\s*event\.startAt/.test(q) ||
    /getTime\(\)/.test(q);
  pruefe(`${name} hat keine eigene Zeit-Prüfung`, !eigeneKopie);
}

console.log("\nT5 · Der Ablehnungsgrund ist ein fester Wert, kein Text");
/* Bis zum 26.09.2026 stand der Grund in `ZahlungAbgelehnt`
   (lib/zahlungRegeln.ts). Diesen Typ gibt es nicht mehr: Er gehörte
   zu einer Entscheidung über eine gespeicherte Anmeldung, und die
   gibt es beim Zahlungsstart nicht mehr. Derselbe feste Wert steht
   jetzt in `StartFehler`. */
const regeln = lies("lib/zahlungStart.ts");
pruefe('StartFehler kennt "kein-termin"', /"kein-termin"/.test(regeln));
pruefe('StartFehler kennt "anmeldung-zu"', /"anmeldung-zu"/.test(regeln));
const danke = lies("app/(seite)/anmeldung/danke/page.tsx");
pruefe("Abschluss-Seite behandelt kein-termin", /kein-termin/.test(danke));
/* Bis zum 26.09.2026 stand hier „blendet den Bezahlknopf aus".
   Den Knopf gibt es nicht mehr: Vor der Zahlung wird nichts
   gespeichert, es gibt also keinen Vorgang, den er fortsetzen
   könnte. Geprüft wird weiterhin dieselbe Sache — dass ohne
   feststehenden Termin nicht bezahlt werden kann —, nur an der
   Stelle, an der sie jetzt entschieden wird. */
pruefe(
  "Die Abschluss-Seite bietet keinen Weg mehr, die Zahlung fortzusetzen",
  !/zahlungStarten/.test(danke),
);
pruefe(
  "Die Bezahlseite wird außerhalb des Anmeldefensters gar nicht erst erzeugt",
  /anmeldeStatus\(event\)/.test(regeln) &&
    /fehler: "kein-termin"/.test(regeln) &&
    /fehler: "anmeldung-zu"/.test(regeln),
);
const woerter = lies("content/de.ts");
pruefe("Wörterbuch hat einen Text dafür", /zahlungKeinTermin/.test(woerter));
pruefe("Wörterbuch hat einen Text für die Anmeldeseite", /keinTerminTitel/.test(woerter));
pruefe("Wörterbuch hat einen Text für vorbei", /vorbeiTitel/.test(woerter));
pruefe("Wörterbuch hat einen Text für Anmeldeschluss", /anmeldeschlussTitel/.test(woerter));

console.log(`\nErgebnis Teil 1: ${ok} bestanden, ${fehl} durchgefallen\n`);
process.exit(fehl === 0 ? 0 : 1);
