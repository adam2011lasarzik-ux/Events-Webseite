/* ---------------------------------------------------------------
   Prüfliste zu Schritt E — gegen die echte Datenbank und den echten
   Server, nicht gegen nachgebaute Logik.

   Jeder Punkt kommt aus dem Plan (Abschnitt „Schritt E — Verifikation").
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { absenden as formularAbsenden, personen, BASIS } from "./senden.mjs";
import * as zw from "../zahlweg.mjs";
import { db } from "../../lib/db.js";
import { berechnePreis } from "../../lib/preise.js";

/**
 * Absenden — und die Zahlung gleich mit.
 *
 * Bis zum 26.09.2026 genügte hier das Absenden: Die Anmeldung stand
 * danach in der Datenbank, und die Liste konnte sie nachsehen. Seit
 * Stufe 2 entsteht sie erst mit der bestätigten Zahlung. Diese Liste
 * prüft aber nicht den Bezahlweg, sondern das, was das Formular aus
 * den Eingaben macht: Preise, Teilnehmer, Plätze, Duplikate, Bremse.
 * Damit diese Fragen dieselben bleiben, geht der Weg bis zum Ende —
 * und der Rest der Liste steht unverändert.
 *
 * Wird gar nicht weitergeleitet (abgelehnt, gebremst, ausgebucht),
 * wird auch nichts bezahlt; die Antwort kommt unverändert zurück.
 */
async function absenden(werte, ip) {
  const antwort = await formularAbsenden(werte, ip);
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);
  if (sitzungId) await zw.rueckmeldung(BASIS, await zw.bezahlen(sitzungId));
  return { ...antwort, sitzungId };
}

let nummer = 0;
const fehlgeschlagen = [];

