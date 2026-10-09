/* Ticketarten und Preisregeln — reine Funktionen, kein Server.

   Deckt die neuen Regeln ab: Ticketart „Erwachsene" (1 bis
   maxErwachsene), Ablehnung darüber hinaus, Familienpaket mit
   mindestens 4 möglichen Kindern, serverseitige Preisberechnung,
   Wirkungslosigkeit manipulierter Werte und die Formularvalidierung
   (maxErwachsene, Familien-Untergrenze, keine negativen Preise). */

import { berechnePreis, begrenzeAuswahl } from "../../lib/preise.js";
import { pruefeUndBaue } from "../../lib/anmeldung.js";
import { pruefeEvent, alsCents } from "../../lib/eventFormular.js";
import { preisAenderungen } from "../../lib/preisProtokoll.js";

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const regeln = (max = 6) => ({
  schuelerAktiv: true,
  schuelerCents: 700,
  erwachsenerCents: 1400,
  maxErwachsene: max,
  familie: {
    basisCents: 3000,
    enthalteneErwachsene: 2,
    enthalteneSchueler: 1,
    weitererSchuelerCents: 600,
    maxSchueler: 6,
  },
});

// Festpreis-Event OHNE Schüler-Einzelpreis, aber mit eigenem
// Familienpaket (eigene Preise). Dient dem Nachweis, dass Familienticket
// und Mehrfachbuchung vom Schülerpreis getrennt sind.
const regelnFlach = (opts = {}) => ({
  schuelerAktiv: false,
  schuelerCents: 0,
  erwachsenerCents: 2500,
  maxErwachsene: opts.maxErwachsene ?? 6,
  familie:
    opts.familie === undefined
      ? {
          basisCents: 3000,
          enthalteneErwachsene: 2,
          enthalteneSchueler: 1,
          weitererSchuelerCents: 600,
          maxSchueler: 6,
        }
      : opts.familie,
});

// Jede Person bekommt Kontaktdaten: Welche Rolle die Kontaktperson ist,
// hängt vom Weg ab (beim Familien-/Erwachsenen-Weg der erste, beim
// Kind-Weg der Elternteil am Ende). Großzügig für alle zu füllen hält
// den Test von dieser Reihenfolge unabhängig.
const personen = (n) =>
  Array.from({ length: n }, (_, i) => ({
    vorname: `V${i}`,
    nachname: `N${i}`,
    email: "kontakt@beispiel.de",
    telefon: "",
  }));

const eingabeErwachsene = (anzahl, max = 6) => ({
  regeln: regeln(max),
  eingabe: {
    weg: "erwachsene",
    schueler: 0,
    erwachsene: anzahl,
    personen: personen(anzahl),
    einwilligungVormund: false,
    agbAkzeptiert: true,
    kenntnisAufnahmen: true,
  },
});

// ── 1 bis 6 Erwachsene werden angenommen ───────────────────────────
for (const anzahl of [1, 2, 3, 4, 5, 6]) {
  const { regeln: r, eingabe } = eingabeErwachsene(anzahl);
  const erg = pruefeUndBaue(r, eingabe);
  const ok =
    !erg.fehler &&
    erg.anmeldung.teilnehmer.length === anzahl &&
    erg.anmeldung.teilnehmer.every((t) => t.typ === "ERWACHSENER");
  pruefe(`${anzahl} Erwachsene werden angenommen`, ok,
    erg.fehler ? erg.fehler[0].text : `${erg.anmeldung.teilnehmer.length} Teilnehmer`);
}

// ── Mehr als 6 Erwachsene werden abgelehnt ─────────────────────────
{
  const { regeln: r, eingabe } = eingabeErwachsene(7);
  const erg = pruefeUndBaue(r, eingabe);
  pruefe("7 Erwachsene werden abgelehnt (Standardgrenze 6)",
    Boolean(erg.fehler) && erg.fehler.some((f) => /höchstens/i.test(f.text)),
    erg.fehler ? erg.fehler.map((f) => f.text).join(" · ") : "faelschlich angenommen");
}

