import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { CourtGrafik } from "@/components/CourtGrafik";
import { PreisKacheln } from "@/components/PreisKacheln";
import { PlatzHinweis } from "@/components/PlatzHinweis";
import { Platzhalter } from "@/components/Platzhalter";
import { CtaBand } from "@/components/CtaBand";
import { Knopf } from "@/components/Knopf";
import { events, findeEvent } from "@/content/events";
import { texte } from "@/content";
import { alsDatum, fuelle } from "@/lib/formate";
import stil from "./event.module.css";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = findeEvent(slug);
  if (!event) return {};
  return {
    title: event.texte.titel,
    description: event.texte.kurz,
  };
}

export default async function EventSeite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = findeEvent(slug);
  if (!event) notFound();

  const t = texte;
  const text = event.texte;
  const halter = (inhalt: string) => (
    <Platzhalter text={inhalt} markierung={t.platzhalter.markierung} />
  );

  return (
    <>
      <Abschnitt>
        <div className={stil.kopf}>
          <div>
            <AbschnittKopf augenbraue={t.event.naechstesEvent} titel={text.titel} haupt />
            <p className={stil.untertitel}>{text.untertitel}</p>
            <div className={stil.knoepfe}>
              <Knopf href={"/anmeldung"} pfeil>
                {t.aktion.anmelden}
              </Knopf>
              <PlatzHinweis event={event} t={t} />
            </div>
          </div>
          <div className={stil.bild}>
            <CourtGrafik />
          </div>
        </div>

        <dl className={stil.daten}>
          <div>
            <dt>{t.event.wann}</dt>
            <dd>
              {event.datum ? alsDatum(event.datum) : halter(t.platzhalter.datum)}
              <br />
              {event.zeitVon && event.zeitBis
                ? `${event.zeitVon} – ${event.zeitBis}`
                : halter(t.platzhalter.zeit)}
            </dd>
          </div>
          <div>
            <dt>{t.event.wo}</dt>
            <dd>
              {event.ort.name ?? halter(t.platzhalter.adresse)}
              <br />
              {event.ort.stadt}
            </dd>
          </div>
          <div>
            <dt>{t.plaetze.ueberschrift}</dt>
            <dd>{event.maxPersonen ? fuelle(t.plaetze.gesamt, { n: event.maxPersonen }) : "—"}</dd>
          </div>
        </dl>
      </Abschnitt>

      <Abschnitt ton="warm">
        <div className={stil.beschreibung}>
          {text.lang.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>

        <div className={stil.zweiListen}>
          <div>
            <h3 className={stil.listenTitel}>{t.event.dabei}</h3>
            <ul className={stil.liste}>
              {text.dabei.map((punkt) => (
                <li key={punkt}>
                  <span className={stil.haken} aria-hidden="true">✓</span>
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={stil.listenTitel}>{t.event.mitbringen}</h3>
            <ul className={stil.liste}>
              {text.mitbringen.map((punkt) => (
                <li key={punkt}>
                  <span className={stil.haken} aria-hidden="true">✓</span>
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Abschnitt>

      <Abschnitt>
        <AbschnittKopf titel={t.preise.ueberschrift} />
        <PreisKacheln t={t} event={event} />
      </Abschnitt>

      <Abschnitt>
        <CtaBand t={t} />
      </Abschnitt>
    </>
  );
}
