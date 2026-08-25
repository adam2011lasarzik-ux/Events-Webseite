import { AbschnittKopf } from "../Abschnitt";
import type { EventBlock } from "@/lib/eventInhalte";
import stil from "./Ablauf.module.css";

/**
 * Der Ablauf in Schritten.
 *
 * Die Nummerierung steht hier zu Recht: Der Tag läuft wirklich in
 * dieser Reihenfolge ab, die Zahlen tragen also Information. Ist eine
 * Uhrzeit angegeben, wird daraus im Business-Theme eine Zeitschiene
 * (siehe styles/themes.css) — dieselbe Angabe, anders gesetzt.
 */
export function Ablauf({ block }: { block: EventBlock }) {
  return (
    <div data-block="ablauf">
      <AbschnittKopf titel={block.titel} />
      <ol className={stil.liste}>
        {block.schritte.map((schritt, i) => (
          <li key={`${schritt.titel}-${i}`} className={stil.schritt}>
            {schritt.zeit && <span data-zeit>{schritt.zeit}</span>}
            <h3 className={stil.titel}>{schritt.titel}</h3>
            {schritt.text && <p className={stil.text}>{schritt.text}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
