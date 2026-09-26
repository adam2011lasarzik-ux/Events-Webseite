/* ---------------------------------------------------------------
   Prüfliste X3 · Die Anmeldung entsteht aus der bezahlten Zahlung

   Läuft gegen die echte Datenbank. Sie prüft die eine Funktion, die
   ab dem Umbau vom 25.09.2026 als EINZIGE eine Anmeldung anlegen darf
   (lib/anmeldungAnlegen.ts) — und die vier Fälle, in denen das Geld da
   ist, aber kein Vertrag zustande kommt.

   Voraussetzung: Datenbank läuft, Startdaten sind eingespielt.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs.
   Diese Liste legt Anmeldungen an und löscht sie wieder. */
import "../schutz.mjs";

import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { db } from "../../lib/db.js";
import { alsSchluessel, verschluesseln, entschluesseln } from "../../lib/anmeldeNutzlast.ts";
import {
  anmeldungAusZahlung,
  fehlbuchungFesthalten,
  erstattungVermerken,
  SOFORT_ERSTATTEN,
  ZUR_KLAERUNG,
  erledigtVermerken,
} from "../../lib/anmeldungAnlegen.ts";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name, zusatz); }
};

/**
 * Alle Fehlbuchungsgründe — aus dem Quelltext gelesen, nicht von Hand
 * abgeschrieben.
 *
 * Der Typ `Fehlbuchungsgrund` existiert zur Laufzeit nicht; eine
 * abgeschriebene Liste wäre beim nächsten neuen Grund still veraltet.
 * Genau das soll nicht passieren: Jeder neue Grund muss eine
 * Entscheidung auslösen — erstattet er von selbst, oder wartet er auf
 * einen Menschen? Wird er in keine der beiden Listen aufgenommen,
 * fällt er durch und niemand merkt es. Deshalb wird die Aufzählung
 * hier aus der Datei gelesen und gegen beide Listen geprüft.
 */
const ALLE_GRUENDE = (() => {
  const quelle = readFileSync("lib/anmeldungAnlegen.ts", "utf8");
  const block = quelle.slice(
    quelle.indexOf("export type Fehlbuchungsgrund"),
    quelle.indexOf("export const SOFORT_ERSTATTEN"),
  );
  return [...block.matchAll(/\|\s*"([a-z-]+)"/g)].map((t) => t[1]);
})();

const bund = { aktuell: alsSchluessel(randomBytes(32)), weitere: [] };
const ADRESSE = "@pruef-x.example";

async function leeren() {
  await db.participant.deleteMany({ where: { anmeldung: { kontaktEmail: { contains: ADRESSE } } } });
  await db.registration.deleteMany({ where: { kontaktEmail: { contains: ADRESSE } } });
  await db.fehlbuchung.deleteMany({ where: { sitzungId: { startsWith: "cs_pruef_x" } } });
}

const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });
const maxVorher = event.maxPersonen;
const startVorher = event.startAt;
if (startVorher === null) {
  await db.event.update({ where: { id: event.id }, data: { startAt: new Date(Date.now() + 30 * 864e5) } });
}

const nutzlast = (nr, personen = 1) => ({
  eventId: event.id,
  kontaktVorname: `Vor${nr}`,
  kontaktNachname: `Nach${nr}`,
  kontaktEmail: `person${nr}${ADRESSE}`,
  kontaktTelefon: null,
  buchungsart: "EINZEL",
  istVormundBuchung: false,
  einwilligungVormund: false,
  agbAkzeptiert: true,
  kenntnisAufnahmen: true,
  gesamtpreisCents: 700 * personen,
  agbFassungId: null,
  datenschutzFassungId: null,
  teilnehmer: Array.from({ length: personen }, (_, i) => ({
    vorname: `T${nr}-${i}`, nachname: `Nach${nr}`, typ: i === 0 ? "E" : "S",
  })),
  erstelltMs: Date.now(),
});

const zahlung = (nr, cents = 700) => ({
  sitzungId: `cs_pruef_x_${nr}`,
  zahlungId: `pi_pruef_x_${nr}`,
  bezahlterBetragCents: cents,
});

