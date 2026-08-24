import { de, type Woerterbuch } from "./de";

/**
 * Alle Texte der Seite. Die Seite ist einsprachig (Deutsch), deshalb
 * ist das hier schlicht das Wörterbuch selbst — früher war es eine
 * Funktion, die je nach Sprachkürzel das passende Wörterbuch lieferte.
 */
export const texte: Woerterbuch = de;

export type { Woerterbuch };
