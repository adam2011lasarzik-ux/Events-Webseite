-- CreateTable
CREATE TABLE `Veroeffentlichung` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `ort` VARCHAR(191) NOT NULL,
    `verantwortlich` ENUM('VERA', 'VERANSTALTUNGSSTAETTE') NOT NULL,
    `zweck` VARCHAR(191) NOT NULL,
    `pruefungId` VARCHAR(191) NULL,
    `veroeffentlichtAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `entferntAm` DATETIME(3) NULL,
    `entferntVon` VARCHAR(191) NULL,
    `entfernungNotiz` TEXT NULL,
    `erfasstVon` VARCHAR(191) NOT NULL,
    `erfasstAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Veroeffentlichung_eventId_entferntAm_idx`(`eventId`, `entferntAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Veroeffentlichung` ADD CONSTRAINT `Veroeffentlichung_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Veroeffentlichung` ADD CONSTRAINT `Veroeffentlichung_pruefungId_fkey` FOREIGN KEY (`pruefungId`) REFERENCES `Veroeffentlichungspruefung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
