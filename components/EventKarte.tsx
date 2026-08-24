import { Knopf } from "./Knopf";
import { PlatzHinweis } from "./PlatzHinweis";
import { Platzhalter } from "./Platzhalter";
import { alsEuro } from "@/lib/preise";
import { alsDatum } from "@/lib/formate";
import { oeffentlich } from "@/lib/pfade";
import type { VeraEvent } from "@/content/events";
import type { Woerterbuch } from "@/content";
import stil from "./EventKarte.module.css";

export function EventKarte({
  t,
  event,
}: {
  t: Woerterbuch;
  event: VeraEvent;
}) {
  const text = event.texte;

  return (
    <article className={stil.karte}>
      <div className={stil.bild}>
        <img
          className={stil.foto}
          src={oeffentlich("/images/event-padel.jpg")}
          alt={t.event.fotoAlt}
        />
      </div>

      <div>
        <span className={stil.kategorie}>{t.event.naechstesEvent}</span>
        <h3 className={stil.titel}>{text.titel}</h3>
        <p className={stil.kurz}>{text.kurz}</p>

        <dl className={stil.daten}>
          <div className={stil.datum}>
            <dt>{t.event.wann}</dt>
            <dd>
              {event.datum ? (
                alsDatum(event.datum)
              ) : (
                <Platzhalter text={t.platzhalter.datumKurz} markierung={t.platzhalter.markierung} />
              )}
            </dd>
          </div>
          <div className={stil.datum}>
            <dt>{t.event.wo}</dt>
            <dd>
              {event.ort.name ? `${event.ort.name}, ${event.ort.stadt}` : event.ort.stadt}
            </dd>
          </div>
          <div className={stil.datum}>
            <dt>{t.event.preis}</dt>
            <dd>
              {t.preise.ab} {alsEuro(event.preise.schuelerCents)}
            </dd>
          </div>
        </dl>

        <div className={stil.fuss}>
          <Knopf href={`/event/${event.slug}`} pfeil>
            {t.aktion.zumEvent}
          </Knopf>
          <PlatzHinweis event={event} t={t} />
        </div>
      </div>
    </article>
  );
}
