/* ---------------------------------------------------------------
   Stornieren durch den VERANSTALTER — aus dem Adminbereich heraus.

   Warum es diese Liste gibt: Bis hierher konnte der Veranstalter im
   Adminbereich nur Vermerke umstellen. "Stornieren" aenderte den
   Status, ohne Geld zu bewegen und ohne jemanden zu benachrichtigen;
   "Erstattet" setzte ein Etikett, ohne dass ein Cent floss. Wer nach
   einem Anruf stornierte, behielt die Zahlung — und die Liste sagte
   danach "Erstattet".

   Geprueft wird deshalb dreierlei:
     1. Die reine Regel (adminStornoEntscheidung) — vor allem der
        Unterschied zur Selbstbedienung: KEINE 24-Stunden-Frist.
     2. Der vollzogene Vorgang gegen die Attrappe: Geld zurueck,
        Status gesetzt, Platz frei.
     3. Dass beide Wege denselben Kern benutzen und nicht
        auseinanderlaufen.

   Es wird kein echtes Geld bewegt — alles laeuft gegen die oertliche
   Attrappe des Anbieters.

   Voraussetzungen: Datenbank laeuft, Attrappe auf 4242, Server 3213.
   --------------------------------------------------------------- */

import { db } from "../../lib/db.ts";
import { adminStornoEntscheidung, stornoEntscheidung } from "../../lib/storno.ts";
import { stornoDurchAdmin } from "../../lib/stornoAusfuehren.ts";
import { stornoBestaetigungsMail } from "../../lib/mailVorlagen.ts";
import { sitzungPruefen } from "../../lib/zahlung.ts";
import { belegtFilter } from "../../lib/plaetze.ts";

const ATTRAPPE = "http://127.0.0.1:4242";

let gut = 0;
let schlecht = 0;

