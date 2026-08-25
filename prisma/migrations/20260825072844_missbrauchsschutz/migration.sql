-- CreateTable
CREATE TABLE `AnmeldeVersuch` (
    `id` VARCHAR(191) NOT NULL,
    `kennung` VARCHAR(191) NOT NULL,
    `zeitpunkt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AnmeldeVersuch_kennung_zeitpunkt_idx`(`kennung`, `zeitpunkt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
