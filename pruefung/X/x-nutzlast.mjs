/* ---------------------------------------------------------------
   Prüfliste X1 · Die verschlüsselte Nutzlast

   Reine Regeln: weder Datenbank noch Server noch Netz. Läuft überall,
   auch ohne DATABASE_URL.

   Was hier auf dem Spiel steht: Ab dem Umbau vom 25.09.2026 liegen die
   Anmeldedaten zwischen dem Absenden des Formulars und der bestätigten
   Zahlung NIRGENDWO SONST als in dieser Marke. Ist sie fälschbar, ist
   jede Anmeldung fälschbar. Ist sie zu groß, nimmt der Zahlungsanbieter
   sie nicht an und die Anmeldung geht verloren.
   --------------------------------------------------------------- */

import { randomBytes } from "node:crypto";
import {
  verschluesseln,
  entschluesseln,
  alsSchluessel,
  schluesselKennung,
  MarkeUngueltig,
  HOECHSTALTER_MINUTEN,
} from "../../lib/anmeldeNutzlast.ts";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) {
    ok++;
    console.log("  ✓", name);
  } else {
    fehl++;
    console.log("  ✗", name, zusatz);
  }
};

/** Fängt einen erwarteten Fehler und liefert seinen Grund. */
const grundVon = (tu) => {
  try {
    tu();
    return "kein-fehler";
  } catch (e) {
    return e instanceof MarkeUngueltig ? e.grund : `fremder Fehler: ${e?.message}`;
  }
};

const schluesselA = alsSchluessel(randomBytes(32));
const schluesselB = alsSchluessel(randomBytes(32));
const bundA = { aktuell: schluesselA, weitere: [] };

const beispiel = {
  eventId: "cmuevent000000000000000001",
  kontaktVorname: "Mara",
  kontaktNachname: "Beispiel",
  kontaktEmail: "mara@beispiel.example",
  kontaktTelefon: "030123456",
  buchungsart: "FAMILIE",
  istVormundBuchung: true,
  einwilligungVormund: true,
  agbAkzeptiert: true,
  kenntnisAufnahmen: true,
  gesamtpreisCents: 3600,
  agbFassungId: "cmuagb0000000000000000001",
  datenschutzFassungId: "cmuds00000000000000000001",
  teilnehmer: [
    { vorname: "Mara", nachname: "Beispiel", typ: "E" },
    { vorname: "Nino", nachname: "Beispiel", typ: "S", geburtsjahr: 2014 },
  ],
};
const passend = { eventId: beispiel.eventId, preisCents: beispiel.gesamtpreisCents };

console.log("\nX1.1 · Hin und zurück");
const marke = verschluesseln(beispiel, bundA);
const zurueck = entschluesseln(marke, bundA, passend);
pruefe("Die Nutzlast kommt unverändert zurück",
  zurueck.kontaktEmail === beispiel.kontaktEmail &&
    zurueck.teilnehmer.length === 2 &&
    zurueck.teilnehmer[1].geburtsjahr === 2014);
pruefe("Der Zeitpunkt wird beim Verschlüsseln gesetzt",
  typeof zurueck.erstelltMs === "number" && Math.abs(Date.now() - zurueck.erstelltMs) < 10_000);
pruefe("Die Marke hat vier Teile", marke.split(".").length === 4, marke.slice(0, 40));
pruefe("Sie beginnt mit der Formatfassung", marke.startsWith("v1."));
pruefe("… und nennt die Kennung des benutzten Schlüssels",
  marke.split(".")[1] === schluesselA.kennung);

/* Der Klartext darf in der Marke nirgends durchscheinen. Eine
   Verschlüsselung, bei der man die E-Mail-Adresse noch lesen kann,
   wäre keine. */
pruefe("Kein Stück Klartext steht in der Marke",
  !marke.includes("mara") && !marke.includes("Beispiel") && !marke.includes("beispiel.example"));

