/* ---------------------------------------------------------------
   Prüfliste S, neuer Teil — Erfassungswege für K3 und K5.

   Bis zum 22.09.2026 konnte niemand einen Zustimmungsnachweis (K3)
   oder eine Checkliste (K5) im Adminbereich ANLEGEN — der Löschlauf
   konnte fällige Datensätze löschen bzw. anonymisieren, aber der Weg
   davor fehlte (docs/loeschkonzept-betrieb.md, "Was bewusst offen
   bleibt"). Diese Liste prüft die neuen Seiten
   /admin/zustimmungsnachweise und /admin/checklisten:

     · Zugriffsschutz — dieselbe Härte wie bei jeder anderen
       Admin-Aktion (s-zugang.mjs): ohne Sitzung und mit erfundenem
       Cookie darf NICHTS gespeichert werden.
     · Mit gültiger Sitzung funktioniert das Anlegen wirklich, und
       faelligAm wird serverseitig aus dem Veranstaltungstermin
       berechnet, nicht aus einem Formularfeld übernommen.
     · Terminverschiebung: Ändert sich der Termin eines Events NACH
       dem Anlegen einer Checkliste, muss faelligkeitenAuffrischen()
       (lib/loeschlauf.ts) die Frist in BEIDE Richtungen nachziehen —
       eine verschobene Veranstaltung darf weder zu früh gelöscht noch
       fälschlich für immer geschützt werden. Das ist die in Punkt 9
       der Nutzeranweisung vom 22.09.2026 ausdrücklich verlangte
       Nachführung.
     · Der reduzierte Zustimmungsnachweis (K3) bekommt bewusst KEINE
       solche Nachführung: veranstaltungAm wird beim Anlegen wie ein
       eingefrorener Preis übernommen (genau wie totalPriceCents bei
       einer Anmeldung) und ändert sich nicht rückwirkend. Punkt 7 der
       Anweisung verlangt das anders als Punkt 9 auch nicht.

   Braucht einen laufenden Server auf Port 3213 (siehe docs/pruefen.md).
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { actionFelder, anmelden, hole, sende } from "../H/admin-senden.mjs";
import { db } from "../../lib/db.js";
import { faelligkeitenAuffrischen } from "../../lib/loeschlauf.js";
import { faelligCheckliste, faelligZustimmungsnachweis } from "../../lib/loeschfristen.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

const GEFAELSCHT = "vera_admin=voellig-ausgedacht-aber-lang-genug-xxxxxxxxxxxxxxx";

async function leeren() {
  const proben = await db.event.findMany({
    where: { slug: { startsWith: "s-probe-k3k5" } },
    select: { id: true },
  });
  for (const p of proben) {
    await db.checkliste.deleteMany({ where: { eventId: p.id } });
    await db.zustimmungsnachweis.deleteMany({ where: { eventId: p.id } });
    await db.event.delete({ where: { id: p.id } });
  }
}

await leeren();

/* ── Ausgangslage: ein Event mit festem, künftigem Termin ────────── */

const TERMIN_A = new Date("2030-06-15T12:00:00Z");

const event = await db.event.create({
  data: {
    slug: "s-probe-k3k5-erfassung",
    titel: "S-Probe K3/K5 Erfassung",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "S-Probe",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: TERMIN_A,
    endAt: TERMIN_A,
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "VEROEFFENTLICHT",
  },
});

const sitzung = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
if (!sitzung.cookie) throw new Error("Anmeldung fehlgeschlagen — läuft der Server auf 3213?");

console.log("── K3: Zugriffsschutz ──\n");

const ohneSitzung = await hole("/admin/zustimmungsnachweise", null);
pruefe(
  "/admin/zustimmungsnachweise ohne Sitzung → Weiterleitung zur Anmeldung",
  ohneSitzung.status >= 300 && ohneSitzung.status < 400 &&
    (ohneSitzung.ziel ?? "").includes("/admin/login"),
);

const k3Seite = await hole("/admin/zustimmungsnachweise", sitzung.cookie);
pruefe("Angemeldet ist /admin/zustimmungsnachweise erreichbar", k3Seite.status === 200);
pruefe("/admin/zustimmungsnachweise trägt noindex", /noindex/i.test(k3Seite.html));

const k3Felder = actionFelder(k3Seite.html, 'name="eventId"');

const k3VorherAnzahl = await db.zustimmungsnachweis.count({ where: { eventId: event.id } });

