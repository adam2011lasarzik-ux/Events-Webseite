import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Allgemeine Geschäftsbedingungen.
 *
 * Seit 21.09.2026 vollständig ausgefüllt, kein Platzhalter mehr —
 * Textgrundlage ist der mit den AGB-Prüf-Skills geprüfte und mit Adam
 * abgestimmte Entwurf (docs/rechtstexte-entwuerfe/03-agb-b2c-events-
 * entwurf.md). Bewusst ausgelassen sind zwei Klauseln, die die
 * Technik heute nicht einlöst — Mindestteilnehmerzahl und
 * Stornoentgelt — siehe den Kommentar bei `agb` in content/de.ts.
 *
 * Ziffer 6 (Minderjährige) ist mit der Einverständniserklärung und
 * dem Hinweis im Anmeldebereich wörtlich abgestimmt und darf nur mit
 * diesen gemeinsam geändert werden. Ziffer 11 (Haftung) ist die
 * einzige Haftungsregelung im Projekt. Ziffer 18 (Aufnahmen) bleibt
 * ein reiner Verweis auf /aufnahmen und die Datenschutzerklärung.
 */
export const metadata: Metadata = { title: texte.recht.agbTitel };

export default function Seite() {
  const t = texte;

  const abschnitte: Array<{ titel: string; absaetze: string[] }> = [
    { titel: t.recht.agbGeltungsbereichUeberschrift, absaetze: t.recht.agbGeltungsbereichAbsaetze },
    { titel: t.recht.agbLeistungUeberschrift, absaetze: t.recht.agbLeistungAbsaetze },
    { titel: t.recht.agbVertragsschlussUeberschrift, absaetze: t.recht.agbVertragsschlussAbsaetze },
    { titel: t.recht.agbPreiseUeberschrift, absaetze: t.recht.agbPreiseAbsaetze },
    { titel: t.recht.agbTeilnahmeUeberschrift, absaetze: t.recht.agbTeilnahmeAbsaetze },
    { titel: t.recht.agbMinderjaehrigUeberschrift, absaetze: t.recht.agbMinderjaehrigAbsaetze },
    { titel: t.recht.agbStornoUeberschrift, absaetze: t.recht.agbStornoAbsaetze },
    { titel: t.recht.agbAbsageUeberschrift, absaetze: t.recht.agbAbsageAbsaetze },
    { titel: t.recht.agbPflichtenUeberschrift, absaetze: t.recht.agbPflichtenAbsaetze },
    { titel: t.recht.agbGesundheitUeberschrift, absaetze: t.recht.agbGesundheitAbsaetze },
    { titel: t.recht.agbHaftungUeberschrift, absaetze: t.recht.agbHaftungAbsaetze },
    {
      titel: t.recht.agbVeranstaltungsstaetteUeberschrift,
      absaetze: t.recht.agbVeranstaltungsstaetteAbsaetze,
    },
    { titel: t.recht.agbWiderrufsrechtUeberschrift, absaetze: t.recht.agbWiderrufsrechtAbsaetze },
    { titel: t.recht.agbVertragsdauerUeberschrift, absaetze: [t.recht.agbVertragsdauerText] },
    {
      titel: t.recht.agbRechtGerichtsstandUeberschrift,
      absaetze: t.recht.agbRechtGerichtsstandAbsaetze,
    },
    { titel: t.recht.agbStreitbeilegungUeberschrift, absaetze: [t.recht.agbStreitbeilegungText] },
    { titel: t.recht.agbSchlussUeberschrift, absaetze: t.recht.agbSchlussAbsaetze },
    { titel: t.recht.agbAufnahmenUeberschrift, absaetze: [t.recht.agbAufnahmenText] },
  ];

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.agbTitel} haupt />
      <div className={stil.inhalt}>
        {abschnitte.map((abschnitt) => (
          <div key={abschnitt.titel}>
            <h2>{abschnitt.titel}</h2>
            {abschnitt.absaetze.map((absatz) => (
              <p key={absatz.slice(0, 40)}>{absatz}</p>
            ))}
          </div>
        ))}
      </div>
    </Abschnitt>
  );
}
