/* ---------------------------------------------------------------
   Prüfliste S, Teil 2 — der Löschlauf gegen die echte Datenbank.

   Geprüft wird jede Löschklasse und jede Sperrsituation an echten
   Datensätzen, nicht an nachgebauter Logik:

     · Probelauf verändert NICHTS
     · K3 wird gelöscht, K4 und K5 anonymisiert, K6 gelöscht
     · steuerrelevante Felder bleiben Zeichen für Zeichen erhalten
     · jeder der fünf Sperrgründe hält den Datensatz fest
     · automatische Sperren entstehen bei Erstattung und offenem Vorfall
     · das Protokoll enthält keine Namen und keine E-Mail-Adressen
     · ein zweiter Lauf über dieselben Daten tut nichts mehr
     · K8 (Aufnahmewiderspruch/Prüfvermerk): ohne "Aufnahmen offline"
       keine Fälligkeit, mit Fälligkeit + Sperre kein Löschen, erst
       nach dem Aufheben der Sperre wird wirklich gelöscht

   Der Lauf legt seine eigenen Daten an und räumt sie danach weg.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { db } from "../../lib/db.js";
import { loeschlauf } from "../../lib/loeschlauf.js";
import { STEUERRELEVANTE_FELDER } from "../../lib/anonymisieren.js";
import { faelligAufnahmewiderspruch } from "../../lib/loeschfristen.js";

let nummer = 0;
const fehlgeschlagen = [];

function pruefe(titel, bedingung, hinweis = "") {
  nummer += 1;
  const ok = bedingung === true;
  if (!ok) fehlgeschlagen.push(`${nummer}. ${titel}`);
  console.log(
    `${ok ? "✓" : "✗"} ${String(nummer).padStart(2)}. ${titel}${hinweis ? `  — ${hinweis}` : ""}`,
  );
}

/* ── Sauberer Anfang ──────────────────────────────────────────── */

async function leeren() {
  await db.loeschprotokoll.deleteMany({});
  await db.loeschsperre.deleteMany({});
  await db.vorfall.deleteMany({});
  await db.checkliste.deleteMany({});
  await db.zustimmungsnachweis.deleteMany({});
  await db.participant.deleteMany({});

  /* Erst die Anmeldungen, dann die Veranstaltung — umgekehrt hält der
     Fremdschlüssel dagegen. Gesucht wird über die Veranstaltung, nicht
     über die E-Mail-Adresse: Nach dem Anonymisieren lautet sie
     "geloescht+…@invalid" und wäre über die Prüfadresse nicht mehr
     auffindbar. Genau daran ist das Aufräumen beim ersten Anlauf
     gescheitert. */
  const proben = await db.event.findMany({
    where: { slug: { startsWith: "s-probe" } },
    select: { id: true },
  });
  for (const p of proben) {
    await db.registration.deleteMany({ where: { eventId: p.id } });
    await db.event.delete({ where: { id: p.id } });
  }
}

await leeren();

/* Eine Veranstaltung, die lange vorbei ist — damit alles fällig ist,
   was fällig werden kann. */
const LANGE_HER = new Date("2015-06-15T12:00:00Z");

const event = await db.event.create({
  data: {
    slug: "s-probe-loeschlauf",
    titel: "S-Probe Löschlauf",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "S-Probe",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: LANGE_HER,
    endAt: LANGE_HER,
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "VEROEFFENTLICHT",
  },
});

/** Eine Anmeldung mit echten Personendaten und echten Geldangaben. */
async function anmeldungAnlegen(kennung, zusatz = {}) {
  return db.registration.create({
    data: {
      eventId: event.id,
      kontaktVorname: "Erika",
      kontaktNachname: "Mustermann",
      kontaktEmail: `${kennung}@s-pruefung.invalid`,
      kontaktTelefon: "0170 1234567",
      gesamtpreisCents: 1400,
      bezahlterBetragCents: 1400,
      bezahltAm: new Date("2015-06-01T10:00:00Z"),
      zahlungsStatus: "BEZAHLT",
      zahlungsReferenz: "cs_test_probe",
      zahlungsAbsicht: "pi_test_probe",
      status: "BESTAETIGT",
      teilnehmer: {
        create: [{ vorname: "Erika", nachname: "Mustermann", typ: "ERWACHSENER" }],
      },
      ...zusatz,
    },
    include: { teilnehmer: true },
  });
}

