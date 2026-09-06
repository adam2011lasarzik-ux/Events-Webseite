import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Widerruf und Stornierung.
 *
 * Abschnitt 1 (gesetzliches Widerrufsrecht) ist weiterhin ein
 * markierter Platzhalter — die Frage nach § 312g Abs. 2 Nr. 9 BGB ist
 * offen. Abschnitt 2 und 3 sind dagegen verbindlich: Sie beschreiben
 * die Stornobedingungen, die der Betreiber festgelegt hat, und den
 * Ablauf, den die Seite tatsächlich anbietet.
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
      <div className={stil.inhalt}>
        <p>{t.recht.widerrufEinleitung}</p>

        <h2>{t.recht.widerrufUeberschrift}</h2>
        {/* Die Markierung steht bei Abschnitt 1, nicht über der ganzen
            Seite: Abschnitt 2 und 3 sind verbindliche Bedingungen. Eine
            Seite, die geltende Regeln enthält und sich zugleich als
            „nicht ausgefüllt" bezeichnet, wäre in beide Richtungen
            irreführend. */}
        <p>
          <Platzhalter
            text={t.recht.widerrufOffenMarke}
            markierung={t.platzhalter.markierung}
          />
        </p>
        <p>{t.recht.widerrufText}</p>
        <p>{t.recht.widerrufHinweis}</p>

        <h2>{t.recht.stornoUeberschrift}</h2>
        {t.recht.stornoAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}

        <h2>{t.recht.absageUeberschrift}</h2>
        <p>{t.recht.absageText}</p>

        <p>{t.recht.widerrufPruefung}</p>
      </div>
    </Abschnitt>
  );
}
