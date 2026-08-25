/* ---------------------------------------------------------------
   Die Regeln des Event-Formulars.

   Reine Funktionen: kein HTTP, keine Datenbank, keine Anzeige — nur
   Entscheidungen. Dieselbe Herangehensweise wie bei lib/preise.ts,
   lib/vorschau.ts und lib/anmeldung.ts, damit sich jede Regel einzeln
   prüfen lässt.
   --------------------------------------------------------------- */

import { ausFormular } from "./zeit";
import { alsTheme, STANDARD_THEME, type Theme } from "./themes";
import { BLOCK_ARTEN, type BlockArt } from "./eventInhalte";

export interface Feldfehler {
  feld: string;
  text: string;
}

export interface EventErgebnis {
  fehler: Feldfehler[];
  meldung?: string;
}

export const EVENT_STARTZUSTAND: EventErgebnis = { fehler: [] };

export const KATEGORIEN = [
  "SPORT", "BUSINESS", "NETWORKING", "SCHULE",
  "COMMUNITY", "WORKSHOP", "FREIZEIT", "SONSTIGES",
] as const;

export const STATUS = ["ENTWURF", "VEROEFFENTLICHT", "ARCHIVIERT"] as const;

export type Kategorie = (typeof KATEGORIEN)[number];
export type Status = (typeof STATUS)[number];

/**
 * Aus einer beliebigen Eingabe einen erlaubten Wert machen.
 *
 * Wichtig, weil diese Werte aus dem Browser kommen: Ohne Prüfung
 * liesse sich per manipuliertem Formular ein Status setzen, den es gar
 * nicht gibt — die Datenbank würde die Anfrage abweisen, und der
 * Bediener bekäme einen unverständlichen Fehler zu sehen.
 */
function ausListe<T extends string>(erlaubt: readonly T[], wert: string, standard: T): T {
  return (erlaubt as readonly string[]).includes(wert) ? (wert as T) : standard;
}

/**
 * Aus „7", „7,50" oder „7.50" ganze Cent machen.
 *
 * Über den Umweg Text statt über Kommazahlen: 7.35 * 100 ergibt in
 * JavaScript 734.9999999999999. Ein Preis, der beim Speichern einen
 * Cent verliert, fällt erst beim Kassensturz auf.
 *
 * Gibt null zurück, wenn die Eingabe kein Betrag ist.
 */