/* ══ X3.1 · Der Normalfall ═══════════════════════════════════════ */
console.log("\nX3.1 · Aus einer bezahlten Zahlung wird eine Anmeldung");
await leeren();
await db.event.update({ where: { id: event.id }, data: { maxPersonen: 100 } });

const erg = await anmeldungAusZahlung(nutzlast(1, 2), zahlung(1, 1400));
pruefe("Die Anmeldung entsteht", erg.lage === "angelegt", JSON.stringify(erg));

const angelegt = await db.registration.findUniqueOrThrow({
  where: { id: erg.anmeldungId }, include: { teilnehmer: true },
});
pruefe("… mit Status BESTAETIGT", angelegt.status === "BESTAETIGT", angelegt.status);
pruefe("… und Zahlungsstatus BEZAHLT", angelegt.zahlungsStatus === "BEZAHLT");
pruefe("… mit beiden Teilnehmern", angelegt.teilnehmer.length === 2);
pruefe("… und richtig übersetzten Typen",
  angelegt.teilnehmer.some((t) => t.typ === "ERWACHSENER") &&
    angelegt.teilnehmer.some((t) => t.typ === "SCHUELER"),
  angelegt.teilnehmer.map((t) => t.typ).join("/"));
pruefe("Die Sitzungskennung steht an der Anmeldung",
  angelegt.zahlungsReferenz === "cs_pruef_x_1");
pruefe("Die Zahlungskennung ebenfalls — ohne sie wäre keine Erstattung möglich",
  angelegt.zahlungsAbsicht === "pi_pruef_x_1");
pruefe("Der Storno-Schlüssel ist gesetzt", (angelegt.stornoSchluessel ?? "").length > 10);
/* Das Feld `reserviertBis` gibt es seit dem 26.09.2026 gar nicht
   mehr (Migration ohne_reserviert). Geprüft wird deshalb nicht mehr
   sein Wert, sondern dass es fort ist — und dass niemand es
   versehentlich wieder einführt. */
pruefe(
  "Das Feld für eine Zahlfrist existiert nicht mehr",
  !("reserviertBis" in angelegt),
  Object.keys(angelegt).filter((k) => /reserv/i.test(k)).join(", "),
);

/* ══ X3.2 · Mehrfach aufrufbar ═══════════════════════════════════ */
console.log("\nX3.2 · Dieselbe Zahlung legt nicht zweimal an");
/* Drei Wege dürfen anlegen und können sich überholen. Der zweite darf
   keinen Fehler sehen — und vor allem keine zweite Anmeldung. */