console.log("── Ausgangslage ──\n");

const k4 = await anmeldungAnlegen("k4");
const k7 = await anmeldungAnlegen("k7", { loeschklasse: "STEUERUNTERLAGEN" });

const k5 = await db.checkliste.create({
  data: {
    eventId: event.id,
    durchgefuehrtAm: LANGE_HER,
    einweisungKuerzel: "AL",
    notiz: "Einweisung durch Adam L., Treffpunkt Tresen.",
    einweisungErfolgt: true,
    teilnehmerAnzahl: 42,
    faelligAm: new Date("2018-12-31T23:59:59.999Z"),
  },
});

const k3 = await db.zustimmungsnachweis.create({
  data: {
    eventId: event.id,
    veranstaltungAm: LANGE_HER,
    teilnehmerName: "Max Mustermann",
    faelligAm: new Date("2018-12-31T23:59:59.999Z"),
  },
});

const k6 = await db.vorfall.create({
  data: {
    titel: "S-Probe abgeschlossener Vorfall",
    einstufung: "LEICHT",
    status: "ABGESCHLOSSEN",
    abgeschlossenAm: new Date("2015-07-01T10:00:00Z"),
    faelligAm: new Date("2025-07-01T10:00:00Z"),
    erstelltVon: "pruefung",
  },
});

pruefe("Testdaten angelegt: je ein Datensatz für K3, K4, K5, K6 und K7", true);

/* ── Probelauf ────────────────────────────────────────────────── */

console.log("\n── Probelauf: darf nichts verändern ──\n");

const vorher = {
  k4: await db.registration.findUnique({ where: { id: k4.id } }),
  k5: await db.checkliste.findUnique({ where: { id: k5.id } }),
  k3: await db.zustimmungsnachweis.findUnique({ where: { id: k3.id } }),
  k6: await db.vorfall.findUnique({ where: { id: k6.id } }),
  teilnehmer: await db.participant.findMany({ where: { registrationId: k4.id } }),
};

const probe = await loeschlauf(true);

const nachProbe = {
  k4: await db.registration.findUnique({ where: { id: k4.id } }),
  k5: await db.checkliste.findUnique({ where: { id: k5.id } }),
  k3: await db.zustimmungsnachweis.findUnique({ where: { id: k3.id } }),
  k6: await db.vorfall.findUnique({ where: { id: k6.id } }),
  teilnehmer: await db.participant.findMany({ where: { registrationId: k4.id } }),
};

pruefe(
  "Probelauf meldet Fälliges",
  probe.eintraege.filter((e) => e.aktion === "faellig").length >= 4,
  `${probe.eintraege.length} Entscheidungen`,
);
pruefe(
  "Probelauf schreibt NICHT „anonymisiert“ oder „geloescht“",
  probe.eintraege.every((e) => e.aktion !== "anonymisiert" && e.aktion !== "geloescht"),
);
pruefe(
  "K4 Anmeldung nach dem Probelauf unverändert",
  nachProbe.k4.kontaktVorname === "Erika" &&
    nachProbe.k4.kontaktEmail === vorher.k4.kontaktEmail &&
    nachProbe.k4.anonymisiertAm === null,
);
pruefe(
  "K4 Teilnehmername nach dem Probelauf unverändert",
  nachProbe.teilnehmer[0].vorname === "Erika",
);
pruefe(
  "K5 Checkliste nach dem Probelauf unverändert",
  nachProbe.k5.einweisungKuerzel === "AL" && nachProbe.k5.anonymisiertAm === null,
);
pruefe("K3 Zustimmungsnachweis steht noch da", nachProbe.k3 !== null);
pruefe("K6 Vorfallakte steht noch da", nachProbe.k6 !== null);
pruefe(
  "Das Protokoll des Probelaufs ist als Probe gekennzeichnet",
  (await db.loeschprotokoll.count({ where: { laufId: probe.laufId, probelauf: false } })) === 0,
);

