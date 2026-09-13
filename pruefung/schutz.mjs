/* ---------------------------------------------------------------
   Der Riegel vor der echten Datenbank.

   WARUM ES DIESE DATEI GIBT

   Die Prüflisten löschen. Sie müssen das: Zwei Listen, die sich
   denselben Datenstand teilen, gehen einander sonst in die Quere.
   `leeren.mjs` räumt deshalb vor jedem Lauf alle Anmeldungen,
   Teilnehmer, Bremszähler und Zahlungsereignisse weg.

   Das Repository liegt vollständig auf dem Produktionsserver — es wird
   dort per `git pull` geholt. Damit lag `pruefung/` bisher neben einer
   `.env`, die auf die ECHTE Datenbank zeigt. Ein Lauf aus dem falschen
   Verzeichnis hätte alle Buchungen echter Menschen gelöscht, ohne
   Rückfrage, ohne Warnung. Die nächtliche Sicherung wäre die einzige
   Rettung gewesen.

   Gefunden bei der Bestandsaufnahme vor dem Livegang, bevor echtes
   Geld im Spiel war.

   WIE ER WIRKT

   Zwei voneinander unabhängige Prüfungen, beide müssen zustimmen:

     1. Der NAME der Datenbank steht in der Liste unten. Produktiv
        heisst sie `vera`, zum Prüfen `vera_dev`. `vera` steht hier
        nicht — und wird hier auch nie stehen.

     2. Die öffentliche Adresse zeigt auf den eigenen Rechner. Auf dem
        Server steht dort `https://veraevents.de`. Das fängt den Fall
        ab, dass jemand eine Datenbank `vera_dev` nennt und trotzdem
        gegen die echte Anwendung prüft.

   Beide Prüfungen sind bewusst grob und ohne Ausnahmen. Ein Riegel mit
   Hintertür ist keiner: Wer ihn umgehen will, soll diese Datei ändern
   müssen — sichtbar, nachvollziehbar, in der Versionsgeschichte.

   WIE MAN IHN BENUTZT

   Als erste Zeile jeder Liste, die löscht:

       import "../schutz.mjs";      // aus einem Unterordner
       import "./schutz.mjs";       // direkt in pruefung/

   Dass keine löschende Liste ihn vergisst, prüft R/r-schutz.mjs.
   --------------------------------------------------------------- */

/** Datenbanken, gegen die geprüft werden darf. `vera` gehört NIE hierher. */
const ERLAUBTE_DATENBANKEN = ["vera_dev", "vera_test"];

/** Adressen, die als „eigener Rechner" gelten. */
const OERTLICH = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/;

function abbrechen(zeilen) {
  console.error("");
  console.error("╔═══════════════════════════════════════════════════════════╗");
  console.error("║  ABBRUCH — die Prüfung läuft NICHT gegen diese Datenbank.  ║");
  console.error("╚═══════════════════════════════════════════════════════════╝");
  console.error("");
  for (const zeile of zeilen) console.error("  " + zeile);
  console.error("");
  console.error("  Prüflisten LÖSCHEN Anmeldungen, Teilnehmer und");
  console.error("  Zahlungsereignisse. Gegen die echte Datenbank wäre das");
  console.error("  ein Totalverlust aller Buchungen.");
  console.error("");
  console.error("  Erlaubt sind nur: " + ERLAUBTE_DATENBANKEN.join(", "));
  console.error("  Nachzulesen in pruefung/schutz.mjs.");
  console.error("");
  process.exit(1);
}

/** Den Datenbanknamen aus der Verbindungsadresse holen. */
function datenbankname(adresse) {
  const ohneParameter = adresse.split("?")[0];
  const letztes = ohneParameter.split("/").pop() ?? "";
  return letztes.trim();
}

const verbindung = (process.env.DATABASE_URL ?? "").trim();
if (!verbindung) {
  abbrechen([
    "DATABASE_URL ist nicht gesetzt.",
    "Ohne sie lässt sich nicht feststellen, welche Datenbank gemeint ist.",
  ]);
}

const name = datenbankname(verbindung);
if (!ERLAUBTE_DATENBANKEN.includes(name)) {
  abbrechen([
    `Die Datenbank heisst "${name}".`,
    "Das ist keine Prüfdatenbank.",
  ]);
}

const adresse = (process.env.OEFFENTLICHE_ADRESSE ?? "").trim();
if (adresse && !OERTLICH.test(adresse)) {
  abbrechen([
    `OEFFENTLICHE_ADRESSE zeigt auf "${adresse}".`,
    "Das ist keine örtliche Adresse — es sieht nach dem echten Server aus.",
  ]);
}
