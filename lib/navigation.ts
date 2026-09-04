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

/**
 * Wohin führt „Jetzt anmelden" in der Kopfleiste — und soll der Knopf
 * überhaupt erscheinen?
 *
 * `null` bedeutet: kein Knopf. Das ist der Fall, sobald nicht eindeutig
 * ist, WOFÜR man sich anmelden würde. Vorher zeigte der Knopf auf jeder
 * Seite auf „/anmeldung", und diese Adresse leitet auf die zeitlich
 * nächste Veranstaltung weiter. Auf der Startseite hiess das: Wer auf
 * „Jetzt anmelden" tippt, landet in der Anmeldung irgendeines Events —
 * womöglich nicht des Events, das er im Sinn hatte. Eine Anmeldung ist
 * verbindlich und kostet Geld; sie darf nicht mit einer stillen
 * Weiterleitung beginnen.
 *
 * Auf einer Event-Seite ist die Sache dagegen eindeutig — dort führt
 * der Knopf direkt zur Anmeldung GENAU dieses Events, ohne Umweg über
 * die Weiterleitung.
 */
export function anmeldeZiel(pfad: string): string | null {
  // Auf der Anmeldeseite selbst wäre der Knopf ein Verweis auf die
  // Seite, auf der man ohnehin schon steht.
  if (/^\/events\/[^/]+\/anmeldung/.test(pfad)) return null;

  const treffer = /^\/events?\/([^/]+)/.exec(pfad);
  return treffer === null ? null : `/events/${treffer[1]}/anmeldung`;
}
