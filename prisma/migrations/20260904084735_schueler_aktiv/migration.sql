-- AlterTable
ALTER TABLE `Event` ADD COLUMN `schuelerAktiv` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `preisSchuelerCents` INTEGER NULL;
