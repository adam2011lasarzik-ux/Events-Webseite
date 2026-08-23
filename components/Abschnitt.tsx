import stil from "./Abschnitt.module.css";

export function Abschnitt({
  id,
  ton = "hell",
  children,
}: {
  id?: string;
  ton?: "hell" | "dunkel" | "warm";
  children: React.ReactNode;
}) {
  const tonKlasse = ton === "dunkel" ? stil.dunkel : ton === "warm" ? stil.warm : "";
  return (
    <section id={id} className={`${stil.abschnitt} ${tonKlasse} ${ton === "dunkel" ? "aufDunkel" : ""}`}>
      <div className={stil.innen}>{children}</div>
    </section>
  );
}

export function AbschnittKopf({
  augenbraue,
  titel,
  einleitung,
  haupt = false,
}: {
  augenbraue?: string;
  titel: string;
  einleitung?: string;
  /**
   * Setzt die Überschrift als h1. Genau eine Seite darf genau eine
   * Hauptüberschrift haben — daran hangeln sich Screenreader und
   * Suchmaschinen entlang.
   */
  haupt?: boolean;
}) {
  const Ueberschrift = haupt ? "h1" : "h2";
  return (
    <header className={stil.kopf}>
      {augenbraue && <span className={stil.augenbraue}>{augenbraue}</span>}
      <Ueberschrift>{titel}</Ueberschrift>
      {einleitung && <p className={stil.einleitung}>{einleitung}</p>}
    </header>
  );
}
