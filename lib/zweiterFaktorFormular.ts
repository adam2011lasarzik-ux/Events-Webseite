/* ---------------------------------------------------------------
   Der Startzustand der Formulare rund um den zweiten Faktor.

   Eigene, winzige Datei aus demselben Grund wie lib/adminLogin.ts:
   Eine Datei mit "use server" darf ausschließlich asynchrone
   Funktionen exportieren. Ein Startwert-Objekt käme dort als
   `undefined` an — und zwar erst zur Laufzeit, als ein wenig
   hilfreicher Serverfehler.
   --------------------------------------------------------------- */

export interface ZweiterFaktorErgebnis {
  meldung?: string;
  /**
   * Nur unmittelbar nach dem (Neu-)Erzeugen gesetzt — der einzige
   * Moment, in dem die Backup-Codes im Klartext vorliegen. Danach ist
   * nur noch ihr Hash gespeichert, sie lassen sich nicht erneut
   * anzeigen.
   */
  backupCodes?: string[];
}

export const ZWEITER_FAKTOR_STARTZUSTAND: ZweiterFaktorErgebnis = {};
