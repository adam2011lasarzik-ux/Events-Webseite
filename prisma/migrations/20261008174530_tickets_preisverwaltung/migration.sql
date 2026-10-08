-- AlterTable
ALTER TABLE `Event` ADD COLUMN `maxErwachsene` INTEGER NOT NULL DEFAULT 4;

-- CreateTable
CREATE TABLE `PreisAenderung` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `ticketart` VARCHAR(191) NOT NULL,
    `altCents` INTEGER NULL,
    `neuCents` INTEGER NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `geaendertAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PreisAenderung_eventId_ticketart_geaendertAm_idx`(`eventId`, `ticketart`, `geaendertAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PreisAenderung` ADD CONSTRAINT `PreisAenderung_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
