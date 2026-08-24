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

/** Die beiden Listen der Event-Seite als optionale Inhaltsblöcke. */
const abschnitte = [
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
