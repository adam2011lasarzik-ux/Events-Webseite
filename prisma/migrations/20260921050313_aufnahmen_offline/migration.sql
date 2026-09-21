-- AlterTable
ALTER TABLE `Event` ADD COLUMN `aufnahmenOfflineAm` DATETIME(3) NULL,
    ADD COLUMN `aufnahmenOfflineNotiz` TEXT NULL,
    ADD COLUMN `aufnahmenOfflineVon` VARCHAR(191) NULL;
