/* ---------------------------------------------------------------
   Kleine Formathelfer für Datum und Textvorlagen.

   Diese Datei ist der Rest von lib/i18n.ts, nachdem die Seite auf
   Deutsch reduziert wurde: Sprachliste, Sprachtyp und der Pfadbauer
   pfad() wurden nicht mehr gebraucht. Adressen werden jetzt direkt
   geschrieben („/anmeldung" statt pfad(sprache, "/anmeldung")).
   --------------------------------------------------------------- */

/** Datum ausschreiben, z. B. „Freitag, 19. September 2026". */
export function alsDatum(isoDatum: string): string {
  return new Intl.DateTimeFormat("de-DE", {
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
 * geschweiften Klammern lösen das und bleiben gut lesbar.
 */
export function fuelle(
  vorlage: string,
  werte: Record<string, string | number>,
): string {
  return vorlage.replace(/\{(\w+)\}/g, (treffer, schluessel: string) =>
    schluessel in werte ? String(werte[schluessel]) : treffer,
  );
}
