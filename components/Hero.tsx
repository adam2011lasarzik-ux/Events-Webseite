import { CourtGrafik } from "./CourtGrafik";
import { HeroVideo } from "./HeroVideo";
import { Knopf } from "./Knopf";
import { PlatzHinweis } from "./PlatzHinweis";
import { oeffentlich } from "@/lib/pfade";
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
  return (
    <div className={stil.hero}>
      <div className={stil.innen}>
        <div>
          <span className={stil.augenbraue}>{t.hero.augenbraue}</span>
          <h1 className={stil.titel}>
            {t.hero.titelZeile1}
            <span className={stil.zeile2}>{t.hero.titelZeile2}</span>
          </h1>
          <p className={stil.text}>{t.hero.text}</p>

          <div className={stil.knoepfe}>
            <Knopf href={"/anmeldung"} pfeil>
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

        <div className={`${stil.bildbereich} ${event.videoUrl ? "" : stil.platzhalter}`}>
          {event.videoUrl ? (
            <HeroVideo
              quelle={oeffentlich(event.videoUrl)}
              beschreibung={t.hero.videoBeschreibung}
            />
          ) : (
            <>
              <CourtGrafik />
              <span className={stil.fotoHinweis}>{t.hero.hinweisFoto}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
