/* ---------------------------------------------------------------
   Regeln für die Menüpunkte der Kopfleiste.

   „Für Schulen" gehört nicht auf jede Seite. Bei einem Event ohne
   Schüler-Zielgruppe (schuelerAktiv = false) steht der Punkt dort ohne
   Bezug und macht die Leiste unnötig voll — auf der Startseite ebenso,
   wo noch gar kein Event gewählt ist.

   Die Regel steht bewusst hier, getrennt von der Anzeige, damit sie
   einzeln geprüft werden kann. Dasselbe Vorgehen wie bei lib/preise.ts,
   lib/plaetze.ts und lib/vorschau.ts.
   --------------------------------------------------------------- */

/**
 * Soll „Für Schulen" in der Kopfleiste erscheinen?
 *
 * @param pfad         Die aktuelle Adresse, z. B. „/events/padel-falkensee".
 * @param schulenSlugs Adressen der veröffentlichten Events MIT
 *                     Schüler-Preiskategorie.
 */
export function zeigeSchulen(pfad: string, schulenSlugs: string[]): boolean {
  // Auf der Seite selbst bleibt der Punkt stehen — er zeigt dann an,
  // wo man gerade ist, statt unter den Füßen zu verschwinden.
  if (pfad === "/fuer-schulen" || pfad.startsWith("/fuer-schulen/")) return true;

  // Auf einer Event-Seite nur, wenn dieses Event Schüler anspricht.
  // Erfasst beide Event-Adressen — die große Seite („/events/…") und
  // die kompakte Detailseite („/event/…") — sowie alles darunter, also
  // auch die Anmeldung unter „/events/<slug>/anmeldung".
  const treffer = /^\/events?\/([^/]+)/.exec(pfad);
  return treffer !== null && schulenSlugs.includes(treffer[1]);
}
