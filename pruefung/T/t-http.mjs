/* ---------------------------------------------------------------
   Prüfliste T · Teil 2 — gegen die echte Datenbank und den echten Server

   Der eigentliche Beweis: Eine direkte HTTP-Anfrage an die
   Serveraktion darf für eine Veranstaltung ohne feststehenden Termin
   KEINE Anmeldung anlegen — auch dann nicht, wenn die Aktionsmarken
   von einer anderen, buchbaren Veranstaltung stammen. Genau so sähe
   der Umgehungsversuch aus: gültige Marken, getauschter Slug.

   Voraussetzungen: Datenbank läuft, `npm run build` ist gelaufen,
   Server auf Port 3213.
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs.
   Diese Liste legt Testveranstaltungen an und löscht Anmeldungen;
   auf dem Produktionsserver wäre das ein Datenverlust. */
import "../schutz.mjs";

import { db } from "../../lib/db.js";
import { bezahlseiteFuer } from "../../lib/zahlungStart.js";

const BASIS = "http://127.0.0.1:3213";
const SLUG_OHNE = "pruef-ohne-termin";
const SLUG_MIT = "pruef-mit-termin";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name, zusatz); }
};

/* ── Testdaten anlegen ──────────────────────────────────────── */
const testSlugs = [SLUG_OHNE, SLUG_MIT];
await db.registration.deleteMany({ where: { event: { slug: { in: testSlugs } } } });
await db.event.deleteMany({ where: { slug: { in: testSlugs } } });

const grunddaten = (slug, titel, startAt) => ({
  slug,
  titel,
  karteTitel: titel,
  karteKurz: "Nur für die Prüfliste T.",
  kurz: "Nur für die Prüfliste T.",
  beschreibung: "Nur für die Prüfliste T.",
  status: "VEROEFFENTLICHT",
  startAt,
  endAt: null,
  ortName: "Prüfhalle",
  stadt: "Teststadt",
  maxPersonen: 50,
  schuelerAktiv: true,
  preisSchuelerCents: 700,
  preisErwachsenerCents: 1400,
  familieAktiv: false,
});

const ohneTermin = await db.event.create({
  data: grunddaten(SLUG_OHNE, "Prüfung: Veranstaltung ohne Termin", null),
});

/* Eine buchbare Vergleichsveranstaltung — die Prüfliste bringt ihre
   eigene mit, statt sich auf den Datenbestand zu verlassen. */
const mitTermin = await db.event.create({
  data: grunddaten(
    SLUG_MIT,
    "Prüfung: Veranstaltung mit Termin",
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  ),
});

/* ── T6: Die Seite bietet gar kein Formular an ──────────────── */
console.log("\nT6 · Anmeldeseite ohne Termin");
const seite = await (await fetch(`${BASIS}/events/${SLUG_OHNE}/anmeldung`)).text();
pruefe("Seite ist erreichbar (kein 404)", seite.length > 0);
pruefe("Seite nennt „Termin folgt“", /Termin folgt/.test(seite));
pruefe("Seite enthält KEIN Anmeldeformular", !/name="eventSlug"/.test(seite));
/* Auf das KNOPF-ELEMENT prüfen, nicht auf die Zeichenkette.

   Seit B-28 heißt der Bestellknopf wörtlich „Zahlungspflichtig
   bestellen" (§ 312j Abs. 3 BGB). Dieser Wortlaut steht damit im
   Wörterbuch — und das Wörterbuch wird auf JEDER Seite als
   serialisierte Eigenschaft mitgeliefert, auch auf einer ohne
   Formular. Eine Suche nach der bloßen Zeichenkette meldete deshalb
   einen Fehler, den es nicht gibt. Gesucht wird jetzt die
   Schaltfläche selbst. */
pruefe(
  "Seite enthält KEINEN Bestellknopf",
  !/<button[^>]*type="submit"[^>]*>\s*Zahlungspflichtig bestellen/i.test(seite),
);

/* ── T7: Die direkte Anfrage wird abgelehnt ─────────────────── */
console.log("\nT7 · Direkte Anfrage an die Serveraktion (Umgehungsversuch)");

