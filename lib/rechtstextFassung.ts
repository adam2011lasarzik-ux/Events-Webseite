/* ---------------------------------------------------------------
   Aus den angezeigten Seiten den Wortlaut für eine Fassung machen.

   Hintergrund: `npm run rechtstext` legt eine Fassung aus einer
   DATEI an. Bisher gab es diese Datei nicht — die Teilnahmebedingungen
   und die Datenschutzerklärung stehen in content/de.ts und werden von
   den Seiten unter app/(seite)/agb und app/(seite)/datenschutz
   gerendert. Ohne eine Datei blieb die Tabelle `Rechtstext` leer, und
   damit ging jede Bestätigungsmail OHNE die einbezogenen Bedingungen
   hinaus — obwohl § 312f Abs. 2 BGB genau die verlangt.

   Diese Datei schliesst die Lücke, und zwar an der einzigen Stelle,
   an der sie sich schliessen lässt: Der Wortlaut wird nicht abgetippt,
   sondern aus DENSELBEN Zeichenketten erzeugt, die die Seite anzeigt.
   Eine abgetippte Kopie wäre beim ersten Satz, den jemand ändert,
   still falsch — und still falsch ist bei einem Vertragstext der
   schlimmste Zustand.

   Was hier NICHT passiert: Es wird kein Wort ergänzt, weggelassen oder
   umformuliert. Auch keine Vorrede, kein „Stand:"-Kopf und keine
   Einleitung — das Stand-Datum steht bereits in Ziffer 17.3, und
   etwas hinzuzufügen, das auf der Seite nicht steht, wäre genau die
   Abweichung, die der Nachweis nicht verträgt. Hinzu kommen
   ausschliesslich Zeilenumbrüche und, wo die Seite eine Aufzählung
   zeigt, ein „- " je Punkt.

   Warum reiner Text und kein Markdown: Der Wortlaut geht als Volltext
   in die Bestätigungsmail (lib/mailVorlagen.ts → fassungsAnhang), und
   die ist reiner Text. Ein „## " vor jeder Ziffer stünde dort
   wörtlich in der Mail.

   Warum ohne harten Zeilenumbruch: Ein Absatz ist EINE Zeile. Das
   Mailprogramm bricht selbst um. Ein eingefügter Umbruch mitten im
   Satz wäre eine Abweichung vom angezeigten Text — sichtbar erst,
   wenn jemand den Wortlaut wieder zusammensetzen will.
   --------------------------------------------------------------- */

import { texte } from "@/content";
import { ohneTrennstellen } from "./formate";

/** Ein Abschnitt, wie ihn die Seite zeigt: Überschrift und Blöcke. */
interface Abschnitt {
  titel: string;
  /** Absätze in der Reihenfolge der Seite. */
  absaetze: string[];
  /** Punkte, die die Seite als Aufzählung zeigt — nach den Absätzen. */
  punkte?: string[];
  /** Absätze, die auf der Seite NACH der Aufzählung stehen. */
  nachsatz?: string[];
}

/**
 * Die Abschnitte der Teilnahmebedingungen, in der Reihenfolge von
 * app/(seite)/agb/page.tsx.
 *
 * Diese Liste ist bewusst die zweite Stelle, an der die Reihenfolge
 * steht — die erste ist die Seite selbst. Dass beide vollständig sind
 * und übereinstimmen, prüft Liste U; sie vergleicht die erzeugte
 * Fassung Feld für Feld mit `texte.recht`. Eine neue Ziffer, die hier
 * fehlt, lässt die Prüfung fehlschlagen.
 */
export function agbAbschnitte(): Abschnitt[] {
  const t = texte.recht;
  return [
    { titel: t.agbGeltungsbereichUeberschrift, absaetze: t.agbGeltungsbereichAbsaetze },
    { titel: t.agbLeistungUeberschrift, absaetze: t.agbLeistungAbsaetze },
    { titel: t.agbVertragsschlussUeberschrift, absaetze: t.agbVertragsschlussAbsaetze },
    { titel: t.agbPreiseUeberschrift, absaetze: t.agbPreiseAbsaetze },
    { titel: t.agbTeilnahmeUeberschrift, absaetze: t.agbTeilnahmeAbsaetze },
    { titel: t.agbMinderjaehrigUeberschrift, absaetze: t.agbMinderjaehrigAbsaetze },
    { titel: t.agbStornoUeberschrift, absaetze: t.agbStornoAbsaetze },
    { titel: t.agbAbsageUeberschrift, absaetze: t.agbAbsageAbsaetze },
    { titel: t.agbPflichtenUeberschrift, absaetze: t.agbPflichtenAbsaetze },
    { titel: t.agbGesundheitUeberschrift, absaetze: t.agbGesundheitAbsaetze },
    { titel: t.agbHaftungUeberschrift, absaetze: t.agbHaftungAbsaetze },
    {
      titel: t.agbVeranstaltungsstaetteUeberschrift,
      absaetze: t.agbVeranstaltungsstaetteAbsaetze,
    },
    { titel: t.agbWiderrufsrechtUeberschrift, absaetze: t.agbWiderrufsrechtAbsaetze },
    { titel: t.agbVertragsdauerUeberschrift, absaetze: [t.agbVertragsdauerText] },
    { titel: t.agbRechtGerichtsstandUeberschrift, absaetze: t.agbRechtGerichtsstandAbsaetze },
    { titel: t.agbStreitbeilegungUeberschrift, absaetze: [t.agbStreitbeilegungText] },
    { titel: t.agbSchlussUeberschrift, absaetze: t.agbSchlussAbsaetze },
    { titel: t.agbAufnahmenUeberschrift, absaetze: [t.agbAufnahmenText] },
  ];
}