const nochmal = await anmeldungAusZahlung(nutzlast(1, 2), zahlung(1, 1400));
pruefe("Der zweite Aufruf meldet „schon da“", nochmal.lage === "schon-da", JSON.stringify(nochmal));
pruefe("… mit derselben Kennung", nochmal.anmeldungId === erg.anmeldungId);
pruefe("… und es gibt genau eine Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: { contains: ADRESSE } } })) === 1);

/* Der eigentliche Riegel ist die Datenbank, nicht die Prüfung im Code.
   Hier wird bewusst daran vorbeigegriffen. */
let indexGriff = false;
try {
  await db.registration.create({
    data: {
      eventId: event.id, kontaktVorname: "X", kontaktNachname: "Y",
      kontaktEmail: `direkt${ADRESSE}`, gesamtpreisCents: 700,
      zahlungsReferenz: "cs_pruef_x_1",
    },
  });
} catch { indexGriff = true; }
pruefe("Auch am Code vorbei weist die DATENBANK die zweite Zahlung ab", indexGriff);

/* ══ X3.3 · Kein Platz mehr ══════════════════════════════════════ */
console.log("\nX3.3 · Der Platz ist bei Zahlungseingang vergeben");
await leeren();
await db.event.update({ where: { id: event.id }, data: { maxPersonen: 1 } });
const ersteR = await anmeldungAusZahlung(nutzlast(10), zahlung(10));
pruefe("Der Erste bekommt den Platz", ersteR.lage === "angelegt");

const zweiteR = await anmeldungAusZahlung(nutzlast(11), zahlung(11));
pruefe("Der Zweite bekommt eine Fehlbuchung", zweiteR.lage === "fehlbuchung", JSON.stringify(zweiteR));
pruefe("… mit dem Grund „keine-plaetze“", zweiteR.grund === "keine-plaetze");
pruefe("… die automatisch erstattet wird", zweiteR.erstatten === true);
pruefe("Und es entsteht KEINE zweite Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: { contains: ADRESSE } } })) === 1);
pruefe("… auch kein Teilnehmer",
  (await db.participant.count({ where: { anmeldung: { kontaktEmail: `person11${ADRESSE}` } } })) === 0);

/* ══ X3.4 · Dieselbe Adresse zweimal ═════════════════════════════ */
console.log("\nX3.4 · Dieselbe Adresse hat schon eine Buchung");
await leeren();
await db.event.update({ where: { id: event.id }, data: { maxPersonen: 100 } });
await anmeldungAusZahlung(nutzlast(20), zahlung(20));
const doppelt = await anmeldungAusZahlung(nutzlast(20), zahlung(21));
pruefe("Die zweite Zahlung wird zur Fehlbuchung", doppelt.lage === "fehlbuchung", JSON.stringify(doppelt));
pruefe("… mit dem Grund „doppelte-adresse“", doppelt.grund === "doppelte-adresse");
pruefe("… und automatischer Erstattung", doppelt.erstatten === true);

console.log("\nX3.5 · Nach einer Stornierung darf dieselbe Adresse wieder");
await db.registration.updateMany({
  where: { kontaktEmail: `person20${ADRESSE}` },
  data: { status: "STORNIERT", zahlungsReferenz: null },
});
const wieder = await anmeldungAusZahlung(nutzlast(20), zahlung(22));
pruefe("Die stornierte Buchung wird ersetzt, nicht verdoppelt", wieder.lage === "angelegt");
pruefe("… und es bleibt bei EINER Zeile für diese Adresse",
  (await db.registration.count({ where: { kontaktEmail: `person20${ADRESSE}` } })) === 1);

/* ══ X3.6 · Termin entfernt ══════════════════════════════════════ */
console.log("\nX3.6 · Der Termin wurde während des Bezahlens entfernt");
await leeren();
await db.event.update({ where: { id: event.id }, data: { startAt: null } });
const ohneTermin = await anmeldungAusZahlung(nutzlast(30), zahlung(30));
pruefe("Es entsteht eine Fehlbuchung", ohneTermin.lage === "fehlbuchung", JSON.stringify(ohneTermin));
pruefe("… mit dem Grund „kein-termin“", ohneTermin.grund === "kein-termin");
pruefe("… und keine Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: { contains: ADRESSE } } })) === 0);
await db.event.update({
  where: { id: event.id },
  data: { startAt: startVorher ?? new Date(Date.now() + 30 * 864e5) },
});

/* ══ X3.7 · Die Fehlbuchung selbst ═══════════════════════════════ */
console.log("\nX3.7 · Der Beleg über eingegangenes Geld");
await leeren();
const f1 = await fehlbuchungFesthalten("cs_pruef_x_90", 1400, "keine-plaetze");
pruefe("Die Zeile entsteht", f1.schonDa === false);
const f2 = await fehlbuchungFesthalten("cs_pruef_x_90", 1400, "keine-plaetze");
pruefe("Ein zweiter Aufruf legt keine zweite an", f2.schonDa === true && f2.id === f1.id);

const zeile = await db.fehlbuchung.findUniqueOrThrow({ where: { sitzungId: "cs_pruef_x_90" } });
pruefe("Sie ist zunächst offen", zeile.erstattetAm === null && zeile.erstattungId === null);
/* Die wichtigste Eigenschaft dieser Tabelle: kein Personenbezug.
   Feld für Feld geprüft, nicht dem Schema vertraut. */
const felder = Object.keys(zeile);
pruefe("Sie enthält KEINE Personendaten — Feld für Feld geprüft",
  !felder.some((f) => /name|email|mail|telefon|teilnehmer|kontakt/i.test(f)),
  felder.join(", "));

await erstattungVermerken("cs_pruef_x_90", "re_pruef_x_90");
const nachher = await db.fehlbuchung.findUniqueOrThrow({ where: { sitzungId: "cs_pruef_x_90" } });
pruefe("Die Erstattung wird vermerkt",
  nachher.erstattetAm !== null && nachher.erstattungId === "re_pruef_x_90");

console.log("\nX3.8 · Welcher Grund erstattet von selbst, welcher nicht");
/* Entscheidung vom 25.09.2026: Ein abweichender Betrag ist entweder ein
   Fehler oder ein Angriff. Beides gehört angesehen — und solange
   unklar ist, WAS gekauft wurde, wird nichts zurückgebucht.

   Entscheidung vom 26.09.2026: `ohne-marke` dagegen schon. Dort ist
   nichts unklar: Ohne Anmeldedaten kann daraus niemals eine Anmeldung
   werden, also hat jemand für nichts bezahlt. */
pruefe("„betrag-abweichend“ steht nicht in der Sofort-Erstattungsliste",
  !SOFORT_ERSTATTEN.includes("betrag-abweichend"), SOFORT_ERSTATTEN.join(", "));
pruefe("Die vier anderen Gründe stehen darin",
  ["keine-plaetze", "doppelte-adresse", "kein-termin", "ohne-marke"]
    .every((g) => SOFORT_ERSTATTEN.includes(g)), SOFORT_ERSTATTEN.join(", "));
pruefe("Genau ein Grund wartet auf einen Menschen",
  ZUR_KLAERUNG.length === 1 && ZUR_KLAERUNG[0] === "betrag-abweichend",
  ZUR_KLAERUNG.join(", "));
pruefe("… und jeder Grund ist genau einer von beiden, keiner fällt durch",
  ALLE_GRUENDE.every(
    (g) => SOFORT_ERSTATTEN.includes(g) !== ZUR_KLAERUNG.includes(g)),
  `${SOFORT_ERSTATTEN.length} + ${ZUR_KLAERUNG.length} von ${ALLE_GRUENDE.length}`);

console.log("\nX3.8b · Eine Fehlbuchung lässt sich abhaken, ohne sie zu löschen");
await leeren();
{
  const sitzung = "cs_pruef_x_erledigt";
  await fehlbuchungFesthalten(sitzung, 1400, "betrag-abweichend");

  const ersteAbhakung = await erledigtVermerken(sitzung, "admin-pruefung", "von Hand geklärt");
  pruefe("Abhaken meldet Erfolg", ersteAbhakung === true);

  const nach = await db.fehlbuchung.findUniqueOrThrow({ where: { sitzungId: sitzung } });
  pruefe("Die Zeile ist NICHT gelöscht — Betrag und Grund stehen weiter da",
    nach.betragCents === 1400 && nach.grund === "betrag-abweichend");
  pruefe("Wer abgehakt hat und wann, ist festgehalten",
    nach.erledigtAm !== null && nach.erledigtVon === "admin-pruefung");
  pruefe("… samt Vermerk", nach.erledigtNotiz === "von Hand geklärt");
  pruefe("Abhaken erstattet NICHT — dafür ist es nicht da",
    nach.erstattetAm === null && nach.erstattungId === null);

  /* Zweimal abhaken darf den ersten Vermerk nicht überschreiben. Wer
     es getan hat und wann, ist der eigentliche Wert dieses Feldes —
     ein zweiter Klick aus einem zweiten Fenster würde sonst den
     Ersten überschreiben, der entschieden hat. */
  const zweiteAbhakung = await erledigtVermerken(sitzung, "jemand-anders", "andere Notiz");
  pruefe("Ein zweites Abhaken meldet, dass nichts mehr zu tun war",
    zweiteAbhakung === false);
  const nachZwei = await db.fehlbuchung.findUniqueOrThrow({ where: { sitzungId: sitzung } });
  pruefe("… und überschreibt den ersten Vermerk nicht",
    nachZwei.erledigtVon === "admin-pruefung" &&
      nachZwei.erledigtAm?.getTime() === nach.erledigtAm?.getTime());

  await db.fehlbuchung.delete({ where: { sitzungId: sitzung } });
}

/* ══ X3.9 · Die Fassungen aus der Nutzlast ═══════════════════════ */
console.log("\nX3.9 · Es gilt die Rechtstext-Fassung vom ABSENDEN");
await leeren();
const fassung = await db.rechtstext.create({
  data: {
    art: "AGB_B2C", version: 991, datum: new Date("2026-01-01"), gueltigAb: new Date("2026-01-01"),
    inhalt: "Fassung fuer Prüfliste X", pruefsumme: "x".repeat(64),
  },
});
const mitFassung = { ...nutzlast(40), agbFassungId: fassung.id };
const ergF = await anmeldungAusZahlung(mitFassung, zahlung(40));
const mitF = await db.registration.findUniqueOrThrow({ where: { id: ergF.anmeldungId } });
pruefe("Die mitgereiste Fassung steht an der Buchung", mitF.agbFassungId === fassung.id);

/* Die Gegenprobe: Eine inzwischen neuere Fassung darf sie NICHT
   überschreiben — sonst stünde nach einer Textänderung die falsche an
   einer alten Buchung. */
await db.rechtstext.create({
  data: {
    art: "AGB_B2C", version: 992, datum: new Date("2026-06-01"), gueltigAb: new Date("2026-06-01"),
    inhalt: "Neuere Fassung", pruefsumme: "y".repeat(64),
  },
});
const ergF2 = await anmeldungAusZahlung({ ...nutzlast(41), agbFassungId: fassung.id }, zahlung(41));
const mitF2 = await db.registration.findUniqueOrThrow({ where: { id: ergF2.anmeldungId } });
pruefe("… auch wenn inzwischen eine neuere gilt", mitF2.agbFassungId === fassung.id);

/* ══ X3.10 · Die Marke und die Anlage greifen ineinander ═════════ */
console.log("\nX3.10 · Von der Marke bis zur Anmeldung");
await leeren();
const roh = nutzlast(50, 3);
const { erstelltMs: _weg, ...ohneZeit } = roh;
const marke = verschluesseln(ohneZeit, bund);
const geoeffnet = entschluesseln(marke, bund, {
  eventId: roh.eventId, preisCents: roh.gesamtpreisCents,
});
const ergM = await anmeldungAusZahlung(geoeffnet, zahlung(50, roh.gesamtpreisCents));
pruefe("Aus einer echten Marke entsteht die Anmeldung", ergM.lage === "angelegt");
const ausMarke = await db.registration.findUniqueOrThrow({
  where: { id: ergM.anmeldungId }, include: { teilnehmer: true },
});
pruefe("… mit allen drei Teilnehmern", ausMarke.teilnehmer.length === 3);
pruefe("… und den Kontaktdaten aus der Marke",
  ausMarke.kontaktEmail === roh.kontaktEmail && ausMarke.kontaktVorname === roh.kontaktVorname);

/* ── Aufräumen ─────────────────────────────────────────────────── */
await leeren();
await db.rechtstext.deleteMany({ where: { version: { in: [991, 992] } } });
/* Den Termin NICHT auf null zurücksetzen, auch wenn er vorher null war.
   Diese Liste läuft im Sammellauf vor N und O, und die prüfen den
   Anmeldebereich der Seite. Ohne Termin zeigt der statt des
   Buchungsformulars den Hinweis „Termin steht noch nicht fest" — N
   fiel dadurch mit „Weg ‚Familienpaket' nicht gefunden" durch, und
   das sah nach einem Frontend-Fehler aus, der keiner war.
   pruefung/leeren.mjs setzt vor jeder Liste ohnehin einen Termin;
   dieselbe Lage stellen wir hier wieder her. */
await db.event.update({
  where: { id: event.id },
  data: {
    maxPersonen: maxVorher,
    startAt: startVorher ?? new Date(Date.now() + 30 * 864e5),
  },
});
pruefe("Testdaten wieder entfernt",
  (await db.registration.count({ where: { kontaktEmail: { contains: ADRESSE } } })) === 0 &&
    (await db.fehlbuchung.count({ where: { sitzungId: { startsWith: "cs_pruef_x" } } })) === 0);

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen`);
await db.$disconnect();
process.exit(fehl === 0 ? 0 : 1);
