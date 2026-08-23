import { de, type Woerterbuch } from "./de";
import { en } from "./en";
import type { Sprache } from "@/lib/i18n";

const woerterbuecher: Record<Sprache, Woerterbuch> = { de, en };

/**
 * Liefert alle Texte in der gewünschten Sprache.
 *
 * Der Rückfall auf Deutsch ist ein Sicherheitsnetz: Ein unbekanntes
 * Sprachkürzel soll nie zu einem Absturz führen. Regulär greift schon
 * die Routenprüfung (dynamicParams) und beantwortet solche Adressen
 * mit 404.
 */
export function texte(sprache: Sprache): Woerterbuch {
  return woerterbuecher[sprache] ?? de;
}

export type { Woerterbuch };
