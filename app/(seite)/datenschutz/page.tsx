import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import { ohneTrennstellen } from "@/lib/formate";
import stil from "@/components/Textseite.module.css";

/**
 * Datenschutzerklärung.
 *
 * Abschnitt 1 ist weiterhin ein markierter Platzhalter — die
 * ausformulierte Erklärung liegt noch nicht vor. Abschnitt 2 ist
 * dagegen verbindlich und beschreibt eine Verarbeitung, die
 * tatsächlich stattfindet: die Angaben auf der
 * Einverständniserklärung für minderjährige Teilnehmer.
 *
 * Abschnitt 3 beschreibt die Speicherdauer und die automatische
 * Löschung. Auch er ist verbindlich und kein Platzhalter: Er gibt
 * wieder, was lib/loeschfristen.ts und lib/loeschlauf.ts tatsächlich
 * tun.
 *
 * Die Markierung steht deshalb seit dieser Ergänzung bei Abschnitt 1
 * statt über der ganzen Seite — dasselbe Muster wie auf der
 * Widerrufs- und der AGB-Seite.
 */
export const metadata: Metadata = { title: ohneTrennstellen(texte.recht.datenschutzTitel) };

export default function Seite() {
  const t = texte;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.datenschutzTitel} haupt />
      <div className={stil.inhalt}>
        <h2>{t.recht.datenschutzAllgemeinUeberschrift}</h2>
        <p>
          <Platzhalter
            text={t.recht.datenschutzOffenMarke}
            markierung={t.platzhalter.markierung}
          />
        </p>
        <p>{t.recht.datenschutzText}</p>
        <p>{t.recht.datenschutzZahlung}</p>
        <p>{t.recht.keineCookies}</p>

        <h2>{t.recht.datenschutzMinderjaehrigUeberschrift}</h2>
        <p>{t.recht.datenschutzMinderjaehrigEinleitung}</p>
        {t.recht.datenschutzMinderjaehrigAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}

        <h2>{t.recht.datenschutzLoeschungUeberschrift}</h2>
        <p>{t.recht.datenschutzLoeschungEinleitung}</p>
        {t.recht.datenschutzLoeschungAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}
      </div>
    </Abschnitt>
  );
}
