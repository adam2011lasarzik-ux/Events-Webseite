/* ---------------------------------------------------------------
   Die Inhaltsblöcke einer Veranstaltung.

   Bis hierher standen „Was ist Padel?", der Ablauf, der
   Für-Schulen-Block und die FAQ im globalen Wörterbuch. Das ging,
   solange es genau ein Event gab — bei einem Unternehmer-Netzwerkabend
   hätte dort „Was ist Padel überhaupt?" gestanden. Jetzt gehören diese
   Inhalte zum Event.

   Gespeichert werden sie in der bereits vorhandenen Tabelle
   EventAbschnitt: `art` sagt, welche Form der Block hat, `titel` ist
   die Überschrift, `inhalt` der Text. Kein neues Datenmodell nötig —
   die Tabelle war für genau diesen Zweck angelegt.

   Warum Zeilen statt eines Eingabe-Baukastens: Der Nutzer arbeitet auf
   einem iPad. Ein Textfeld mit einer erklärten Zeilenregel lässt sich
   dort tippen; ein Baukasten mit Ziehen und Sortieren nicht.

   Reine Funktionen: kein HTTP, keine Datenbank, keine Anzeige.
   --------------------------------------------------------------- */

/** Die Blockarten, die auf der Event-Seite erscheinen — in dieser Reihenfolge. */
export const BLOCK_ARTEN = ["vorstellung", "ablauf", "hinweise", "faq"] as const;
export type BlockArt = (typeof BLOCK_ARTEN)[number];

/**
 * Blockarten, die NICHT auf der Event-Seite erscheinen.
 * `dabei` und `mitbringen` speisen die kompakte Detailseite und bleiben
 * unverändert, wie sie seit Schritt D sind.
 */
export const WEITERE_ARTEN = ["dabei", "mitbringen"] as const;

export interface Fakt { zahl: string; text: string }
export interface Schritt { zeit: string | null; titel: string; text: string }
export interface Frage { frage: string; antwort: string }
export interface Verweis { text: string; ziel: string }

/** Ein Block, fertig für die Anzeige aufbereitet. */
export interface EventBlock {
  art: BlockArt;
  titel: string;
  absaetze: string[];
  punkte: string[];
  fakten: Fakt[];
  schritte: Schritt[];
  fragen: Frage[];
  verweis: Verweis | null;
}

const teile = (zeile: string): string[] => zeile.split("|").map((t) => t.trim());

/**
 * Eine Zeilenregel für alle Blockarten — einmal gelernt, überall gültig:
 *
 *   - Text            ein Aufzählungspunkt
 *   * 20 × 10 | Meter Platz    eine Zahlenkachel
 *   > Mehr erfahren | /fuer-schulen   ein Verweis
 *   alles andere      Fließtext; eine Leerzeile trennt zwei Absätze
 *
 * Bei „ablauf" und „faq" wird jede übrige Zeile stattdessen an den
 * senkrechten Strichen geteilt.
 */
export function leseBlock(art: BlockArt, titel: string, inhalt: string): EventBlock {
  const block: EventBlock = {
    art, titel,
    absaetze: [], punkte: [], fakten: [], schritte: [], fragen: [], verweis: null,
  };

  const rest: string[] = [];

  for (const rohZeile of inhalt.split("\n")) {
    const zeile = rohZeile.trim();

    if (zeile.startsWith("- ")) {
      block.punkte.push(zeile.slice(2).trim());
    } else if (zeile.startsWith("* ")) {
      const [zahl, text = ""] = teile(zeile.slice(2));
      if (zahl) block.fakten.push({ zahl, text });
    } else if (zeile.startsWith("> ")) {
      const [text, ziel = ""] = teile(zeile.slice(2));
      // Nur seiteneigene Ziele. Ein Verweis auf eine fremde Adresse
      // wäre eine stille Möglichkeit, Besucher woandershin zu schicken.
      if (text && ziel.startsWith("/")) block.verweis = { text, ziel };
    } else {
      rest.push(zeile);
    }
  }

  if (art === "ablauf") {
    for (const zeile of rest) {
      if (!zeile) continue;
      const stuecke = teile(zeile);
      if (stuecke.length >= 3) {
        block.schritte.push({ zeit: stuecke[0], titel: stuecke[1], text: stuecke.slice(2).join(" | ") });
      } else if (stuecke.length === 2) {
        block.schritte.push({ zeit: null, titel: stuecke[0], text: stuecke[1] });
      } else {
        block.schritte.push({ zeit: null, titel: stuecke[0], text: "" });
      }
    }
    return block;
  }

  if (art === "faq") {
    for (const zeile of rest) {
      if (!zeile) continue;
      const [frage, ...antwort] = teile(zeile);
      if (frage) block.fragen.push({ frage, antwort: antwort.join(" | ") });
    }
    return block;
  }

  // Fließtext: eine Leerzeile trennt zwei Absätze.
  block.absaetze = rest
    .join("\n")
    .split(/\n\s*\n/)
    .map((a) => a.replace(/\n/g, " ").trim())
    .filter(Boolean);

  return block;
}

/** Hat der Block überhaupt Inhalt? Leere Blöcke werden nicht angezeigt. */
export function blockHatInhalt(block: EventBlock): boolean {
  return (
    block.absaetze.length > 0 || block.punkte.length > 0 || block.fakten.length > 0 ||
    block.schritte.length > 0 || block.fragen.length > 0
  );
}

/** Aus den Datenbankzeilen die anzuzeigenden Blöcke bauen, in fester Reihenfolge. */
export function leseBloecke(
  abschnitte: { art: string; titel: string; inhalt: string }[],
): EventBlock[] {
  return BLOCK_ARTEN.map((art) => {
    const zeile = abschnitte.find((a) => a.art === art);
    if (!zeile) return null;
    const block = leseBlock(art, zeile.titel, zeile.inhalt);
    return blockHatInhalt(block) ? block : null;
  }).filter((b): b is EventBlock => b !== null);
}

/**
 * Teilt eine Kopfzeilen-Überschrift an der ersten Satzgrenze.
 *
 * Damit steht der zweite Teil abgesetzt darunter, wie bisher bei
 * „Nie gespielt? / Genau darum geht's." Bewusst nur, wenn beide
 * Hälften noch etwas hergeben: Ein abgetrennter Ein-Wort-Rest sähe
 * nach Fehler aus, nicht nach Absicht. Ohne Trennstelle bleibt es bei
 * einer Zeile.
 */
export function teileUeberschrift(titel: string): [string, string | null] {
  const text = titel.trim();
  for (const t of text.matchAll(/[?!.](\s+)/g)) {
    const schnitt = (t.index ?? 0) + 1;
    const erste = text.slice(0, schnitt).trim();
    const zweite = text.slice(schnitt).trim();
    if (erste.length >= 6 && zweite.length >= 6) return [erste, zweite];
  }
  return [text, null];
}
