import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { texte } from "@/content";
import { ohneTrennstellen } from "@/lib/formate";
import stil from "@/components/Textseite.module.css";

/**
 * Datenschutzerklärung.
 *
 * Seit 21.09.2026 vollständig ausgefüllt, kein Platzhalter mehr. Alle
 * fünf Abschnitte beschreiben eine Verarbeitung, die tatsächlich
 * stattfindet: Abschnitt 1 die Online-Anmeldung und die Zahlung,
 * Abschnitt 2 das Papierformular für Minderjährige, Abschnitt 3 die
 * Empfänger, Abschnitt 4 Speicherdauer und Löschung
 * (lib/loeschfristen.ts, lib/loeschlauf.ts) und Abschnitt 5 die
 * gesetzlichen Rechte der betroffenen Personen.
 *
 * Abschnitt 2 ist mit der Einverständniserklärung
 * (public/dokumente/einverstaendniserklaerung-minderjaehrige.pdf)
 * wörtlich abgestimmt und darf nur gemeinsam mit ihr geändert werden.
 */
export const metadata: Metadata = { title: ohneTrennstellen(texte.recht.datenschutzTitel) };

export default function Seite() {
  const t = texte;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.datenschutzTitel} haupt />
      <div className={stil.inhalt}>
        <h2>{t.recht.datenschutzAllgemeinUeberschrift}</h2>
        <p>{t.recht.datenschutzVerantwortlicher}</p>
        <p>{t.recht.datenschutzText}</p>
        <p>{t.recht.datenschutzZahlung}</p>
        <p>{t.recht.keineCookies}</p>

        <h2>{t.recht.datenschutzMinderjaehrigUeberschrift}</h2>
        <p>{t.recht.datenschutzMinderjaehrigEinleitung}</p>
        {t.recht.datenschutzMinderjaehrigAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}

        <h2>{t.recht.datenschutzEmpfaengerUeberschrift}</h2>
        <p>{t.recht.datenschutzEmpfaengerEinleitung}</p>
        <ul>
          {t.recht.datenschutzEmpfaengerAbsaetze.map((absatz) => (
            <li key={absatz.slice(0, 40)}>{absatz}</li>
          ))}
        </ul>

        <h2>{t.recht.datenschutzLoeschungUeberschrift}</h2>
        <p>{t.recht.datenschutzLoeschungEinleitung}</p>
        {t.recht.datenschutzLoeschungAbsaetze.map((absatz) => (
          <p key={absatz.slice(0, 40)}>{absatz}</p>
        ))}

        <h2>{t.recht.datenschutzRechteUeberschrift}</h2>
        <p>{t.recht.datenschutzRechteEinleitung}</p>
        <ul>
          {t.recht.datenschutzRechtePunkte.map((punkt) => (
            <li key={punkt.slice(0, 40)}>{punkt}</li>
          ))}
        </ul>
        <p>{t.recht.datenschutzRechteKontakt}</p>
        <p>{t.recht.datenschutzRechteBeschwerde}</p>
        <p>{t.recht.datenschutzRechteAutomatisiert}</p>
      </div>
    </Abschnitt>
  );
}
