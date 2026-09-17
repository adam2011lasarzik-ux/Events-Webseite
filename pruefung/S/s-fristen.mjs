/* ---------------------------------------------------------------
   Prüfliste S, Teil 1 — die Regeln des Löschkonzepts.

   Reine Funktionen, keine Datenbank. Geprüft wird jede der sieben
   Löschklassen und jede Sperrsituation aus
   docs/rechtstexte-entwuerfe/13-loeschkonzept.md.

   Die wichtigste Prüfung steht ganz unten: dass ein steuerrelevanter
   Datensatz auch dann nicht angefasst wird, wenn alles andere für
   eine Löschung spricht.
   --------------------------------------------------------------- */

import {
  AKTION_JE_KLASSE,
  ANMELDEDATEN_JAHRE,
  CHECKLISTE_JAHRE,
  EINVERSTAENDNIS_JAHRE,
  GESUNDHEIT_TAGE,
  VORFALL_LEICHT_JAHRE,
  VORFALL_SCHWER_JAHRE,
  ZUSTIMMUNGSNACHWEIS_JAHRE,
  darfLoeschlaufAnfassen,
  entscheide,
  faelligAnmeldedaten,
  faelligCheckliste,
  faelligEinverstaendnis,
  faelligGesundheit,
  faelligVorfall,
  faelligZustimmungsnachweis,
  istFaellig,
  istGesperrt,
  jahresende,
  offeneSperrgruende,
} from "../../lib/loeschfristen.js";

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

const offen = [];
const gesperrt = [{ grund: "RECHTSSTREIT", aufgehobenAm: null }];
const aufgehoben = [{ grund: "RECHTSSTREIT", aufgehobenAm: new Date("2026-01-01") }];

/* Ein Event am 15.06.2026, 14 Uhr deutscher Zeit. */
const VERANSTALTUNG = new Date("2026-06-15T12:00:00Z");

console.log("── Fristbeginn und Fälligkeit je Klasse ──\n");

/* K1 — 7 Tage nach Veranstaltungsende, NICHT zum Jahresende. */
const k1 = faelligGesundheit(VERANSTALTUNG);
pruefe(
  `K1 Gesundheitsangaben: ${GESUNDHEIT_TAGE} Tage nach der Veranstaltung`,
  k1.getTime() === VERANSTALTUNG.getTime() + GESUNDHEIT_TAGE * 24 * 60 * 60 * 1000,
  k1.toISOString().slice(0, 10),
);
pruefe(
  "K1 rechnet NICHT zum Jahresende — sonst lägen Notfalldaten ein halbes Jahr zu lang",
  k1.getUTCFullYear() === 2026 && k1.getUTCMonth() === 5,
);

/* K2 — 3 Jahre ab Ende des Kalenderjahres. */
const k2 = faelligEinverstaendnis(VERANSTALTUNG);
pruefe(
  `K2 Einverständniserklärungen: ${EINVERSTAENDNIS_JAHRE} Jahre ab Jahresende`,
  k2.getUTCFullYear() === 2026 + EINVERSTAENDNIS_JAHRE,
  k2.toISOString().slice(0, 10),
);
pruefe(
  "K2 beginnt am Jahresende, nicht am Veranstaltungstag",
  jahresende(VERANSTALTUNG).getUTCFullYear() === 2026,
);

/* K3 — reduzierter Nachweis, 10 Jahre ab Jahresende. */
const k3 = faelligZustimmungsnachweis(VERANSTALTUNG);
pruefe(
  `K3 Zustimmungsnachweis: ${ZUSTIMMUNGSNACHWEIS_JAHRE} Jahre ab Jahresende`,
  k3.getUTCFullYear() === 2026 + ZUSTIMMUNGSNACHWEIS_JAHRE,
  k3.toISOString().slice(0, 10),
);
pruefe("K3 bleibt länger als K2 — das ist der Sinn der Reduktion", k3 > k2);

/* K4 — Anmelde- und Check-in-Daten, 3 Jahre ab Jahresende. */
const k4 = faelligAnmeldedaten(VERANSTALTUNG);
pruefe(
  `K4 Anmeldedaten: ${ANMELDEDATEN_JAHRE} Jahre ab Jahresende`,
  k4.getUTCFullYear() === 2026 + ANMELDEDATEN_JAHRE,
  k4.toISOString().slice(0, 10),
);
pruefe("K4 und K2 laufen gleich lang — beide 3 Jahre ab Jahresende", k4.getTime() === k2.getTime());

/* K5 — Checkliste, 3 Jahre ab Jahresende. */
const k5 = faelligCheckliste(VERANSTALTUNG);
pruefe(
  `K5 Checkliste: ${CHECKLISTE_JAHRE} Jahre ab Jahresende`,
  k5.getUTCFullYear() === 2026 + CHECKLISTE_JAHRE,
  k5.toISOString().slice(0, 10),
);

/* K6 — Vorfall: Frist beginnt erst mit dem Abschluss. */
pruefe(
  "K6 offener Vorfall: KEIN Fälligkeitsdatum — es wird nichts gelöscht",
  faelligVorfall(null, "LEICHT") === null && faelligVorfall(null, "SCHWER") === null,
);
const abschluss = new Date("2026-08-01T10:00:00Z");
const k6leicht = faelligVorfall(abschluss, "LEICHT");
const k6schwer = faelligVorfall(abschluss, "SCHWER");
pruefe(
  `K6 leicht: ${VORFALL_LEICHT_JAHRE} Jahre nach Abschluss`,
  k6leicht.getUTCFullYear() === 2026 + VORFALL_LEICHT_JAHRE,
  k6leicht.toISOString().slice(0, 10),
);
pruefe(
  `K6 schwer: ${VORFALL_SCHWER_JAHRE} Jahre nach Abschluss`,
  k6schwer.getUTCFullYear() === 2026 + VORFALL_SCHWER_JAHRE,
  k6schwer.toISOString().slice(0, 10),
);
pruefe("K6 schwer liegt später als K6 leicht", k6schwer > k6leicht);