console.log("\nX1.2 · Zweimal derselbe Text ergibt nie dieselbe Marke");
const zweite = verschluesseln(beispiel, bundA);
pruefe("Zwei Marken derselben Daten unterscheiden sich", marke !== zweite);
pruefe("… und beide lassen sich öffnen",
  entschluesseln(zweite, bundA, passend).kontaktEmail === beispiel.kontaktEmail);

console.log("\nX1.3 · Jede Veränderung scheitert");
/* Nicht stichprobenartig, sondern JEDE Stelle des Geheimtextes. Eine
   Verschlüsselung, die nur an den geprüften Stellen hält, hält nicht.

   Eine Eigenheit von base64 muss dabei berücksichtigt werden, sonst
   prüft diese Liste etwas Falsches und schlägt zufällig fehl: Das
   LETZTE Zeichen einer base64-Zeichenkette trägt je nach Länge
   ungenutzte Bits. Zwei verschiedene Endzeichen können deshalb
   dieselben Bytes ergeben. Wird ein solches Zeichen verändert, ändert
   sich der Geheimtext gar nicht — und dann darf und soll die Marke
   sich öffnen lassen.

   Geprüft wird also die Eigenschaft, um die es wirklich geht: JEDE
   Veränderung, die die Bytes verändert, wird abgewiesen. Gemessen
   wird das an den Bytes, nicht an den Zeichen.

   (Gefunden am 26.09.2026, weil diese Liste bei etwa jedem dritten
   Lauf an genau dieser einen Stelle rot wurde.) */
const teile = marke.split(".");
const geheim = teile[3];
const geheimBytes = Buffer.from(geheim, "base64url");

let alleGescheitert = true;
let ersteLuecke = "";
let wirklichGeprueft = 0;
let folgenlos = 0;

for (let i = 0; i < geheim.length; i++) {
  const anders = geheim[i] === "A" ? "B" : "A";
  const veraendert = geheim.slice(0, i) + anders + geheim.slice(i + 1);
  if (veraendert === geheim) continue;

  // Ändern sich die BYTES überhaupt? Sonst ist nichts verändert worden.
  if (Buffer.from(veraendert, "base64url").equals(geheimBytes)) {
    folgenlos++;
    continue;
  }

  wirklichGeprueft++;
  const verbogen = [teile[0], teile[1], teile[2], veraendert].join(".");
  const grund = grundVon(() => entschluesseln(verbogen, bundA, passend));
  if (grund !== "siegel" && grund !== "inhalt") {
    alleGescheitert = false;
    ersteLuecke = `Stelle ${i}: ${grund}`;
    break;
  }
}
pruefe(
  `Jede der ${wirklichGeprueft} wirksamen Ein-Zeichen-Änderungen am Geheimtext wird abgewiesen`,
  alleGescheitert,
  ersteLuecke,
);
pruefe(
  "Die folgenlosen Änderungen betreffen nur das letzte Zeichen — eine Eigenheit von base64",
  folgenlos <= 1,
  `${folgenlos} folgenlose Stellen`,
);

let zufallGescheitert = true;
const zufall = teile[2];
const zufallBytes = Buffer.from(zufall, "base64url");
for (let i = 0; i < zufall.length; i++) {
  const anders = zufall[i] === "A" ? "B" : "A";
  const veraendert = zufall.slice(0, i) + anders + zufall.slice(i + 1);
  if (veraendert === zufall) continue;
  if (Buffer.from(veraendert, "base64url").equals(zufallBytes)) continue;
  const verbogen = [teile[0], teile[1], veraendert, teile[3]].join(".");
  const grund = grundVon(() => entschluesseln(verbogen, bundA, passend));
  if (grund !== "siegel" && grund !== "inhalt") { zufallGescheitert = false; break; }
}
pruefe("Auch ein verändertes Zeichen im Zufallswert wird abgewiesen", zufallGescheitert);

pruefe("Eine abgeschnittene Marke wird abgewiesen",
  grundVon(() => entschluesseln(marke.slice(0, marke.length - 6), bundA, passend)) === "siegel");