/* ── Sperren: jeder Grund hält ────────────────────────────────── */

console.log("\n── Sperren: jeder der fünf Gründe hält ──\n");

for (const grund of ["UNFALL", "BESCHWERDE", "RUECKBUCHUNG", "VERSICHERUNG", "RECHTSSTREIT"]) {
  const a = await anmeldungAnlegen(`sperre-${grund.toLowerCase()}`);
  await db.loeschsperre.create({
    data: { zielArt: "Registration", zielId: a.id, grund, gesetztVon: "pruefung" },
  });

  await loeschlauf(false);

  const danach = await db.registration.findUnique({ where: { id: a.id } });
  pruefe(
    `Sperre ${grund}: die Anmeldung bleibt vollständig erhalten`,
    danach.kontaktVorname === "Erika" && danach.anonymisiertAm === null,
  );

  // Für die folgenden Prüfungen wieder abräumen, damit sich die
  // Fälle nicht gegenseitig beeinflussen.
  await db.participant.deleteMany({ where: { registrationId: a.id } });
  await db.loeschsperre.deleteMany({ where: { zielId: a.id } });
  await db.registration.delete({ where: { id: a.id } });
}

/* Eine aufgehobene Sperre hält nicht mehr. */
const aufgehoben = await anmeldungAnlegen("sperre-aufgehoben");
await db.loeschsperre.create({
  data: {
    zielArt: "Registration",
    zielId: aufgehoben.id,
    grund: "BESCHWERDE",
    gesetztVon: "pruefung",
    aufgehobenAm: new Date(),
    aufgehobenVon: "pruefung",
  },
});
await loeschlauf(false);
const nachAufhebung = await db.registration.findUnique({ where: { id: aufgehoben.id } });
pruefe(
  "Aufgehobene Sperre: die Anmeldung wird anonymisiert",
  nachAufhebung.anonymisiertAm !== null && nachAufhebung.kontaktVorname === "Gelöscht",
);

/* ── Automatische Sperren ─────────────────────────────────────── */

console.log("\n── Automatische Sperren ──\n");

const erstattet = await anmeldungAnlegen("erstattet", { zahlungsStatus: "ERSTATTET" });
await loeschlauf(false);
const sperreErstattung = await db.loeschsperre.findFirst({
  where: { zielId: erstattet.id, grund: "RUECKBUCHUNG", aufgehobenAm: null },
});
const nachErstattung = await db.registration.findUnique({ where: { id: erstattet.id } });
pruefe(
  "Erstattung erzeugt automatisch eine Sperre „Rückbuchung“",
  sperreErstattung !== null && sperreErstattung.automatisch === true,
);
pruefe(
  "… und die erstattete Anmeldung bleibt dadurch erhalten",
  nachErstattung.anonymisiertAm === null,
);

const mitVorfall = await anmeldungAnlegen("mit-vorfall");
await db.vorfall.create({
  data: {
    titel: "S-Probe offener Vorfall",
    status: "OFFEN",
    registrationId: mitVorfall.id,
    erstelltVon: "pruefung",
  },
});
await loeschlauf(false);
const sperreUnfall = await db.loeschsperre.findFirst({
  where: { zielId: mitVorfall.id, grund: "UNFALL", aufgehobenAm: null },
});
const nachVorfall = await db.registration.findUnique({ where: { id: mitVorfall.id } });
pruefe(
  "Offener Vorfall erzeugt automatisch eine Sperre „Unfall“",
  sperreUnfall !== null && sperreUnfall.automatisch === true,
);
pruefe("… und hält die zugehörige Anmeldung fest", nachVorfall.anonymisiertAm === null);
pruefe(
  "Ein OFFENER Vorfall wird selbst nie gelöscht",
  (await db.vorfall.count({ where: { status: "OFFEN" } })) === 1,
);