function pruefe(name, bedingung, zusatz = "") {
  if (bedingung) gut += 1;
  else schlecht += 1;
  console.log(`${bedingung ? "✓" : "✗"} ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
}

/* ═══ Teil 1: die reine Regel, ohne Datenbank ════════════════════ */

const inEinerStunde = new Date(Date.now() + 60 * 60 * 1000);
const inZehnTagen = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

const bezahlteBuchung = (startAt) => ({
  status: "BESTAETIGT",
  zahlungsStatus: "BEZAHLT",
  gesamtpreisCents: 2500,
  startAt,
});

pruefe(
  "Bezahlte Buchung: erlaubt, und es wird erstattet",
  (() => {
    const e = adminStornoEntscheidung(bezahlteBuchung(inZehnTagen));
    return e.erlaubt === true && e.erstatten === true;
  })(),
);

pruefe(
  "Unbezahlte Reservierung: erlaubt, aber ohne Erstattung",
  (() => {
    const e = adminStornoEntscheidung({
      status: "RESERVIERT",
      zahlungsStatus: "OFFEN",
      gesamtpreisCents: 2500,
      startAt: inZehnTagen,
    });
    return e.erlaubt === true && e.erstatten === false;
  })(),
);

pruefe(
  "Kostenloses Event: erlaubt, ohne Erstattung",
  (() => {
    const e = adminStornoEntscheidung({
      status: "BESTAETIGT",
      zahlungsStatus: "BEZAHLT",
      gesamtpreisCents: 0,
      startAt: inZehnTagen,
    });
    return e.erlaubt === true && e.erstatten === false;
  })(),
);

pruefe(
  "Bereits storniert: abgelehnt",
  (() => {
    const e = adminStornoEntscheidung({
      status: "STORNIERT",
      zahlungsStatus: "BEZAHLT",
      gesamtpreisCents: 2500,
      startAt: inZehnTagen,
    });
    return e.erlaubt === false && e.grund === "bereits-storniert";
  })(),
);

pruefe(
  "Bereits erstattet: erlaubt, aber KEIN zweites Mal Geld",
  (() => {
    const e = adminStornoEntscheidung({
      status: "BESTAETIGT",
      zahlungsStatus: "ERSTATTET",
      gesamtpreisCents: 2500,
      startAt: inZehnTagen,
    });
    return e.erlaubt === true && e.erstatten === false;
  })(),
  "eine doppelte Auszahlung waere der teuerste denkbare Fehler",
);

/* Der eigentliche Unterschied zur Selbstbedienung. */
pruefe(
  "Kulanz: eine Stunde vor Beginn lehnt die Selbstbedienung ab …",
  (() => {
    const e = stornoEntscheidung(bezahlteBuchung(inEinerStunde));
    return e.erlaubt === false && e.grund === "zu-spaet";
  })(),
);

pruefe(
  "… der Veranstalter darf es trotzdem, samt Erstattung",
  (() => {
    const e = adminStornoEntscheidung(bezahlteBuchung(inEinerStunde));
    return e.erlaubt === true && e.erstatten === true;
  })(),
  "die Frist schuetzt seine Planung, nicht ihn selbst",
);

pruefe(
  "Auch nach Beginn noch moeglich",
  (() => {
    const gestern = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return adminStornoEntscheidung(bezahlteBuchung(gestern)).erlaubt === true;
  })(),
);

/* ═══ Teil 2: die Mail sagt, WER storniert hat ═══════════════════ */

const mailAnmeldung = {
  id: "probe",
  kontaktVorname: "Alex",
  kontaktNachname: "Beispiel",
  kontaktEmail: "alex@pruefung.example",
  kontaktTelefon: null,
  gesamtpreisCents: 2500,
  teilnehmer: [{ vorname: "Alex", nachname: "Beispiel", typ: "ERWACHSENER" }],
};
const mailEvent = { titel: "Probe-Event", startAt: inZehnTagen, ortName: null, stadt: "Falkensee" };

const vomKunden = stornoBestaetigungsMail(mailAnmeldung, mailEvent, true);
const vomVeranstalter = stornoBestaetigungsMail(mailAnmeldung, mailEvent, true, true);

pruefe(
  "Kundenweg: Wortlaut unveraendert",
  vomKunden.betreff.startsWith("Stornierung bestätigt") &&
    vomKunden.text.includes("deine Buchung") &&
    vomKunden.text.includes("Schade, dass es diesmal nicht klappt"),
);

pruefe(
  "Veranstalterweg: sagt, dass VERA storniert hat",
  vomVeranstalter.text.includes("wir mussten deine Buchung") &&
    !vomVeranstalter.text.includes("Schade, dass es diesmal nicht klappt"),
  "eine Bestaetigung fuer etwas, das man nie veranlasst hat, liest sich wie ein Fehler",
);

pruefe(
  "Veranstalterweg: der Betreff kuendigt es an",
  vomVeranstalter.betreff.startsWith("Deine Buchung wurde storniert"),
);

pruefe(
  "Beide Wege nennen den Erstattungsbetrag",
  vomKunden.text.includes("25,00") && vomVeranstalter.text.includes("25,00"),
);

/* ═══ Teil 3: der Vorgang wirklich vollzogen ═════════════════════ */

const event = await db.event.findFirst({ where: { status: "VEROEFFENTLICHT" } });
if (!event) {
  console.error("Kein veroeffentlichtes Event vorhanden — bitte erst db:seed laufen lassen.");
  process.exit(1);
}

async function bezahlteBuchungAnlegen(email) {
  await db.registration.deleteMany({ where: { eventId: event.id, kontaktEmail: email } });

  const { sitzungErstellen } = await import("../../lib/zahlung.ts");
  const anmeldung = await db.registration.create({
    data: {
      eventId: event.id,
      kontaktVorname: "Admin",
      kontaktNachname: "Storno",
      kontaktEmail: email,
      status: "RESERVIERT",
      reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
      gesamtpreisCents: 2500,
      teilnehmer: { create: [{ vorname: "Admin", nachname: "Storno", typ: "ERWACHSENER" }] },
    },
  });

  const sitzung = await sitzungErstellen({
    anmeldungId: anmeldung.id,
    email,
    eventTitel: event.titel,
    personen: 1,
    gesamtCents: 2500,
  });
  await fetch(`${ATTRAPPE}/steuerung/bezahlt/${sitzung.id}`, { method: "POST" });
  const stand = await sitzungPruefen(sitzung.id);

  await db.registration.update({
    where: { id: anmeldung.id },
    data: {
      status: "BESTAETIGT",
      reserviertBis: null,
      zahlungsStatus: "BEZAHLT",
      zahlungsReferenz: sitzung.id,
      zahlungsAbsicht: stand.zahlungId,
      bezahlterBetragCents: 2500,
      bezahltAm: new Date(),
    },
  });
  return db.registration.findUnique({ where: { id: anmeldung.id } });
}

const belegtVorher = await db.registration.count({
  where: { eventId: event.id, ...belegtFilter(new Date()) },
});

const buchung = await bezahlteBuchungAnlegen("admin-storno@pruefung.example");

const belegtMitBuchung = await db.registration.count({
  where: { eventId: event.id, ...belegtFilter(new Date()) },
});
pruefe(
  "Die bezahlte Buchung belegt einen Platz",
  belegtMitBuchung === belegtVorher + 1,
  `${belegtVorher} → ${belegtMitBuchung}`,
);

const ergebnis = await stornoDurchAdmin(buchung.id);

pruefe("Der Vorgang meldet Erfolg", ergebnis.erfolg === true);
pruefe("… und dass erstattet wurde", ergebnis.erfolg === true && ergebnis.erstattet === true);
pruefe(
  "… ueber den vollen Betrag",
  ergebnis.erfolg === true && ergebnis.betragCents === 2500,
  ergebnis.erfolg === true ? `${ergebnis.betragCents} Cent` : "",
);

const nachher = await db.registration.findUnique({ where: { id: buchung.id } });

pruefe("Die Buchung steht auf STORNIERT", nachher.status === "STORNIERT", nachher.status);
pruefe(
  "Der Zahlungsstatus steht auf ERSTATTET",
  nachher.zahlungsStatus === "ERSTATTET",
  nachher.zahlungsStatus,
);
pruefe("Der Stornozeitpunkt ist festgehalten", nachher.storniertAm !== null);
pruefe("Die Reservierung ist beendet", nachher.reserviertBis === null);

const belegtNachher = await db.registration.count({
  where: { eventId: event.id, ...belegtFilter(new Date()) },
});
pruefe(
  "Der Platz ist wieder frei",
  belegtNachher === belegtVorher,
  `${belegtMitBuchung} → ${belegtNachher}`,
);

/* Der Anbieter muss die Erstattung wirklich gesehen haben — nicht nur
   die Datenbank. Sonst pruefte diese Liste nur sich selbst. */
const beimAnbieter = await fetch(`${ATTRAPPE}/steuerung/erstattungen`).then((r) => r.json());
pruefe(
  "Der Anbieter hat eine Erstattung zu dieser Zahlung verzeichnet",
  Array.isArray(beimAnbieter) &&
    beimAnbieter.some((e) => e.payment_intent === buchung.zahlungsAbsicht),
  `${Array.isArray(beimAnbieter) ? beimAnbieter.length : "?"} verzeichnet`,
);

/* Zweiter Versuch auf dieselbe Buchung. */
const nochmal = await stornoDurchAdmin(buchung.id);
pruefe(
  "Ein zweiter Versuch wird abgelehnt",
  nochmal.erfolg === false && nochmal.fehler === "bereits-storniert",
  nochmal.erfolg === false ? nochmal.fehler : "faelschlich erfolgreich",
);

const nachZweitem = await db.registration.findUnique({ where: { id: buchung.id } });
pruefe(
  "… und bewegt kein zweites Mal Geld",
  nachZweitem.zahlungsStatus === "ERSTATTET",
);

/* Unbezahlte Buchung: stornieren ohne Erstattung. */
await db.registration.deleteMany({
  where: { eventId: event.id, kontaktEmail: "admin-storno-offen@pruefung.example" },
});
const offene = await db.registration.create({
  data: {
    eventId: event.id,
    kontaktVorname: "Admin",
    kontaktNachname: "Offen",
    kontaktEmail: "admin-storno-offen@pruefung.example",
    status: "RESERVIERT",
    reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
    gesamtpreisCents: 2500,
    teilnehmer: { create: [{ vorname: "Admin", nachname: "Offen", typ: "ERWACHSENER" }] },
  },
});

const ohneGeld = await stornoDurchAdmin(offene.id);
pruefe(
  "Unbezahlte Buchung: storniert, aber nichts erstattet",
  ohneGeld.erfolg === true && ohneGeld.erstattet === false,
);

pruefe(
  "Eine unbekannte Nummer wird abgelehnt",
  (await stornoDurchAdmin("gibt-es-nicht")).erfolg === false,
);

/* ── Aufraeumen ─────────────────────────────────────────────────── */

await db.registration.deleteMany({
  where: {
    eventId: event.id,
    kontaktEmail: { in: ["admin-storno@pruefung.example", "admin-storno-offen@pruefung.example"] },
  },
});
const belegtZumSchluss = await db.registration.count({
  where: { eventId: event.id, ...belegtFilter(new Date()) },
});
console.log(`\nTestbuchungen entfernt. Verbleibend belegt: ${belegtZumSchluss}`);

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
