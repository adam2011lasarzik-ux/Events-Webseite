import { Abschnitt, AbschnittKopf } from "./Abschnitt";
import { ThemeRahmen } from "./ThemeRahmen";
import { Hero } from "./Hero";
import { HeroPremium } from "./HeroPremium";
import { EventKarte } from "./EventKarte";
import { PreisKacheln } from "./PreisKacheln";
import { CtaBand } from "./CtaBand";
import { EventBloecke } from "./bloecke/EventBloecke";
import type { VeraEvent } from "@/lib/events";
import type { Woerterbuch } from "@/content";

/**
 * Die vollständige Event-Seite.
 *
 * Als eigener Baustein und nicht direkt in der Seitendatei, weil ihn
 * ZWEI Stellen brauchen: die öffentliche Adresse `/events/[slug]` und
 * die Vorschau im Adminbereich. Nur so zeigt die Vorschau garantiert
 * dasselbe, was Besucher später sehen — bei zwei getrennten Fassungen
 * liefe sie früher oder später auseinander, und zwar unbemerkt.
 *
 * Das Aussehen bestimmt allein der ThemeRahmen. Reihenfolge und Inhalt
 * der Abschnitte sind in jedem Theme identisch: Es ändert sich die
 * Darstellung, nie die Information.
 */
export function EventSeite({ t, event }: { t: Woerterbuch; event: VeraEvent }) {
  /* Die Preise stehen bewusst NACH dem Vorstellungstext und VOR dem
     Ablauf — genau dort, wo sie auf der Padel-Seite immer standen.
     Wer wissen will, was ihn erwartet, liest erst die Vorstellung;
     wer schon weiß, worum es geht, sucht als Nächstes den Preis. */
  const vorstellung = event.bloecke.filter((b) => b.art === "vorstellung");
  const weitere = event.bloecke.filter((b) => b.art !== "vorstellung");

  return (
    <ThemeRahmen theme={event.theme}>
      {/* Premium bekommt einen eigenen Kopfbereich: Dort liegt das Bild
          HINTER dem Text statt daneben — das lässt sich nicht über
          Design-Variablen erreichen. Standard und Business behalten
          dadurch garantiert ihren bisherigen Kopfbereich. */}
      {event.theme === "PREMIUM" ? (
        <HeroPremium t={t} event={event} />
      ) : (
        <Hero t={t} event={event} />
      )}

      {/* Die Event-Karte wiederholt Titel, Termin, Ort und Preis —
          Angaben, die im Premium-Kopfbereich bereits gross dastehen.
          Dort ist sie deshalb Unruhe statt Information und entfällt.
          Die kompakte Detailseite bleibt über „Alle Infos zum Event"
          im Kopfbereich erreichbar. */}
      {event.theme !== "PREMIUM" && (
        <Abschnitt id="event" ton="warm">
          <EventKarte t={t} event={event} />
        </Abschnitt>
      )}

      {/* Die Blöcke kommen vom Event, nicht aus dem Wörterbuch.
          Ein Netzwerkabend zeigt hier also seine eigenen Inhalte —
          und nicht „Was ist Padel überhaupt?". */}
      <EventBloecke bloecke={vorstellung} />

      <Abschnitt ton="warm">
        <AbschnittKopf titel={t.preise.ueberschrift} />
        <PreisKacheln t={t} event={event} />
      </Abschnitt>

      <EventBloecke bloecke={weitere} startTon="hell" />

      {/* Premium endet auf einer dunklen Fläche. Das schliesst die
          Seite ab und macht den Übergang zum dunklen Fussbereich
          ruhig — von Creme direkt ins Dunkle wäre eine harte Kante. */}
      <Abschnitt ton={event.theme === "PREMIUM" ? "dunkel" : "hell"}>
        <CtaBand t={t} event={event} />
      </Abschnitt>
    </ThemeRahmen>
  );
}
