/* ---------------------------------------------------------------
   Der Startzustand des Admin-Anmeldeformulars.

   Winzige eigene Datei, und das aus zwei Gründen:

   1. Aus einer Datei mit "use server" dürfen ausschließlich
      asynchrone Funktionen exportiert werden. Ein Startwert-Objekt
      käme dort als `undefined` an.
   2. Das Anmeldeformular läuft im Browser. Läge der Wert in
      lib/adminAuth.ts, zöge der Browser über diesen einen Import die
      gesamte Datenbankschicht samt Treiber mit — der Bau bricht dann
      ab, und zu Recht: Datenbankzugangsdaten haben im Browser nichts
      verloren.
   --------------------------------------------------------------- */

/** Was das Anmeldeformular nach einem Versuch zurückbekommt. */
export interface LoginErgebnis {
  meldung?: string;
}

export const LOGIN_STARTZUSTAND: LoginErgebnis = {};
