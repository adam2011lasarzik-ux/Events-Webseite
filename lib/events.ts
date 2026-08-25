/* ---------------------------------------------------------------
   Event-Daten aus der Datenbank.

   Die einzige Stelle, an der die Seite Events lädt. Vorher stand hier
   ein fest verdrahtetes Array — jedes neue Event hätte eine
   Code-Änderung gebraucht.

   Warum hier übersetzt wird: In der Datenbank liegen die Felder flach
   (preisSchuelerCents, ortName …), die Anzeige arbeitet aber mit einer
   verschachtelten Form (event.preise.familie, event.ort.stadt). Diese
   Übersetzung passiert an genau einer Stelle. Dadurch bleibt
   lib/preise.ts unangetastet — sein Preisregeln-Typ passt exakt auf
   die verschachtelte Form.
   --------------------------------------------------------------- */

import { db } from "@/lib/db";
import type { Preisregeln } from "@/lib/preise";
// Datum und Uhrzeit kommen aus lib/zeit.ts, damit sie in DEUTSCHER
// Zeit erscheinen. Der Server läuft in UTC — ohne Umrechnung stünde
// bei einem Event um 14:00 auf der Seite 12:00.
import { alsIsoDatum, alsUhrzeit } from "@/lib/zeit";
import { leseBloecke, type EventBlock } from "@/lib/eventInhalte";
import { alsTheme, type Theme } from "@/lib/themes";

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
  /** Kleine Zeile über der Kopf-Überschrift. Leer = Kategorie und Stadt. */
  heroAugenbraue: string;
  /** Überschrift im Kopfbereich. Leer im Datensatz = fällt auf `titel` zurück. */
  heroTitel: string;
  /** Text im Kopfbereich. Leer im Datensatz = fällt auf `kurz` zurück. */
  heroText: string;
  /** Abschluss-Aufruf. Leer = der neutrale Text aus dem Wörterbuch. */
  ctaTitel: string;
  ctaText: string;
  lang: string[];
  dabei: string[];
  mitbringen: string[];
  /** Knappere Fassung für die Karte auf der Startseite. */
  karteTitel: string;
  karteKurz: string;
  karteZielgruppe: string;
}

export interface VeraEvent {
  /** Nur im Adminbereich gebraucht — Besucher sehen die Kennung nie. */
  id: string;
  slug: string;
  kategorie: string;
  /** Bestimmt ausschließlich das Aussehen, nie die Daten. */
  theme: Theme;
  /** Redaktioneller Zustand. Öffentlich immer VEROEFFENTLICHT — nur die
   *  Vorschau im Adminbereich bekommt hier auch ENTWURF zu sehen. */
  status: string;
  /** Die Inhaltsblöcke dieser Veranstaltung, in fester Reihenfolge. */
  bloecke: EventBlock[];
  /** ISO-Datum, z. B. "2026-09-19". null = steht noch nicht fest. */
  datum: string | null;
  zeitVon: string | null;
  zeitBis: string | null;
  ort: EventOrt;
  /** Obergrenze in PERSONEN, nicht in Anmeldungen. null = unbegrenzt. */
  maxPersonen: number | null;
  /** Ab wie wenigen freien Plätzen die Zahl angezeigt wird. */
  schwelle: number;
  /** Gezählt in Personen — siehe belegtePlaetze() weiter unten. */
  belegtePersonen: number;
  /** Video im Hero-Bereich. Je Event, nicht global. */
  videoUrl: string | null;
  bildUrl: string | null;
  preise: Preisregeln;
  texte: EventTexte;
}

/** Ein Inhaltsblock je Art, zeilenweise als Liste. */
function blockAlsListe(
  abschnitte: { art: string; inhalt: string }[],
  art: string,
): string[] {
  const treffer = abschnitte.find((a) => a.art === art);
  if (!treffer) return [];
  return treffer.inhalt.split("\n").map((z) => z.trim()).filter(Boolean);
}

type DbEvent = Awaited<ReturnType<typeof ladeRohEvents>>[number];

function ladeRohEvents(where: object) {
  return db.event.findMany({
    where,
    orderBy: [{ startAt: "asc" }, { erstelltAm: "asc" }],
    include: { abschnitte: { orderBy: { reihenfolge: "asc" } } },
  });
}

/**
 * Belegte Plätze je Event — gezählt in PERSONEN, nicht in Anmeldungen.
 *
 * Eine Familie mit sechs Personen belegt sechs Plätze. Würde man
 * Anmeldungen zählen, zeigte die Seite freie Plätze an, während die
 * Anlage längst voll ist.
 *
 * Bewusst EINE Abfrage für alle Events statt einer je Event: sonst
 * würde die Startseite mit jedem weiteren Event langsamer.
 */
