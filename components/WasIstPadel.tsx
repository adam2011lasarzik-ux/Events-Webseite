import { AbschnittKopf } from "./Abschnitt";
import type { Woerterbuch } from "@/content";
import stil from "./WasIstPadel.module.css";

export function WasIstPadel({ t }: { t: Woerterbuch }) {
  return (
    <>
      <AbschnittKopf titel={t.padel.ueberschrift} />
      <div className={stil.raster}>
        <div className={stil.texte}>
          {t.padel.absaetze.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>
        <div className={stil.fakten}>
          {t.padel.fakten.map((fakt) => (
            <div key={fakt.text} className={stil.fakt}>
              <span className={stil.zahl}>{fakt.zahl}</span>
              <span className={stil.faktText}>{fakt.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
