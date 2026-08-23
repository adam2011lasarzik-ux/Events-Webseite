import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Hero } from "@/components/Hero";
import { EventKarte } from "@/components/EventKarte";
import { WasIstPadel } from "@/components/WasIstPadel";
import { PreisKacheln } from "@/components/PreisKacheln";
import { Ablauf } from "@/components/Ablauf";
import { FaqListe } from "@/components/FaqListe";
import { CtaBand } from "@/components/CtaBand";
import { Knopf } from "@/components/Knopf";
import { events } from "@/content/events";
import { texte } from "@/content";
import { pfad, type Sprache } from "@/lib/i18n";
import textStil from "@/components/Textseite.module.css";

export default async function Startseite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);
  const event = events[0];

  return (
    <>
      <Hero sprache={sprache} t={t} event={event} />

      <Abschnitt id="event" ton="warm">
        <EventKarte sprache={sprache} t={t} event={event} />
      </Abschnitt>

      <Abschnitt>
        <WasIstPadel t={t} />
      </Abschnitt>

      <Abschnitt ton="warm">
        <AbschnittKopf titel={t.preise.ueberschrift} />
        <PreisKacheln sprache={sprache} t={t} event={event} />
      </Abschnitt>

      <Abschnitt>
        <Ablauf t={t} />
      </Abschnitt>

      <Abschnitt ton="warm">
        <AbschnittKopf titel={t.schulen.ueberschrift} einleitung={t.schulen.kurz} />
        <ul className={textStil.punkte}>
          {t.schulen.punkte.map((punkt) => (
            <li key={punkt}>
              <span className={textStil.haken} aria-hidden="true">✓</span>
              {punkt}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: "2rem" }}>
          <Knopf href={pfad(sprache, "/fuer-schulen")} art="zweit" pfeil>
            {t.schulen.mehr}
          </Knopf>
        </div>
      </Abschnitt>

      <Abschnitt>
        <FaqListe t={t} />
      </Abschnitt>

      <Abschnitt>
        <CtaBand sprache={sprache} t={t} />
      </Abschnitt>
    </>
  );
}
