import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Widerrufsbelehrung — vorerst ein markierter Platzhalter.
 *
 * Wie bei den AGB gilt: Was rechtlich zutrifft, schreibt eine
 * fachkundige Person. Der Text hier benennt nur, WAS hineingehört —
 * und einen Punkt, der besonders leicht übersehen wird (siehe
 * `widerrufHinweis` in content/de.ts).
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
        <p>{t.recht.widerrufText}</p>
        <p>{t.recht.widerrufHinweis}</p>
        <p>{t.recht.hinweisJurist}</p>
      </div>
    </Abschnitt>
  );
}
