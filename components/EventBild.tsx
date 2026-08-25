import { CourtGrafik } from "./CourtGrafik";
import { VeraWortmarke } from "./VeraWortmarke";
import { oeffentlich } from "@/lib/pfade";
import type { VeraEvent } from "@/lib/events";
import stil from "./EventBild.module.css";

/**
 * Das Bild einer Veranstaltung — mit Ersatz, wenn keins hinterlegt ist.
 *
 * Die Court-Grafik ist ein SPORT-Zeichen, kein Markenzeichen. Über
 * einem Unternehmer-Netzwerkabend wäre ein Padel-Platz schlicht falsch
 * — und im dunklen Premium-Design leuchtet er zudem unangenehm heraus.
 * Deshalb: Foto, sonst Court-Grafik nur bei Sport, sonst die Wortmarke
 * auf ruhiger Fläche.
 *
 * An einer Stelle, weil drei Bausteine dieselbe Entscheidung treffen
 * müssen: der Kopfbereich, die Event-Karte und die Übersichtskarte.
 */
export function EventBild({
  event,
  alt,
}: {
  event: VeraEvent;
  /** Beschreibung des Fotos für Screenreader. */
  alt: string;
}) {
  if (event.bildUrl) {
    // Bewusst OHNE eigene Klasse: Wie das Foto beschnitten wird, weiss
    // nur die umgebende Karte — sie kennt ihr Seitenverhältnis. Jede
    // Karte setzt das über `.bild img` in ihrer eigenen CSS-Datei.
    return <img src={oeffentlich(event.bildUrl)} alt={alt} />;
  }
  if (event.kategorie === "sport") {
    return <CourtGrafik />;
  }
  return (
    <div className={stil.ohneBild}>
      <VeraWortmarke groesse="mittel" />
    </div>
  );
}
