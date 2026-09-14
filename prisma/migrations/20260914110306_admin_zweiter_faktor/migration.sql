-- AlterTable
ALTER TABLE `AdminUser` ADD COLUMN `zweiterFaktorAktiv` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `zweiterFaktorGeheimnis` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AdminZweiterFaktorCode` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `benutztAm` DATETIME(3) NULL,

    INDEX `AdminZweiterFaktorCode_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminZweiterFaktorPruefung` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `laeuftAbAm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminZweiterFaktorPruefung_tokenHash_key`(`tokenHash`),
    INDEX `AdminZweiterFaktorPruefung_adminId_idx`(`adminId`),
    INDEX `AdminZweiterFaktorPruefung_laeuftAbAm_idx`(`laeuftAbAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminZweiterFaktorCode` ADD CONSTRAINT `AdminZweiterFaktorCode_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminZweiterFaktorPruefung` ADD CONSTRAINT `AdminZweiterFaktorPruefung_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
