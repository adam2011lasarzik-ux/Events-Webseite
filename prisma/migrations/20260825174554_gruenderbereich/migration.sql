-- AlterTable
ALTER TABLE `Event` ADD COLUMN `gruenderZeigen` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Einstellungen` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'global',
    `gruenderName` VARCHAR(191) NOT NULL DEFAULT 'Adam Lasarzik',
    `gruenderRolle` VARCHAR(191) NOT NULL DEFAULT 'Gründer von VERA',
    `gruenderText` TEXT NULL,
    `gruenderBildUrl` VARCHAR(191) NULL,
    `gruenderAufStart` BOOLEAN NOT NULL DEFAULT true,
    `geaendertAm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