console.log("\n── Vorgesehene Aktion je Klasse ──\n");

pruefe(
  "K1 → erinnern (steht nur auf dem Papierformular, nicht in der Datenbank)",
  AKTION_JE_KLASSE.GESUNDHEITSANGABEN === "erinnern",
  "die Anwendung kann Papier nicht vernichten",
);
pruefe("K2 → erinnern (liegt auf Papier)", AKTION_JE_KLASSE.EINVERSTAENDNIS_VOLL === "erinnern");
pruefe("K3 → löschen", AKTION_JE_KLASSE.ZUSTIMMUNGSNACHWEIS === "loeschen");
pruefe("K4 → anonymisieren (Buchhaltung bleibt)", AKTION_JE_KLASSE.ANMELDEDATEN === "anonymisieren");
pruefe("K5 → anonymisieren (Sicherheitsdoku bleibt)", AKTION_JE_KLASSE.CHECKLISTE === "anonymisieren");
pruefe("K6 → löschen", AKTION_JE_KLASSE.VORFALLAKTE === "loeschen");
pruefe("K7 → NIEMALS", AKTION_JE_KLASSE.STEUERUNTERLAGEN === "niemals");

console.log("\n── Sperren ──\n");

pruefe("Ohne Sperre: nicht gesperrt", istGesperrt(offen) === false);
pruefe("Offene Sperre: gesperrt", istGesperrt(gesperrt) === true);
pruefe("Aufgehobene Sperre: nicht mehr gesperrt", istGesperrt(aufgehoben) === false);
pruefe(
  "Mehrere Sperren, eine offen: gesperrt",
  istGesperrt([...aufgehoben, ...gesperrt]) === true,
  "eine genügt",
);
pruefe(
  "Nur offene Gründe werden protokolliert",
  JSON.stringify(offeneSperrgruende([...aufgehoben, ...gesperrt])) === '["RECHTSSTREIT"]',
);

/* Jeder der fünf Sperrgründe hält gleichermaßen. */
for (const grund of ["UNFALL", "BESCHWERDE", "RUECKBUCHUNG", "VERSICHERUNG", "RECHTSSTREIT"]) {
  const e = entscheide("ANMELDEDATEN", new Date("2020-01-01"), [{ grund, aufgehobenAm: null }]);
  pruefe(
    `Sperrgrund ${grund}: fällig, aber es passiert nichts`,
    e.handeln === false && e.grund === "gesperrt",
  );
}

console.log("\n── Die Entscheidung, Reihenfolge der Prüfungen ──\n");

const laengstFaellig = new Date("2000-01-01");

pruefe(
  "Fällig, nicht gesperrt → handeln",
  entscheide("ANMELDEDATEN", laengstFaellig, offen).handeln === true,
);
pruefe(
  "Noch nicht fällig → nicht handeln",
  entscheide("ANMELDEDATEN", new Date("2999-01-01"), offen).grund === "nicht-faellig",
);
pruefe(
  "Kein Fälligkeitsdatum → nicht handeln",
  entscheide("ANMELDEDATEN", null, offen).grund === "kein-termin",
  "Veranstaltung ohne Termin",
);

/* Der Kern: Steuerrelevantes wird VOR allem anderen geprüft. */
pruefe(
  "K7 wird nie angefasst — auch längst fällig nicht",
  entscheide("STEUERUNTERLAGEN", laengstFaellig, offen).grund === "steuerrelevant",
);
pruefe(
  "K7 ohne jede Sperre: trotzdem steuerrelevant, nicht „handeln“",
  entscheide("STEUERUNTERLAGEN", laengstFaellig, []).handeln === false,
  "eine fehlende Sperre gibt K7 nicht frei",
);
pruefe(
  "K7 mit Sperre: der Grund bleibt „steuerrelevant“, nicht „gesperrt“",
  entscheide("STEUERUNTERLAGEN", laengstFaellig, gesperrt).grund === "steuerrelevant",
  "Prüfung 1 vor Prüfung 2",
);
pruefe(
  "darfLoeschlaufAnfassen: K7 nein, alle anderen ja",
  darfLoeschlaufAnfassen("STEUERUNTERLAGEN") === false &&
    ["GESUNDHEITSANGABEN", "EINVERSTAENDNIS_VOLL", "ZUSTIMMUNGSNACHWEIS", "ANMELDEDATEN", "CHECKLISTE", "VORFALLAKTE"].every(
      (k) => darfLoeschlaufAnfassen(k) === true,
    ),
);

pruefe(
  "istFaellig: genau am Stichtag ist fällig",
  istFaellig(new Date("2026-06-15T00:00:00Z"), new Date("2026-06-15T00:00:00Z")) === true,
);
pruefe(
  "istFaellig: eine Sekunde davor noch nicht",
  istFaellig(new Date("2026-06-15T00:00:01Z"), new Date("2026-06-15T00:00:00Z")) === false,
);

console.log(
  fehlgeschlagen.length === 0
    ? `\n${nummer} von ${nummer} in Ordnung.`
    : `\n${fehlgeschlagen.length} von ${nummer} fehlgeschlagen:\n${fehlgeschlagen.join("\n")}`,
);
process.exit(fehlgeschlagen.length === 0 ? 0 : 1);
