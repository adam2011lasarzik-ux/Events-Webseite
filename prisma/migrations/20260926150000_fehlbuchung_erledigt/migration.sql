-- Eine Fehlbuchung von Hand abhaken koennen (26.09.2026).
--
-- Bei `betrag-abweichend` wird absichtlich nicht automatisch
-- erstattet. `erstattetAm` bleibt dort fuer immer leer -- und damit
-- hatte die Warnung im Adminbereich bisher keinen Weg, jemals wieder
-- zu verschwinden, auch wenn der Vorgang laengst geklaert war.
--
-- Abhaken loescht nichts: Betrag, Grund und Sitzungskennung bleiben
-- vollstaendig stehen. Es wird nur nicht mehr angemahnt.
ALTER TABLE `Fehlbuchung`
  ADD COLUMN `erledigtAm` DATETIME(3) NULL,
  ADD COLUMN `erledigtVon` VARCHAR(191) NULL,
  ADD COLUMN `erledigtNotiz` TEXT NULL;

CREATE INDEX `Fehlbuchung_erledigtAm_idx` ON `Fehlbuchung`(`erledigtAm`);
