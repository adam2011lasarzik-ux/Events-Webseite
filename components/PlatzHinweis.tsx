import { platzstand } from "@/lib/plaetze";
import { fuelle } from "@/lib/formate";
import type { VeraEvent } from "@/content/events";
import type { Woerterbuch } from "@/content";
import stil from "./PlatzHinweis.module.css";

/**
 * Zeigt freie Plätze nur dann, wenn es knapp wird. Solange viel frei
 * ist, erscheint gar nichts — eine Zahl wie „noch 98 frei" wirkt
 * nicht einladend, sondern leer.
 */
export function PlatzHinweis({
  event,
  t,
  aufDunkel = false,
}: {
  event: VeraEvent;
  t: Woerterbuch;
  aufDunkel?: boolean;
}) {
  const stand = platzstand(event.maxPersonen, event.belegtePersonen, event.schwelle);

  if (stand.lage === "offen" || stand.lage === "unbegrenzt") return null;

  const ausgebucht = stand.lage === "ausgebucht";
  const tonKlasse = ausgebucht ? stil.ausgebucht : aufDunkel ? stil.aufDunkelTon : stil.wenige;

  return (
    <span className={`${stil.hinweis} ${tonKlasse}`}>
      <span className={stil.punkt} aria-hidden="true" />
      {ausgebucht
        ? t.plaetze.ausgebucht
        : stand.frei === 1
          ? t.plaetze.wenigeEiner
          : fuelle(t.plaetze.wenigeMehrere, { n: stand.frei })}
    </span>
  );
}
