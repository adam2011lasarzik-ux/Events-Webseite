-- CreateTable
CREATE TABLE `AdminProtokoll` (
    `id` VARCHAR(191) NOT NULL,
    `zeitpunkt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NOT NULL,
    `aktion` VARCHAR(191) NOT NULL,
    `zielArt` VARCHAR(191) NULL,
    `zielId` VARCHAR(191) NULL,
    `detail` VARCHAR(191) NULL,

    INDEX `AdminProtokoll_zeitpunkt_idx`(`zeitpunkt`),
    INDEX `AdminProtokoll_adminId_zeitpunkt_idx`(`adminId`, `zeitpunkt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