const zweimal = await db.loeschsperre.count({
  where: { zielId: erstattet.id, grund: "RUECKBUCHUNG" },
});
await loeschlauf(false);
pruefe(
  "Ein zweiter Lauf verdoppelt keine automatische Sperre",
  (await db.loeschsperre.count({ where: { zielId: erstattet.id, grund: "RUECKBUCHUNG" } })) ===
    zweimal,
);

/* ── Echter Lauf: was passiert mit K3 bis K7 ──────────────────── */

console.log("\n── Echter Lauf ──\n");

const nachher = {
  k4: await db.registration.findUnique({ where: { id: k4.id } }),
  k7: await db.registration.findUnique({ where: { id: k7.id } }),
  k5: await db.checkliste.findUnique({ where: { id: k5.id } }),
  k3: await db.zustimmungsnachweis.findUnique({ where: { id: k3.id } }),
  k6: await db.vorfall.findUnique({ where: { id: k6.id } }),
  teilnehmer: await db.participant.findMany({ where: { registrationId: k4.id } }),
};

pruefe(
  "K4: Vorname, Nachname und Telefon überschrieben",
  nachher.k4.kontaktVorname === "Gelöscht" &&
    nachher.k4.kontaktNachname === "Anmeldung" &&
    nachher.k4.kontaktTelefon === null,
);
pruefe(
  "K4: E-Mail-Adresse überschrieben, aber je Event eindeutig",
  nachher.k4.kontaktEmail === `geloescht+${k4.id}@invalid`,
);
pruefe("K4: Zeitpunkt der Anonymisierung festgehalten", nachher.k4.anonymisiertAm !== null);
pruefe(
  "K4: auch die Teilnehmer sind anonym — keine verwaisten Personendaten",
  nachher.teilnehmer.every((t) => t.vorname === "Gelöscht" && t.geburtsjahr === null),
);
pruefe(
  "K4: die Anmeldezeile selbst bleibt bestehen",
  nachher.k4 !== null,
  "die Buchhaltung braucht sie",
);

pruefe(
  "K5: Mitarbeiterkürzel unwiderruflich entfernt",
  nachher.k5.einweisungKuerzel === null,
);
pruefe("K5: Freitextnotiz entfernt", nachher.k5.notiz === null);
pruefe(
  "K5: die anonyme Sicherheitsdokumentation bleibt",
  nachher.k5.einweisungErfolgt === true && nachher.k5.teilnehmerAnzahl === 42,
);
pruefe("K5: Zeitpunkt festgehalten", nachher.k5.anonymisiertAm !== null);

pruefe("K3: Zustimmungsnachweis vollständig gelöscht", nachher.k3 === null);
pruefe("K6: abgeschlossene Vorfallakte gelöscht", nachher.k6 === null);

/* ── K7: Steuerunterlagen bleiben unangetastet ────────────────── */

console.log("\n── K7 Steuerunterlagen: der Riegel ──\n");

pruefe(
  "K7: die Anmeldung wurde NICHT anonymisiert",
  nachher.k7.anonymisiertAm === null && nachher.k7.kontaktVorname === "Erika",
  "der Löschlauf fasst sie nie an",
);
pruefe(
  "K7 taucht im Protokoll gar nicht erst als fällig auf",
  (await db.loeschprotokoll.count({ where: { zielId: k7.id, aktion: "faellig" } })) === 0,
);

/* Steuerrelevante Felder auch bei der ANONYMISIERTEN Anmeldung. */
const gleich = STEUERRELEVANTE_FELDER.filter(
  (feld) => String(vorher.k4[feld]) === String(nachher.k4[feld]),
);
pruefe(
  `Alle ${STEUERRELEVANTE_FELDER.length} steuerrelevanten Felder bleiben unverändert`,
  gleich.length === STEUERRELEVANTE_FELDER.length,
  gleich.join(", "),
);

/* ── Protokoll ────────────────────────────────────────────────── */

console.log("\n── Protokoll ──\n");

const protokoll = await db.loeschprotokoll.findMany({});
pruefe("Es gibt Protokolleinträge", protokoll.length > 0, `${protokoll.length} Zeilen`);

