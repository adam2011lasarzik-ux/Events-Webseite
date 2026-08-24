"use client";

import { useEffect, useRef, useState } from "react";
import { CourtGrafik } from "./CourtGrafik";
import {
  beobachtungsSchwellen,
  naechsterZustand,
  startZustand,
  type Sichtzustand,
} from "@/lib/videoSichtbarkeit";
import stil from "./HeroVideo.module.css";

/**
 * Das Padel-Video im Hero.
 *
 * Es läuft ohne Ton, ohne Bedienelemente und ohne Endlosschleife: Wird
 * der Bereich sichtbar, spielt es genau einmal. Erst wenn der Bereich
 * das Sichtfeld verlassen hat und wieder zurückkommt, beginnt es von
 * vorn. Die Regel dafür steht in lib/videoSichtbarkeit.ts.
 *
 * `muted` und `playsInline` sind auf iPhone und iPad Pflicht — ohne
 * sie verweigert Safari das selbstständige Abspielen und würde das
 * Video stattdessen im Vollbild öffnen.
 */
export function HeroVideo({
  quelle,
  beschreibung,
}: {
  quelle: string;
  beschreibung: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const zustandRef = useRef<Sichtzustand>(startZustand);
  const [bereit, setzeBereit] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ist das Video schon geladen, bevor React seinen Zuhörer anhängen
    // konnte, bleibt `onLoadedData` unbemerkt — das Video liefe dann
    // unsichtbar hinter der Court-Grafik weiter. Auf schnellen
    // Verbindungen passiert genau das zuverlässig, deshalb hier noch
    // einmal direkt nachsehen. readyState ab 2 heißt: Bilddaten sind da.
    if (video.readyState >= 2) setzeBereit(true);

    // Wer im Betriebssystem weniger Bewegung eingestellt hat, bekommt
    // das Video nicht von selbst gestartet — es bleibt beim ersten
    // Bild stehen, statt ganz zu verschwinden.
    const wenigerBewegung = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (wenigerBewegung) return;

    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const eintrag of eintraege) {
          const schritt = naechsterZustand(zustandRef.current, eintrag.intersectionRatio);
          zustandRef.current = schritt.zustand;

          if (schritt.starten) {
            video.currentTime = 0;
            // Browser dürfen das Abspielen ablehnen (Energiesparmodus,
            // Autoplay-Sperre). Dann bleibt einfach das erste Bild
            // stehen, statt dass ein Fehler die Seite stört.
            void video.play().catch(() => {});
          }
        }
      },
      { threshold: beobachtungsSchwellen },
    );

    beobachter.observe(video);
    return () => beobachter.disconnect();
  }, []);

  return (
    <div className={stil.buehne}>
      <div className={stil.ruhebild} aria-hidden="true">
        <CourtGrafik mitBoden={false} />
      </div>

      <video
        ref={videoRef}
        className={`${stil.video} ${bereit ? stil.sichtbar : ""}`}
        src={quelle}
        muted
        playsInline
        preload="metadata"
        aria-label={beschreibung}
        onLoadedData={() => setzeBereit(true)}
      />
    </div>
  );
}
