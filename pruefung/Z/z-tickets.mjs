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

const regeln = (max = 4) => ({
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

const personen = (n) =>
  Array.from({ length: n }, (_, i) => ({
    vorname: `V${i}`,
    nachname: `N${i}`,
    email: i === 0 ? "kontakt@beispiel.de" : "",
    telefon: "",
  }));

const eingabeErwachsene = (anzahl, max = 4) => ({
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

// ── 1 bis 4 Erwachsene werden angenommen ───────────────────────────
for (const anzahl of [1, 2, 3, 4]) {
  const { regeln: r, eingabe } = eingabeErwachsene(anzahl);
  const erg = pruefeUndBaue(r, eingabe);
  const ok =
    !erg.fehler &&
    erg.anmeldung.teilnehmer.length === anzahl &&
    erg.anmeldung.teilnehmer.every((t) => t.typ === "ERWACHSENER");
  pruefe(`${anzahl} Erwachsene werden angenommen`, ok,
    erg.fehler ? erg.fehler[0].text : `${erg.anmeldung.teilnehmer.length} Teilnehmer`);
}

// ── Mehr als 4 Erwachsene werden abgelehnt ─────────────────────────
{
  const { regeln: r, eingabe } = eingabeErwachsene(5);
  const erg = pruefeUndBaue(r, eingabe);
  pruefe("5 Erwachsene werden abgelehnt (Standardgrenze 4)",
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
  const b = begrenzeAuswahl(regeln(4), { art: "single", schueler: 0, erwachsene: 99 });
  pruefe("Manipulierte 99 Erwachsene werden auf 4 gekappt", b.erwachsene === 4, `erwachsene=${b.erwachsene}`);
}

// ── maxErwachsene ist pro Event einstellbar ────────────────────────
{
  const { regeln: r6, eingabe: e6 } = eingabeErwachsene(6, 6);
  const ok6 = !pruefeUndBaue(r6, e6).fehler;
  const { regeln: r6b, eingabe: e7 } = eingabeErwachsene(7, 6);
  const abgelehnt7 = Boolean(pruefeUndBaue(r6b, e7).fehler);
  pruefe("Bei maxErwachsene=6 sind 6 erlaubt und 7 abgelehnt", ok6 && abgelehnt7);
}

// ── Familienpaket: mindestens 4 Kinder möglich ─────────────────────
for (const kinder of [4, 5, 6]) {
  const b = begrenzeAuswahl(regeln(), { art: "family", schueler: kinder, erwachsene: 2 });
  pruefe(`Familienpaket erlaubt ${kinder} Kinder`, b.schueler === kinder, `schueler=${b.schueler}`);
}
// Grundpreis (1 Kind enthalten) + 3 weitere × 6,00 € bei 4 Kindern.
{
  const p = berechnePreis(regeln(), { art: "family", schueler: 4, erwachsene: 2 });
  pruefe("Familienpaket mit 4 Kindern: 30,00 € + 3 × 6,00 € = 48,00 €",
    p.gesamtCents === 4800 && p.personen === 6, `${p.gesamtCents} Cent, ${p.personen} Personen`);
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
  pruefe("Formular: leeres maxErwachsene → Standard 4", !leer.fehler && leer.daten.maxErwachsene === 4);
  for (const wert of ["0", "21", "abc", "-3"]) {
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