const alsText = JSON.stringify(protokoll);
pruefe(
  "Das Protokoll enthält keinen Namen",
  !alsText.includes("Erika") && !alsText.includes("Mustermann"),
);
pruefe(
  "Das Protokoll enthält keine E-Mail-Adresse",
  !alsText.includes("@s-pruefung.invalid") && !alsText.includes("@invalid"),
);
pruefe(
  "Das Protokoll enthält keine Telefonnummer",
  !alsText.includes("0170"),
);
pruefe(
  "Jede Zeile trägt eine Lauf-Kennung",
  protokoll.every((p) => typeof p.laufId === "string" && p.laufId.length > 0),
);
pruefe(
  "Übersprungene Datensätze stehen mit ihrem Sperrgrund im Protokoll",
  protokoll.some((p) => p.aktion === "uebersprungen" && p.grund === "gesperrt"),
);

/* ── K8: Aufnahmewiderspruch und Prüfvermerk ─────────────────── */

console.log("\n── K8: ereignisbezogene Löschung ──\n");

/* Drei getrennte Events, weil "Aufnahmen offline" eine Eigenschaft
   der VERANSTALTUNG ist und alle ihre K8-Datensätze gleichermaßen
   betrifft — ein gemeinsames Event würde die Fälle gegenseitig
   verfälschen. */

/* Event 1: von Anfang an als offline markiert, Frist längst
   abgelaufen. Enthält den fälligen UND den gesperrten Fall. */
const laengstOffline = new Date("2015-01-01T00:00:00Z");
const k8EventOffline = await db.event.create({
  data: {
    slug: "s-probe-loeschlauf-k8-offline",
    titel: "S-Probe Löschlauf K8 offline",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "S-Probe K8a",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: LANGE_HER,
    endAt: LANGE_HER,
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "VEROEFFENTLICHT",
    aufnahmenOfflineAm: laengstOffline,
    aufnahmenOfflineVon: "pruefung",
    aufnahmenOfflineNotiz: "S-Probe",
  },
});

/* Event 2: NIE als offline markiert. */
const k8EventOhneOffline = await db.event.create({
  data: {
    slug: "s-probe-loeschlauf-k8-ohne",
    titel: "S-Probe Löschlauf K8 ohne Offline",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "S-Probe K8b",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: LANGE_HER,
    endAt: LANGE_HER,
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "VEROEFFENTLICHT",
  },
});

/* Event 3: wird ERST NACH der Anlage seines Widerspruchs als offline
   markiert — der Fall "faelligkeitenAuffrischen() muss nachziehen". */
const k8EventSpaeter = await db.event.create({
  data: {
    slug: "s-probe-loeschlauf-k8-spaeter",
    titel: "S-Probe Löschlauf K8 später",
    beschreibung: "Nur zum Prüfen.",
    kurz: "Prüfung",
    karteTitel: "S-Probe K8c",
    karteKurz: "Prüfung",
    karteZielgruppe: "Prüfung",
    startAt: LANGE_HER,
    endAt: LANGE_HER,
    stadt: "Falkensee",
    maxPersonen: 100,
    schwelleWenigPlaetze: 10,
    schuelerAktiv: true,
    preisSchuelerCents: 700,
    preisErwachsenerCents: 1400,
    status: "VEROEFFENTLICHT",
  },
});

/* Fall A: Offline seit 2015, Frist längst abgelaufen, KEINE Sperre —
   muss beim echten Lauf gelöscht werden. faelligAm wird hier absichtlich
   schon korrekt gesetzt: faelligkeitenAuffrischen() läuft bei jedem
   Aufruf und würde einen falsch gesetzten Wert ohnehin überschreiben —
   genau das prüft Fall D weiter unten eigens. */
const k8Faellig = await db.aufnahmewiderspruch.create({
  data: {
    eventId: k8EventOffline.id,
    name: "S-Probe fällig",
    weg: "VOR_ORT",
    erfasstVon: "pruefung",
    faelligAm: faelligAufnahmewiderspruch(laengstOffline),
  },
});
const pruefvermerkFaellig = await db.veroeffentlichungspruefung.create({
  data: {
    eventId: k8EventOffline.id,
    ziel: "S-Probe Website",
    widersprueche: 0,
    erkennbar: false,
    geprueftVon: "pruefung",
    faelligAm: faelligAufnahmewiderspruch(laengstOffline),
  },
});

