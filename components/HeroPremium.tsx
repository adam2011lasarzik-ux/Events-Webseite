import { HeroVideo } from "./HeroVideo";
import { Knopf } from "./Knopf";
import { PlatzHinweis } from "./PlatzHinweis";
import { oeffentlich } from "@/lib/pfade";
import { kleineFassung } from "@/lib/bilder";
import { alsDatum } from "@/lib/formate";
import type { VeraEvent } from "@/lib/events";
import type { Woerterbuch } from "@/content";
import stil from "./HeroPremium.module.css";

/**
 * Der Kopfbereich des Premium-Designs.
 *
 * Eine EIGENE Komponente statt einer Fallunterscheidung in Hero.tsx:
 * Der Aufbau ist ein grundsätzlich anderer — das Bild liegt hier
 * hinter dem Text, nicht daneben. Das lässt sich mit CSS allein nicht
 * erreichen, und Hero.tsx bleibt so garantiert unverändert. Standard
 * und Business können durch diesen Baustein nicht kaputtgehen.
 *
 * Wiederverwendet werden Knopf, PlatzHinweis, HeroVideo und die
 * Datumsformatierung — alles wie bisher.
 */
export function HeroPremium({ t, event }: { t: Woerterbuch; event: VeraEvent }) {
  const augenbraue =
    event.texte.heroAugenbraue ||
    `${t.kategorie[event.kategorie] ?? t.kategorie.sonstiges} · ${event.ort.stadt}`;

  const ort = event.ort.name ? `${event.ort.name} · ${event.ort.stadt}` : event.ort.stadt;

  const zeit =
    event.zeitVon && event.zeitBis
      ? `${event.zeitVon} – ${event.zeitBis} Uhr`
      : event.zeitVon
        ? `ab ${event.zeitVon} Uhr`
        : null;

  return (
    <div className={stil.hero} data-block="herobild">
      <div className={stil.bild}>
        {event.videoUrl ? (
          <HeroVideo quelle={oeffentlich(event.videoUrl)} beschreibung={t.hero.videoBeschreibung} />
        ) : event.bildUrl ? (
          /* Zwei Grössen: Ohne das lädt ein Handy das Bild in
             Desktop-Breite — bei einem formatfüllenden Foto fällt das
             sofort auf die Ladezeit. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={stil.foto}
            src={oeffentlich(event.bildUrl)}
            srcSet={`${oeffentlich(kleineFassung(event.bildUrl))} 900w, ${oeffentlich(event.bildUrl)} 1800w`}
            sizes="100vw"
            alt=""
            /* Leerer Alt-Text mit Absicht: Das Bild ist Stimmung, kein
               Inhalt. Alles, was es sagt, steht als Text darüber. Eine
               Beschreibung wäre für Screenreader nur Lärm. */
          />
        ) : (
          /* Ohne Titelbild nur der warme Verlauf. Eine grosse Wortmarke
             läge hier HINTER dem Rahmen und sähe nach Fehler aus — und
             der Eventtitel steht ohnehin gross davor. */
          <div className={stil.ohneBild} />
        )}
      </div>

      {/* Der Verlauf sichert die Lesbarkeit — unabhängig davon, welches
          Foto hinterlegt wird. Ohne ihn hinge die Schrift von der
          Helligkeit des jeweiligen Bildes ab. */}
      <div className={stil.schleier} aria-hidden="true" />

      <div className={stil.innen}>
        <div className={stil.rahmen} data-block="kopf">
          <span className={stil.augenbraue}>{augenbraue}</span>

          <h1 className={stil.titel}>{event.texte.heroTitel}</h1>

          <div className={stil.trenner} aria-hidden="true" />

          <p className={stil.datum}>
            {event.datum ? (
              alsDatum(event.datum)
            ) : (
              <span className={stil.offen}>{t.platzhalter.datumKurz}</span>
            )}
          </p>
          {zeit && <p className={stil.zeit}>{zeit}</p>}

          <div className={stil.trenner} aria-hidden="true" />

          <p className={stil.text}>{event.texte.heroText}</p>

          <p className={stil.ort}>{ort}</p>

          <div className={stil.knoepfe}>
            <Knopf href={`/events/${event.slug}/anmeldung`} pfeil>
              {t.aktion.anmelden}
            </Knopf>
            <Knopf href={`/event/${event.slug}`} art="aufDunkel">
              {t.aktion.detailsAnsehen}
            </Knopf>
          </div>

          <div className={stil.platz}>
            <PlatzHinweis event={event} t={t} aufDunkel />
          </div>
        </div>
      </div>
    </div>
  );
}
