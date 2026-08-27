/* Anmeldungen verwalten: Status, Zahlung, Anonymisieren, CSV, Löschen. */
import { anmelden, hole, sende, actionFelder, alsText, BASIS } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

await db.anmeldeVersuch.deleteMany({});
const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "192.0.2.40");
const K = s.cookie;
const EVENT = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

// Eine Familienanmeldung mit 5 Personen anlegen — und eine mit
// einem Namen, der eine Tabellenkalkulation zur Formel verleiten würde.
const familie = await db.registration.create({
  data: {
    eventId: EVENT.id, kontaktVorname: "Anna", kontaktNachname: "Klein",
    kontaktEmail: "anna@example.org", kontaktTelefon: "030 12345",
    gesamtpreisCents: 4200, buchungsart: "FAMILIE", status: "BESTAETIGT",
    istVormundBuchung: true, einwilligungVormund: true,
    teilnehmer: { create: [
      { vorname: "Anna", nachname: "Klein", typ: "ERWACHSENER" },
      { vorname: "Bernd", nachname: "Klein", typ: "ERWACHSENER" },
      { vorname: "Cara", nachname: "Klein", typ: "SCHUELER" },
      { vorname: "Dirk", nachname: "Klein", typ: "SCHUELER" },
      { vorname: "Eva", nachname: "Klein", typ: "SCHUELER" },
    ] },
  },
});
const boese = await db.registration.create({
  data: {
    eventId: EVENT.id, kontaktVorname: "=HYPERLINK(\"http://boese.example\")",
    kontaktNachname: "Müller; Schmidt", kontaktEmail: "boese@example.org",
    gesamtpreisCents: 700, status: "BESTAETIGT",
    teilnehmer: { create: [{ vorname: "+49", nachname: 'Anführung"szeichen', typ: "SCHUELER" }] },
  },
});

const liste = await hole(`/admin/events/${EVENT.id}/anmeldungen`, K);
pruefe("Anmeldungsliste ist erreichbar", liste.status === 200);
pruefe("Eine Zeile je Anmeldung, aufklappbar",
  (liste.html.match(/<details/g) ?? []).length === 2,
  `${(liste.html.match(/<details/g) ?? []).length} Zeilen`);
const listeText = alsText(liste.html);
pruefe("Personenzahl und Betrag stehen in der Zeile",
  listeText.includes("5 Personen (3 Schüler, 2 Erwachsene)") && listeText.includes("42,00 €"));
pruefe("Aufgeklappt stehen die Teilnehmer",
  liste.html.includes("Cara") && liste.html.includes("Eva"));

pruefe("Belegte Plätze zählen PERSONEN, nicht Anmeldungen",
  listeText.includes("6 von 100 Plätzen belegt"), "6 Teilnehmer aus 2 Anmeldungen");

// ── Status umstellen ───────────────────────────────────────────
const statusFelder = actionFelder(liste.html, 'name="status"');
await sende(`/admin/events/${EVENT.id}/anmeldungen`, statusFelder,
  { anmeldungId: familie.id, status: "WARTELISTE" }, K);
let stand = await db.registration.findUniqueOrThrow({ where: { id: familie.id } });
pruefe("Auf Warteliste setzen wirkt", stand.status === "WARTELISTE");

const uebersicht = await hole("/admin", K);
pruefe("Die Übersicht zeigt die geänderten Zahlen sofort",
  alsText(uebersicht.html).includes("auf der Warteliste"));

await sende(`/admin/events/${EVENT.id}/anmeldungen`, statusFelder,
  { anmeldungId: familie.id, status: "STORNIERT" }, K);
stand = await db.registration.findUniqueOrThrow({ where: { id: familie.id } });
pruefe("Stornieren setzt den Zeitstempel", stand.status === "STORNIERT" && stand.storniertAm !== null);

await sende(`/admin/events/${EVENT.id}/anmeldungen`, statusFelder,
  { anmeldungId: familie.id, status: "BESTAETIGT" }, K);
stand = await db.registration.findUniqueOrThrow({ where: { id: familie.id } });
pruefe("Wieder bestätigen räumt den Stornierungs-Zeitstempel weg",
  stand.status === "BESTAETIGT" && stand.storniertAm === null && stand.reaktiviertAm !== null);

// ── Erfundener Status wird abgewiesen ──────────────────────────
await sende(`/admin/events/${EVENT.id}/anmeldungen`, statusFelder,
  { anmeldungId: familie.id, status: "GIBT_ES_NICHT" }, K);
stand = await db.registration.findUniqueOrThrow({ where: { id: familie.id } });
pruefe("Ein erfundener Status ändert nichts", stand.status === "BESTAETIGT");

