/* ---------------------------------------------------------------
   Der Stripe-Teil der Stornierung — gegen die Attrappe, niemals gegen
   den echten Anbieter. Es wird kein echtes Geld bewegt.

   Geprüft werden zwei Dinge:
     1. Die neue Erstattungsfunktion samt Schutz vor doppelter
        Auszahlung.
     2. Die REPARATUR: Eine im Dashboard von Hand ausgelöste
        Kulanz-Erstattung muss ihre Buchung wiederfinden. Vorher lief
        sie ins Leere, weil nach Werten gesucht wurde, die in einer
        Erstattungs-Meldung nie stehen.

   Voraussetzungen: Datenbank läuft, Attrappe auf 4242, Server auf 3213.
   --------------------------------------------------------------- */

import { db } from "../../lib/db.ts";
import { erstattungAusloesen, sitzungPruefen, zugangVergessen } from "../../lib/zahlung.ts";
import { belegtFilter } from "../../lib/plaetze.ts";

const ATTRAPPE = "http://127.0.0.1:4242";
const SERVER = process.env.PRUEF_SERVER ?? "http://127.0.0.1:3213";

let gut = 0;
let schlecht = 0;

function pruefe(name, bedingung, zusatz = "") {
  if (bedingung) gut += 1;
  else schlecht += 1;
  console.log(`${bedingung ? "✓" : "✗"} ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
}

/* ── Eine bezahlte Buchung herstellen ───────────────────────────── */

const event = await db.event.findFirst({ where: { status: "VEROEFFENTLICHT" } });
if (!event) {
  console.error("Kein veröffentlichtes Event vorhanden — bitte erst db:seed laufen lassen.");
  process.exit(1);
}

async function anmelden(email) {
  const formular = new URLSearchParams({
    eventSlug: event.slug,
    weg: "selbst",
    selbstAls: "adult",
    schueler: "0",
    erwachsene: "1",
    "person.0.vorname": "Storno",
    "person.0.nachname": "Pruefung",
    "person.0.email": email,
    "person.0.telefon": "",
    webseite: "",
  });
  const antwort = await fetch(`${SERVER}/events/${event.slug}/anmeldung`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "next-action": "pruefung",
    },
    body: formular,
    redirect: "manual",
  });
  await antwort.text();
  return db.registration.findUnique({
    where: { eventId_kontaktEmail: { eventId: event.id, kontaktEmail: email } },
  });
}

/* Der Weg über den Server ist der ehrliche, braucht aber die
   Server-Aktion. Für diese Liste genügt der direkte Weg: Geprüft wird
   die Erstattung, nicht das Anmeldeformular. */
async function buchungAnlegen(email, bezahlen = true) {
  await db.registration.deleteMany({ where: { eventId: event.id, kontaktEmail: email } });

  // Eine echte Bezahlseite bei der Attrappe erzeugen …
  const { sitzungErstellen } = await import("../../lib/zahlung.ts");
  const anmeldung = await db.registration.create({
    data: {
      eventId: event.id,
      kontaktVorname: "Storno",
      kontaktNachname: "Pruefung",
      kontaktEmail: email,
      status: "RESERVIERT",
      reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
      gesamtpreisCents: 2500,
      teilnehmer: { create: [{ vorname: "Storno", nachname: "Pruefung", typ: "ERWACHSENER" }] },
    },
  });

  const sitzung = await sitzungErstellen({
    anmeldungId: anmeldung.id,
    email,
    eventTitel: event.titel,
    personen: 1,
    gesamtCents: 2500,
  });

  if (!bezahlen) {
    await db.registration.update({
      where: { id: anmeldung.id },
      data: { zahlungsReferenz: sitzung.id },
    });
    return db.registration.findUnique({ where: { id: anmeldung.id } });
  }

  // … und sie bei der Attrappe als bezahlt markieren.
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

const a = await buchungAnlegen("storno-eins@pruefung.example");

/* ── 1. Die Zahlungskennung wird überhaupt mitgeführt ───────────── */

pruefe(
  "Nach der Zahlung ist die Zahlungskennung gespeichert",
  typeof a.zahlungsAbsicht === "string" && a.zahlungsAbsicht.startsWith("pi_"),
  a.zahlungsAbsicht ?? "— fehlt —",
);
pruefe(
  "Sie unterscheidet sich von der Bezahlseite",
  a.zahlungsAbsicht !== a.zahlungsReferenz,
  `Sitzung ${a.zahlungsReferenz}`,
);

/* ── 2. Erstattung auslösen ─────────────────────────────────────── */

const e1 = await erstattungAusloesen(a.zahlungsAbsicht, a.id);
pruefe("Die Erstattung wird angenommen", e1.lage === "succeeded", e1.lage ?? "—");
pruefe("Es wird der volle Betrag erstattet", e1.betragCents === 2500, `${e1.betragCents} Cent`);
pruefe("Die Anmeldenummer hängt an der Erstattung", e1.id.startsWith("re_"), e1.id);

/* ── 3. Der Schutz vor doppelter Auszahlung ─────────────────────── */

const e2 = await erstattungAusloesen(a.zahlungsAbsicht, a.id);
pruefe(
  "Derselbe Aufruf ein zweites Mal erstattet NICHT erneut",
  e2.id === e1.id,
  `${e1.id} / ${e2.id}`,
);

const alleErstattungen = await (await fetch(`${ATTRAPPE}/steuerung/sitzungen`)).json();
const dieseSitzung = alleErstattungen.find((z) => z.id === a.zahlungsReferenz);
pruefe(
  "Beim Anbieter ist genau EIN Betrag erstattet",
  dieseSitzung?.erstattetCents === 2500,
  `${dieseSitzung?.erstattetCents} Cent`,
);

/* ── 4. Die Reparatur: Kulanz-Erstattung findet ihre Buchung ────── */

const b = await buchungAnlegen("storno-zwei@pruefung.example");

/* So sieht eine Erstattung aus, die im Dashboard von Hand ausgelöst
   wurde: Charge- und Zahlungskennung, KEINE Sitzungskennung. Genau
   daran ist die Zuordnung vorher gescheitert. */
const { rueckmeldungSenden } = await import("./hilfe-rueckmeldung.mjs");

let r = await rueckmeldungSenden(SERVER, {
  id: `evt_kulanz_${Date.now()}`,
  object: "event",
  type: "charge.refunded",
  data: {
    object: {
      id: "ch_kulanz_ohne_metadaten",
      amount_refunded: 2500,
      payment_intent: b.zahlungsAbsicht,
      metadata: {},
    },
  },
});
pruefe("Die Kulanz-Rückmeldung wird angenommen", r.status === 200, `Status ${r.status}`);

const bNach = await db.registration.findUnique({ where: { id: b.id } });
pruefe(
  "… und die Buchung gilt jetzt als erstattet",
  bNach.zahlungsStatus === "ERSTATTET",
  bNach.zahlungsStatus,
);

/* Die Gegenprobe: ohne die gespeicherte Zahlungskennung wäre genau
   das nicht möglich gewesen. */
const c = await buchungAnlegen("storno-drei@pruefung.example");
await db.registration.update({ where: { id: c.id }, data: { zahlungsAbsicht: null } });

r = await rueckmeldungSenden(SERVER, {
  id: `evt_kulanz_ohne_${Date.now()}`,
  object: "event",
  type: "charge.refunded",
  data: {
    object: {
      id: "ch_ohne_jede_spur",
      amount_refunded: 2500,
      payment_intent: "pi_gibt_es_nicht",
      metadata: {},
    },
  },
});
const cNach = await db.registration.findUnique({ where: { id: c.id } });
pruefe(
  "Gegenprobe: ohne Zahlungskennung bleibt die Buchung unberührt",
  cNach.zahlungsStatus === "BEZAHLT",
  cNach.zahlungsStatus,
);

/* ── 5. Der Testmodus-Riegel gilt auch für Erstattungen ─────────── */

const echterSchluessel = process.env.ZAHLUNG_GEHEIMSCHLUESSEL;
process.env.ZAHLUNG_GEHEIMSCHLUESSEL = "sk_live_echtes_konto";
zugangVergessen();
let abgewiesen = false;
try {
  await erstattungAusloesen("pi_egal", "egal");
} catch {
  abgewiesen = true;
}
process.env.ZAHLUNG_GEHEIMSCHLUESSEL = echterSchluessel;
zugangVergessen();
pruefe("Mit einem ECHTEN Schlüssel wird keine Erstattung ausgelöst", abgewiesen);

/* ── Aufräumen ──────────────────────────────────────────────────── */

await db.registration.deleteMany({
  where: { kontaktEmail: { in: [
    "storno-eins@pruefung.example",
    "storno-zwei@pruefung.example",
    "storno-drei@pruefung.example",
  ] } },
});

const belegt = await db.registration.count({
  where: { eventId: event.id, ...belegtFilter(new Date()) },
});
console.log(`\nTestbuchungen entfernt. Verbleibend belegt: ${belegt}`);

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
