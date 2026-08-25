/* ---------------------------------------------------------------
   Startdaten für die Entwicklungsdatenbank.

   Überträgt das bestehende Padel-Event aus content/events.ts in die
   Datenbank. Läuft mit:

     npm run db:seed

   Gefahrlos wiederholbar: Ein vorhandenes Event mit demselben slug
   wird aktualisiert statt ein zweites angelegt.

   WICHTIG: Hier gehören ausschließlich erfundene Testdaten hinein.
   Niemals echte Teilnehmerdaten.
   --------------------------------------------------------------- */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt — siehe .env.example");

const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });

const daten = {
  slug: "padel-falkensee",
  status: "VEROEFFENTLICHT" as const,
  kategorie: "SPORT" as const,

  titel: "Padel für Schüler und Eltern",
  untertitel: "Ein Nachmittag auf dem Court in Falkensee",

  // Kopfbereich der Event-Seite. Stand bis zum Theme-Umbau im
  // globalen Wörterbuch — womit jede Veranstaltung „Nie gespielt?"
  // als Überschrift bekommen hätte.
  heroAugenbraue: "Padel · Falkensee",
  ctaTitel: "Bereit für den ersten Ballwechsel?",
  ctaText: "Such dir aus, wer mitkommt, und sieh dir an, was es kostet.",
  heroTitel: "Nie gespielt? Genau darum geht's.",
  heroText:
    "Ein Nachmittag Padel für Schüler, Lehrer und Eltern. Schläger gibt es vor Ort — und " +
    "ein Trainer ist dabei, der Fragen beantwortet, den Sport erklärt und auf Wunsch erste " +
    "Übungen mit euch macht.",

  karteTitel: "Padel Event",
  karteKurz:
    "Gemeinsam Padel spielen, neue Leute kennenlernen und einen besonderen Abend erleben.",
  karteZielgruppe: "Für Schüler, Lehrer und Eltern",
  kurz:
    "Padel ausprobieren, ohne vorher etwas zu können. Schläger und Bälle liegen bereit, " +
    "ein Trainer ist vor Ort, und Essen und Getränke gibt es zwischendurch auch.",
  beschreibung: [
    "Der Tag ist für alle gemacht, die noch nie einen Padelschläger in der Hand hatten. " +
      "Du brauchst keine Vorkenntnisse, keine Ausrüstung und keinen Partner — beides " +
      "bekommst du vor Ort.",
    "Betreuer sind den ganzen Nachmittag dabei. Sie erklären die Regeln, zeigen dir die " +
      "ersten Schläge und geben Tipps, sobald du im Spiel bist. Gespielt wird in " +
      "Vierergruppen, damit alle oft an den Ball kommen.",
    "Eltern spielen ausdrücklich mit. Wer lieber zuschaut, findet am Rand einen Platz — " +
      "Essen und Getränke gibt es für alle.",
  ].join("\n\n"),

  // Datum und genaue Adresse stehen noch nicht fest. null bedeutet
  // „Platzhalter" und wird auf der Seite sichtbar so gekennzeichnet.
  startAt: null,
  endAt: null,
  ortName: null,
  strasse: null,
  plz: null,
  stadt: "Falkensee",

  bildUrl: "/images/event-padel.jpg",
  videoUrl: "/videos/padel-hero.mp4",

  maxPersonen: 100,
  schwelleWenigPlaetze: 10,

  preisSchuelerCents: 700,
  preisErwachsenerCents: 1400,

  familieAktiv: true,
  familieBasisCents: 3000,
  familieEnthaltenErwachsene: 2,
  familieEnthaltenSchueler: 1,
  familieWeitererSchuelerCents: 600,
  familieMaxSchueler: 6,
};

/**
 * Die Inhalte der Event-Seite.
 *
 * Diese Texte standen bis zum Theme-Umbau im globalen Wörterbuch
 * (content/de.ts). Das ging, solange es genau ein Event gab — bei
 * einem Unternehmer-Netzwerkabend hätte dort „Was ist Padel
 * überhaupt?" gestanden. Jetzt gehören sie zur Veranstaltung.
 *
 * Zeilenregel (gilt für alle Blockarten, siehe lib/eventInhalte.ts):
 *   - Text                  ein Aufzählungspunkt
 *   * 20 × 10 | Meter Platz eine Zahlenkachel
 *   > Text | /pfad          ein Verweis
 *   alles andere            Fließtext, Leerzeile trennt Absätze
 * Bei „ablauf" und „faq" wird stattdessen an den Strichen geteilt.
 */
