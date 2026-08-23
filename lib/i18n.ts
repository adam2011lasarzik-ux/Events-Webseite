/* ---------------------------------------------------------------
   Sprachen. Deutsch ist die Standardsprache.
   --------------------------------------------------------------- */

export const sprachen = ["de", "en"] as const;
export type Sprache = (typeof sprachen)[number];
export const standardSprache: Sprache = "de";

export function istSprache(wert: string): wert is Sprache {
  return (sprachen as readonly string[]).includes(wert);
}

/** Baut einen Pfad in der gewählten Sprache, z. B. („en", "/faq") → „/en/faq". */
export function pfad(sprache: Sprache, rest: string = ""): string {
  const sauber = rest.startsWith("/") ? rest : rest ? `/${rest}` : "";
  return `/${sprache}${sauber}`;
}

/** Datum sprachabhängig ausschreiben. */
export function alsDatum(isoDatum: string, sprache: Sprache): string {
  return new Intl.DateTimeFormat(sprache === "en" ? "en-GB" : "de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${isoDatum}T12:00:00`));
}

/**
 * Setzt Werte in eine Textvorlage ein: fuelle("Noch {n} frei", { n: 6 }).
 *
 * Warum keine Funktionen im Wörterbuch: Texte werden vom Server an die
 * interaktiven Teile der Seite übergeben, und dabei können nur reine
 * Daten die Grenze überqueren — Funktionen nicht. Vorlagen mit
 * geschweiften Klammern lösen das und bleiben für Übersetzer lesbar.
 */
export function fuelle(
  vorlage: string,
  werte: Record<string, string | number>,
): string {
  return vorlage.replace(/\{(\w+)\}/g, (treffer, schluessel: string) =>
    schluessel in werte ? String(werte[schluessel]) : treffer,
  );
}
