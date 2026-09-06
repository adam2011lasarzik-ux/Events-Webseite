/* ---------------------------------------------------------------
   Die Selbstbedienungs-Stornierung von Ende zu Ende.

   Gegen die Attrappe, niemals gegen den echten Anbieter — es wird
   kein echtes Geld bewegt.

   Voraussetzungen: Datenbank läuft, Attrappe auf 4242, Server auf 3213.
   --------------------------------------------------------------- */

import { db } from "../../lib/db.ts";
import { sitzungErstellen, sitzungPruefen } from "../../lib/zahlung.ts";
import { neuerStornoSchluessel } from "../../lib/storno.ts";
import { stornoansichtFuer, stornoAusfuehren } from "../../lib/stornoAusfuehren.ts";
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

const event = await db.event.findFirst({ where: { status: "VEROEFFENTLICHT" } });
if (!event) {
  console.error("Kein veröffentlichtes Event vorhanden.");
  process.exit(1);
}

const emails = [];

/** Eine Buchung anlegen, wahlweise bezahlt und mit gewünschtem Termin. */
async function buchung({ email, bezahlen = true, startAt = undefined, personen = 1 }) {
  emails.push(email);
  await db.registration.deleteMany({ where: { eventId: event.id, kontaktEmail: email } });

  const schluessel = neuerStornoSchluessel();
  const anmeldung = await db.registration.create({
    data: {
      eventId: event.id,
      kontaktVorname: "Storno",
      kontaktNachname: "Ablauf",
      kontaktEmail: email,
      status: "RESERVIERT",
      reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
      gesamtpreisCents: 2500 * personen,
      stornoSchluessel: schluessel,
      teilnehmer: {
        create: Array.from({ length: personen }, (_, i) => ({
          vorname: `Person${i + 1}`,
          nachname: "Ablauf",
          typ: "ERWACHSENER",
        })),
      },
    },
  });

  if (bezahlen) {
    const sitzung = await sitzungErstellen({
      anmeldungId: anmeldung.id,
      email,
      eventTitel: event.titel,
      personen,
      gesamtCents: 2500 * personen,
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
        bezahlterBetragCents: 2500 * personen,
        bezahltAm: new Date(),
      },
    });
  }

  if (startAt !== undefined) {
    await db.event.update({ where: { id: event.id }, data: { startAt } });
  }
  return { id: anmeldung.id, schluessel };
}

const belegteJetzt = async () => {
  const zeilen = await db.registration.findMany({
    where: { eventId: event.id, ...belegtFilter(new Date()) },
    select: { _count: { select: { teilnehmer: true } } },
  });
  return zeilen.reduce((s, z) => s + z._count.teilnehmer, 0);
};

const urspruenglicherTermin = event.startAt;

/* ── 1. Der Schlüssel als Zugangsnachweis ───────────────────────── */

const a = await buchung({ email: "ablauf-eins@pruefung.example", startAt: null });

pruefe(
  "Mit richtigem Schlüssel wird die Buchung angezeigt",
  (await stornoansichtFuer(a.id, a.schluessel)) !== null,
);
pruefe(
  "Mit FALSCHEM Schlüssel nicht",
  (await stornoansichtFuer(a.id, neuerStornoSchluessel())) === null,
);
pruefe("Ohne Schlüssel nicht", (await stornoansichtFuer(a.id, "")) === null);
pruefe(
  "Die Anmeldenummer allein genügt NICHT",
  (await stornoansichtFuer(a.id, a.id)) === null,
);
pruefe(
  "Unbekannte Nummer mit gültig aussehendem Schlüssel: nichts",
  (await stornoansichtFuer("gibt-es-nicht", a.schluessel)) === null,
);

/* ── 2. Der Seitenaufruf allein storniert NICHTS ────────────────── */

const vorAufruf = await db.registration.findUnique({ where: { id: a.id } });
const antwort = await fetch(
  `${SERVER}/anmeldung/stornieren?nr=${a.id}&schluessel=${encodeURIComponent(a.schluessel)}`,
);
const seite = await antwort.text();
const nachAufruf = await db.registration.findUnique({ where: { id: a.id } });

pruefe("Die Storno-Seite ist erreichbar", antwort.status === 200, `Status ${antwort.status}`);
pruefe(
  "Der blosse Aufruf ändert den Status NICHT",
  nachAufruf.status === vorAufruf.status && nachAufruf.status !== "STORNIERT",
  nachAufruf.status,
);
pruefe("Die Seite zeigt einen Knopf, keinen Storno-Link", seite.includes("<form"));
pruefe(
  "Die Seite trägt noindex",
  /noindex/i.test(seite),
);

