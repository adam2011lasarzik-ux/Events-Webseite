/* ---------------------------------------------------------------
   Adressen für Dateien aus dem Ordner `public/`.

   Auf GitHub Pages liegt die Seite in einem Unterordner
   (…github.io/Events-Webseite/). Next.js setzt diesen Pfad zwar
   automatisch vor Links und eigene Bausteine, NICHT aber vor die
   Adresse in einem <video src="…"> oder <img src="…"> aus `public/`.
   Ohne diese Funktion würde das Video dort ins Leere zeigen — auf dem
   eigenen Rechner aber funktionieren, der Fehler fiele also erst
   nach dem Veröffentlichen auf.
   --------------------------------------------------------------- */

const basisPfad = process.env.NEXT_PUBLIC_BASIS_PFAD ?? "";

/** oeffentlich("/videos/x.mp4") → "/Events-Webseite/videos/x.mp4" */
export function oeffentlich(pfad: string): string {
  return `${basisPfad}${pfad.startsWith("/") ? pfad : `/${pfad}`}`;
}