/* Aktionsmarken von einer buchbaren Veranstaltung holen. */
const buchbar = mitTermin;
const quelle = await (await fetch(`${BASIS}/events/${buchbar.slug}/anmeldung`)).text();
const feld = (name) => {
  const m = quelle.match(
    new RegExp(`<input type="hidden" name="\\${name}"(?: value="([^"]*)")?/>`),
  );
  return m ? (m[1] ?? "").replace(/&quot;/g, '"') : null;
};
const marken = {
  "$ACTION_REF_1": feld("$ACTION_REF_1"),
  "$ACTION_1:0": feld("$ACTION_1:0"),
  "$ACTION_1:1": feld("$ACTION_1:1"),
  "$ACTION_KEY": feld("$ACTION_KEY"),
};
pruefe("Gültige Aktionsmarken von der buchbaren Seite geholt", marken["$ACTION_KEY"] !== null);

const daten = new FormData();
for (const [k, v] of Object.entries(marken)) if (v !== null) daten.append(k, v);
daten.append("eventSlug", SLUG_OHNE);          // ← der getauschte Slug
daten.append("weg", "selbst");
daten.append("selbstAls", "adult");
daten.append("schueler", "0");
daten.append("erwachsene", "1");
daten.append("person.0.vorname", "Test");
daten.append("person.0.nachname", "Person");
daten.append("person.0.email", "pruefung-termin@example.org");
daten.append("person.0.telefon", "");
daten.append("webseite", "");

const antwort = await fetch(`${BASIS}/events/${buchbar.slug}/anmeldung`, {
  method: "POST",
  body: daten,
  redirect: "manual",
  headers: { "x-forwarded-for": "203.0.113.77" },
});
const rumpf = await antwort.text();
const ziel = antwort.headers.get("x-action-redirect") ?? antwort.headers.get("location");

pruefe("Keine Weiterleitung zur Bezahlseite oder Danke-Seite", !ziel || !/danke|stripe|checkout/i.test(ziel), `ziel=${ziel}`);
pruefe("Antwort nennt den fehlenden Termin", /kein Termin fest/.test(rumpf));

const angelegt = await db.registration.count({ where: { eventId: ohneTermin.id } });
pruefe("KEINE Anmeldung in der Datenbank angelegt", angelegt === 0, `gefunden: ${angelegt}`);

/* ── T8: Auch die Bezahlung ist gesperrt ────────────────────── */
console.log("\nT8 · Zahlungsstart bei entferntem Termin");

/* Eine Anmeldung auf der buchbaren Veranstaltung anlegen, dann dort
   den Termin entfernen — der Fall, dass ein Admin den Termin nach der
   Buchung löscht. */
const buchbarVoll = mitTermin;
const testAnmeldung = await db.registration.create({
  data: {
    eventId: buchbarVoll.id,
    kontaktVorname: "Zahl",
    kontaktNachname: "Test",
    kontaktEmail: "pruefung-termin-zahlung@example.org",
    buchungsart: "EINZEL",
    istVormundBuchung: false,
    einwilligungVormund: false,
    agbAkzeptiert: true,
    kenntnisAufnahmen: true,
    status: "RESERVIERT",
    reserviertBis: new Date(Date.now() + 30 * 60 * 1000),
    gesamtpreisCents: 1400,
    zahlungsStatus: "OFFEN",
    teilnehmer: { create: [{ vorname: "Zahl", nachname: "Test", typ: "ERWACHSENER" }] },
  },
});

const vorher = await bezahlseiteFuer(testAnmeldung.id);
pruefe("Mit Termin: Zahlung wird nicht wegen des Termins abgelehnt",
  !("fehler" in vorher) || vorher.fehler !== "kein-termin", JSON.stringify(vorher));

await db.event.update({ where: { id: buchbarVoll.id }, data: { startAt: null } });
const nachher = await bezahlseiteFuer(testAnmeldung.id);
pruefe("Ohne Termin: Zahlung abgelehnt mit Grund „kein-termin“",
  "fehler" in nachher && nachher.fehler === "kein-termin", JSON.stringify(nachher));

/* ── Aufräumen ──────────────────────────────────────────────── */
await db.registration.deleteMany({ where: { event: { slug: { in: testSlugs } } } });
await db.event.deleteMany({ where: { slug: { in: testSlugs } } });

const restEvents = await db.event.count({ where: { slug: { in: testSlugs } } });
pruefe("Testdaten wieder entfernt", restEvents === 0);

console.log(`\nErgebnis Teil 2: ${ok} bestanden, ${fehl} durchgefallen\n`);
await db.$disconnect();
process.exit(fehl === 0 ? 0 : 1);
