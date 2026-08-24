/* ---------------------------------------------------------------
   Event-Daten.

   Hier änderst du Datum, Ort, Preise und Texte deiner Events.
   Kein anderer Teil der Seite muss dafür angefasst werden.

   Alles mit `null` ist ein PLATZHALTER und wird auf der Seite
   sichtbar als solcher gekennzeichnet.
   --------------------------------------------------------------- */

import type { Preisregeln } from "@/lib/preise";
import type { Sprache } from "@/lib/i18n";

export interface EventOrt {
  name: string | null;
  strasse: string | null;
  plz: string | null;
  stadt: string;
}

export interface EventTexte {
  titel: string;
  untertitel: string;
  kurz: string;
  lang: string[];
  dabei: string[];
  mitbringen: string[];
}

export interface VeraEvent {
  slug: string;
  kategorie: "sport" | "business";
  /** ISO-Datum, z. B. "2026-09-19". null = noch offen. */
  datum: string | null;
  zeitVon: string | null;
  zeitBis: string | null;
  ort: EventOrt;
  /** Obergrenze in PERSONEN, nicht in Anmeldungen. */
  maxPersonen: number | null;
  /** Ab wie wenigen freien Plätzen die Zahl angezeigt wird. */
  schwelle: number;
  /**
   * Bereits belegte Plätze, gezählt in Personen.
   *
   * Version 1 hat noch keine Datenbank, deshalb steht der Wert hier.
   * Zum Ausprobieren der Restplatz-Anzeige: auf 90 setzen — dann
   * erscheint „Nur noch 10 freie Plätze". Bei 100 steht dort
   * „Ausgebucht".
   */
  belegtePersonen: number;
  alterVon: number | null;
  alterBis: number | null;
  preise: Preisregeln;
  texte: Record<Sprache, EventTexte>;
}

export const events: VeraEvent[] = [
  {
    slug: "padel-falkensee",
    kategorie: "sport",
    datum: null,
    zeitVon: null,
    zeitBis: null,
    ort: {
      name: null,
      strasse: null,
      plz: null,
      stadt: "Falkensee",
    },
    maxPersonen: 100,
    schwelle: 10,
    belegtePersonen: 0,
    alterVon: 15,
    alterBis: 21,
    preise: {
      schuelerCents: 700,
      erwachsenerCents: 1400,
      familie: {
        basisCents: 3000,
        enthalteneErwachsene: 2,
        enthalteneSchueler: 1,
        weitererSchuelerCents: 600,
        maxSchueler: 6,
      },
    },
    texte: {
      de: {
        titel: "Padel für Schüler und Eltern",
        untertitel: "Ein Nachmittag auf dem Court in Falkensee",
        kurz:
          "Padel ausprobieren, ohne vorher etwas zu können. Schläger und Bälle liegen bereit, " +
          "ein Trainer ist vor Ort, und Essen und Getränke gibt es zwischendurch auch.",
        lang: [
          "Der Tag ist für alle gemacht, die noch nie einen Padelschläger in der Hand hatten. " +
            "Du brauchst keine Vorkenntnisse, keine Ausrüstung und keinen Partner — beides " +
            "bekommst du vor Ort.",
          "Betreuer sind den ganzen Nachmittag dabei. Sie erklären die Regeln, zeigen dir die " +
            "ersten Schläge und geben Tipps, sobald du im Spiel bist. Gespielt wird in " +
            "Vierergruppen, damit alle oft an den Ball kommen.",
          "Eltern spielen ausdrücklich mit. Wer lieber zuschaut, findet am Rand einen Platz — " +
            "Essen und Getränke gibt es für alle.",
        ],
        dabei: [
          "Schläger und Bälle",
          "Einweisung und Betreuung",
          "Essen und Getränke",
          "Spielzeit in Vierergruppen",
        ],
        mitbringen: [
          "Sportkleidung",
          "Saubere Hallenschuhe",
          "Ein Handtuch",
        ],
      },
      en: {
        titel: "Padel for Students and Parents",
        untertitel: "An afternoon on the court in Falkensee",
        kurz:
          "Try padel without knowing anything about it first. Rackets and balls are provided, " +
          "a coach is on site, and food and drinks are there too.",
        lang: [
          "This day is built for people who have never held a padel racket. No experience, " +
            "no gear and no partner needed — you get all of it on site.",
          "Coaches are there all afternoon. They explain the rules, walk you through your " +
            "first shots and give tips once you are rallying. You play in groups of four so " +
            "everyone gets plenty of time on the ball.",
          "Parents are meant to play too. If you would rather watch, there is space courtside — " +
            "food and drinks are there for everyone.",
        ],
        dabei: [
          "Rackets and balls",
          "Introduction and coaching",
          "Food and drinks",
          "Court time in groups of four",
        ],
        mitbringen: [
          "Sportswear",
          "Clean indoor shoes",
          "A towel",
        ],
      },
    },
  },
];

/**
 * Video im Hero-Bereich der Startseite.
 *
 * Dateiname relativ zu `public/`. Auf `null` gesetzt, erscheint dort
 * stattdessen die Court-Grafik mit Platzhalter-Hinweis.
 *
 * WICHTIG: Die Datei muss MP4 mit H.264 sein. Eine .mov-Datei mit
 * HEVC/H.265 spielt zwar auf iPhone und iPad, bleibt in Chrome und
 * Firefox aber schwarz.
 */
export const heroVideo: string | null = null;

export function findeEvent(slug: string): VeraEvent | undefined {
  return events.find((e) => e.slug === slug);
}

export function kommendeEvents(): VeraEvent[] {
  return events;
}
