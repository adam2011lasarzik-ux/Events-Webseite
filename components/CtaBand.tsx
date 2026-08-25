import { CourtLinien } from "./CourtGrafik";
import { Knopf } from "./Knopf";
import type { VeraEvent } from "@/lib/events";
import type { Woerterbuch } from "@/content";
import stil from "./CtaBand.module.css";

/**
 * Der Abschluss-Aufruf am Seitenende.
 *
 * Das Event ist freiwillig: Auf einer Event-Seite führt der Knopf zur
 * Anmeldung GENAU DIESER Veranstaltung. Auf den allgemeinen Seiten
 * (Für Schulen, Über VERA, Fragen) gibt es kein Event — dort führt er
 * auf /anmeldung, was zur nächsten Veranstaltung weiterleitet.
 */
export function CtaBand({ t, event }: { t: Woerterbuch; event?: VeraEvent }) {
  return (
    <div className={`${stil.band} aufDunkel`}>
      <div className={stil.courtEcke} aria-hidden="true">
        <CourtLinien />
      </div>
      <div>
        <h2 className={stil.titel}>{event?.texte.ctaTitel || t.cta.ueberschrift}</h2>
        <p className={stil.text}>{event?.texte.ctaText || t.cta.text}</p>
      </div>
      <div className={stil.knoepfe}>
        <Knopf href={event ? `/events/${event.slug}/anmeldung` : "/anmeldung"} pfeil>
          {t.aktion.anmelden}
        </Knopf>
        <Knopf href={"/kontakt"} art="aufDunkel">
          {t.nav.kontakt}
        </Knopf>
      </div>
    </div>
  );
}