await sende(
  "/admin/zustimmungsnachweise",
  k3Felder,
  { eventId: event.id, teilnehmerName: "EINGESCHLEUST ohne Sitzung", zustimmungLagVor: "an" },
  null,
);
pruefe(
  "K3 anlegen ohne Sitzung: nichts gespeichert",
  (await db.zustimmungsnachweis.count({ where: { eventId: event.id } })) === k3VorherAnzahl,
);

await sende(
  "/admin/zustimmungsnachweise",
  k3Felder,
  { eventId: event.id, teilnehmerName: "EINGESCHLEUST mit Fake-Cookie", zustimmungLagVor: "an" },
  GEFAELSCHT,
);
pruefe(
  "K3 anlegen mit erfundenem Cookie: nichts gespeichert",
  (await db.zustimmungsnachweis.count({ where: { eventId: event.id } })) === k3VorherAnzahl,
);

console.log("\n── K3: mit Sitzung wirklich anlegen ──\n");

await sende(
  "/admin/zustimmungsnachweise",
  k3Felder,
  {
    eventId: event.id,
    teilnehmerName: "S-Probe Teilnehmer",
    zustimmungLagVor: "an",
    /* Bewusst mitgeschickt, obwohl es das Feld nicht mehr gibt: Ein
       Formularwert, den der Server nicht kennt, darf nichts bewirken
       und erst recht keinen Fehler auslösen. */
    selbstVerlassenGestattet: "an",
  },
  sitzung.cookie,
);
const k3Angelegt = await db.zustimmungsnachweis.findFirst({
  where: { eventId: event.id, teilnehmerName: "S-Probe Teilnehmer" },
});
pruefe("K3 mit Sitzung angelegt: Datensatz existiert", k3Angelegt !== null);
pruefe("K3: Häkchen korrekt übernommen", k3Angelegt?.zustimmungLagVor === true);
pruefe(
  "K3: das Feld „selbstständiges Verlassen gestattet“ gibt es nicht mehr",
  k3Angelegt !== null && !("selbstVerlassenGestattet" in k3Angelegt),
  "Minderjährige dürfen ausnahmslos selbstständig gehen",
);
pruefe(
  "K3: faelligAm serverseitig aus dem Veranstaltungstermin berechnet, nicht erfunden",
  k3Angelegt !== null &&
    k3Angelegt.faelligAm.getTime() === faelligZustimmungsnachweis(TERMIN_A).getTime(),
);
pruefe(
  "K3: KEIN Geburtsdatum, KEINE Mobilnummer, KEINE Gesundheitsangaben im Modell",
  k3Angelegt !== null &&
    !("geburtsdatum" in k3Angelegt) &&
    !("mobilnummer" in k3Angelegt) &&
    !("gesundheitsangaben" in k3Angelegt),
);

console.log("\n── K5: Zugriffsschutz ──\n");

const k5OhneSitzung = await hole("/admin/checklisten", null);
pruefe(
  "/admin/checklisten ohne Sitzung → Weiterleitung zur Anmeldung",
  k5OhneSitzung.status >= 300 && k5OhneSitzung.status < 400 &&
    (k5OhneSitzung.ziel ?? "").includes("/admin/login"),
);

const k5Seite = await hole("/admin/checklisten", sitzung.cookie);
pruefe("Angemeldet ist /admin/checklisten erreichbar", k5Seite.status === 200);
pruefe("/admin/checklisten trägt noindex", /noindex/i.test(k5Seite.html));

const k5Felder = actionFelder(k5Seite.html, 'name="eventId"');

const k5VorherAnzahl = await db.checkliste.count({ where: { eventId: event.id } });

await sende(
  "/admin/checklisten",
  k5Felder,
  { eventId: event.id, einweisungKuerzel: "XX", notiz: "EINGESCHLEUST" },
  null,
);
pruefe(
  "K5 anlegen ohne Sitzung: nichts gespeichert",
  (await db.checkliste.count({ where: { eventId: event.id } })) === k5VorherAnzahl,
);

await sende(
  "/admin/checklisten",
  k5Felder,
  { eventId: event.id, einweisungKuerzel: "XX", notiz: "EINGESCHLEUST" },
  GEFAELSCHT,
);
pruefe(
  "K5 anlegen mit erfundenem Cookie: nichts gespeichert",
  (await db.checkliste.count({ where: { eventId: event.id } })) === k5VorherAnzahl,
);

console.log("\n── K5: mit Sitzung wirklich anlegen ──\n");

