import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Widerruf und Stornierung — vorerst ein markierter Platzhalter.
 *
 * Die Seite hiess einmal „Widerrufsbelehrung". Dieser Titel setzt
 * voraus, dass ein Widerrufsrecht besteht — und genau das ist bei
 * Freizeitveranstaltungen mit festem Termin offen (§ 312g Abs. 2
 * Nr. 9 BGB). Ein Titel darf die Frage nicht vorwegnehmen, die die
 * Seite stellt.
 *
 * Bewusst KEINE 14-Tage-Belehrung: Über ein Recht zu belehren, das es
 * womöglich gar nicht gibt, wäre irreführend.
 *
 * Ebenso bewusst getrennt: das gesetzliche Widerrufsrecht auf der
 * einen, die vertragliche Stornierung auf der anderen Seite. Die
 * beiden werden regelmässig verwechselt, sind aber verschiedene
 * Dinge — das eine steht im Gesetz, das andere legt VERA selbst fest.
 */
export const metadata: Metadata = { title: texte.recht.widerrufTitel };

export default function Seite() {
  const t = texte;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.widerrufTitel} haupt />
      <p style={{ marginBottom: "1.5rem" }}>
        <Platzhalter text={t.recht.platzhalterTitel} markierung={t.platzhalter.markierung} />
      </p>
      <div className={stil.inhalt}>
        <p>{t.recht.widerrufEinleitung}</p>

        <h2>{t.recht.widerrufUeberschrift}</h2>
        <p>{t.recht.widerrufText}</p>
        <p>{t.recht.widerrufHinweis}</p>

        <h2>{t.recht.stornoUeberschrift}</h2>
        <p>{t.recht.stornoText}</p>

        <p>{t.recht.hinweisJurist}</p>
      </div>
    </Abschnitt>
  );
}
