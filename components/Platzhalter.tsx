import stil from "./Platzhalter.module.css";

/**
 * Sichtbare Markierung für alles, was noch nicht feststeht.
 *
 * Bewusst auffällig: Ein Platzhalter, den man für echten Inhalt
 * halten kann, geht irgendwann versehentlich online.
 */
export function Platzhalter({ text, markierung }: { text: string; markierung: string }) {
  return (
    <span className={stil.halter}>
      <span className={stil.marke}>{markierung}</span>
      {text}
    </span>
  );
}
