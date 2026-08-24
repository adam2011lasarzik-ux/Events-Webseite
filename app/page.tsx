import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { VeranstaltungsKarte } from "@/components/VeranstaltungsKarte";
import { kommendeEvents } from "@/content/events";
import { texte } from "@/content";
import stil from "./page.module.css";

/**
 * Die zentrale Event-Übersicht. Bis vor Kurzem lag hier der komplette
 * Padel-Inhalt direkt — der ist umgezogen nach `/events/[slug]` (siehe
 * dort). Diese Seite zeigt nur noch eine Karte pro Veranstaltung und
 * bleibt so, auch wenn später weitere Events dazukommen.
 */
export const metadata: Metadata = { title: texte.startseite.ueberschrift };

export default function Startseite() {
  const t = texte;
  const veranstaltungen = kommendeEvents();

  return (
    <>
      <Abschnitt ton="warm">
        <AbschnittKopf titel={t.startseite.ueberschrift} einleitung={t.startseite.einleitung} haupt />
      </Abschnitt>

      <Abschnitt>
        <div className={stil.raster}>
          {veranstaltungen.map((event) => (
            <VeranstaltungsKarte key={event.slug} t={t} event={event} />
          ))}
        </div>
        <p className={stil.hinweis}>{t.startseite.weitereFolgen}</p>
      </Abschnitt>
    </>
  );
}
