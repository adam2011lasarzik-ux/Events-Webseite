/* ---------------------------------------------------------------
   Die Regeln der Anmeldung.

   Reine Funktionen: kein HTTP, keine Datenbank, keine Anzeige — nur
   Entscheidungen. Dieselbe Herangehensweise wie bei lib/preise.ts und
   lib/vorschau.ts, damit sich jede Regel einzeln prüfen lässt.

   Wichtig: Welche Personen abgefragt werden, bestimmt NICHT das
   Formular, sondern vorschauRollen() aus lib/vorschau.ts — dieselbe
   Funktion, die auch die Feldgruppen erzeugt. Der Browser schickt nur
   Werte, die Struktur kommt vom Server. So können Formular,
   Preisanzeige und gespeicherte Teilnehmer nicht auseinanderlaufen.
   --------------------------------------------------------------- */

import { begrenzeAuswahl, type Auswahl, type Preisregeln } from "./preise";
import { brauchtKontaktdaten, vorschauRollen, type Anmeldeweg } from "./vorschau";

export type { Anmeldeweg };

/** Ein einzelnes Namensfeld-Paar aus dem Formular. */
export interface PersonEingabe {
  vorname: string;
  nachname: string;
  /** Nur bei der Kontaktperson gesetzt. */
  email?: string;
  telefon?: string;
}

export interface AnmeldeEingabe {
  weg: Anmeldeweg;
  /** Nur beim Weg „selbst": meldet sich die Person als Schüler oder Erwachsener an? */
  selbstAls?: "student" | "adult";
  schueler: number;
  erwachsene: number;
  /** In derselben Reihenfolge wie vorschauRollen() sie liefert. */
  personen: PersonEingabe[];
  einwilligungVormund: boolean;
  einwilligungFotos: boolean;
  /** Unsichtbares Feld — nur Bots füllen es aus. */
  honigtopf?: string;
}

/**
 * Was das Formular nach einem Absendeversuch zurueckbekommt.
 *
 * Steht bewusst hier und nicht in der Server-Datei: Aus einer Datei mit
 * "use server" duerfen ausschliesslich asynchrone Funktionen exportiert
 * werden. Ein einfaches Startwert-Objekt kaeme dort als `undefined` an —
 * genau daran ist der erste Bauversuch gescheitert.
 */
export interface AnmeldeErgebnis {
  fehler: Feldfehler[];
  /** Meldung, die nicht an einem einzelnen Feld haengt. */
  meldung?: string;
}

export const ANMELDE_STARTZUSTAND: AnmeldeErgebnis = { fehler: [] };

export interface Feldfehler {
  /** z. B. "person.0.vorname" oder "einwilligungVormund" */
  feld: string;
  text: string;
}

export type TeilnehmerTyp = "SCHUELER" | "ERWACHSENER";

export interface FertigeAnmeldung {
  auswahl: Auswahl;
  buchungsart: "EINZEL" | "FAMILIE";
  kontakt: { vorname: string; nachname: string; email: string; telefon: string | null };
  teilnehmer: { vorname: string; nachname: string; typ: TeilnehmerTyp }[];
  istVormundBuchung: boolean;
  einwilligungVormund: boolean;
  einwilligungFotos: boolean;
}

const MAX_NAME = 80;
const MAX_EMAIL = 200;
const MAX_TELEFON = 40;

/**
 * Bewusst großzügig: Eine E-Mail-Adresse vollständig zu prüfen ist
 * kaum möglich, und zu strenge Regeln sperren echte Adressen aus.
 * Diese Prüfung fängt Tippfehler ab; ob die Adresse wirklich
 * existiert, zeigt erst die Bestätigungsmail.
 */
function istEmail(wert: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(wert);
}

const sauber = (wert: string | undefined): string => (wert ?? "").trim();

/**
 * Braucht dieser Anmeldeweg die Einwilligung Erziehungsberechtigter?
 *
 * „Mein Kind" meldet ausdrücklich Minderjährige an. Das Familienpaket
 * enthält Schülerplätze, bei denen ebenfalls Minderjährige zu erwarten
 * sind — deshalb hier die vorsichtigere Annahme. „Mich selbst" ist
 * laut Anmeldebereich ab 18 Jahren.
 *
 * HINWEIS: Rechtlich fachkundig prüfen lassen. Diese Regel bildet ab,
 * was der Skill vorgibt, ist aber keine Rechtsberatung.
 */
export function brauchtVormundEinwilligung(weg: Anmeldeweg): boolean {
  return weg === "kind" || weg === "familie";
}

/** Aus dem gewählten Weg die Auswahl bauen, mit der lib/preise.ts rechnet. */
export function alsAuswahl(eingabe: AnmeldeEingabe): Auswahl {
  if (eingabe.weg === "familie") {
    return { art: "family", schueler: eingabe.schueler, erwachsene: eingabe.erwachsene };
  }
  if (eingabe.weg === "kind") {
    return { art: "single", schueler: eingabe.schueler, erwachsene: eingabe.erwachsene };
  }
  return {
    art: "single",
    schueler: eingabe.selbstAls === "student" ? 1 : 0,
    erwachsene: eingabe.selbstAls === "adult" ? 1 : 0,
  };
}

/**
 * Prüft die Eingaben und baut daraus die fertige Anmeldung.
 *
 * Liefert entweder eine Liste von Fehlern ODER das fertige Ergebnis —
 * nie beides. Der Aufrufer kann also nicht versehentlich mit
 * halbgültigen Daten weiterarbeiten.
 */
