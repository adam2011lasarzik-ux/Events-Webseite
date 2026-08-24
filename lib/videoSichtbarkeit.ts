/* ---------------------------------------------------------------
   Wann das Hero-Video starten darf.

   Gewünschtes Verhalten: Wird der Videobereich sichtbar, läuft das
   Video genau EINMAL. Es startet erst dann wieder von vorn, wenn der
   Bereich das Sichtfeld zwischendurch wirklich verlassen hat.

   Der Kniff sind zwei getrennte Schwellen statt einer. Mit nur einer
   Schwelle würde schon ein Wackeln um diesen einen Wert herum das
   Video ständig neu anwerfen — man kennt das von Seiten, auf denen
   beim Scrollen dauernd etwas neu losläuft. Zwischen 5 % und 50 %
   passiert hier bewusst gar nichts.
   --------------------------------------------------------------- */

/** Ab so viel Sichtbarkeit gilt der Bereich als „deutlich im Bild". */
export const SCHWELLE_STARTEN = 0.5;

/** Darunter gilt der Bereich als „verlassen" und darf neu starten. */
export const SCHWELLE_VERLASSEN = 0.05;

export interface Sichtzustand {
  /** Darf beim nächsten deutlichen Sichtbarwerden gestartet werden? */
  bereitFuerNeuenDurchlauf: boolean;
}

/** Beim ersten Betrachten soll sofort abgespielt werden. */
export const startZustand: Sichtzustand = { bereitFuerNeuenDurchlauf: true };

export interface Sichtschritt {
  zustand: Sichtzustand;
  /** true = Video auf 0:00 setzen und einmal abspielen. */
  starten: boolean;
}

/**
 * Nächster Zustand für eine gemessene Sichtbarkeit (0 bis 1).
 * Reine Funktion — kein Zugriff auf Browser oder Video.
 */
export function naechsterZustand(
  zustand: Sichtzustand,
  sichtbarkeit: number,
): Sichtschritt {
  if (sichtbarkeit >= SCHWELLE_STARTEN && zustand.bereitFuerNeuenDurchlauf) {
    return { zustand: { bereitFuerNeuenDurchlauf: false }, starten: true };
  }

  if (sichtbarkeit <= SCHWELLE_VERLASSEN) {
    return { zustand: { bereitFuerNeuenDurchlauf: true }, starten: false };
  }

  return { zustand, starten: false };
}

/**
 * Schwellen für den IntersectionObserver. Die beiden Grenzwerte
 * müssen dabei sein, sonst meldet der Browser den Übergang nicht.
 */
export const beobachtungsSchwellen = [0, SCHWELLE_VERLASSEN, SCHWELLE_STARTEN, 1];
