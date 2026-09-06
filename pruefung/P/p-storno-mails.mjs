/* ---------------------------------------------------------------
   Die E-Mail-Texte rund um die Stornierung.

   Reine Vorlagen — es wird nichts verschickt:
       npx tsx pruefung/P/p-storno-mails.mjs
   --------------------------------------------------------------- */

import { stornoLink } from "../../lib/storno.ts";
import {
  bestaetigungsMail,
  zahlungsBestaetigungsMail,
  stornoBestaetigungsMail,
  stornoAdminMail,
} from "../../lib/mailVorlagen.ts";

let gut = 0;
let schlecht = 0;

/* Geldbeträge tragen ein GESCHÜTZTES Leerzeichen vor dem Euro-Zeichen
   (U+00A0), kein gewöhnliches. Wer danach mit einem normalen
   Leerzeichen sucht, findet nichts — und hält den Produktcode für
   kaputt, obwohl der Test falsch ist. Genau das ist hier beim ersten
   Lauf passiert. */
const ohneSonderleerzeichen = (t) => t.replace(/\u00a0/g, " ");
function pruefe(name, bedingung, zusatz = "") {
  if (bedingung) gut += 1;
  else schlecht += 1;
  console.log(`${bedingung ? "✓" : "✗"} ${gut + schlecht}. ${name}${zusatz ? `  — ${zusatz}` : ""}`);
}

const anmeldung = {
  id: "abc123",
  kontaktVorname: "Anna",
  kontaktNachname: "Beispiel",
  kontaktEmail: "anna@beispiel.example",
  kontaktTelefon: null,
  gesamtpreisCents: 2500,
  teilnehmer: [{ vorname: "Anna", nachname: "Beispiel" }],
};
const event = {
  titel: "VERA Padel Event",
  startAt: new Date("2026-10-01T16:00:00Z"),
  ortName: "Padelpark",
  stadt: "Falkensee",
};

/* ── Der Link selbst ────────────────────────────────────────────── */

const link = stornoLink("https://veraevents.de", "abc123", "geheim-schluessel");
pruefe(
  "Der Link zeigt auf die Storno-Seite",
  link === "https://veraevents.de/anmeldung/stornieren?nr=abc123&schluessel=geheim-schluessel",
  link,
);
pruefe(
  "Ein Schrägstrich am Ende der Adresse stört nicht",
  stornoLink("https://veraevents.de/", "abc123", "x") ===
    "https://veraevents.de/anmeldung/stornieren?nr=abc123&schluessel=x",
);
pruefe("Ohne Adresse kein Link", stornoLink("", "abc123", "x") === null);
pruefe("Ohne Schlüssel kein Link", stornoLink("https://veraevents.de", "abc123", null) === null);
pruefe(
  "Sonderzeichen im Schlüssel werden kodiert",
  stornoLink("https://x.de", "a", "mit/und+zeichen").includes("mit%2Fund%2Bzeichen"),
);

/* ── Der Storno-Abschnitt in den Bestätigungen ──────────────────── */

const mitLink = zahlungsBestaetigungsMail(anmeldung, event, link);
pruefe("Die Zahlungsbestätigung enthält den Storno-Link", mitLink.text.includes(link));
pruefe(
  "… und erklärt die 24-Stunden-Frist",
  mitLink.text.includes("24 Stunden") && mitLink.text.includes("zurückerstattet"),
);

const ohneLink = zahlungsBestaetigungsMail(anmeldung, event, null);
pruefe(
  "Ohne Link fehlt der Abschnitt ganz — kein kaputter Hinweis",
  !ohneLink.text.includes("stornieren") && !ohneLink.text.includes("24 Stunden"),
);
pruefe(
  "… der Rest der Mail bleibt vollständig",
  ohneLink.text.includes("Anmeldenummer: abc123") && ohneLink.text.includes("VERA Padel Event"),
);

const anmeldeMail = bestaetigungsMail(anmeldung, event, link);
pruefe("Auch die Anmeldebestätigung enthält den Link", anmeldeMail.text.includes(link));

/* ── Die Stornierungs-Bestätigung ───────────────────────────────── */

const mitErstattung = stornoBestaetigungsMail(anmeldung, event, true);
pruefe(
  "Betreff nennt die Stornierung",
  mitErstattung.betreff === "Stornierung bestätigt: VERA Padel Event",
  mitErstattung.betreff,
);
pruefe(
  "Der erstattete Betrag steht drin",
  ohneSonderleerzeichen(mitErstattung.text).includes("25,00 €"),
);
pruefe("… und dass der Platz frei ist", mitErstattung.text.includes("Platz ist wieder frei"));

const ohneErstattung = stornoBestaetigungsMail(anmeldung, event, false);
pruefe(
  "Ohne Erstattung wird kein Geld versprochen",
  !ohneSonderleerzeichen(ohneErstattung.text).includes("25,00 €") &&
    ohneErstattung.text.includes("nichts erstattet"),
);

/* ── Die Nachricht an den Veranstalter ──────────────────────────── */

const anAdmin = stornoAdminMail(anmeldung, event, true);
pruefe(
  "Der Betreff nennt Event und Personenzahl",
  anAdmin.betreff === "Stornierung: VERA Padel Event (1 Person)",
  anAdmin.betreff,
);
pruefe("Kontaktdaten sind enthalten", anAdmin.text.includes("anna@beispiel.example"));
pruefe("Die Erstattung ist vermerkt", anAdmin.text.includes("automatisch angewiesen"));
pruefe("Die frei gewordenen Plätze stehen drin", anAdmin.text.includes("1 Platz/Plätze"));

const anAdminOhne = stornoAdminMail(anmeldung, event, false);
pruefe(
  "Ohne Erstattung steht das auch so da",
  anAdminOhne.text.includes("keine — für diese Buchung war nichts bezahlt"),
);

const mehrere = stornoAdminMail(
  { ...anmeldung, teilnehmer: [...anmeldung.teilnehmer, { vorname: "Ben", nachname: "Beispiel" }] },
  event,
  true,
);
pruefe(
  "Bei mehreren Personen stimmt die Mehrzahl",
  mehrere.betreff.includes("(2 Personen)"),
  mehrere.betreff,
);

/* ── Der Schlüssel darf NIRGENDS in der Admin-Mail stehen ───────── */

pruefe(
  "Die Mail an den Veranstalter enthält keinen Storno-Link",
  !anAdmin.text.includes("stornieren?nr="),
);

console.log("");
if (schlecht === 0) {
  console.log(`Alle ${gut} Prüfungen bestanden.\n`);
  process.exit(0);
}
console.log(`${gut} von ${gut + schlecht} bestanden, ${schlecht} fehlgeschlagen.\n`);
process.exit(1);
