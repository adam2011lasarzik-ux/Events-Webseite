import { themeAttribut, type Theme } from "@/lib/themes";
import stil from "./ThemeRahmen.module.css";

/**
 * Legt das Design einer Veranstaltung um deren Seite.
 *
 * Absichtlich winzig: Der Rahmen setzt nur `data-theme`. Was das
 * bedeutet, steht ausschließlich in styles/themes.css, und zwar als
 * Überschreibung von Design-Variablen. Deshalb müssen die Bausteine
 * darin nichts vom Theme wissen — sie lesen dieselben Variablen wie
 * vorher, nur mit anderen Werten.
 *
 * Der Rahmen liegt bewusst INNERHALB von Kopfzeile und Fußbereich:
 * Die Marken-Hülle bleibt in jedem Theme gleich, damit erkennbar
 * bleibt, dass alle Veranstaltungen zusammengehören. Nur der Inhalt
 * dazwischen wechselt sein Aussehen.
 */
export function ThemeRahmen({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <div className={stil.rahmen} data-theme={themeAttribut(theme)}>
      {children}
    </div>
  );
}
