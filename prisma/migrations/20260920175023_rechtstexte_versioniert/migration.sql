-- AlterTable
ALTER TABLE `Registration` ADD COLUMN `agbFassungId` VARCHAR(191) NULL,
    ADD COLUMN `datenschutzFassungId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Rechtstext` (
    `id` VARCHAR(191) NOT NULL,
    `art` ENUM('AGB_B2C', 'AGB_B2B', 'DATENSCHUTZ') NOT NULL,
    `version` INTEGER NOT NULL,
    `datum` DATETIME(3) NOT NULL,
    `gueltigAb` DATETIME(3) NOT NULL,
    `inhalt` TEXT NOT NULL,
    `pruefsumme` VARCHAR(191) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Rechtstext_art_gueltigAb_idx`(`art`, `gueltigAb`),
    UNIQUE INDEX `Rechtstext_art_version_key`(`art`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Registration` ADD CONSTRAINT `Registration_agbFassungId_fkey` FOREIGN KEY (`agbFassungId`) REFERENCES `Rechtstext`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Registration` ADD CONSTRAINT `Registration_datenschutzFassungId_fkey` FOREIGN KEY (`datenschutzFassungId`) REFERENCES `Rechtstext`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
