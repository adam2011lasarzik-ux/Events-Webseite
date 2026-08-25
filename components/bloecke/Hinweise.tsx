import { AbschnittKopf } from "../Abschnitt";
import { Knopf } from "../Knopf";
import type { EventBlock } from "@/lib/eventInhalte";
import stil from "../Textseite.module.css";

/**
 * Überschrift, Einleitung, Punkteliste und ein optionaler Verweis.
 *
 * Nutzt dieselben Stile, mit denen der Für-Schulen-Block bisher auf der
 * Event-Seite stand — nur kommt der Inhalt jetzt vom Event.
 */
export function Hinweise({ block }: { block: EventBlock }) {
  return (
    <div data-block="hinweise">
      <AbschnittKopf titel={block.titel} einleitung={block.absaetze[0]} />
      {block.absaetze.slice(1).map((absatz, i) => (
        <p key={i} style={{ marginTop: "1rem", maxWidth: "var(--breite-text)" }}>
          {absatz}
        </p>
      ))}
      {block.punkte.length > 0 && (
        <ul className={stil.punkte}>
          {block.punkte.map((punkt) => (
            <li key={punkt}>
              <span className={stil.haken} aria-hidden="true">✓</span>
              {punkt}
            </li>
          ))}
        </ul>
      )}
      {block.verweis && (
        <div style={{ marginTop: "2rem" }}>
          <Knopf href={block.verweis.ziel} art="zweit" pfeil>
            {block.verweis.text}
          </Knopf>
        </div>
      )}
    </div>
  );
}
