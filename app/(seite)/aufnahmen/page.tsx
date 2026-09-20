import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Hinweise zu Foto-, Video- und Tonaufnahmen.
 *
 * Diese Seite ersetzt die früher geplante Einwilligungsseite. Seit
 * Entscheidung 4.8 gibt es KEINE Foto-Einwilligung mehr: Es entstehen
 * ausschliesslich Übersichtsaufnahmen, gestützt auf Art. 6 Abs. 1
 * Buchst. f DS-GVO. Wer nicht abgebildet werden möchte, widerspricht
 * nach Art. 21 DS-GVO — das kostet die Teilnahme nicht.
 *
 * Der Hinweis auf das Widerspruchsrecht steht deshalb in einem
 * eigenen, abgesetzten Abschnitt am Ende: Art. 21 Abs. 4 DS-GVO
 * verlangt ihn „getrennt von anderen Informationen".
 *
 * Mehrere Angaben sind noch Platzhalter — die Instagram-Kanäle
 * (Bauauftrag B-12) und die Firmierung der Veranstaltungsstätte
 * (B-11). Sie sind im Text als solche erkennbar und müssen vor der
 * Freischaltung eingesetzt werden.
 */
export const metadata: Metadata = {
  title: texte.aufnahmen.titel,
};

export default function Seite() {
  const t = texte.aufnahmen;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.titel} haupt einleitung={t.einleitung} />
      <div className={stil.inhalt}>
        {t.abschnitte.map((a) => (
          <section key={a.titel}>
            <h2>{a.titel}</h2>
            {a.absaetze.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </section>
        ))}

        {/* Getrennt von allem anderen — das ist die Anforderung aus
            Art. 21 Abs. 4 DS-GVO, nicht eine Gestaltungsidee. */}
        <section>
          <h2>{t.widerspruchTitel}</h2>
          {t.widerspruchAbsaetze.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </section>
      </div>
    </Abschnitt>
  );
}