/* Fall B: ebenfalls offline seit 2015 und fällig, ABER gesperrt
   (laufendes Verfahren) — darf trotz Fälligkeit nicht verschwinden. */
const k8Gesperrt = await db.aufnahmewiderspruch.create({
  data: {
    eventId: k8EventOffline.id,
    name: "S-Probe gesperrt",
    weg: "EMAIL",
    erfasstVon: "pruefung",
    faelligAm: faelligAufnahmewiderspruch(laengstOffline),
  },
});
await db.loeschsperre.create({
  data: {
    zielArt: "Aufnahmewiderspruch",
    zielId: k8Gesperrt.id,
    grund: "RECHTSSTREIT",
    gesetztVon: "pruefung",
  },
});

/* Fall C: das zugehörige Event wurde nie als offline markiert. */
const k8OhneOffline = await db.aufnahmewiderspruch.create({
  data: {
    eventId: k8EventOhneOffline.id,
    name: "S-Probe ohne Offline",
    weg: "VOR_ORT",
    erfasstVon: "pruefung",
    faelligAm: null,
  },
});

const k8ProbeVorher = await loeschlauf(true);
pruefe(
  "Probelauf meldet die beiden fälligen K8-Datensätze",
  k8ProbeVorher.eintraege.some(
    (e) => e.zielArt === "Aufnahmewiderspruch" && e.zielId === k8Faellig.id && e.aktion === "faellig",
  ) &&
    k8ProbeVorher.eintraege.some(
      (e) =>
        e.zielArt === "Veroeffentlichungspruefung" &&
        e.zielId === pruefvermerkFaellig.id &&
        e.aktion === "faellig",
    ),
);
pruefe(
  "Probelauf meldet den gesperrten K8-Datensatz als übersprungen, nicht als fällig",
  k8ProbeVorher.eintraege.some(
    (e) =>
      e.zielArt === "Aufnahmewiderspruch" &&
      e.zielId === k8Gesperrt.id &&
      e.aktion === "uebersprungen" &&
      e.grund === "gesperrt",
  ),
);
pruefe(
  "Probelauf rührt den Datensatz ohne Offline-Datum gar nicht erst an",
  !k8ProbeVorher.eintraege.some((e) => e.zielId === k8OhneOffline.id),
);
pruefe(
  "Probelauf verändert nichts — alle drei Widersprüche stehen noch da",
  (await db.aufnahmewiderspruch.count({
    where: { id: { in: [k8Faellig.id, k8Gesperrt.id, k8OhneOffline.id] } },
  })) === 3,
);

const k8Echt = await loeschlauf(false);

pruefe(
  "Echter Lauf: der fällige, ungesperrte Widerspruch ist gelöscht",
  (await db.aufnahmewiderspruch.findUnique({ where: { id: k8Faellig.id } })) === null,
);
pruefe(
  "Echter Lauf: der fällige, ungesperrte Prüfvermerk ist gelöscht",
  (await db.veroeffentlichungspruefung.findUnique({ where: { id: pruefvermerkFaellig.id } })) ===
    null,
);
pruefe(
  "Echter Lauf: der gesperrte Widerspruch bleibt trotz Fälligkeit erhalten",
  (await db.aufnahmewiderspruch.findUnique({ where: { id: k8Gesperrt.id } })) !== null,
  "ein laufendes Verfahren sperrt die Löschung",
);
pruefe(
  "Echter Lauf: der Widerspruch ohne Offline-Datum bleibt erhalten",
  (await db.aufnahmewiderspruch.findUnique({ where: { id: k8OhneOffline.id } })) !== null,
  "solange niemand feststellt, dass alle Aufnahmen offline sind, gibt es keine Fälligkeit",
);
pruefe(
  "Das Protokoll nennt K8-Löschungen mit Zielart, aber keinen Namen",
  k8Echt.eintraege.some((e) => e.zielArt === "Aufnahmewiderspruch" && e.aktion === "geloescht") &&
    !JSON.stringify(k8Echt.eintraege).includes("S-Probe fällig"),
);

