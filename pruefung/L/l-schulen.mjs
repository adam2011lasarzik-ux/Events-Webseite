/* Wann steht „Für Schulen" in der Kopfleiste?

   Der Punkt gehörte früher auf jede Seite — auch auf die Startseite
   und auf Events ohne Schüler-Zielgruppe, wo er ohne Bezug stand.
   Die Regel dafür liegt in lib/navigation.ts, getrennt von der
   Anzeige, damit sie genau hier einzeln prüfbar ist.

   Reine Logik, kein Browser und keine Datenbank nötig. Läuft mit:
     npx tsx pruefung/L/l-schulen.mjs
*/
import { zeigeSchulen } from "../../lib/navigation.js";

// Nur dieses Event hat eine Schüler-Preiskategorie.
const SLUGS = ["padel-falkensee"];

let n = 0;
const schief = [];
const pruefe = (name, ok) => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}`);
  if (!ok) schief.push(name);
};

// ── Soll NICHT erscheinen ──────────────────────────────────────
pruefe("Startseite: nicht in der Leiste", zeigeSchulen("/", SLUGS) === false);
pruefe("Event OHNE Schüler: nicht in der Leiste",
  zeigeSchulen("/events/vera-padel-event", SLUGS) === false);
pruefe("… auch nicht in dessen Anmeldung",
  zeigeSchulen("/events/vera-padel-event/anmeldung", SLUGS) === false);
pruefe("… auch nicht auf dessen kompakter Detailseite",
  zeigeSchulen("/event/vera-padel-event", SLUGS) === false);
pruefe("Über VERA: nicht in der Leiste", zeigeSchulen("/ueber-vera", SLUGS) === false);
pruefe("Fragen: nicht in der Leiste", zeigeSchulen("/faq", SLUGS) === false);
pruefe("Kontakt: nicht in der Leiste", zeigeSchulen("/kontakt", SLUGS) === false);
pruefe("Impressum: nicht in der Leiste", zeigeSchulen("/impressum", SLUGS) === false);
pruefe("Abschluss-Seite: nicht in der Leiste",
  zeigeSchulen("/anmeldung/danke", SLUGS) === false);

// ── Soll erscheinen ────────────────────────────────────────────
pruefe("Event MIT Schülern: erscheint",
  zeigeSchulen("/events/padel-falkensee", SLUGS) === true);
pruefe("… auch in dessen Anmeldung",
  zeigeSchulen("/events/padel-falkensee/anmeldung", SLUGS) === true);
pruefe("… auch auf dessen kompakter Detailseite",
  zeigeSchulen("/event/padel-falkensee", SLUGS) === true);
pruefe("Auf der Seite „Für Schulen“ selbst: erscheint",
  zeigeSchulen("/fuer-schulen", SLUGS) === true);

// ── Grenzfälle: nichts darf durchrutschen ──────────────────────
pruefe("Ein nur ähnlicher Slug zählt nicht",
  zeigeSchulen("/events/padel-falkensee-2", SLUGS) === false);
pruefe("Ohne Schüler-Events erscheint der Punkt nirgends",
  zeigeSchulen("/events/padel-falkensee", []) === false);
pruefe("Eine Adresse, die nur so aussieht, zählt nicht",
  zeigeSchulen("/eventsammlung/padel-falkensee", SLUGS) === false);

console.log(schief.length === 0
  ? `\nAlle ${n} Prüfungen bestanden.`
  : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
process.exitCode = schief.length === 0 ? 0 : 1;