await sende(
  "/admin/checklisten",
  k5Felder,
  {
    eventId: event.id,
    einweisungKuerzel: "AL",
    notiz: "S-Probe Sicherheitsprüfung",
    einweisungErfolgt: "an",
    teilnehmerAnzahl: "12",
  },
  sitzung.cookie,
);
const k5Angelegt = await db.checkliste.findFirst({
  where: { eventId: event.id, einweisungKuerzel: "AL" },
});
pruefe("K5 mit Sitzung angelegt: Datensatz existiert", k5Angelegt !== null);
pruefe(
  "K5: Einweisung/Teilnehmerzahl korrekt übernommen",
  k5Angelegt?.einweisungErfolgt === true && k5Angelegt?.teilnehmerAnzahl === 12,
);
pruefe(
  "K5: faelligAm serverseitig aus dem Veranstaltungstermin berechnet",
  k5Angelegt !== null && k5Angelegt.faelligAm.getTime() === faelligCheckliste(TERMIN_A).getTime(),
);

console.log("\n── K5: Bearbeiten, Zugriffsschutz und Wirkung ──\n");

const k5SeiteMitZeile = await hole("/admin/checklisten", sitzung.cookie);
const k5BearbeitenFelder = actionFelder(k5SeiteMitZeile.html, 'name="checklisteId"');

await sende(
  "/admin/checklisten",
  k5BearbeitenFelder,
  { checklisteId: k5Angelegt.id, einweisungKuerzel: "EINGESCHLEUST", einweisungErfolgt: "an" },
  null,
);
const k5NachFremdversuch = await db.checkliste.findUnique({ where: { id: k5Angelegt.id } });
pruefe(
  "K5 bearbeiten ohne Sitzung: unverändert",
  k5NachFremdversuch?.einweisungKuerzel === "AL",
);

await sende(
  "/admin/checklisten",
  k5BearbeitenFelder,
  { checklisteId: k5Angelegt.id, einweisungKuerzel: "BL", einweisungErfolgt: "an" },
  sitzung.cookie,
);
const k5NachBearbeitung = await db.checkliste.findUnique({ where: { id: k5Angelegt.id } });
pruefe(
  "K5 mit Sitzung bearbeitet: neues Kürzel gespeichert",
  k5NachBearbeitung?.einweisungKuerzel === "BL",
);

/* ── Terminverschiebung: faelligAm muss in BEIDE Richtungen mitwandern ── */

console.log("\n── K5: Terminverschiebung ──\n");

const TERMIN_SPAETER = new Date("2033-09-01T12:00:00Z");
await db.event.update({ where: { id: event.id }, data: { startAt: TERMIN_SPAETER, endAt: TERMIN_SPAETER } });
await faelligkeitenAuffrischen();

const k5NachVerschiebungSpaeter = await db.checkliste.findUnique({ where: { id: k5Angelegt.id } });
pruefe(
  "Termin nach hinten verschoben: faelligAm zieht auf den neuen Termin nach",
  k5NachVerschiebungSpaeter?.faelligAm.getTime() === faelligCheckliste(TERMIN_SPAETER).getTime(),
  "schützt vor zu früher Löschung",
);

const LAENGST_VORBEI = new Date("2015-06-15T12:00:00Z");
await db.event.update({ where: { id: event.id }, data: { startAt: LAENGST_VORBEI, endAt: LAENGST_VORBEI } });
await faelligkeitenAuffrischen();

const k5NachVerschiebungFrueher = await db.checkliste.findUnique({ where: { id: k5Angelegt.id } });
pruefe(
  "Termin weit nach vorn verschoben: faelligAm zieht ebenso nach und liegt jetzt in der Vergangenheit",
  k5NachVerschiebungFrueher?.faelligAm.getTime() === faelligCheckliste(LAENGST_VORBEI).getTime() &&
    k5NachVerschiebungFrueher.faelligAm.getTime() < Date.now(),
  "wird dadurch fällig",
);

pruefe(
  "K3 bekommt bewusst KEINE Terminnachführung — veranstaltungAm bleibt wie eingefroren",
  k3Angelegt !== null &&
    (await db.zustimmungsnachweis.findUnique({ where: { id: k3Angelegt.id } }))
      .veranstaltungAm.getTime() === TERMIN_A.getTime(),
);

/* ── Aufräumen ────────────────────────────────────────────────── */

await leeren();

console.log(
  schief.length === 0
    ? `\n${n} von ${n} in Ordnung. Testdaten entfernt.`
    : `\n${schief.length} von ${n} fehlgeschlagen:\n${schief.join("\n")}`,
);
await db.$disconnect();
process.exit(schief.length === 0 ? 0 : 1);
