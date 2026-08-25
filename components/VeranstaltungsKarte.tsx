import { CourtGrafik } from "./CourtGrafik";
import { Knopf } from "./Knopf";
import { Platzhalter } from "./Platzhalter";
import { alsDatum } from "@/lib/formate";
import { oeffentlich } from "@/lib/pfade";
import type { VeraEvent } from "@/lib/events";
import type { Woerterbuch } from "@/content";
import stil from "./VeranstaltungsKarte.module.css";

/**
 * Die große Karte auf der zentralen Event-Übersicht (`/`).
 *
 * Bewusst eine eigene Komponente statt Wiederverwendung von
 * `EventKarte`: Diese hier ist die "Eingangstür" zu einem Event —
 * größer, knapper formuliert, verlinkt auf die volle Event-Seite
 * (`/events/[slug]`). `EventKarte` bleibt unverändert Teil dieser
 * vollen Seite und verlinkt weiterhin auf die schlankere Detailseite
 * (`/event/[slug]`) — beide behalten ihre eigene, klar getrennte Rolle.
 */
export function VeranstaltungsKarte({
  t,
  event,
}: {
  t: Woerterbuch;
  event: VeraEvent;
}) {
  const text = event.texte;

  return (
    <div className={stil.behaelter}>
      <article className={stil.karte}>
      <div className={stil.bild}>
        {event.bildUrl ? (
          <img className={stil.foto} src={oeffentlich(event.bildUrl)} alt={t.event.fotoAlt} />
        ) : (
          <CourtGrafik />
        )}
      </div>

      <div className={stil.inhalt}>
        <span className={stil.kategorie}>{t.event.naechstesEvent}</span>
        <h3 className={stil.titel}>{text.karteTitel}</h3>
        <p className={stil.kurz}>{text.karteKurz}</p>

        <dl className={stil.daten}>
          <div className={stil.datum}>
            <span className={stil.icon} aria-hidden="true">📅</span>
            <div>
              <dt>{t.event.wann}</dt>
              <dd>
                {event.datum ? (
                  alsDatum(event.datum)
                ) : (
                  <Platzhalter text={t.platzhalter.datumKurz} markierung={t.platzhalter.markierung} />
                )}
              </dd>
            </div>
          </div>
          <div className={stil.datum}>
            <span className={stil.icon} aria-hidden="true">📍</span>
            <div>
              <dt>{t.event.wo}</dt>
              <dd>{event.ort.name ? `${event.ort.name}, ${event.ort.stadt}` : event.ort.stadt}</dd>
            </div>
          </div>
          <div className={stil.zielgruppe}>
            <span className={stil.icon} aria-hidden="true">👥</span>
            <span>{text.karteZielgruppe}</span>
          </div>
        </dl>

        <Knopf href={`/events/${event.slug}`} pfeil>
          {t.aktion.eventAnsehen}
        </Knopf>
      </div>
      </article>
    </div>
  );
}