// ── Preis = Anzahl × Erwachsenenpreis (serverseitig gerechnet) ─────
{
  const p = berechnePreis(regeln(), { art: "single", schueler: 0, erwachsene: 3 });
  pruefe("3 Erwachsene kosten 3 × 14,00 € = 42,00 €",
    p.gesamtCents === 4200 && p.personen === 3, `${p.gesamtCents} Cent`);
}

// ── begrenzeAuswahl kappt eine manipulierte Übermenge ──────────────
{
  const b = begrenzeAuswahl(regeln(6), { art: "single", schueler: 0, erwachsene: 99 });
  pruefe("Manipulierte 99 Erwachsene werden auf 6 gekappt", b.erwachsene === 6, `erwachsene=${b.erwachsene}`);
}

// ── maxErwachsene ist pro Event einstellbar ────────────────────────
{
  const { regeln: r6, eingabe: e6 } = eingabeErwachsene(6, 6);
  const ok6 = !pruefeUndBaue(r6, e6).fehler;
  const { regeln: r6b, eingabe: e7 } = eingabeErwachsene(7, 6);
  const abgelehnt7 = Boolean(pruefeUndBaue(r6b, e7).fehler);
  pruefe("Bei maxErwachsene=6 sind 6 erlaubt und 7 abgelehnt", ok6 && abgelehnt7);
}

