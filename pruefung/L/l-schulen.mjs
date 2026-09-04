/* Wann steht „Für Schulen" in der Kopfleiste?

   Der Punkt gehörte früher auf jede Seite — auch auf die Startseite
   und auf Events ohne Schüler-Zielgruppe, wo er ohne Bezug stand.
   Die Regel dafür liegt in lib/navigation.ts, getrennt von der
   Anzeige, damit sie genau hier einzeln prüfbar ist.

   Reine Logik, kein Browser und keine Datenbank nötig. Läuft mit:
     npx tsx pruefung/L/l-schulen.mjs
*/
import { anmeldeZiel, zeigeSchulen } from "../../lib/navigation.js";

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

// ── „Jetzt anmelden": nur, wo eindeutig ist WOFÜR ──────────────
// Vorher zeigte der Knopf überall auf „/anmeldung", und diese Adresse
// leitet stillschweigend auf die zeitlich nächste Veranstaltung weiter.
// Auf der Startseite hätte man sich damit für das falsche Event
// anmelden können.
pruefe("Startseite: kein Anmelde-Knopf", anmeldeZiel("/") === null);
pruefe("Über VERA: kein Anmelde-Knopf", anmeldeZiel("/ueber-vera") === null);
pruefe("Fragen: kein Anmelde-Knopf", anmeldeZiel("/faq") === null);
pruefe("Kontakt: kein Anmelde-Knopf", anmeldeZiel("/kontakt") === null);
pruefe("Für Schulen: kein Anmelde-Knopf", anmeldeZiel("/fuer-schulen") === null);
pruefe("Impressum: kein Anmelde-Knopf", anmeldeZiel("/impressum") === null);
pruefe("Abschluss-Seite: kein Anmelde-Knopf", anmeldeZiel("/anmeldung/danke") === null);

pruefe("Event-Seite: führt zur Anmeldung GENAU dieses Events",
  anmeldeZiel("/events/padel-falkensee") === "/events/padel-falkensee/anmeldung");
pruefe("Zweites Event: führt zu dessen eigener Anmeldung",
  anmeldeZiel("/events/vera-padel-event") === "/events/vera-padel-event/anmeldung");
pruefe("Kompakte Detailseite: führt ebenfalls zum richtigen Event",
  anmeldeZiel("/event/padel-falkensee") === "/events/padel-falkensee/anmeldung");
pruefe("Auf der Anmeldeseite selbst: kein Knopf auf sich selbst",
  anmeldeZiel("/events/padel-falkensee/anmeldung") === null);

console.log(schief.length === 0
  ? `\nAlle ${n} Prüfungen bestanden.`
  : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
process.exitCode = schief.length === 0 ? 0 : 1;