const abschnitte = [
  {
    art: "vorstellung",
    titel: "Was ist Padel überhaupt?",
    reihenfolge: 10,
    inhalt: [
      "Padel ist der entspannte Cousin von Tennis. Gespielt wird immer zu viert auf einem " +
        "Platz, der etwa ein Drittel so groß ist wie ein Tennisfeld — rundum Glaswände, von " +
        "denen der Ball abspringt und weiterläuft.",
      "",
      "Der Aufschlag geht von unten, der Schläger hat keine Saiten, und die Wände sind Teil " +
        "des Spiels statt das Ende davon. Genau deshalb kommen die meisten schon nach ein " +
        "paar Minuten zum ersten richtigen Ballwechsel.",
      "",
      "Neben den Doppel-Courts (4 Personen, 20 × 10 Meter) gibt es bei uns zusätzlich 2 " +
        "Single-Courts: Dort spielen jeweils 2 Personen gegeneinander, auf einer Fläche von " +
        "6 × 10 Metern.",
      "* 4 | Spieler, immer",
      "* 20 × 10 | Meter Platz",
      "* 0 | Vorkenntnisse nötig",
    ].join("\n"),
  },
  {
    art: "ablauf",
    titel: "So läuft der Tag ab",
    reihenfolge: 20,
    inhalt: [
      "Anmelden | Such dir aus, wer mitkommt, und melde dich an. Die Plätze sind begrenzt, " +
        "und der Preis steht dir vorher klar vor Augen.",
      "Ankommen | Schläger und Bälle liegen bereit. Es gibt eine kurze Einweisung, danach " +
        "werden die Vierergruppen eingeteilt.",
      "Spielen | Ihr spielt in Gruppen, die Betreuer geben Tipps. Zwischendurch Pause am " +
        "Buffet — und danach zurück auf den Court.",
    ].join("\n"),
  },
  {
    art: "hinweise",
    titel: "Für Schulen",
    reihenfolge: 30,
    inhalt: [
      "Sie möchten mit einer Klasse oder einem Kurs vorbeikommen? Schreiben Sie uns eine " +
        "E-Mail — Termin, Gruppengröße und Ablauf stimmen wir individuell ab.",
      "- Keine Vorkenntnisse nötig",
      "- Ausrüstung wird gestellt",
      "- 90 Minuten, während der Schulzeit (08:00–15:00 Uhr)",
      "- Bis zu 20 Personen gleichzeitig auf dem Platz",
      "> Mehr für Schulen | /fuer-schulen",
    ].join("\n"),
  },
  {
    art: "faq",
    titel: "Häufige Fragen",
    reihenfolge: 40,
    inhalt: [
      "Ich habe noch nie Padel gespielt. Ist das ein Problem? | Im Gegenteil, dafür ist der " +
        "Tag gemacht. Die meisten kommen ohne jede Erfahrung. Betreuer erklären alles von " +
        "Anfang an.",
      "Was muss ich mitbringen? | Sportkleidung, saubere Hallenschuhe und ein Handtuch. " +
        "Schläger und Bälle bekommst du vor Ort.",
      "Mein Kind ist unter 18. Wer meldet an? | Ein Elternteil oder eine erziehungsberechtigte " +
        "Person meldet an und bestätigt die Teilnahme. Ab 18 kann man sich selbst anmelden.",
      "Können Eltern mitspielen? | Ja, ausdrücklich. Es gibt einen eigenen Preis für " +
        "Erwachsene und ein günstigeres Familienpaket. Zuschauen ist natürlich auch möglich.",
      "Wie bezahle ich? | Das legen wir gerade fest und geben es rechtzeitig vor der " +
        "Anmeldung bekannt. Der Preis steht dir aber jetzt schon vollständig vor Augen.",
      "Wann startet die Anmeldung? | Sobald Datum und Uhrzeit feststehen. Schreib uns gern, " +
        "dann sagen wir dir Bescheid.",
    ].join("\n"),
  },
  {
    art: "dabei",
    titel: "Das ist dabei",
    reihenfolge: 1,
    inhalt: [
      "Schläger und Bälle",
      "Einweisung und Betreuung",
      "Essen und Getränke",
      "Spielzeit in Vierergruppen",
    ].join("\n"),
  },
  {
    art: "mitbringen",
    titel: "Das bringst du mit",
    reihenfolge: 2,
    inhalt: ["Sportkleidung", "Saubere Hallenschuhe", "Ein Handtuch"].join("\n"),
  },
];

async function main() {
  const event = await db.event.upsert({
    where: { slug: daten.slug },
    create: daten,
    update: daten,
  });

  // Abschnitte neu setzen, damit ein zweiter Lauf sie nicht verdoppelt.
  await db.eventAbschnitt.deleteMany({ where: { eventId: event.id } });
  await db.eventAbschnitt.createMany({
    data: abschnitte.map((a) => ({ ...a, eventId: event.id })),
  });

  console.log(`Event angelegt/aktualisiert: ${event.titel} (${event.slug})`);
  console.log(`Inhaltsblöcke: ${abschnitte.length}`);
}

main()
  .catch((fehler) => {
    console.error(fehler);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
