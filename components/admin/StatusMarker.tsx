import stil from "@/app/admin/admin.module.css";

/**
 * Zeigt einen Status als farbige Marke.
 *
 * Die Übersetzung von Datenbankwert zu deutschem Wort steht bewusst
 * an genau einer Stelle: Sonst hiesse dasselbe VEROEFFENTLICHT auf
 * einer Seite „Veröffentlicht" und auf der nächsten „Live".
 */
const worte: Record<string, { text: string; klasse: string }> = {
  // Event
  ENTWURF:         { text: "Entwurf",         klasse: "markerAus" },
  VEROEFFENTLICHT: { text: "Veröffentlicht",  klasse: "markerGut" },
  ARCHIVIERT:      { text: "Archiviert",      klasse: "markerAus" },
  // Anmeldung
  /* Zwei getrennte Lagen, damit auf einen Blick klar ist, ob noch
     etwas passieren kann. „RESERVIERT_ABGELAUFEN" gibt es in der
     Datenbank nicht — die Seite leitet den Wert aus der Ablaufzeit ab.
     Bewusst NICHT „Warteliste": Eine Reservierung ist eine technische
     Sicherung während der Zahlung, keine Wartelistenposition. */
  RESERVIERT:            { text: "Bezahlung läuft",      klasse: "markerWartet" },
  RESERVIERT_ABGELAUFEN: { text: "Nicht abgeschlossen",  klasse: "markerAus" },
  BESTAETIGT:      { text: "Bestätigt",       klasse: "markerGut" },
  WARTELISTE:      { text: "Warteliste",      klasse: "markerWartet" },
  STORNIERT:       { text: "Storniert",       klasse: "markerAus" },
  // Zahlung
  OFFEN:               { text: "Zahlung offen",       klasse: "markerOffen" },
  BEZAHLT:             { text: "Bezahlt",             klasse: "markerGut" },
  ERSTATTET:           { text: "Erstattet",           klasse: "markerAus" },
  TEILWEISE_ERSTATTET: { text: "Teilweise erstattet", klasse: "markerWartet" },
};

export function StatusMarker({ art, wert }: { art: "event" | "anmeldung" | "zahlung"; wert: string }) {
  const w = worte[wert] ?? { text: wert, klasse: "markerAus" };
  const klasse = (stil as Record<string, string>)[w.klasse];
  return (
    <span className={`${stil.marker} ${klasse}`} data-art={art}>
      {w.text}
    </span>
  );
}