export function pruefeUndBaue(
  regeln: Preisregeln,
  eingabeRoh: AnmeldeEingabe,
): { fehler: Feldfehler[] } | { fehler: null; anmeldung: FertigeAnmeldung } {
  // Bietet dieses Event gar keine Schüler-Preiskategorie an, bestimmt
  // ausschließlich der Server den Weg — nicht das, was im POST steht.
  // Ein manipulierter Aufruf mit weg=kind/familie oder
  // selbstAls=student würde sonst über die Schüler-Preisstufe (bei
  // so einem Event: kein Preis vorhanden) eine falsche oder kostenlose
  // Buchung erzeugen. Ab hier wird ausschließlich diese korrigierte
  // Fassung verwendet, nie mehr eingabeRoh direkt — "Der Server
  // bestimmt die Struktur, nicht das Formular."
  const eingabe: AnmeldeEingabe = regeln.schuelerAktiv
    ? eingabeRoh
    : { ...eingabeRoh, weg: "selbst", selbstAls: "adult" };

  const fehler: Feldfehler[] = [];

  // Der Server bestimmt die Struktur, nicht das Formular.
  const auswahl = begrenzeAuswahl(regeln, alsAuswahl(eingabe));
  const rollen = vorschauRollen(eingabe.weg, auswahl);

  const teilnehmer: FertigeAnmeldung["teilnehmer"] = [];
  let kontakt: FertigeAnmeldung["kontakt"] | null = null;

  // Nimmt der Elternteil selbst teil?
  //
  // Im Weg „Mein Kind" gibt es das Häkchen „Ich komme selbst mit".
  // Ist es gesetzt, steht in der Auswahl ein Erwachsener — dieser
  // wird bezahlt und muss deshalb auch einen Platz belegen. Ohne
  // Häkchen ist der Elternteil nur Vertragspartner und zählt nicht mit.
  const elternteilNimmtTeil = eingabe.weg === "kind" && auswahl.erwachsene > 0;

  rollen.forEach((rolle, i) => {
    const person = eingabe.personen[i] ?? { vorname: "", nachname: "" };
    const vorname = sauber(person.vorname);
    const nachname = sauber(person.nachname);

    if (!vorname) fehler.push({ feld: `person.${i}.vorname`, text: "Bitte den Vornamen angeben." });
    else if (vorname.length > MAX_NAME)
      fehler.push({ feld: `person.${i}.vorname`, text: "Der Vorname ist zu lang." });

    if (!nachname) fehler.push({ feld: `person.${i}.nachname`, text: "Bitte den Nachnamen angeben." });
    else if (nachname.length > MAX_NAME)
      fehler.push({ feld: `person.${i}.nachname`, text: "Der Nachname ist zu lang." });

    if (brauchtKontaktdaten(rolle)) {
      const email = sauber(person.email);
      const telefon = sauber(person.telefon);

      if (!email) fehler.push({ feld: `person.${i}.email`, text: "Bitte eine E-Mail-Adresse angeben." });
      else if (email.length > MAX_EMAIL || !istEmail(email))
        fehler.push({ feld: `person.${i}.email`, text: "Diese E-Mail-Adresse sieht nicht richtig aus." });

      if (telefon.length > MAX_TELEFON)
        fehler.push({ feld: `person.${i}.telefon`, text: "Die Telefonnummer ist zu lang." });

      if (!kontakt) {
        kontakt = { vorname, nachname, email: email.toLowerCase(), telefon: telefon || null };
      }
    }

    // Der Elternteil ist Vertragspartner, nimmt aber nicht zwingend
    // selbst teil — er wird nur dann Teilnehmer, wenn er sich selbst
    // mit eingetragen hat (siehe elternteilNimmtTeil oben).
    if (rolle.rolle !== "elternteil" || elternteilNimmtTeil) {
      teilnehmer.push({
        vorname,
        nachname,
        typ: rolle.rolle === "schueler"
          ? "SCHUELER"
          : rolle.rolle === "erwachsener" || rolle.rolle === "elternteil"
            ? "ERWACHSENER"
            : eingabe.selbstAls === "student"
              ? "SCHUELER"
              : "ERWACHSENER",
      });
    }
  });

  if (!kontakt) {
    fehler.push({ feld: "person.0.email", text: "Es fehlen die Kontaktdaten." });
  }

  const vormundNoetig = brauchtVormundEinwilligung(eingabe.weg);
  if (vormundNoetig && !eingabe.einwilligungVormund) {
    fehler.push({
      feld: "einwilligungVormund",
      text: "Ohne die Einwilligung der Erziehungsberechtigten ist die Anmeldung nicht möglich.",
    });
  }

  if (teilnehmer.length === 0) {
    fehler.push({ feld: "auswahl", text: "Es ist niemand zur Teilnahme ausgewählt." });
  }

  if (fehler.length > 0) return { fehler };

  return {
    fehler: null,
    anmeldung: {
      auswahl,
      buchungsart: eingabe.weg === "familie" ? "FAMILIE" : "EINZEL",
      kontakt: kontakt!,
      teilnehmer,
      istVormundBuchung: vormundNoetig,
      einwilligungVormund: eingabe.einwilligungVormund,
      // Freiwillig: eine Anmeldung darf nicht daran scheitern, dass
      // jemand keine Fotos möchte.
      einwilligungFotos: eingabe.einwilligungFotos,
    },
  };
}
