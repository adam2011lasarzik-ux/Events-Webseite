import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Allgemeine Geschäftsbedingungen — vorerst ein markierter Platzhalter.
 *
 * Die Seite entsteht jetzt, obwohl der Text noch fehlt: Adresse,
 * Verlinkung im Fußbereich und Gerüst stehen damit, und am Tag des
 * Livegangs ist nur noch Text einzusetzen statt umzubauen.
 *
 * Die Stornobedingungen bekommen bewusst KEINE eigene Adresse. Sie
 * gehören in denselben Vertragstext; eine eigene Seite dafür würde die
 * Fußzeile aufblähen, ohne etwas zu gewinnen.
 */
export const metadata: Metadata = { title: texte.recht.agbTitel };

export default function Seite() {
  const t = texte;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.agbTitel} haupt />
      <p style={{ marginBottom: "1.5rem" }}>
        <Platzhalter text={t.recht.platzhalterTitel} markierung={t.platzhalter.markierung} />
      </p>
      <div className={stil.inhalt}>
        <p>{t.recht.agbText}</p>
        <p>{t.recht.agbStorno}</p>
        <p>{t.recht.hinweisJurist}</p>
      </div>
    </Abschnitt>
  );
}
