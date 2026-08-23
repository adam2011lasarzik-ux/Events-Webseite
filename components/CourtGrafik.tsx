import stil from "./CourtGrafik.module.css";

/**
 * Ein Padel-Court von oben, maßstabsgetreu: 20 × 10 Meter, Netz in der
 * Mitte, Aufschlaglinien 6,95 m vom Netz entfernt, dazwischen die
 * Mittellinie.
 *
 * Diese Linienführung ist das Erkennungsmerkmal der Seite. Sie ist
 * selbst gezeichnet — kein fremdes Bild, keine Lizenzfrage.
 */
export function CourtGrafik({ mitBoden = true }: { mitBoden?: boolean }) {
  return (
    <svg
      className={stil.court}
      viewBox="0 0 20 10"
      role="img"
      aria-label="Grundriss eines Padel-Courts"
      preserveAspectRatio="xMidYMid meet"
    >
      {mitBoden && <rect className={stil.boden} x="0" y="0" width="20" height="10" rx="0.35" />}

      {/* Glasflächen an den Stirnseiten, nur angedeutet */}
      <rect className={stil.glas} x="0.18" y="0.18" width="2.6" height="9.64" />
      <rect className={stil.glas} x="17.22" y="0.18" width="2.6" height="9.64" />

      {/* Spielfeldbegrenzung */}
      <rect className={stil.linie} x="0.18" y="0.18" width="19.64" height="9.64" rx="0.2" />

      {/* Netz */}
      <line className={stil.netz} x1="10" y1="0.18" x2="10" y2="9.82" />

      {/* Aufschlaglinien, 6,95 m vom Netz */}
      <line className={stil.linie} x1="3.05" y1="0.18" x2="3.05" y2="9.82" />
      <line className={stil.linie} x1="16.95" y1="0.18" x2="16.95" y2="9.82" />

      {/* Mittellinie zwischen Aufschlaglinie und Netz */}
      <line className={stil.linieZart} x1="3.05" y1="5" x2="16.95" y2="5" />
    </svg>
  );
}

/**
 * Nur die Linien, ohne Boden — als ruhiges Muster über Flächen und
 * als Rahmen um Bildbereiche.
 */
export function CourtLinien() {
  return <CourtGrafik mitBoden={false} />;
}
