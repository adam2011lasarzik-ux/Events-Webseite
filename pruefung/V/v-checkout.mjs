/* ---------------------------------------------------------------
   Prüfliste V · Bestellknopf, AGB-Häkchen, Aufnahmehinweis
                 (Bauaufträge B-28, B-29 und B-17)

   Drei Punkte mit sehr unterschiedlicher, aber jeweils harter
   Rechtsfolge:

     B-28  § 312j Abs. 3 BGB — ist der Bestellknopf falsch
           beschriftet, kommt der Vertrag nach Absatz 4 NICHT ZUSTANDE.
     B-29  § 305 Abs. 2 BGB — ohne ausdrückliche Annahme werden die
           Teilnahmebedingungen nicht Vertragsbestandteil.
     B-17  Art. 7 Abs. 4 DS-GVO — die Kenntnisnahme darf nur deshalb
           Pflicht sein, WEIL sie keine Einwilligung ist. Und
           Art. 21 Abs. 4 DS-GVO verlangt den Widerspruchshinweis
           getrennt von anderen Informationen.

   Teil 1 braucht weder Datenbank noch Server, Teil 2 beides.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { readFileSync } from "node:fs";
import { db } from "../../lib/db.js";
import { pruefeUndBaue } from "../../lib/anmeldung.js";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name, zusatz); }
};

const lies = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const de = lies("content/de.ts");
const felder = lies("components/AnmeldeFelder.tsx");
const rechner = lies("components/PreisRechner.tsx");

/* ══ V1 · Der Bestellknopf (B-28) ════════════════════════════════ */

console.log("\nV1 · Bestellknopf und Einstieg");

pruefe(
  "Der Bestellknopf heißt wörtlich „Zahlungspflichtig bestellen“",
  /absenden:\s*"Zahlungspflichtig bestellen"/.test(de),
);
pruefe(
  "Der Einstiegsknopf heißt „Zu den Tickets“",
  /anmelden:\s*"Zu den Tickets"/.test(de),
);

/* Die verworfenen Beschriftungen dürfen nicht zurückkehren. */
for (const schlecht of ["Jetzt anmelden", "Zur Bezahlung", "Bestellung aufgeben"]) {
  pruefe(
    `„${schlecht}“ steht nicht mehr als Knopfbeschriftung im Wörterbuch`,
    !new RegExp(`(absenden|anmelden):\\s*"${schlecht}`).test(de),
  );
}

