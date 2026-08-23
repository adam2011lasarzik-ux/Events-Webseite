import { AbschnittKopf } from "./Abschnitt";
import type { Woerterbuch } from "@/content";
import stil from "./FaqListe.module.css";

/**
 * Bewusst mit <details>/<summary> gebaut: Das Auf- und Zuklappen
 * kann der Browser selbst, ganz ohne JavaScript. Damit funktioniert
 * es auch mit Tastatur und Screenreader zuverlässig.
 */
export function FaqListe({ t, mitKopf = true }: { t: Woerterbuch; mitKopf?: boolean }) {
  return (
    <>
      {mitKopf && <AbschnittKopf titel={t.faq.ueberschrift} />}
      <div className={stil.liste}>
        {t.faq.eintraege.map((eintrag) => (
          <details key={eintrag.frage} className={stil.eintrag}>
            <summary className={stil.frage}>
              {eintrag.frage}
              <span className={stil.zeichen} aria-hidden="true" />
            </summary>
            <p className={stil.antwort}>{eintrag.antwort}</p>
          </details>
        ))}
      </div>
    </>
  );
}
