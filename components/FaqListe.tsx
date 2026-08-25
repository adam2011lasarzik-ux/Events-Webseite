import { AbschnittKopf } from "./Abschnitt";
import stil from "./FaqListe.module.css";

export interface FaqEintrag {
  frage: string;
  antwort: string;
}

/**
 * Bewusst mit <details>/<summary> gebaut: Das Auf- und Zuklappen
 * kann der Browser selbst, ganz ohne JavaScript. Damit funktioniert
 * es auch mit Tastatur und Screenreader zuverlässig.
 *
 * Bekommt die Einträge übergeben, statt sie selbst aus dem Wörterbuch
 * zu holen: Auf der Event-Seite stammen sie vom Event, auf /faq aus
 * dem Wörterbuch. Ein Baustein, zwei Quellen.
 */
export function FaqListe({
  eintraege,
  ueberschrift,
}: {
  eintraege: readonly FaqEintrag[];
  /** Weglassen, wenn die Überschrift schon darüber steht. */
  ueberschrift?: string;
}) {
  return (
    <div data-block="faq">
      {ueberschrift && <AbschnittKopf titel={ueberschrift} />}
      <div className={stil.liste}>
        {eintraege.map((eintrag) => (
          <details key={eintrag.frage} className={stil.eintrag}>
            <summary className={stil.frage}>
              {eintrag.frage}
              <span className={stil.zeichen} aria-hidden="true" />
            </summary>
            <p className={stil.antwort}>{eintrag.antwort}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