// ── Familienpaket: 4 bis Höchstzahl Kinder (von der 6-Grenze ausgenommen) ─
// Die Kinderzahl bleibt in [4, maxSchueler]; regeln() hat maxSchueler=6.
// Unter 4 wird auf 4 angehoben, über 6 auf 6 gekappt.
for (const [wunsch, erwartet] of [[3, 4], [4, 4], [5, 5], [6, 6], [99, 6]]) {
  const b = begrenzeAuswahl(regeln(), { art: "family", schueler: wunsch, erwachsene: 2 });
  pruefe(`Familienpaket: Wunsch ${wunsch} Kinder → ${erwartet}`, b.schueler === erwartet,
    `schueler=${b.schueler}`);
}
// Familienpaket mit 4 Kindern wird angenommen und kostet 48,00 €.
{
  const erg = pruefeUndBaue(regeln(), {
    weg: "familie", schueler: 4, erwachsene: 2, personen: personen(6),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  const p = berechnePreis(regeln(), { art: "family", schueler: 4, erwachsene: 2 });
  pruefe("Familienpaket mit 4 Kindern: angenommen, 6 Personen, 48,00 €",
    !erg.fehler && erg.anmeldung.teilnehmer.length === 6 && p.gesamtCents === 4800,
    erg.fehler ? erg.fehler[0].text : `${p.gesamtCents} Cent`);
}
// Weniger als 4 Kinder im Familienpaket wird abgelehnt.
{
  const erg = pruefeUndBaue(regeln(), {
    weg: "familie", schueler: 3, erwachsene: 2, personen: personen(5),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Familienpaket mit 3 Kindern wird abgelehnt (mindestens 4)",
    Boolean(erg.fehler) && erg.fehler.some((f) => /mindestens 4 Kinder/i.test(f.text)));
}
// Familienpaket ist von der 6-Personen-Grenze ausgenommen: 5 Kinder
// (7 Personen) werden angenommen; mehr als die Höchstzahl Kinder (6)
// werden abgelehnt.
{
  const ja = pruefeUndBaue(regeln(), {
    weg: "familie", schueler: 5, erwachsene: 2, personen: personen(7),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Familienpaket mit 5 Kindern (7 Personen) wird angenommen",
    !ja.fehler && ja.anmeldung.teilnehmer.length === 7, ja.fehler ? ja.fehler[0].text : "ok");
  const nein = pruefeUndBaue(regeln(), {
    weg: "familie", schueler: 7, erwachsene: 2, personen: personen(9),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Familienpaket mit 7 Kindern wird abgelehnt (Höchstzahl 6)",
    Boolean(nein.fehler) && nein.fehler.some((f) => /höchstens 6 Kinder/i.test(f.text)));
}

// ── Harte Gesamtgrenze: 6 Personen je Buchung, alle Wege ───────────
// Schul-/Kind-Weg: 6 Kinder angenommen, 7 abgelehnt.
{
  const ja = pruefeUndBaue(regeln(), {
    weg: "kind", schueler: 6, erwachsene: 0, personen: personen(8),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Schul-/Kind-Weg: 6 Kinder werden angenommen",
    !ja.fehler && ja.anmeldung.teilnehmer.length === 6, ja.fehler ? ja.fehler[0].text : "ok");
  const nein = pruefeUndBaue(regeln(), {
    weg: "kind", schueler: 7, erwachsene: 0, personen: personen(7),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Schul-/Kind-Weg: 7 Kinder werden abgelehnt",
    Boolean(nein.fehler) && nein.fehler.some((f) => /höchstens 6 Personen/i.test(f.text)));
}
// Kind-Weg mit mitkommendem Elternteil: 5 Kinder + 1 Elternteil = 6 ok,
// 6 Kinder + 1 Elternteil = 7 abgelehnt.
{
  const ja = pruefeUndBaue(regeln(), {
    weg: "kind", schueler: 5, erwachsene: 1, personen: personen(8),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Kind-Weg: 5 Kinder + Elternteil (6 Personen) angenommen",
    !ja.fehler && ja.anmeldung.teilnehmer.length === 6, ja.fehler ? ja.fehler[0].text : "ok");
  const nein = pruefeUndBaue(regeln(), {
    weg: "kind", schueler: 6, erwachsene: 1, personen: personen(7),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Kind-Weg: 6 Kinder + Elternteil (7 Personen) abgelehnt",
    Boolean(nein.fehler) && nein.fehler.some((f) => /höchstens 6 Personen/i.test(f.text)));
}
// Manipulierte Einzel-Übermenge wird auf 6 gekappt (99 Schüler → 6).
{
  const b = begrenzeAuswahl(regeln(), { art: "single", schueler: 99, erwachsene: 0 });
  pruefe("Manipulierte 99 Schüler werden auf 6 gekappt", b.schueler === 6, `schueler=${b.schueler}`);
}

// ── Der Preis hängt NICHT an mitgeschickten Werten ─────────────────
{
  // Ein „gesamtCents" im Eingabeobjekt existiert im Typ nicht und wird
  // ignoriert — der Server rechnet aus regeln + Auswahl.
  const { regeln: r, eingabe } = eingabeErwachsene(2);
  const manipuliert = { ...eingabe, gesamtCents: 1, erwachsenerCents: 1 };
  const erg = pruefeUndBaue(r, manipuliert);
  const p = berechnePreis(r, { art: "single", schueler: 0, erwachsene: 2 });
  pruefe("Manipulierte Preisfelder im Formular sind wirkungslos",
    !erg.fehler && p.gesamtCents === 2800, `${p.gesamtCents} Cent`);
}

// ── Formular: maxErwachsene-Validierung ────────────────────────────
const basisFormular = {
  titel: "Testevent", stadt: "Teststadt", karteTitel: "T", karteKurz: "K",
  kurz: "Kurz", beschreibung: "Beschreibung", preisErwachsener: "14,00",
  schuelerAktiv: "an", preisSchueler: "7,00",
};
{
  const ok = pruefeEvent({ ...basisFormular, maxErwachsene: "4" });
  pruefe("Formular akzeptiert maxErwachsene=4", !ok.fehler && ok.daten.maxErwachsene === 4);
  const leer = pruefeEvent({ ...basisFormular, maxErwachsene: "" });
  pruefe("Formular: leeres maxErwachsene → Standard 6", !leer.fehler && leer.daten.maxErwachsene === 6);
  const sechs = pruefeEvent({ ...basisFormular, maxErwachsene: "6" });
  pruefe("Formular akzeptiert maxErwachsene=6 (harte Grenze)", !sechs.fehler && sechs.daten.maxErwachsene === 6);
  for (const wert of ["0", "7", "21", "abc", "-3"]) {
    const r = pruefeEvent({ ...basisFormular, maxErwachsene: wert });
    pruefe(`Formular lehnt maxErwachsene="${wert}" ab`,
      Boolean(r.fehler) && r.fehler.some((f) => f.feld === "maxErwachsene"));
  }
}

// ── Formular: Familienpaket muss mindestens 4 Kinder zulassen ──────
{
  const fam = (max) => ({
    ...basisFormular, familieAktiv: "an", familieBasis: "30,00",
    familieWeitererSchueler: "6,00", familieEnthaltenErwachsene: "2",
    familieEnthaltenSchueler: "1", familieMaxSchueler: String(max),
  });
  const zuWenig = pruefeEvent(fam(3));
  pruefe("Familienpaket mit Höchstzahl 3 wird abgelehnt (mind. 4)",
    Boolean(zuWenig.fehler) && zuWenig.fehler.some((f) => f.feld === "familieMaxSchueler"));
  const genug = pruefeEvent(fam(4));
  pruefe("Familienpaket mit Höchstzahl 4 wird angenommen", !genug.fehler);
  // Das Familienpaket ist von der 6-Personen-Grenze ausgenommen, daher
  // sind auch 3 enthaltene Erwachsene zulässig.
  const dreiErw = pruefeEvent({
    ...basisFormular, familieAktiv: "an", familieBasis: "30,00",
    familieWeitererSchueler: "6,00", familieEnthaltenErwachsene: "3",
    familieEnthaltenSchueler: "1", familieMaxSchueler: "4",
  });
  pruefe("Familienpaket mit 3 enthaltenen Erwachsenen wird angenommen (Familie ohne 6-Grenze)",
    !dreiErw.fehler, dreiErw.fehler ? dreiErw.fehler.map((f) => f.text).join(" · ") : "ok");
}

// ── Formular: keine negativen/ungültigen Preise ────────────────────
{
  pruefe("alsCents lehnt negativen Preis ab", alsCents("-5,00") === null);
  pruefe("alsCents lehnt Text ab", alsCents("gratis") === null);
  pruefe("alsCents nimmt 14,00 € als 1400 Cent", alsCents("14,00") === 1400);
  const neg = pruefeEvent({ ...basisFormular, preisErwachsener: "-5,00" });
  pruefe("Formular lehnt negativen Erwachsenenpreis ab",
    Boolean(neg.fehler) && neg.fehler.some((f) => f.feld === "preisErwachsener"));
}

// ── Trennung: Familienticket & Mehrfachbuchung ohne Schülerpreis ───
// Ein Event ohne Schüler-Einzelpreis darf trotzdem ein Familienticket
// und Mehrfachbuchung anbieten (eigene Preise). „Mein Kind" (einzelne
// Schüler) braucht den Schülerpreis und fällt serverseitig zurück.
{
  // Familienticket ohne Schülerpreis: angenommen, bleibt Familie.
  const fam = pruefeUndBaue(regelnFlach(), {
    weg: "familie", schueler: 4, erwachsene: 2, personen: personen(6),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Ohne Schülerpreis: Familienticket bleibt buchbar",
    !fam.fehler && fam.anmeldung.buchungsart === "FAMILIE" &&
    fam.anmeldung.teilnehmer.length === 6,
    fam.fehler ? fam.fehler[0].text : "ok");

  // Familienpreis ohne Schülerpreis: Grundpreis 30,00 + 3 weitere
  // Kinder à 6,00 = 48,00 € (unabhängig vom Schülerpreis gerechnet).
  const pFam = berechnePreis(regelnFlach(), { art: "family", schueler: 4, erwachsene: 2 });
  pruefe("Ohne Schülerpreis: Familienpreis = 48,00 €", pFam.gesamtCents === 4800, `${pFam.gesamtCents} Cent`);

  // Mehrere Erwachsene ohne Schülerpreis: angenommen.
  const erw = pruefeUndBaue(regelnFlach(), {
    weg: "erwachsene", schueler: 0, erwachsene: 3, personen: personen(3),
    einwilligungVormund: false, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Ohne Schülerpreis: mehrere Erwachsene bleiben buchbar",
    !erw.fehler && erw.anmeldung.teilnehmer.length === 3 &&
    erw.anmeldung.teilnehmer.every((t) => t.typ === "ERWACHSENER"),
    erw.fehler ? erw.fehler[0].text : "ok");

  // „Mein Kind" ohne Schülerpreis fällt auf Einzel-Erwachsener zurück.
  const kind = pruefeUndBaue(regelnFlach(), {
    weg: "kind", schueler: 3, erwachsene: 0, personen: personen(1),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Ohne Schülerpreis: manipulierter Kind-Weg → Einzel-Erwachsener",
    !kind.fehler && kind.anmeldung.buchungsart === "EINZEL" &&
    kind.anmeldung.teilnehmer.length === 1 &&
    kind.anmeldung.teilnehmer[0].typ === "ERWACHSENER",
    kind.fehler ? kind.fehler[0].text : "ok");

  // Reines Festpreis-Event (kein Familienticket, maxErwachsene=1):
  // manipulierter Familien-Weg fällt auf Einzel-Erwachsener zurück.
  const flachOhne = regelnFlach({ maxErwachsene: 1, familie: null });
  const manip = pruefeUndBaue(flachOhne, {
    weg: "familie", schueler: 4, erwachsene: 2, personen: personen(1),
    einwilligungVormund: true, agbAkzeptiert: true, kenntnisAufnahmen: true,
  });
  pruefe("Festpreis ohne Familienticket: manipulierter Familien-Weg → Einzel-Erwachsener",
    !manip.fehler && manip.anmeldung.buchungsart === "EINZEL" &&
    manip.anmeldung.teilnehmer.length === 1 &&
    manip.anmeldung.teilnehmer[0].typ === "ERWACHSENER",
    manip.fehler ? manip.fehler[0].text : "ok");
}

// ── Formular: Familienticket ohne Schülerpreis ist konfigurierbar ──
{
  const ohneSchueler = pruefeEvent({
    titel: "Flachevent", stadt: "Teststadt", karteTitel: "T", karteKurz: "K",
    kurz: "Kurz", beschreibung: "Beschreibung", preisErwachsener: "25,00",
    maxErwachsene: "6",
    familieAktiv: "an", familieBasis: "30,00", familieWeitererSchueler: "6,00",
    familieEnthaltenErwachsene: "2", familieEnthaltenSchueler: "1",
    familieMaxSchueler: "4",
  });
  pruefe("Formular: Familienticket ohne Schülerpreis wird angenommen und ist aktiv",
    !ohneSchueler.fehler && ohneSchueler.daten.familieAktiv === true &&
    ohneSchueler.daten.schuelerAktiv === false &&
    ohneSchueler.daten.preisSchuelerCents === null,
    ohneSchueler.fehler ? ohneSchueler.fehler.map((f) => f.text).join(" · ") : "ok");
}

// ── Preis-Änderungsprotokoll: welche Einträge entstehen? ───────────
{
  const stand = (erw, sch = 700, fb = 3000, fw = 600) => ({
    schueler: sch, erwachsener: erw, familieBasis: fb, familieWeitererSchueler: fw,
  });
  // Neues Event: alle Anfangspreise als alt=null.
  const neu = preisAenderungen(null, stand(1400));
  pruefe("Neues Event: vier Anfangspreise als alt=null",
    neu.length === 4 && neu.every((e) => e.altCents === null),
    `${neu.length} Einträge`);
  // Nur der Erwachsenenpreis ändert sich: genau ein Eintrag 1400→1600.
  const eine = preisAenderungen(stand(1400), stand(1600));
  pruefe("Eine Preisänderung ergibt genau einen Eintrag (1400 → 1600)",
    eine.length === 1 && eine[0].ticketart === "erwachsener" &&
    eine[0].altCents === 1400 && eine[0].neuCents === 1600,
    JSON.stringify(eine));
  // Nichts geändert: kein Eintrag.
  const keine = preisAenderungen(stand(1400), stand(1400));
  pruefe("Unveränderte Preise ergeben keinen Protokolleintrag", keine.length === 0);
}

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