export function alsCents(eingabe: string): number | null {
  const text = eingabe.trim().replace(/\s|€/g, "").replace(",", ".");
  if (text === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

  const [ganze, bruch = ""] = text.split(".");
  const cent = (bruch + "00").slice(0, 2);
  return Number(ganze) * 100 + Number(cent);
}

/** Cent-Betrag als Eingabewert, z. B. 700 → „7,00". */
export function centsAlsEingabe(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Aus einem Titel eine Adresse machen: „Padel für Schüler" → „padel-fuer-schueler".
 *
 * Umlaute werden ausgeschrieben statt weggeworfen. Ohne diesen Schritt
 * würde aus „Grünes Fest" die Adresse „grnes-fest".
 */
export function alsSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Was der Server aus dem Formular an die Datenbank weitergibt. */
export interface EventDaten {
  slug: string;
  status: Status;
  kategorie: Kategorie;
  /** Bestimmt ausschließlich das Aussehen der Event-Seite. */
  theme: Theme;
  titel: string;
  untertitel: string | null;
  karteTitel: string;
  karteKurz: string;
  karteZielgruppe: string | null;
  kurz: string;
  beschreibung: string;
  hinweise: string | null;
  heroAugenbraue: string | null;
  heroTitel: string | null;
  heroText: string | null;
  ctaTitel: string | null;
  ctaText: string | null;
  startAt: Date | null;
  endAt: Date | null;
  ortName: string | null;
  strasse: string | null;
  plz: string | null;
  stadt: string;
  /* bildUrl wird NICHT mehr aus dem Formular gelesen: Das Titelbild
     kommt seit dem Upload als Datei, und ein frei eintippbarer Pfad
     wäre eine Möglichkeit, auf beliebige Adressen zu zeigen. Die
     Aktion setzt das Feld selbst. */
  videoUrl: string | null;
  maxPersonen: number | null;
  schwelleWenigPlaetze: number;
  preisSchuelerCents: number;
  preisErwachsenerCents: number;
  familieAktiv: boolean;
  familieBasisCents: number | null;
  familieEnthaltenErwachsene: number | null;
  familieEnthaltenSchueler: number | null;
  familieWeitererSchuelerCents: number | null;
  familieMaxSchueler: number | null;
  anmeldungAb: Date | null;
  anmeldungBis: Date | null;
  /** Zeilenweise, landen als EventAbschnitt in der Datenbank. */
  dabei: string;
  mitbringen: string;
  /** Die Inhaltsblöcke der Event-Seite: Überschrift und Text je Blockart. */
  bloecke: { art: BlockArt; titel: string; inhalt: string }[];
}

const MAX_KURZ = 200;
const MAX_TITEL = 120;

const sauber = (wert: string | undefined) => (wert ?? "").trim();
const oderNull = (wert: string) => (wert === "" ? null : wert);

function ganzeZahl(eingabe: string): number | null {
  const t = eingabe.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
}

/**
 * Prüft die Eingaben und baut daraus die zu speichernden Daten.
 *
 * Liefert entweder Fehler ODER das Ergebnis, nie beides — der
 * Aufrufer kann also nicht versehentlich mit halbgültigen Daten
 * weiterarbeiten.
 */
export function pruefeEvent(
  roh: Record<string, string>,
): { fehler: Feldfehler[] } | { fehler: null; daten: EventDaten } {
  const fehler: Feldfehler[] = [];
  const pflicht = (feld: string, wert: string, name: string, max = MAX_TITEL) => {
    if (!wert) fehler.push({ feld, text: `${name} fehlt.` });
    else if (wert.length > max) fehler.push({ feld, text: `${name} ist zu lang.` });
    return wert;
  };

  const titel = pflicht("titel", sauber(roh.titel), "Der Titel");
  const stadt = pflicht("stadt", sauber(roh.stadt), "Der Ort");
  const karteTitel = pflicht("karteTitel", sauber(roh.karteTitel), "Der Titel auf der Karte");
  const karteKurz = pflicht("karteKurz", sauber(roh.karteKurz), "Der Kurztext auf der Karte", 400);
  const kurz = pflicht("kurz", sauber(roh.kurz), "Der Kurztext", MAX_KURZ * 3);
  const beschreibung = pflicht("beschreibung", sauber(roh.beschreibung), "Die Beschreibung", 20000);

  // Fehlt die Adresse, wird sie aus dem Titel gebildet.
  const slugRoh = sauber(roh.slug) || alsSlug(titel);
  const slug = alsSlug(slugRoh);
  if (!slug) fehler.push({ feld: "slug", text: "Die Adresse lässt sich nicht bilden. Bitte selbst eintragen." });

  const status = ausListe(STATUS, sauber(roh.status), "ENTWURF");
  const kategorie = ausListe(KATEGORIEN, sauber(roh.kategorie), "SONSTIGES");
  // Ein erfundenes Theme fällt still auf Standard zurück, statt die
  // Datenbank mit einem unbekannten Wert abzuweisen.
  const theme = alsTheme(sauber(roh.theme));

  // ── Preise ───────────────────────────────────────────────────
  const preisSchuelerCents = alsCents(sauber(roh.preisSchueler));
  if (preisSchuelerCents === null)
    fehler.push({ feld: "preisSchueler", text: "Bitte einen Betrag angeben, z. B. 7,00." });

  const preisErwachsenerCents = alsCents(sauber(roh.preisErwachsener));
  if (preisErwachsenerCents === null)
    fehler.push({ feld: "preisErwachsener", text: "Bitte einen Betrag angeben, z. B. 14,00." });

  // ── Familienpaket ────────────────────────────────────────────
  const familieAktiv = roh.familieAktiv === "an";
  let familieBasisCents: number | null = null;
  let familieEnthaltenErwachsene: number | null = null;
  let familieEnthaltenSchueler: number | null = null;
  let familieWeitererSchuelerCents: number | null = null;
  let familieMaxSchueler: number | null = null;

  if (familieAktiv) {
    familieBasisCents = alsCents(sauber(roh.familieBasis));
    if (familieBasisCents === null)
      fehler.push({ feld: "familieBasis", text: "Bitte den Grundpreis angeben, z. B. 30,00." });

    familieWeitererSchuelerCents = alsCents(sauber(roh.familieWeitererSchueler));
    if (familieWeitererSchuelerCents === null)
      fehler.push({ feld: "familieWeitererSchueler", text: "Bitte den Preis je weiterem Schüler angeben." });

    familieEnthaltenErwachsene = ganzeZahl(sauber(roh.familieEnthaltenErwachsene));
    if (familieEnthaltenErwachsene === null)
      fehler.push({ feld: "familieEnthaltenErwachsene", text: "Bitte eine Zahl angeben." });

    familieEnthaltenSchueler = ganzeZahl(sauber(roh.familieEnthaltenSchueler));
    if (familieEnthaltenSchueler === null)
      fehler.push({ feld: "familieEnthaltenSchueler", text: "Bitte eine Zahl angeben." });

    familieMaxSchueler = ganzeZahl(sauber(roh.familieMaxSchueler));
    if (familieMaxSchueler === null)
      fehler.push({ feld: "familieMaxSchueler", text: "Bitte eine Zahl angeben." });

    if (
      familieEnthaltenSchueler !== null &&
      familieMaxSchueler !== null &&
      familieMaxSchueler < familieEnthaltenSchueler
    ) {
      fehler.push({
        feld: "familieMaxSchueler",
        text: "Die Höchstzahl darf nicht kleiner sein als die enthaltene Zahl.",
      });
    }
  }

  // ── Plätze ───────────────────────────────────────────────────
  const maxPersonenText = sauber(roh.maxPersonen);
  const maxPersonen = maxPersonenText === "" ? null : ganzeZahl(maxPersonenText);
  if (maxPersonenText !== "" && maxPersonen === null)
    fehler.push({ feld: "maxPersonen", text: "Bitte eine ganze Zahl angeben oder das Feld leer lassen." });

  const schwelleText = sauber(roh.schwelleWenigPlaetze);
  const schwelle = schwelleText === "" ? 10 : ganzeZahl(schwelleText);
  if (schwelle === null)
    fehler.push({ feld: "schwelleWenigPlaetze", text: "Bitte eine ganze Zahl angeben." });

  // ── Zeiten ───────────────────────────────────────────────────
  const zeit = (feld: string, name: string): Date | null => {
    const t = sauber(roh[feld]);
    if (t === "") return null;
    const d = ausFormular(t);
    if (!d) fehler.push({ feld, text: `${name} ist keine gültige Angabe.` });
    return d;
  };

  const startAt = zeit("startAt", "Der Beginn");
  const endAt = zeit("endAt", "Das Ende");
  const anmeldungAb = zeit("anmeldungAb", "Der Anmeldebeginn");
  const anmeldungBis = zeit("anmeldungBis", "Das Anmeldeende");

  if (startAt && endAt && endAt.getTime() < startAt.getTime())
    fehler.push({ feld: "endAt", text: "Das Ende liegt vor dem Beginn." });

  if (anmeldungAb && anmeldungBis && anmeldungBis.getTime() < anmeldungAb.getTime())
    fehler.push({ feld: "anmeldungBis", text: "Das Anmeldeende liegt vor dem Anmeldebeginn." });

  if (fehler.length > 0) return { fehler };

  return {
    fehler: null,
    daten: {
      slug,
      status,
      kategorie,
      theme,
      titel,
      untertitel: oderNull(sauber(roh.untertitel)),
      karteTitel,
      karteKurz,
      karteZielgruppe: oderNull(sauber(roh.karteZielgruppe)),
      kurz,
      beschreibung,
      hinweise: oderNull(sauber(roh.hinweise)),
      heroAugenbraue: oderNull(sauber(roh.heroAugenbraue)),
      heroTitel: oderNull(sauber(roh.heroTitel)),
      heroText: oderNull(sauber(roh.heroText)),
      ctaTitel: oderNull(sauber(roh.ctaTitel)),
      ctaText: oderNull(sauber(roh.ctaText)),
      startAt,
      endAt,
      ortName: oderNull(sauber(roh.ortName)),
      strasse: oderNull(sauber(roh.strasse)),
      plz: oderNull(sauber(roh.plz)),
      stadt,
      videoUrl: oderNull(sauber(roh.videoUrl)),
      maxPersonen,
      schwelleWenigPlaetze: schwelle!,
      preisSchuelerCents: preisSchuelerCents!,
      preisErwachsenerCents: preisErwachsenerCents!,
      familieAktiv,
      familieBasisCents,
      familieEnthaltenErwachsene,
      familieEnthaltenSchueler,
      familieWeitererSchuelerCents,
      familieMaxSchueler,
      anmeldungAb,
      anmeldungBis,
      dabei: sauber(roh.dabei),
      mitbringen: sauber(roh.mitbringen),
      // Nur bekannte Blockarten. Die Namen kommen aus dem Formular und
      // werden hier gegen die feste Liste geprüft, nicht übernommen.
      bloecke: BLOCK_ARTEN.map((art) => ({
        art,
        titel: sauber(roh[`block.${art}.titel`]),
        inhalt: sauber(roh[`block.${art}.inhalt`]),
      })),
    },
  };
}

/** Voreinstellung, damit ein neues Event nicht mit leerem Theme startet. */
export const STANDARD_EVENT_THEME = STANDARD_THEME;
