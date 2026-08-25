-- AlterTable
ALTER TABLE `Registration` ADD COLUMN `anonymisiertAm` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `AdminSession` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `laeuftAbAm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminSession_tokenHash_key`(`tokenHash`),
    INDEX `AdminSession_adminId_idx`(`adminId`),
    INDEX `AdminSession_laeuftAbAm_idx`(`laeuftAbAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminSession` ADD CONSTRAINT `AdminSession_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
