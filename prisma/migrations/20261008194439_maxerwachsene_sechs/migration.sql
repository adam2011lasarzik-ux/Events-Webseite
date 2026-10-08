-- AlterTable
ALTER TABLE `Event` MODIFY `maxErwachsene` INTEGER NOT NULL DEFAULT 6;

-- Bestehende Events auf das neue Limit 6 heben. Die Funktion ist neu
-- und noch nicht ausgerollt, daher stehen alle Events auf dem alten
-- Default 4; dieser Schritt bringt sie einheitlich auf 6 (Vorgabe:
-- "bis zu 6 Erwachsene" bei bestehenden und neuen Events).
UPDATE `Event` SET `maxErwachsene` = 6 WHERE `maxErwachsene` = 4;