pruefe("Blanker Unsinn wird abgewiesen",
  grundVon(() => entschluesseln("kein.gueltiger.wert.ueberhaupt", bundA, passend)) !== "kein-fehler");
pruefe("Eine Marke ohne Punkte wird am Aufbau abgewiesen",
  grundVon(() => entschluesseln("nurirgendwas", bundA, passend)) === "aufbau");
pruefe("Eine fremde Formatfassung wird abgewiesen",
  grundVon(() => entschluesseln(["v9", teile[1], teile[2], teile[3]].join("."), bundA, passend)) === "fassung");

console.log("\nX1.4 · Die Marke gilt nur für IHRE Veranstaltung und IHREN Betrag");
pruefe("Andere Veranstaltung → abgewiesen",
  grundVon(() => entschluesseln(marke, bundA, { eventId: "cmufremd0000000000000001", preisCents: 3600 })) === "siegel");
pruefe("Anderer Betrag → abgewiesen",
  grundVon(() => entschluesseln(marke, bundA, { eventId: beispiel.eventId, preisCents: 100 })) === "siegel");
pruefe("Ein Cent Unterschied genügt",
  grundVon(() => entschluesseln(marke, bundA, { eventId: beispiel.eventId, preisCents: 3599 })) === "siegel");

console.log("\nX1.5 · Ein fremder Schlüssel öffnet nichts");
pruefe("Mit einem anderen Schlüssel ist die Kennung unbekannt",
  grundVon(() => entschluesseln(marke, { aktuell: schluesselB, weitere: [] }, passend)) === "schluessel-unbekannt");
/* Der gefährlichere Fall: gleiche Kennung vorgetäuscht, anderer
   Schlüssel. Dann muss das Siegel greifen, nicht die Kennung. */
const getarnt = { aktuell: { kennung: schluesselA.kennung, bytes: schluesselB.bytes }, weitere: [] };
pruefe("Und bei vorgetäuschter Kennung greift das Siegel",
  grundVon(() => entschluesseln(marke, getarnt, passend)) === "siegel");

console.log("\nX1.6 · Schlüsselwechsel ohne Ausfall");
/* Der Ablauf aus lib/anmeldeSchluessel.ts, nachgestellt: Der neue
   Schlüssel verschlüsselt, der alte schliesst noch auf. */
const bundNachWechsel = { aktuell: schluesselB, weitere: [schluesselA] };
pruefe("Eine alte Marke lässt sich nach dem Wechsel weiter öffnen",
  entschluesseln(marke, bundNachWechsel, passend).kontaktEmail === beispiel.kontaktEmail);
const markeNeu = verschluesseln(beispiel, bundNachWechsel);
pruefe("Eine neue Marke trägt die Kennung des NEUEN Schlüssels",
  markeNeu.split(".")[1] === schluesselB.kennung);
pruefe("… und lässt sich ebenfalls öffnen",
  entschluesseln(markeNeu, bundNachWechsel, passend).kontaktEmail === beispiel.kontaktEmail);
pruefe("Nach dem Entfernen des alten Schlüssels ist die alte Marke tot",
  grundVon(() => entschluesseln(marke, { aktuell: schluesselB, weitere: [] }, passend)) === "schluessel-unbekannt");

console.log("\nX1.7 · Kennungen");
pruefe("Die Kennung hat acht Stellen", schluesselA.kennung.length === 8);
pruefe("Zwei verschiedene Schlüssel haben verschiedene Kennungen",
  schluesselA.kennung !== schluesselB.kennung);
pruefe("Derselbe Schlüssel hat immer dieselbe Kennung",
  schluesselKennung(schluesselA.bytes) === schluesselA.kennung);
pruefe("Ein zu kurzer Schlüssel wird abgelehnt",
  grundVon(() => alsSchluessel(randomBytes(16))).startsWith("fremder Fehler"));