pruefe(
  "Der Betrag wird NICHT mehr in den Bestellknopf gefüllt",
  /* Wortgrenze nötig: „absenden" ist ein Präfix von
     „absendenBetrag", und der DARF gefüllt werden. */
  !/fuelle\(t\.anmeldung\.formular\.absenden\b(?!Betrag)/.test(rechner),
);
pruefe(
  "… sondern steht als eigene Zeile daneben",
  rechner.includes("absendenBetrag"),
);
pruefe(
  "Der Knopf trägt genau den Wörterbuchwert, ohne Zusatz",
  /text=\{\s*ergebnis\.gesamtCents > 0\s*\?\s*t\.anmeldung\.formular\.absenden\b/.test(rechner),
);
pruefe(
  "Bei kostenlosen Veranstaltungen bleibt die eigene Beschriftung",
  /absendenKostenlos:\s*"Jetzt verbindlich anmelden"/.test(de),
);

/* ══ V2 · Die beiden Pflichthaken im Formular (B-29, B-17) ═══════ */

console.log("\nV2 · Die Häkchen im Formular");

pruefe("Es gibt ein Häkchen agbAkzeptiert", felder.includes('name="agbAkzeptiert"'));
pruefe("Es gibt ein Häkchen kenntnisAufnahmen", felder.includes('name="kenntnisAufnahmen"'));
pruefe(
  "Das freiwillige Foto-Häkchen ist verschwunden",
  !felder.includes("einwilligungFotos") && !de.includes("einwilligungFotos"),
);
pruefe(
  "Kein Häkchen ist vorbelegt — der Anfangswert ist immer false",
  /gesetzt=\{haken\.agbAkzeptiert \?\? false\}/.test(felder) &&
    /gesetzt=\{haken\.kenntnisAufnahmen \?\? false\}/.test(felder),
);
pruefe(
  "Beide zeigen ihren Fehler am Feld an",
  felder.includes('fehlerZu("agbAkzeptiert")') && felder.includes('fehlerZu("kenntnisAufnahmen")'),
);
pruefe(
  "Der AGB-Haken verlinkt die vollständigen Bedingungen",
  /href="\/agb"/.test(felder),
);
pruefe(
  "Der Aufnahme-Haken verlinkt die Hinweisseite",
  /href="\/aufnahmen"/.test(felder),
);
pruefe(
  "Der AGB-Text spricht von Akzeptieren, nicht von Einwilligen",
  /agbTeil1:\s*"Ich akzeptiere/.test(de),
);
pruefe(
  "Der Aufnahme-Text spricht von Kenntnisnahme, nicht von Einwilligung",
  /aufnahmenTeil1:\s*\n?\s*"Ich habe zur Kenntnis genommen/.test(de),
);

console.log("\nV3 · Der Widerspruchshinweis steht getrennt (Art. 21 Abs. 4 DS-GVO)");
pruefe(
  "Er steht in einem eigenen Element, nicht in der Häkchenliste",
  felder.includes("<aside className={stil.widerspruch}"),
);
pruefe(
  "… ausserhalb des Blocks mit den Einwilligungen",
  felder.indexOf("stil.widerspruch") > felder.indexOf("</div>\n\n      {/* ── Der Widerspruchshinweis") - 1,
);
pruefe("… mit eigener Überschrift", felder.includes('<h3 id="widerspruch-titel">'));
pruefe(
  "… und ist optisch abgesetzt",
  lies("components/AnmeldeFelder.module.css").includes(".widerspruch {"),
);
pruefe(
  "Der Text sagt ausdrücklich, dass ein Widerspruch keine Nachteile hat",
  /keinerlei\s*"?\s*\+?\s*\n?\s*"?Nachteile/.test(de) || de.includes("keinerlei Nachteile"),
);

console.log("\nV4 · Die Hinweisseite /aufnahmen");
const seite = lies("app/(seite)/aufnahmen/page.tsx");
pruefe("Die Seite existiert", seite.length > 0);
pruefe("Sie hat einen eigenen Abschnitt zum Widerspruchsrecht", seite.includes("widerspruchTitel"));
pruefe(
  "Sie behauptet keine Einwilligung",
  !/Einwilligung erteil|Sie willigen ein/.test(de.slice(de.indexOf("aufnahmen: {"), de.indexOf("recht: {"))),
);
pruefe(
  "Es wird nicht behauptet, VERA habe schon einen Instagram-Kanal (B-12)",
  !/Instagram-Kanal von VERA\./.test(de),
);
pruefe(
  "Stattdessen steht dort ehrlich, dass es noch keinen gibt",
  de.includes("Instagram-Kanal hat VERA derzeit nicht"),
);
pruefe("Sie ist aus dem Fussbereich erreichbar", lies("components/Footer.tsx").includes('"/aufnahmen"'));

/* ══ V5 · Serverseitig erzwungen — der eigentliche Beweis ════════ */

console.log("\nV5 · Serverseitige Prüfung, nicht nur im Browser");

const regeln = {
  schuelerAktiv: true,
  schuelerCents: 700,
  erwachsenerCents: 1400,
  familie: null,
};
const basis = {
  weg: "selbst",
  selbstAls: "adult",
  schueler: 0,
  erwachsene: 1,
  personen: [{ vorname: "Vera", nachname: "Probe", email: "v@pruef-v.example", telefon: "" }],
  einwilligungVormund: false,
  agbAkzeptiert: true,
  kenntnisAufnahmen: true,
};

const gut = pruefeUndBaue(regeln, basis);
pruefe("Mit beiden Haken geht die Anmeldung durch", gut.fehler === null, JSON.stringify(gut.fehler));

const ohneAgb = pruefeUndBaue(regeln, { ...basis, agbAkzeptiert: false });
pruefe(
  "Ohne AGB-Haken wird sie abgelehnt",
  ohneAgb.fehler?.some((f) => f.feld === "agbAkzeptiert"),
  JSON.stringify(ohneAgb.fehler),
);

const ohneKenntnis = pruefeUndBaue(regeln, { ...basis, kenntnisAufnahmen: false });
pruefe(
  "Ohne Aufnahme-Haken wird sie abgelehnt",
  ohneKenntnis.fehler?.some((f) => f.feld === "kenntnisAufnahmen"),
);

const ohneBeide = pruefeUndBaue(regeln, {
  ...basis,
  agbAkzeptiert: false,
  kenntnisAufnahmen: false,
});
pruefe(
  "Fehlen beide, werden auch beide gemeldet — nicht nur der erste",
  ohneBeide.fehler?.length >= 2,
);

pruefe(
  "Die Annahme wird an der Buchung festgehalten",
  gut.anmeldung?.agbAkzeptiert === true && gut.anmeldung?.kenntnisAufnahmen === true,
);

console.log("\nV6 · Die Serveraktion liest beide Felder aus dem Formular");
const aktion = lies("app/(seite)/anmeldung/aktion.ts");
pruefe(
  "agbAkzeptiert wird aus dem Formular gelesen",
  aktion.includes('formular.get("agbAkzeptiert")'),
);
pruefe(
  "kenntnisAufnahmen wird aus dem Formular gelesen",
  aktion.includes('formular.get("kenntnisAufnahmen")'),
);
pruefe(
  "Das alte Foto-Feld wird nirgends mehr gelesen",
  !aktion.includes("einwilligungFotos"),
);

console.log("\nV7 · Datenmodell");
const schema = lies("prisma/schema.prisma");
pruefe("Registration trägt agbAkzeptiert", schema.includes("agbAkzeptiert"));
pruefe("Registration trägt kenntnisAufnahmen", schema.includes("kenntnisAufnahmen"));
/* Auf die FELDDEKLARATION prüfen, nicht auf jede Erwähnung: Der
   Kommentar im Schema erklärt, warum das Feld entfallen ist, und
   nennt es dabei. Das ist kein Rückfall, sondern Dokumentation. */
pruefe(
  "einwilligungFotos ist als Feld entfallen",
  !/^\s*einwilligungFotos\s+Boolean/m.test(schema),
);

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen`);
await db.$disconnect();
process.exit(fehl === 0 ? 0 : 1);
