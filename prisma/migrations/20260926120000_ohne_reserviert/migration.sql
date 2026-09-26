-- Stufe 2: Es gibt keine unbezahlte Anmeldung mehr (26.09.2026).
--
-- Eine Anmeldung entsteht seit diesem Umbau erst mit der bestaetigten
-- Zahlung. Der Zustand RESERVIERT und die Frist reserviertBis haben
-- damit keinen Gegenstand mehr.

-- Vorhandene RESERVIERT-Zeilen sind abgebrochene Bezahlvorgaenge.
-- Sie werden auf STORNIERT gesetzt und NICHT geloescht: Was einmal in
-- der Datenbank stand, verschwindet hier nicht stillschweigend. Wer
-- eine Zeile wirklich entfernen will, nimmt den bewussten Einzelweg
-- (npm run anmeldung:pruefen, dann npm run anmeldung:loeschen).
--
-- storniertAm wird mitgesetzt, damit die Zeile nicht als am
-- Urschleim storniert dasteht.
UPDATE `Registration`
   SET `status` = 'STORNIERT',
       `storniertAm` = COALESCE(`storniertAm`, NOW(3))
 WHERE `status` = 'RESERVIERT';

-- Erst danach den Wert aus dem Aufzaehlungstyp nehmen. Andersherum
-- schluege die Aenderung an den Zeilen fehl, die ihn noch tragen.
ALTER TABLE `Registration`
  MODIFY `status` ENUM('BESTAETIGT', 'WARTELISTE', 'STORNIERT') NOT NULL DEFAULT 'BESTAETIGT';

ALTER TABLE `Registration` DROP COLUMN `reserviertBis`;
