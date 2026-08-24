import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { VeranstaltungsKarte } from "@/components/VeranstaltungsKarte";
import { kommendeEvents } from "@/content/events";
import { texte } from "@/content";
import type { Sprache } from "@/lib/i18n";
import stil from "./page.module.css";

/**
 * Die zentrale Event-Übersicht. Bis vor Kurzem lag hier der komplette
 * Padel-Inhalt direkt — der ist umgezogen nach `/events/[slug]` (siehe
 * dort). Diese Seite zeigt nur noch eine Karte pro Veranstaltung und
 * bleibt so, auch wenn später weitere Events dazukommen.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: texte(locale).startseite.ueberschrift };
}

export default async function Startseite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);
  const veranstaltungen = kommendeEvents();

  return (
    <>
      <Abschnitt ton="warm">
        <AbschnittKopf titel={t.startseite.ueberschrift} einleitung={t.startseite.einleitung} haupt />
      </Abschnitt>

      <Abschnitt>
        <div className={stil.raster}>
          {veranstaltungen.map((event) => (
            <VeranstaltungsKarte key={event.slug} sprache={sprache} t={t} event={event} />
          ))}
        </div>
        <p className={stil.hinweis}>{t.startseite.weitereFolgen}</p>
      </Abschnitt>
    </>
  );
}