function pruefe(name, bedingung, zusatz = "") {
  nummer += 1;
  const zeichen = bedingung ? "✓" : "✗";
  console.log(`${zeichen} ${nummer}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!bedingung) fehlgeschlagen.push(name);
}

const SLUG = "padel-falkensee";
let ipZaehler = 0;
const neueIp = () => `198.51.100.${(ipZaehler += 1)}`;

async function leeren() {
  await db.participant.deleteMany({});
  await db.registration.deleteMany({});
  await db.anmeldeVersuch.deleteMany({});
  await db.zahlungsEreignis.deleteMany({});
  await db.fehlbuchung.deleteMany({});
}

async function letzte() {
  return db.registration.findFirst({
    orderBy: { angemeldetAm: "desc" },
    include: { teilnehmer: true },
  });
}

async function main() {
  const event = await db.event.findFirstOrThrow({ where: { slug: SLUG } });
  const regeln = {
    schuelerCents: event.preisSchuelerCents,
    erwachsenerCents: event.preisErwachsenerCents,
    familie: event.familieAktiv
      ? {
          basisCents: event.familieBasisCents,
          enthalteneErwachsene: event.familieEnthaltenErwachsene,
          enthalteneSchueler: event.familieEnthaltenSchueler,
          weitererSchuelerCents: event.familieWeitererSchuelerCents,
          maxSchueler: event.familieMaxSchueler,
        }
      : null,
  };

  await leeren();

  // ── 1. Einzelbuchung Schüler ─────────────────────────────────
  await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "Lena", nachname: "Schmidt", email: "lena@example.org", telefon: "030111" }]) },
    neueIp(),
  );
  let a = await letzte();
  pruefe("Einzelbuchung Schüler kostet 7,00 €", a?.gesamtpreisCents === 700, `${a?.gesamtpreisCents} Cent`);
  pruefe("… und legt genau einen Teilnehmer an", a?.teilnehmer.length === 1 && a.teilnehmer[0].typ === "SCHUELER");

  // ── 2. Einzelbuchung Erwachsener ─────────────────────────────
  await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "adult", schueler: 0, erwachsene: 1, webseite: "",
      ...personen([{ vorname: "Mark", nachname: "Weber", email: "mark@example.org", telefon: "" }]) },
    neueIp(),
  );
  a = await letzte();
  pruefe("Einzelbuchung Erwachsener kostet 14,00 €", a?.gesamtpreisCents === 1400, `${a?.gesamtpreisCents} Cent`);
  pruefe("… Teilnehmertyp ist ERWACHSENER", a?.teilnehmer[0]?.typ === "ERWACHSENER");

  // ── 3. Familie mit Mindestzahl ───────────────────────────────
  await absenden(
    { eventSlug: SLUG, weg: "familie", schueler: 1, erwachsene: 2, webseite: "",
      einwilligungVormund: "an",
      ...personen([
        { vorname: "Anna", nachname: "Klein", email: "anna@example.org", telefon: "030222" },
        { vorname: "Bernd", nachname: "Klein" },
        { vorname: "Cara", nachname: "Klein" },
      ]) },
    neueIp(),
  );
  a = await letzte();
  pruefe("Familienpaket Mindestzahl kostet 30,00 €", a?.gesamtpreisCents === 3000, `${a?.gesamtpreisCents} Cent`);
  pruefe("… 3 Teilnehmer, Buchungsart FAMILIE",
    a?.teilnehmer.length === 3 && a.buchungsart === "FAMILIE");

  // ── 4. Familie mit Höchstzahl ────────────────────────────────
  await absenden(
    { eventSlug: SLUG, weg: "familie", schueler: 6, erwachsene: 2, webseite: "",
      einwilligungVormund: "an",
      ...personen([
        { vorname: "Dana", nachname: "Groß", email: "dana@example.org", telefon: "" },
        { vorname: "Emil", nachname: "Groß" },
        ...["F", "G", "H", "I", "J", "K"].map((n) => ({ vorname: n, nachname: "Groß" })),
      ]) },
    neueIp(),
  );
  a = await letzte();
  pruefe("Familienpaket Höchstzahl kostet 60,00 €", a?.gesamtpreisCents === 6000, `${a?.gesamtpreisCents} Cent`);

  // ── 5. Angezeigter Preis = serverseitig berechneter Preis ─────
  const angezeigt = berechnePreis(regeln, { art: "family", schueler: 6, erwachsene: 2 });
  pruefe("Angezeigter und gespeicherter Preis sind identisch",
    angezeigt.gesamtCents === a?.gesamtpreisCents,
    `Anzeige ${angezeigt.gesamtCents}, Datenbank ${a?.gesamtpreisCents}`);

  pruefe("Familienpaket Höchstzahl belegt 8 Plätze (2 Erwachsene + 6 Schüler)",
    a?.teilnehmer.length === 8, `${a?.teilnehmer.length} Teilnehmer`);

  // ── 6. Gruppe von 6 belegt 6 Plätze ──────────────────────────
  // Weg „Mein Kind": 5 Kinder plus mitkommender Elternteil.
  await absenden(
    { eventSlug: SLUG, weg: "kind", schueler: 5, erwachsene: 1, webseite: "",
      einwilligungVormund: "an",
      ...personen([
        ...Array.from({ length: 5 }, (_, i) => ({ vorname: `Kind${i + 1}`, nachname: "Sechs" })),
        { vorname: "Mutter", nachname: "Sechs", email: "sechs@example.org", telefon: "" },
      ]) },
    neueIp(),
  );
  a = await letzte();
  pruefe("Gruppe mit 6 Personen belegt 6 Plätze", a?.teilnehmer.length === 6,
    `${a?.teilnehmer.length} Teilnehmer`);
  pruefe("… der mitkommende Elternteil ist als Erwachsener dabei",
    a?.teilnehmer.filter((x) => x.typ === "ERWACHSENER").length === 1);
  pruefe("… und kostet 49,00 € (5 × 7 € + 14 €)", a?.gesamtpreisCents === 4900,
    `${a?.gesamtpreisCents} Cent`);

  // ── 7. Manipulierte Teilnehmerzahl wird begrenzt ─────────────
  // 10 Schüler ist die Obergrenze aus begrenzeAuswahl(); danach folgt
  // der Elternteil als 11. Feldgruppe.
  await absenden(
    { eventSlug: SLUG, weg: "kind", schueler: 5000, erwachsene: 0, webseite: "",
      einwilligungVormund: "an",
      ...personen([
        ...Array.from({ length: 10 }, (_, i) => ({ vorname: `K${i}`, nachname: "Viel" })),
        { vorname: "Eltern", nachname: "Viel", email: "viel@example.org", telefon: "" },
      ]) },
    neueIp(),
  );
  a = await letzte();
  pruefe("5000 Schüler werden auf 10 begrenzt", a?.teilnehmer.length === 10,
    `gespeichert: ${a?.teilnehmer.length}`);
  pruefe("… und der Preis passt zur begrenzten Zahl (70,00 €)", a?.gesamtpreisCents === 7000,
    `${a?.gesamtpreisCents} Cent`);

  // ── 8. Manipulierter Preis wird ignoriert ────────────────────
  await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "adult", schueler: 0, erwachsene: 1, webseite: "",
      gesamtpreisCents: 1, preis: 1, gesamtCents: 1, betrag: "0,01",
      ...personen([{ vorname: "Trick", nachname: "Betrug", email: "trick@example.org", telefon: "" }]) },
    neueIp(),
  );
  a = await letzte();
  pruefe("Mitgeschickter Betrag von 1 Cent wird ignoriert", a?.gesamtpreisCents === 1400,
    `gespeichert: ${a?.gesamtpreisCents} Cent`);

  // ── 9. Honeypot ──────────────────────────────────────────────
  const vorHoney = await db.registration.count();
  const honig = await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0,
      webseite: "http://spam.example",
      ...personen([{ vorname: "Bot", nachname: "Netz", email: "bot@example.org", telefon: "" }]) },
    neueIp(),
  );
  pruefe("Ausgefülltes Bot-Feld speichert nichts",
    (await db.registration.count()) === vorHoney && honig.status === 200);

  // ── 10. Ungültige E-Mail ─────────────────────────────────────
  const vorMail = await db.registration.count();
  const mailAntwort = await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "Ohne", nachname: "Klammeraffe", email: "keine-adresse", telefon: "" }]) },
    neueIp(),
  );
  pruefe("Ungültige E-Mail-Adresse speichert nichts",
    (await db.registration.count()) === vorMail);
  pruefe("… und meldet das verständlich am Feld",
    mailAntwort.text.includes("E-Mail-Adresse sieht nicht richtig aus"));

  // ── 11. Leere Pflichtfelder ──────────────────────────────────
  const vorLeer = await db.registration.count();
  const leerAntwort = await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "", nachname: "", email: "", telefon: "" }]) },
    neueIp(),
  );
  pruefe("Leere Pflichtfelder speichern nichts", (await db.registration.count()) === vorLeer);
  pruefe("… und melden Vorname, Nachname und E-Mail einzeln",
    leerAntwort.text.includes("Bitte den Vornamen angeben") &&
    leerAntwort.text.includes("Bitte den Nachnamen angeben") &&
    leerAntwort.text.includes("Bitte eine E-Mail-Adresse angeben"));

  // ── 12. Fehlende Einwilligung der Erziehungsberechtigten ─────
  const vorVormund = await db.registration.count();
  const vormundAntwort = await absenden(
    { eventSlug: SLUG, weg: "kind", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([
        { vorname: "Kind", nachname: "Ohne" },
        { vorname: "Vater", nachname: "Ohne", email: "ohne@example.org", telefon: "" },
      ]) },
    neueIp(),
  );
  pruefe("Ohne Einwilligung der Erziehungsberechtigten wird nichts gespeichert",
    (await db.registration.count()) === vorVormund);
  pruefe("… mit verständlicher Begründung",
    vormundAntwort.text.includes("Einwilligung der Erziehungsberechtigten"));

  // ── 13. Doppelte Anmeldung ───────────────────────────────────
  //
  // Bis zum 26.09.2026 gab es hier zwei Fälle: ein zweiter Anlauf
  // WÄHREND der laufenden Reservierung (erlaubt, derselbe Datensatz)
  // und eine zweite Anmeldung zu einer bestätigten (abgelehnt). Den
  // ersten gibt es nicht mehr — es gibt keine Reservierung, in der
  // man einen zweiten Anlauf unternehmen könnte. Wer abbricht,
  // hinterlässt nichts und fängt von vorn an; das prüft Liste K.
  // Übrig bleibt der Fall, um den es immer ging.
  const doppelt = await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "Lena", nachname: "Schmidt", email: "lena@example.org", telefon: "" }]) },
    neueIp(),
  );
  pruefe("Zweite Anmeldung zu einer bestätigten wird abgelehnt",
    doppelt.status === 200 && doppelt.text.includes("bereits eine Anmeldung"));
  pruefe("… und es entsteht kein zweiter Datensatz",
    (await db.registration.count({ where: { kontaktEmail: "lena@example.org" } })) === 1);
  pruefe("… und keine Zahlung wird überhaupt erst gestartet", doppelt.sitzungId === null);

  // ── 14. Reaktivierung nach Stornierung ───────────────────────
  const lena = await db.registration.findFirstOrThrow({ where: { kontaktEmail: "lena@example.org" } });
  await db.registration.update({
    where: { id: lena.id },
    data: { status: "STORNIERT", storniertAm: new Date() },
  });
  await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "adult", schueler: 0, erwachsene: 1, webseite: "",
      ...personen([{ vorname: "Lena", nachname: "Schmidt", email: "lena@example.org", telefon: "030999" }]) },
    neueIp(),
  );
  const wieder = await db.registration.findMany({ where: { kontaktEmail: "lena@example.org" }, include: { teilnehmer: true } });
  pruefe("Nach Stornierung entsteht kein zweiter Datensatz", wieder.length === 1,
    `${wieder.length} Datensätze`);
  /* Seit Stufe 2 (26.09.2026) entsteht die Anmeldung erst mit der
     bestätigten Zahlung — die Reaktivierung geschieht deshalb in
     demselben Schritt und führt gleich zu BESTAETIGT. Den Zustand
     dazwischen gibt es nicht mehr. */
  pruefe("… derselbe Datensatz wird reaktiviert",
    wieder[0].id === lena.id && wieder[0].status === "BESTAETIGT" &&
    wieder[0].reaktiviertAm !== null && wieder[0].storniertAm === null,
    `Status ${wieder[0].status}`);
  pruefe("… mit neu berechnetem Preis (jetzt Erwachsener, 14,00 €)",
    wieder[0].gesamtpreisCents === 1400, `${wieder[0].gesamtpreisCents} Cent`);

  // ── 15. Ausgebucht: eine Gruppe passt nicht mehr ─────────────
  await leeren();
  await db.event.update({ where: { id: event.id }, data: { maxPersonen: 1 } });

  const zuGross = await absenden(
    { eventSlug: SLUG, weg: "kind", schueler: 2, erwachsene: 0, webseite: "",
      einwilligungVormund: "an",
      ...personen([
        { vorname: "Eins", nachname: "Zuviel" },
        { vorname: "Zwei", nachname: "Zuviel" },
        { vorname: "Mutter", nachname: "Zuviel", email: "zuviel@example.org", telefon: "" },
      ]) },
    neueIp(),
  );
  pruefe("Bei 1 freiem Platz wird eine Zweiergruppe abgelehnt",
    (await db.registration.count()) === 0 && zuGross.text.includes("nur noch 1"));

  // Ein einzelner Platz geht dagegen durch.
  await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "Letzter", nachname: "Platz", email: "letzter@example.org", telefon: "" }]) },
    neueIp(),
  );
  pruefe("… der eine freie Platz lässt sich aber buchen",
    (await db.registration.count()) === 1);

  /* Bis zum 26.09.2026 standen hier zwei Schritte: erst „unbezahlt
     hält den Platz nicht", dann „bezahlt hält ihn". Der erste ist
     entfallen — eine unbezahlte Anmeldung gibt es nicht mehr, sie
     entsteht mit der Zahlung oder gar nicht. Geprüft wird weiterhin
     dasselbe: Ein bezahlter Platz ist weg. */
  const ausgebucht = await absenden(
    { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "Zu", nachname: "Spaet", email: "spaet@example.org", telefon: "" }]) },
    neueIp(),
  );
  pruefe("Ist der Platz bezahlt, meldet der Server „ausgebucht\"",
    ausgebucht.text.includes("ausgebucht"),
    ausgebucht.text.slice(0, 90));
  pruefe("… und schickt niemanden mehr zur Bezahlseite", ausgebucht.sitzungId === null);
  pruefe("… und legt nichts an",
    (await db.registration.count({ where: { kontaktEmail: "spaet@example.org" } })) === 0);

  await db.event.update({ where: { id: event.id }, data: { maxPersonen: event.maxPersonen } });

  // ── 16. Bremse gegen Massen-Einsendungen ─────────────────────
  await leeren();
  /* Eine bei JEDEM Lauf andere Adresse.
     
     Seit dem 26.09.2026 zählt die Bremse im Arbeitsspeicher des
     Servers und nicht mehr in der Datenbank (Entscheidung: kein
     Datenbankeintrag vor der Zahlung). `leeren.mjs` setzt sie
     deshalb nicht mehr zurück, und eine feste Adresse trug ihre
     Zähler aus dem vorigen Lauf mit — beim zweiten Sammellauf
     wurden dann alle sieben Versuche abgewiesen statt zwei. Der
     Bereich 198.18.0.0/15 ist für Messungen reserviert und gehört
     niemandem. */
  const angreifer =
    `198.18.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
  let gebremst = 0;
  for (let i = 0; i < 7; i += 1) {
    const r = await absenden(
      { eventSlug: SLUG, weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
        ...personen([{ vorname: "Serie", nachname: `Nr${i}`, email: `serie${i}@example.org`, telefon: "" }]) },
      angreifer,
    );
    if (r.text.includes("Zu viele Versuche")) gebremst += 1;
  }
  pruefe("Nach 5 Versuchen von derselben Adresse wird gebremst", gebremst === 2,
    `${gebremst} von 7 abgewiesen`);

  // ── 17. Unbekannte Veranstaltung ─────────────────────────────
  const unbekannt = await absenden(
    { eventSlug: "gibt-es-nicht", weg: "selbst", selbstAls: "student", schueler: 1, erwachsene: 0, webseite: "",
      ...personen([{ vorname: "X", nachname: "Y", email: "x@example.org", telefon: "" }]) },
    neueIp(),
  );
  pruefe("Unbekannter Veranstaltungs-Slug wird abgewiesen",
    unbekannt.text.includes("gibt es nicht"));

  console.log(
    fehlgeschlagen.length === 0
      ? `\nAlle ${nummer} Prüfungen bestanden.`
      : `\n${fehlgeschlagen.length} von ${nummer} fehlgeschlagen:\n- ` + fehlgeschlagen.join("\n- "),
  );
  process.exitCode = fehlgeschlagen.length === 0 ? 0 : 1;
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