/**
 * Die Abschnitte der Datenschutzerklärung, in der Reihenfolge von
 * app/(seite)/datenschutz/page.tsx.
 *
 * Abschnitt 3 und 5 zeigt die Seite als Aufzählung; Abschnitt 5 hat
 * danach noch drei Absätze. Deshalb `punkte` und `nachsatz` — die
 * Reihenfolge auf der Seite bleibt erhalten.
 */
export function datenschutzAbschnitte(): Abschnitt[] {
  const t = texte.recht;
  return [
    {
      titel: t.datenschutzAllgemeinUeberschrift,
      absaetze: [
        t.datenschutzVerantwortlicher,
        t.datenschutzText,
        t.datenschutzZahlung,
        t.keineCookies,
      ],
    },
    {
      titel: t.datenschutzMinderjaehrigUeberschrift,
      absaetze: [t.datenschutzMinderjaehrigEinleitung, ...t.datenschutzMinderjaehrigAbsaetze],
    },
    {
      titel: t.datenschutzEmpfaengerUeberschrift,
      absaetze: [t.datenschutzEmpfaengerEinleitung],
      punkte: t.datenschutzEmpfaengerAbsaetze,
    },
    {
      titel: t.datenschutzLoeschungUeberschrift,
      absaetze: [t.datenschutzLoeschungEinleitung, ...t.datenschutzLoeschungAbsaetze],
    },
    {
      titel: t.datenschutzRechteUeberschrift,
      absaetze: [t.datenschutzRechteEinleitung],
      punkte: t.datenschutzRechtePunkte,
      nachsatz: [
        t.datenschutzRechteKontakt,
        t.datenschutzRechteBeschwerde,
        t.datenschutzRechteAutomatisiert,
      ],
    },
  ];
}

/**
 * Aus Titel und Abschnitten den Wortlaut machen.
 *
 * Zwischen zwei Abschnitten stehen zwei Leerzeilen, innerhalb eines
 * Abschnitts eine. Das ist die einzige Gliederungshilfe — mehr braucht
 * reiner Text nicht, und weniger liesse die Ziffern ineinanderlaufen.
 *
 * Weiche Trennstellen (U+00AD) fallen heraus. Sie sind ein Hinweis an
 * den Browser, wo er ein langes Wort umbrechen darf; in einer Mail
 * zeigen manche Programme sie als sichtbaren Bindestrich an. Auf dem
 * Papier stünde dann ein Wort, das so nirgends steht.
 */
export function alsWortlaut(titel: string, abschnitte: Abschnitt[]): string {
  const bloecke: string[] = [ohneTrennstellen(titel)];

  for (const a of abschnitte) {
    const zeilen: string[] = [ohneTrennstellen(a.titel), ...a.absaetze.map(ohneTrennstellen)];
    if (a.punkte) zeilen.push(...a.punkte.map((p) => `- ${ohneTrennstellen(p)}`));
    if (a.nachsatz) zeilen.push(...a.nachsatz.map(ohneTrennstellen));
    bloecke.push(zeilen.join("\n\n"));
  }

  /* Schlusszeilenumbruch: Eine Textdatei endet mit einem Umbruch.
     Ohne ihn meldet git „\ No newline at end of file" bei jeder
     Änderung — Lärm in einem Unterschied, der lesbar bleiben soll. */
  return bloecke.join("\n\n\n") + "\n";
}

/** Der Wortlaut der Teilnahmebedingungen, wie die Seite ihn zeigt. */
export function agbWortlaut(): string {
  return alsWortlaut(texte.recht.agbTitel, agbAbschnitte());
}

/** Der Wortlaut der Datenschutzerklärung, wie die Seite ihn zeigt. */
export function datenschutzWortlaut(): string {
  return alsWortlaut(texte.recht.datenschutzTitel, datenschutzAbschnitte());
}

/**
 * Wo die erzeugten Fassungen im Projekt liegen.
 *
 * Feste Namen, nicht nach Datum: Die Datei ist immer der AKTUELLE
 * Wortlaut. Das Archiv der alten Fassungen ist die Datenbank, nicht
 * der Ordner — dort verweisen die Buchungen hin. Zwei Archive wären
 * zwei Wahrheiten.
 */
export const FASSUNGSDATEIEN = {
  AGB_B2C: "rechtstexte/agb-b2c.txt",
  DATENSCHUTZ: "rechtstexte/datenschutzerklaerung.txt",
} as const;