// ── Zahlung ────────────────────────────────────────────────────
const zahlFelder = actionFelder(liste.html, 'name="zahlungsStatus"');
await sende(`/admin/events/${EVENT.id}/anmeldungen`, zahlFelder,
  { anmeldungId: familie.id, zahlungsStatus: "BEZAHLT" }, K);
stand = await db.registration.findUniqueOrThrow({ where: { id: familie.id } });
pruefe("Als bezahlt markieren setzt Betrag und Zeitpunkt",
  stand.zahlungsStatus === "BEZAHLT" &&
  stand.bezahlterBetragCents === 4200 && stand.bezahltAm !== null,
  `${stand.bezahlterBetragCents} Cent`);

const u2 = alsText((await hole("/admin", K)).html);
pruefe("Die Übersicht verbucht den Betrag als bezahlt",
  /42,00 € bezahlt/.test(u2), u2.match(/[\d,]+ € offen [\d,]+ € bezahlt/)?.[0] ?? "");

// ── CSV ────────────────────────────────────────────────────────
const csv = await fetch(`${BASIS}/admin/events/${EVENT.id}/anmeldungen/csv`, {
  headers: { cookie: K },
});
// Bewusst ueber die Rohbytes: fetch().text() entfernt ein BOM beim
// Dekodieren, die Pruefung ginge sonst immer schief, obwohl die Datei
// in Ordnung ist.
const bytes = new Uint8Array(await csv.arrayBuffer());
const text = new TextDecoder("utf-8").decode(bytes);
pruefe("CSV wird als Datei ausgeliefert",
  csv.headers.get("content-disposition")?.includes("attachment") === true,
  csv.headers.get("content-disposition") ?? "");
pruefe("CSV beginnt mit dem BOM (Excel liest dann Umlaute richtig)",
  bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
  [...bytes.slice(0, 3)].map((b) => b.toString(16).padStart(2, "0")).join(" "));
pruefe("Eine Zeile je Teilnehmer", text.trim().split("\r\n").length === 1 + 5 + 1,
  `${text.trim().split("\r\n").length} Zeilen (1 Kopf + 6 Teilnehmer)`);
pruefe("Formel-Falle entschärft: führendes = bekommt einen Apostroph",
  text.includes(`"'=HYPERLINK`), "CSV Injection");
pruefe("… ebenso ein führendes +", text.includes(`"'+49"`));
pruefe("Semikolon im Namen zerlegt die Zeile nicht",
  text.includes(`"Müller; Schmidt"`));
pruefe("Anführungszeichen im Namen sind verdoppelt",
  text.includes(`"Anführung""szeichen"`));
pruefe("Umlaute stehen richtig drin", text.includes("Müller") && text.includes("Schüler"));

// ── Anonymisieren ──────────────────────────────────────────────
const anonFelder = actionFelder(liste.html, "Personendaten löschen");
await sende(`/admin/events/${EVENT.id}/anmeldungen`, anonFelder,
  { anmeldungId: familie.id }, K);
stand = await db.registration.findUniqueOrThrow({
  where: { id: familie.id }, include: { teilnehmer: true },
});
pruefe("Anonymisieren überschreibt die Kontaktdaten",
  stand.kontaktVorname === "Gelöscht" && stand.kontaktTelefon === null &&
  !stand.kontaktEmail.includes("anna"), stand.kontaktEmail);
pruefe("… und ALLE Teilnehmer mit",
  stand.teilnehmer.every((t) => t.vorname === "Gelöscht") &&
  !JSON.stringify(stand.teilnehmer).includes("Cara"),
  "keine verwaisten Personendaten");
pruefe("… Betrag und Datum bleiben für die Buchhaltung erhalten",
  stand.gesamtpreisCents === 4200 && stand.angemeldetAm !== null && stand.anonymisiertAm !== null);

const liste2 = await hole(`/admin/events/${EVENT.id}/anmeldungen`, K);
pruefe("Die Liste weist die Löschung aus",
  alsText(liste2.html).includes("Personendaten wurden am"));

// ── Löschen nur ohne Anmeldungen ───────────────────────────────
const bearbeiten = await hole(`/admin/events/${EVENT.id}`, K);
pruefe("Ein Event MIT Anmeldungen bietet gar keinen Löschknopf an",
  !bearbeiten.html.includes("endgültig löschen"));

await db.participant.deleteMany({ where: { registrationId: { in: [familie.id, boese.id] } } });
await db.registration.deleteMany({ where: { id: { in: [familie.id, boese.id] } } });

const bearbeiten2 = await hole(`/admin/events/${EVENT.id}`, K);
pruefe("Ohne Anmeldungen erscheint der Löschknopf",
  bearbeiten2.html.includes("endgültig löschen"));

console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
