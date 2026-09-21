import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { texte } from "@/content";
import { veranstaltungsstaetten } from "@/lib/aufnahmen";
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
 * ── Warum die Seite die Datenbank liest ──
 *
 * Die Veranstaltungsstätte ist Empfängerin der Aufnahmen und muss als
 * solche benannt werden (Art. 13 Abs. 1 Buchst. e DS-GVO). Ihre
 * Firmierung steht am jeweiligen Event (`Event.ortFirma`, Bauauftrag
 * B-11) und wird hier geholt, statt im Text zu stehen: Ein fest
 * eingetippter Firmenname wäre beim zweiten Veranstaltungsort
 * stillschweigend falsch — und ausgerechnet die Empfängerangabe darf
 * das nicht sein.
 *
 * Offen bleibt ein Platzhalter, im Text als solcher erkennbar: die
 * Instagram-Kanäle (B-12).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: texte.aufnahmen.titel,
};

export default async function Seite() {
  const t = texte.aufnahmen;
  const staetten = await veranstaltungsstaetten();

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.titel} haupt einleitung={t.einleitung} />
      <div className={stil.inhalt}>
        {t.abschnitte.map((a) => (
          <section key={a.id}>
            <h2>{a.titel}</h2>
            {a.absaetze.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}

            {/* Die Empfänger stehen dort, wo von der Weitergabe die
                Rede ist — nicht in einem eigenen Abschnitt am Ende,
                den man beim Lesen nicht mehr mit ihr verbindet. */}
            {a.id === "verwendung" && (
              <>
                <h3>{t.staettenTitel}</h3>
                {staetten.length === 0 ? (
                  <p>{t.staettenLeer}</p>
                ) : (
                  <>
                    <p>{t.staettenEinleitung}</p>
                    <ul>
                      {staetten.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
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