async function belegtePlaetze(eventIds: string[]): Promise<Map<string, number>> {
  const stand = new Map<string, number>(eventIds.map((id) => [id, 0]));
  if (eventIds.length === 0) return stand;

  const anmeldungen = await db.registration.findMany({
    where: { eventId: { in: eventIds }, status: "BESTAETIGT" },
    select: { eventId: true, _count: { select: { teilnehmer: true } } },
  });

  for (const a of anmeldungen) {
    stand.set(a.eventId, (stand.get(a.eventId) ?? 0) + a._count.teilnehmer);
  }
  return stand;
}

function alsAnzeigeEvent(e: DbEvent, belegt: number): VeraEvent {
  return {
    id: e.id,
    slug: e.slug,
    kategorie: e.kategorie.toLowerCase(),
    theme: alsTheme(e.theme),
    status: e.status,
    bloecke: leseBloecke(e.abschnitte),
    datum: alsIsoDatum(e.startAt),
    zeitVon: alsUhrzeit(e.startAt),
    zeitBis: alsUhrzeit(e.endAt),
    ort: { name: e.ortName, strasse: e.strasse, plz: e.plz, stadt: e.stadt },
    maxPersonen: e.maxPersonen,
    schwelle: e.schwelleWenigPlaetze,
    belegtePersonen: belegt,
    videoUrl: e.videoUrl,
    bildUrl: e.bildUrl,
    preise: {
      schuelerCents: e.preisSchuelerCents,
      erwachsenerCents: e.preisErwachsenerCents,
      familie:
        e.familieAktiv &&
        e.familieBasisCents !== null &&
        e.familieEnthaltenErwachsene !== null &&
        e.familieEnthaltenSchueler !== null &&
        e.familieWeitererSchuelerCents !== null &&
        e.familieMaxSchueler !== null
          ? {
              basisCents: e.familieBasisCents,
              enthalteneErwachsene: e.familieEnthaltenErwachsene,
              enthalteneSchueler: e.familieEnthaltenSchueler,
              weitererSchuelerCents: e.familieWeitererSchuelerCents,
              maxSchueler: e.familieMaxSchueler,
            }
          : null,
    },
    texte: {
      titel: e.titel,
      untertitel: e.untertitel ?? "",
      kurz: e.kurz,
      // Leer bedeutet: die allgemeinen Felder übernehmen. So bleiben
      // Veranstaltungen ohne eigenen Kopftext heil.
      heroAugenbraue: e.heroAugenbraue?.trim() || "",
      heroTitel: e.heroTitel?.trim() || e.titel,
      heroText: e.heroText?.trim() || e.kurz,
      ctaTitel: e.ctaTitel?.trim() || "",
      ctaText: e.ctaText?.trim() || "",
      lang: e.beschreibung.split("\n\n").map((a) => a.trim()).filter(Boolean),
      dabei: blockAlsListe(e.abschnitte, "dabei"),
      mitbringen: blockAlsListe(e.abschnitte, "mitbringen"),
      karteTitel: e.karteTitel,
      karteKurz: e.karteKurz,
      karteZielgruppe: e.karteZielgruppe ?? "",
    },
  };
}

/** Alle veröffentlichten Events für die Startseite. */
export async function kommendeEvents(): Promise<VeraEvent[]> {
  const roh = await ladeRohEvents({ status: "VEROEFFENTLICHT" });
  const belegt = await belegtePlaetze(roh.map((e) => e.id));
  return roh.map((e) => alsAnzeigeEvent(e, belegt.get(e.id) ?? 0));
}

/**
 * Ein Event über seine Kennung — auch als ENTWURF.
 *
 * Ausschließlich für die Vorschau im Adminbereich. Bewusst eine eigene
 * Funktion und kein Zusatzwert an findeEvent(): So kann eine
 * öffentliche Seite nicht versehentlich einen Entwurf ausliefern, weil
 * jemand irgendwo ein Häkchen falsch gesetzt hat.
 */
export async function findeEventFuerVorschau(id: string): Promise<VeraEvent | undefined> {
  const roh = await ladeRohEvents({ id });
  if (roh.length === 0) return undefined;
  const belegt = await belegtePlaetze([roh[0].id]);
  return alsAnzeigeEvent(roh[0], belegt.get(roh[0].id) ?? 0);
}

/** Ein Event über seine Adresse. undefined, wenn es keins gibt. */
export async function findeEvent(slug: string): Promise<VeraEvent | undefined> {
  const roh = await ladeRohEvents({ slug, status: "VEROEFFENTLICHT" });
  if (roh.length === 0) return undefined;
  const belegt = await belegtePlaetze([roh[0].id]);
  return alsAnzeigeEvent(roh[0], belegt.get(roh[0].id) ?? 0);
}

