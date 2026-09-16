import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Allgemeine Geschäftsbedingungen.
 *
 * Abschnitt 1 (der allgemeine Vertragstext) ist weiterhin ein
 * markierter Platzhalter — ob VERA eigene AGB verwendet, ist offen.
 * Abschnitt 2 ist dagegen verbindlich: Die Regeln für die Teilnahme
 * Minderjähriger hat der Betreiber festgelegt, und sie beschreiben
 * denselben Ablauf wie die Einverständniserklärung und der Hinweis im
 * Anmeldebereich.
 *
 * Deshalb steht die Markierung seit dieser Ergänzung bei Abschnitt 1
 * statt über der ganzen Seite — dasselbe Muster wie auf der
 * Widerrufsseite. Eine Seite, die geltende Bedingungen enthält und
 * sich zugleich als „noch nicht ausgefüllt" bezeichnet, wäre in beide
 * Richtungen irreführend.
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
      <div className={stil.inhalt}>
        <h2>{t.recht.agbAllgemeinUeberschrift}</h2>
        <p>
          <Platzhalter text={t.recht.agbOffenMarke} markierung={t.platzhalter.markierung} />
        </p>
        <p>{t.recht.agbText}</p>
        <p>{t.recht.agbHinweisPflichtinfos}</p>
        <p>{t.recht.agbStorno}</p>

        <h2>{t.recht.agbMinderjaehrigUeberschrift}</h2>
        {t.recht.agbMinderjaehrigAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}
      </div>
    </Abschnitt>
  );
}