/* Fall D: Die Sperre wird aufgehoben — danach muss der nächste Lauf
   wirklich löschen. */
await db.loeschsperre.updateMany({
  where: { zielArt: "Aufnahmewiderspruch", zielId: k8Gesperrt.id, aufgehobenAm: null },
  data: { aufgehobenAm: new Date(), aufgehobenVon: "pruefung" },
});
await loeschlauf(false);
pruefe(
  "Nach dem Aufheben der Sperre: der vormals gesperrte Widerspruch ist jetzt gelöscht",
  (await db.aufnahmewiderspruch.findUnique({ where: { id: k8Gesperrt.id } })) === null,
);

/* Fall E: faelligkeitenAuffrischen() korrigiert die Frist, wenn das
   Offline-Datum NACH der Anlage des Widerspruchs gesetzt wird —
   genau der Fall, dass ein Widerspruch schon vor der
   Offline-Markierung bestand. */
const k8Spaeter = await db.aufnahmewiderspruch.create({
  data: {
    eventId: k8EventSpaeter.id,
    name: "S-Probe später offline",
    weg: "VOR_ORT",
    erfasstVon: "pruefung",
    faelligAm: null,
  },
});
const k8SpaeterVorAuffrischen = await db.aufnahmewiderspruch.findUnique({
  where: { id: k8Spaeter.id },
});
pruefe(
  "Vor der Offline-Markierung: keine Fälligkeit",
  k8SpaeterVorAuffrischen.faelligAm === null,
);
await db.event.update({
  where: { id: k8EventSpaeter.id },
  data: {
    aufnahmenOfflineAm: laengstOffline,
    aufnahmenOfflineVon: "pruefung",
    aufnahmenOfflineNotiz: "S-Probe",
  },
});
await loeschlauf(true); // Probelauf frischt Fälligkeiten trotzdem auf.
const k8SpaeterNachAuffrischen = await db.aufnahmewiderspruch.findUnique({
  where: { id: k8Spaeter.id },
});
pruefe(
  "faelligkeitenAuffrischen() setzt die Frist eines schon bestehenden Widerspruchs nach, wenn das Event nachträglich als offline markiert wird",
  k8SpaeterNachAuffrischen.faelligAm !== null &&
    k8SpaeterNachAuffrischen.faelligAm.getTime() ===
      faelligAufnahmewiderspruch(laengstOffline).getTime(),
);
await loeschlauf(false);
pruefe(
  "… und ein anschließender echter Lauf löscht ihn dann auch",
  (await db.aufnahmewiderspruch.findUnique({ where: { id: k8Spaeter.id } })) === null,
);

/* ── Aufräumen K8 ─────────────────────────────────────────────── */
for (const ev of [k8EventOffline, k8EventOhneOffline, k8EventSpaeter]) {
  await db.veroeffentlichungspruefung.deleteMany({ where: { eventId: ev.id } });
  await db.aufnahmewiderspruch.deleteMany({ where: { eventId: ev.id } });
  await db.event.delete({ where: { id: ev.id } });
}

/* ── Zweiter Lauf: nichts mehr zu tun ─────────────────────────── *//* ── Zweiter Lauf: nichts mehr zu tun ─────────────────────────── */

console.log("\n── Ein zweiter Lauf ──\n");

const zweiter = await loeschlauf(false);
pruefe(
  "Ein zweiter Lauf anonymisiert oder löscht nichts mehr",
  zweiter.eintraege.every((e) => e.aktion !== "anonymisiert" && e.aktion !== "geloescht"),
  "idempotent",
);

/* ── Aufräumen ────────────────────────────────────────────────── */

await leeren();

console.log(
  fehlgeschlagen.length === 0
    ? `\n${nummer} von ${nummer} in Ordnung. Testdaten entfernt.`
    : `\n${fehlgeschlagen.length} von ${nummer} fehlgeschlagen:\n${fehlgeschlagen.join("\n")}`,
);
await db.$disconnect();
process.exit(fehlgeschlagen.length === 0 ? 0 : 1);
