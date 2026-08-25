import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { VeranstaltungsKarte } from "@/components/VeranstaltungsKarte";
import { GruenderBereich } from "@/components/GruenderBereich";
import { kommendeEvents } from "@/lib/events";
import { ladeGruender } from "@/lib/einstellungen";
import { texte } from "@/content";
import stil from "./page.module.css";

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
 * Die zentrale Event-Übersicht. Bis vor Kurzem lag hier der komplette
 * Padel-Inhalt direkt — der ist umgezogen nach `/events/[slug]` (siehe
 * dort). Diese Seite zeigt nur noch eine Karte pro Veranstaltung und
 * bleibt so, auch wenn später weitere Events dazukommen.
 */
export const metadata: Metadata = { title: texte.startseite.ueberschrift };

export default async function Startseite() {
  const t = texte;
  const veranstaltungen = await kommendeEvents();
  const gruender = await ladeGruender();

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

      {/* Der Gründerbereich. Auf der zentralen Seite grundsätzlich
          sichtbar; abschalten lässt er sich im Adminbereich unter
          „Gründerbereich“. */}
      {gruender.aufStart && <GruenderBereich t={t} gruender={gruender} ton="warm" />}
    </>
  );
}
