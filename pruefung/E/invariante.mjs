/* Muss immer gelten: Wer bezahlt wird, belegt auch einen Platz.
   Also: berechnePreis(...).personen === Zahl der gespeicherten Teilnehmer. */
import { pruefeUndBaue } from "../../lib/anmeldung.js";
import { berechnePreis } from "../../lib/preise.js";

const regeln = {
  schuelerCents: 700, erwachsenerCents: 1400,
  familie: { basisCents: 3000, enthalteneErwachsene: 2, enthalteneSchueler: 1,
             weitererSchuelerCents: 600, maxSchueler: 6 },
};

const p = (n) => Array.from({ length: n }, (_, i) => ({
  vorname: `V${i}`, nachname: `N${i}`, email: "a@b.de", telefon: "",
}));

const faelle = [
  { name: "selbst, Schüler",            weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0 },
  { name: "selbst, Erwachsener",        weg: "selbst", selbstAls: "adult",   schueler: 0, erwachsene: 1 },
  { name: "Kind, 1 Kind, ohne Eltern",  weg: "kind", schueler: 1, erwachsene: 0 },
  { name: "Kind, 3 Kinder, ohne Eltern",weg: "kind", schueler: 3, erwachsene: 0 },
  { name: "Kind, 1 Kind, Eltern dabei", weg: "kind", schueler: 1, erwachsene: 1 },
  { name: "Kind, 5 Kinder, Eltern dabei",weg: "kind", schueler: 5, erwachsene: 1 },
  { name: "Familie, 1 Schüler",         weg: "familie", schueler: 1, erwachsene: 2 },
  { name: "Familie, 6 Schüler",         weg: "familie", schueler: 6, erwachsene: 2 },
];

let schief = 0;
for (const f of faelle) {
  const eingabe = { weg: f.weg, selbstAls: f.selbstAls, schueler: f.schueler,
    erwachsene: f.erwachsene, personen: p(12),
    einwilligungVormund: true, einwilligungFotos: false };
  const auswahl = { art: f.weg === "familie" ? "family" : "single",
    schueler: f.weg === "selbst" ? (f.selbstAls === "student" ? 1 : 0) : f.schueler,
    erwachsene: f.weg === "selbst" ? (f.selbstAls === "adult" ? 1 : 0) : f.erwachsene };
  const preis = berechnePreis(regeln, auswahl);
  const erg = pruefeUndBaue(regeln, eingabe);
  const anzahl = erg.fehler ? `FEHLER: ${erg.fehler[0].text}` : erg.anmeldung.teilnehmer.length;
  const ok = !erg.fehler && anzahl === preis.personen;
  if (!ok) schief += 1;
  console.log(`${ok ? "✓" : "✗"} ${f.name.padEnd(28)} bezahlt für ${preis.personen} Personen (${preis.gesamtCents / 100} €), gespeichert: ${anzahl}`);
}
console.log(schief === 0 ? "\nStimmt überall." : `\n${schief} Abweichung(en).`);
