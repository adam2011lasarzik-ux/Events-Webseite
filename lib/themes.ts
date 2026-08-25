/* ---------------------------------------------------------------
   Die Design-Themes einer Veranstaltung.

   Diese Datei ist die einzige Stelle, an der steht, welche Themes es
   gibt und wie sie heißen. Ein weiteres Theme braucht genau drei
   Schritte:

     1. Wert in die Prisma-Aufzählung EventTheme aufnehmen (+ Migration)
     2. Eintrag in THEMES hier
     3. Block [data-theme="…"] in styles/themes.css

   Bewusst KEINE Farben oder Schriften hier: Die stehen in
   styles/themes.css, damit Aussehen und Programmlogik nicht
   durcheinandergeraten. Hier stehen nur Name, Beschreibung und die
   Werte für die Vorschaukarten im Adminbereich.

   Reine Daten — keine Datenbank, kein HTTP, keine Anzeige. Dadurch
   lässt sich diese Datei auch im Browser verwenden, ohne dass
   Serverteile mitgezogen werden.
   --------------------------------------------------------------- */

export const THEMES = ["STANDARD", "BUSINESS", "PREMIUM"] as const;

export type Theme = (typeof THEMES)[number];

export const STANDARD_THEME: Theme = "STANDARD";

export interface ThemeBeschreibung {
  wert: Theme;
  name: string;
  /** Ein Satz: wofür dieses Design gedacht ist. */
  kurz: string;
  /** Wofür es sich eignet — für die Auswahl im Adminbereich. */
  passtZu: string;
  /** Farben NUR für die kleine Vorschaukarte im Adminbereich. */
  vorschau: { grund: string; text: string; akzent: string; schrift: string };
}

export const THEME_LISTE: ThemeBeschreibung[] = [
  {
    wert: "STANDARD",
    name: "Standard",
    kurz: "Freundlich, offen, ein bisschen sportlich — der gewohnte VERA-Auftritt.",
    passtZu: "Schüler- und Familienveranstaltungen, Freizeit, Padel, Community",
    vorschau: { grund: "#F6F3ED", text: "#0C3157", akzent: "#D8E84A", schrift: "var(--font-display), sans-serif" },
  },
  {
    wert: "BUSINESS",
    name: "Business",
    kurz: "Klar, sachlich, aufgeräumt. Zurückgenommen statt verspielt.",
    passtZu: "Unternehmer-Events, Networking, Firmenveranstaltungen, Workshops",
    vorschau: { grund: "#F7F9FB", text: "#0C3157", akzent: "#175D9C", schrift: "var(--font-business), sans-serif" },
  },
  {
    wert: "PREMIUM",
    name: "Premium",
    kurz: "Dunkel, ruhig, edel. Für Abende, an die man sich erinnern soll.",
    passtZu: "Exklusives Networking, VIP- und Abendveranstaltungen, hochwertige Partner",
    vorschau: { grund: "#081F38", text: "#F1EBE0", akzent: "#D8E84A", schrift: "var(--font-premium), serif" },
  },
];

/**
 * Aus einer beliebigen Eingabe ein erlaubtes Theme machen.
 *
 * Wichtig, weil der Wert aus dem Browser kommt: Ohne Prüfung liesse
 * sich über ein manipuliertes Formular ein Theme setzen, das es gar
 * nicht gibt. Die Datenbank wiese das ab, und der Bediener bekäme
 * einen unverständlichen Fehler zu sehen. So fällt es still auf
 * Standard zurück.
 */
export function alsTheme(wert: string): Theme {
  return (THEMES as readonly string[]).includes(wert) ? (wert as Theme) : STANDARD_THEME;
}

/** Kleingeschrieben für das data-theme-Attribut im HTML. */
export function themeAttribut(theme: Theme): string {
  return theme.toLowerCase();
}