/* ── 3. Stornieren mit Erstattung ───────────────────────────────── */

const belegtVorher = await belegteJetzt();
const e1 = await stornoAusfuehren(a.id, a.schluessel);
pruefe("Stornieren gelingt", e1.erfolg === true);
pruefe("… mit Erstattung", e1.erfolg && e1.erstattet === true);

const aNach = await db.registration.findUnique({ where: { id: a.id } });
pruefe("Die Buchung ist storniert", aNach.status === "STORNIERT", aNach.status);
pruefe("… und als erstattet vermerkt", aNach.zahlungsStatus === "ERSTATTET", aNach.zahlungsStatus);
pruefe("… mit Zeitpunkt", aNach.storniertAm !== null);
pruefe(
  "Der Platz ist sofort wieder frei",
  (await belegteJetzt()) === belegtVorher - 1,
  `vorher ${belegtVorher}, jetzt ${await belegteJetzt()}`,
);

/* ── 4. Kein zweites Mal ────────────────────────────────────────── */

const e2 = await stornoAusfuehren(a.id, a.schluessel);
pruefe(
  "Ein zweiter Versuch wird abgelehnt",
  !e2.erfolg && e2.fehler === "bereits-storniert",
  e2.erfolg ? "erfolgreich" : e2.fehler,
);

/* ── 5. Die 24-Stunden-Grenze am echten Ablauf ───────────────────── */

const b = await buchung({
  email: "ablauf-zwei@pruefung.example",
  startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // in 2 Stunden
});
const e3 = await stornoAusfuehren(b.id, b.schluessel);
pruefe(
  "Zwei Stunden vor Beginn: abgelehnt",
  !e3.erfolg && e3.fehler === "zu-spaet",
  e3.erfolg ? "erfolgreich" : e3.fehler,
);
const bNach = await db.registration.findUnique({ where: { id: b.id } });
pruefe("… und die Buchung bleibt unangetastet", bNach.status === "BESTAETIGT", bNach.status);
pruefe("… das Geld bleibt gezahlt", bNach.zahlungsStatus === "BEZAHLT", bNach.zahlungsStatus);

await db.event.update({
  where: { id: event.id },
  data: { startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) }, // in 10 Tagen
});
const e4 = await stornoAusfuehren(b.id, b.schluessel);
pruefe("Zehn Tage vor Beginn: erlaubt", e4.erfolg === true, e4.erfolg ? "" : e4.fehler);

/* ── 6. Unbezahlte Buchung: stornieren ohne Erstattung ──────────── */

const c = await buchung({ email: "ablauf-drei@pruefung.example", bezahlen: false });
const e5 = await stornoAusfuehren(c.id, c.schluessel);
pruefe("Unbezahlte Buchung lässt sich stornieren", e5.erfolg === true);
pruefe("… ohne Erstattung", e5.erfolg && e5.erstattet === false);

/* ── 7. Gruppenbuchung gibt ALLE Plätze frei ────────────────────── */

const d = await buchung({ email: "ablauf-vier@pruefung.example", personen: 4 });
const belegtMitGruppe = await belegteJetzt();
await stornoAusfuehren(d.id, d.schluessel);
pruefe(
  "Eine Vierergruppe gibt vier Plätze frei",
  (await belegteJetzt()) === belegtMitGruppe - 4,
  `${belegtMitGruppe} → ${await belegteJetzt()}`,
);

/* ── 8. Fremder Schlüssel storniert nicht ───────────────────────── */

const f = await buchung({ email: "ablauf-fuenf@pruefung.example" });
const e6 = await stornoAusfuehren(f.id, neuerStornoSchluessel());
pruefe(
  "Mit fremdem Schlüssel wird NICHT storniert",
  !e6.erfolg && e6.fehler === "unbekannt",
  e6.erfolg ? "erfolgreich" : e6.fehler,
);
const fNach = await db.registration.findUnique({ where: { id: f.id } });
pruefe("… die Buchung bleibt bestätigt", fNach.status === "BESTAETIGT", fNach.status);

/* ── Aufräumen ──────────────────────────────────────────────────── */

await db.registration.deleteMany({ where: { kontaktEmail: { in: emails } } });
await db.event.update({ where: { id: event.id }, data: { startAt: urspruenglicherTermin } });
console.log(`\nTestbuchungen entfernt, Termin zurückgesetzt. Belegt: ${await belegteJetzt()}`);

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
