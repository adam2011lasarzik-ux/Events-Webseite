import { EventBild } from "./EventBild";
import { HeroVideo } from "./HeroVideo";
import { Knopf } from "./Knopf";
import { PlatzHinweis } from "./PlatzHinweis";
import { oeffentlich } from "@/lib/pfade";
import { teileUeberschrift } from "@/lib/eventInhalte";
import type { VeraEvent } from "@/lib/events";
import type { Woerterbuch } from "@/content";
import stil from "./Hero.module.css";

export function Hero({
  t,
  event,
}: {
  t: Woerterbuch;
  event: VeraEvent;
}) {
  /* Die Augenbraue: was der Veranstalter eingetragen hat, sonst
     Kategorie und Stadt. Stand früher fest im Wörterbuch („Padel ·
     Falkensee") — bei einem Netzwerkabend wäre das falsch gewesen. */
  const augenbraue =
    event.texte.heroAugenbraue ||
    `${t.kategorie[event.kategorie] ?? t.kategorie.sonstiges} · ${event.ort.stadt}`;

  /* Ein Fragezeichen oder ein Punkt in der Mitte teilt die Überschrift
     in zwei Zeilen — der zweite Teil steht dann abgesetzt darunter,
     wie bisher bei „Nie gespielt? / Genau darum geht's." Ohne
     Trennstelle bleibt es bei einer Zeile. */
  const [ersteZeile, zweiteZeile] = teileUeberschrift(event.texte.heroTitel);

  return (
    <div className={stil.hero}>
      <div className={stil.innen}>
        <div data-block="kopf">
          {/* Im Premium-Theme sitzt diese Zeile als Einsatz im
              Linienrahmen — siehe styles/themes.css. */}
          <span className={stil.augenbraue} data-einsatz>
            {augenbraue}
          </span>
          <h1 className={stil.titel}>
            {ersteZeile}
            {zweiteZeile && <span className={stil.zeile2}>{zweiteZeile}</span>}
          </h1>
          <p className={stil.text}>{event.texte.heroText}</p>

          <div className={stil.knoepfe}>
            <Knopf href={`/events/${event.slug}/anmeldung`} pfeil>
              {t.aktion.anmelden}
            </Knopf>
            <Knopf href={`/event/${event.slug}`} art="zweit">
              {t.aktion.detailsAnsehen}
            </Knopf>
          </div>

          <div className={stil.platzZeile}>
            <PlatzHinweis event={event} t={t} />
          </div>
        </div>

        {/* Der Rahmen gehört zur Court-Grafik: Sie sitzt in einem
            Rahmen aus ihren eigenen Linien. Um die Wortmarke gelegt
            ergäbe er zwei ineinandergeschachtelte dunkle Rechtecke —
            das sähe nach Versehen aus. */}
        <div
          className={`${stil.bildbereich} ${
            !event.videoUrl && event.kategorie === "sport" ? stil.platzhalter : ""
          }`}
        >
          {event.videoUrl ? (
            <HeroVideo
              quelle={oeffentlich(event.videoUrl)}
              beschreibung={t.hero.videoBeschreibung}
            />
          ) : (
            <>
              <EventBild event={event} alt={t.event.fotoAlt} />
              {/* Der Hinweis nur, solange die Court-Grafik als Ersatz
                  dient — bei der Wortmarke wäre „Foto vom Court" auf
                  einem Netzwerkabend Unsinn. */}
              {event.kategorie === "sport" && (
                <span className={stil.fotoHinweis}>{t.hero.hinweisFoto}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