console.log("\nX1.8 · Alter");
const alt = verschluesseln(beispiel, bundA, new Date(Date.now() - (HOECHSTALTER_MINUTEN + 1) * 60_000));
pruefe("Eine zu alte Marke wird abgewiesen",
  grundVon(() => entschluesseln(alt, bundA, passend)) === "abgelaufen");
const geradeNoch = verschluesseln(beispiel, bundA, new Date(Date.now() - (HOECHSTALTER_MINUTEN - 5) * 60_000));
pruefe("Eine gerade noch junge Marke geht durch",
  entschluesseln(geradeNoch, bundA, passend).kontaktEmail === beispiel.kontaktEmail);

console.log("\nX1.9 · Unvollständige Inhalte");
/* Das Siegel beweist nur, dass niemand Fremdes geschrieben hat — nicht,
   dass der Inhalt zu dieser Fassung des Programms passt. */
const ohneTeilnehmer = verschluesseln({ ...beispiel, teilnehmer: [] }, bundA);
pruefe("Eine Nutzlast ohne Teilnehmer wird abgewiesen",
  grundVon(() => entschluesseln(ohneTeilnehmer, bundA, passend)) === "inhalt");
const falscherTyp = verschluesseln(
  { ...beispiel, teilnehmer: [{ vorname: "X", nachname: "Y", typ: "Q" }] }, bundA);
pruefe("Ein unbekannter Teilnehmertyp wird abgewiesen",
  grundVon(() => entschluesseln(falscherTyp, bundA, passend)) === "inhalt");
const ohneEmail = verschluesseln({ ...beispiel, kontaktEmail: "" }, bundA);
pruefe("Eine Nutzlast ohne E-Mail-Adresse wird abgewiesen",
  grundVon(() => entschluesseln(ohneEmail, bundA, passend)) === "inhalt");

console.log("\nX1.10 · Die Marke passt in die Metadaten des Zahlungsanbieters");
/* Am 25.09.2026 auf dem Server gegen die echte Schnittstelle gemessen:
   20 Felder zu je 500 Zeichen gehen durch. Diese Prüfung hält den
   schlimmsten Fall dagegen — und schlägt an, wenn jemand später die
   Feldlängen in lib/anmeldung.ts lockert oder mehr Personen je Buchung
   erlaubt, ohne hier nachzusehen. */
const FELD_ZEICHEN = 500;
const FELDER_BELEGT = 20;
const PLATZ = FELD_ZEICHEN * FELDER_BELEGT;

const langerName = () =>
  [...Array(80)].map(() => "abcdefghijklmnopqrstuvwxyz"[(Math.random() * 26) | 0]).join("");
const schlimmst = {
  ...beispiel,
  buchungsart: "EINZEL",
  kontaktVorname: langerName(),
  kontaktNachname: langerName(),
  kontaktEmail: langerName() + "@" + langerName() + ".de",
  kontaktTelefon: "0".repeat(40),
  teilnehmer: Array.from({ length: 20 }, () => ({
    vorname: langerName(), nachname: langerName(), typ: "S", geburtsjahr: 2011,
  })),
};
let groesste = 0;
for (let i = 0; i < 20; i++) {
  groesste = Math.max(groesste, verschluesseln(schlimmst, bundA).length);
}
pruefe(
  `Der schlimmste Fall (20 Personen, volle Feldlängen) passt in ${FELDER_BELEGT} Felder`,
  groesste <= PLATZ,
  `${groesste} von ${PLATZ} Zeichen`,
);
pruefe("… und lässt sich vollständig zurücklesen",
  entschluesseln(verschluesseln(schlimmst, bundA), bundA,
    { eventId: schlimmst.eventId, preisCents: schlimmst.gesamtpreisCents }).teilnehmer.length === 20);
console.log(`     (gemessen: ${groesste} Zeichen, das sind ${Math.ceil(groesste / FELD_ZEICHEN)} Felder à ${FELD_ZEICHEN})`);

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen`);
process.exit(fehl === 0 ? 0 : 1);
