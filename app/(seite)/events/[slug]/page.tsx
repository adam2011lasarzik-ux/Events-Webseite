import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Hero } from "@/components/Hero";
import { EventKarte } from "@/components/EventKarte";
import { WasIstPadel } from "@/components/WasIstPadel";
import { PreisKacheln } from "@/components/PreisKacheln";
import { Ablauf } from "@/components/Ablauf";
import { FaqListe } from "@/components/FaqListe";
import { CtaBand } from "@/components/CtaBand";
import { Knopf } from "@/components/Knopf";
import { findeEvent, type VeraEvent } from "@/lib/events";
import { texte } from "@/content";

import textStil from "@/components/Textseite.module.css";

/**
 * Bei jedem Aufruf frisch aus der Datenbank.
 *
 * Bis zum Adminbereich wurden diese Seiten beim Bauen erzeugt. Das
 * ging, solange Events nur über den Seed entstanden. Jetzt kann ein
 * Event im Adminbereich veröffentlicht oder geändert werden — und
 * dann muss es sofort sichtbar sein, nicht erst nach dem nächsten
 * Bauen.
 */
export const dynamic = "force-dynamic";

/**
 * Die vollständige Event-Seite. Bis vor Kurzem war das die Startseite
 * selbst (`/`) — seit es eine zentrale Event-Übersicht gibt, lebt der
 * unveränderte Inhalt hier, unter einer eigenen Adresse pro Event.
 *
 * Technisch bereits mehrfachtauglich (generateStaticParams über alle
 * Events, Auflösung per Slug — dasselbe Muster wie bei der schlankeren
 * Detailseite `/event/[slug]`). Inhaltlich ist diese Seite aber nach
 * wie vor auf Padel zugeschnitten: „Was ist Padel?", der Ablauf in
 * drei Schritten, der Für-Schulen-Block und die FAQ sind Padel-Texte.
 * Ein zweites Event mit anderem Charakter braucht hier vermutlich eigene
 * Abschnitte — das ist spätere Arbeit, kein übersehenes Detail.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await findeEvent(slug);
  if (!event) return {};
  return {
    title: event.texte.titel,
    description: event.texte.kurz,
  };
}

export default async function EventVollseite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event: VeraEvent | undefined = await findeEvent(slug);
  if (!event) notFound();

  const t = texte;

  return (
    <>
      <Hero t={t} event={event} />

      <Abschnitt id="event" ton="warm">
        <EventKarte t={t} event={event} />
      </Abschnitt>

      <Abschnitt>
        <WasIstPadel t={t} />
      </Abschnitt>

      <Abschnitt ton="warm">
        <AbschnittKopf titel={t.preise.ueberschrift} />
        <PreisKacheln t={t} event={event} />
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
          <Knopf href={"/fuer-schulen"} art="zweit" pfeil>
            {t.schulen.mehr}
          </Knopf>
        </div>
      </Abschnitt>

      <Abschnitt>
        <FaqListe t={t} />
      </Abschnitt>

      <Abschnitt>
        <CtaBand t={t} />
      </Abschnitt>
    </>
  );
}
