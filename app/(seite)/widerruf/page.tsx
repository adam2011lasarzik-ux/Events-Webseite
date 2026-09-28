import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Widerruf und Stornierung.
 *
 * Alle drei Abschnitte sind seit dem 28.09.2026 verbindlich. Abschnitt
 * 1 war bis dahin ein sichtbar markierter Platzhalter; er teilt jetzt
 * den Ausschluss nach § 312g Abs. 2 Nr. 9 BGB mit, wie ihn Art. 246a
 * § 1 Abs. 3 Nr. 1 EGBGB verlangt. Die Begründung und der offene
 * Prüfauftrag stehen bei den Texten in content/de.ts.
 *
 * Die Seite heisst weiterhin „Widerruf und Stornierung" und nicht
 * „Widerrufsbelehrung": Eine Belehrung über ein Recht, das nicht
 * besteht, wäre eine falsche Überschrift.
 *
 * Bewusst getrennt: das gesetzliche Widerrufsrecht auf der einen, die
 * vertragliche Stornierung auf der anderen Seite. Die beiden werden
 * regelmässig verwechselt, sind aber verschiedene Dinge — das eine
 * steht im Gesetz, das andere legt VERA selbst fest.
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
        {t.recht.widerrufAusschlussAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}

        <h2>{t.recht.stornoUeberschrift}</h2>
        {t.recht.stornoAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}

        <h2>{t.recht.absageUeberschrift}</h2>
        <p>{t.recht.absageText}</p>

      </div>
    </Abschnitt>
  );
}
