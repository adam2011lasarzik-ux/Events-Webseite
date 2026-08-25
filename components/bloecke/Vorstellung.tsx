import { AbschnittKopf } from "../Abschnitt";
import type { EventBlock } from "@/lib/eventInhalte";
import stil from "./Vorstellung.module.css";

/**
 * Vorstellungstext mit Zahlenkacheln daneben.
 *
 * War früher `WasIstPadel` und holte seinen Inhalt aus dem globalen
 * Wörterbuch — womit jedes Event „Was ist Padel?" gezeigt hätte. Jetzt
 * kommt der Inhalt vom Event. Die CSS-Datei ist unverändert dieselbe,
 * damit die Padel-Seite Zeile für Zeile aussieht wie vorher.
 */
export function Vorstellung({ block }: { block: EventBlock }) {
  return (
    <div data-block="vorstellung">
      <AbschnittKopf titel={block.titel} />
      <div className={stil.raster}>
        <div className={stil.texte}>
          {block.absaetze.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>
        {block.fakten.length > 0 && (
          <div className={stil.fakten}>
            {block.fakten.map((fakt) => (
              <div key={`${fakt.zahl}-${fakt.text}`} className={stil.fakt}>
                <span className={stil.zahl}>{fakt.zahl}</span>
                <span className={stil.faktText}>{fakt.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
