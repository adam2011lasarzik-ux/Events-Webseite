-- AlterTable
ALTER TABLE `Registration` ADD COLUMN `faelligAm` DATETIME(3) NULL,
    ADD COLUMN `loeschklasse` ENUM('GESUNDHEITSANGABEN', 'EINVERSTAENDNIS_VOLL', 'ZUSTIMMUNGSNACHWEIS', 'ANMELDEDATEN', 'CHECKLISTE', 'VORFALLAKTE', 'STEUERUNTERLAGEN') NOT NULL DEFAULT 'ANMELDEDATEN';

-- CreateTable
CREATE TABLE `Loeschsperre` (
    `id` VARCHAR(191) NOT NULL,
    `zielArt` VARCHAR(191) NOT NULL,
    `zielId` VARCHAR(191) NOT NULL,
    `grund` ENUM('UNFALL', 'BESCHWERDE', 'RUECKBUCHUNG', 'VERSICHERUNG', 'RECHTSSTREIT') NOT NULL,
    `automatisch` BOOLEAN NOT NULL DEFAULT false,
    `gesetztAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gesetztVon` VARCHAR(191) NOT NULL,
    `notiz` TEXT NULL,
    `aufgehobenAm` DATETIME(3) NULL,
    `aufgehobenVon` VARCHAR(191) NULL,

    INDEX `Loeschsperre_zielArt_zielId_aufgehobenAm_idx`(`zielArt`, `zielId`, `aufgehobenAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vorfall` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `registrationId` VARCHAR(191) NULL,
    `titel` VARCHAR(191) NOT NULL,
    `beschreibung` TEXT NULL,
    `einstufung` ENUM('LEICHT', 'SCHWER') NOT NULL DEFAULT 'LEICHT',
    `status` ENUM('OFFEN', 'ABGESCHLOSSEN') NOT NULL DEFAULT 'OFFEN',
    `eroeffnetAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `abgeschlossenAm` DATETIME(3) NULL,
    `faelligAm` DATETIME(3) NULL,
    `loeschklasse` ENUM('GESUNDHEITSANGABEN', 'EINVERSTAENDNIS_VOLL', 'ZUSTIMMUNGSNACHWEIS', 'ANMELDEDATEN', 'CHECKLISTE', 'VORFALLAKTE', 'STEUERUNTERLAGEN') NOT NULL DEFAULT 'VORFALLAKTE',
    `erstelltVon` VARCHAR(191) NOT NULL,

    INDEX `Vorfall_status_faelligAm_idx`(`status`, `faelligAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zustimmungsnachweis` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `veranstaltungAm` DATETIME(3) NOT NULL,
    `teilnehmerName` VARCHAR(191) NOT NULL,
    `zustimmungLagVor` BOOLEAN NOT NULL DEFAULT true,
    `selbstVerlassenGestattet` BOOLEAN NOT NULL DEFAULT false,
    `angelegtAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `faelligAm` DATETIME(3) NOT NULL,
    `loeschklasse` ENUM('GESUNDHEITSANGABEN', 'EINVERSTAENDNIS_VOLL', 'ZUSTIMMUNGSNACHWEIS', 'ANMELDEDATEN', 'CHECKLISTE', 'VORFALLAKTE', 'STEUERUNTERLAGEN') NOT NULL DEFAULT 'ZUSTIMMUNGSNACHWEIS',

    INDEX `Zustimmungsnachweis_faelligAm_idx`(`faelligAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Checkliste` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `durchgefuehrtAm` DATETIME(3) NOT NULL,
    `einweisungKuerzel` VARCHAR(191) NULL,
    `notiz` TEXT NULL,
    `einweisungErfolgt` BOOLEAN NOT NULL DEFAULT false,
    `teilnehmerAnzahl` INTEGER NULL,
    `anonymisiertAm` DATETIME(3) NULL,
    `faelligAm` DATETIME(3) NOT NULL,
    `loeschklasse` ENUM('GESUNDHEITSANGABEN', 'EINVERSTAENDNIS_VOLL', 'ZUSTIMMUNGSNACHWEIS', 'ANMELDEDATEN', 'CHECKLISTE', 'VORFALLAKTE', 'STEUERUNTERLAGEN') NOT NULL DEFAULT 'CHECKLISTE',

    INDEX `Checkliste_faelligAm_anonymisiertAm_idx`(`faelligAm`, `anonymisiertAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loeschprotokoll` (
    `id` VARCHAR(191) NOT NULL,
    `zeitpunkt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `laufId` VARCHAR(191) NOT NULL,
    `klasse` ENUM('GESUNDHEITSANGABEN', 'EINVERSTAENDNIS_VOLL', 'ZUSTIMMUNGSNACHWEIS', 'ANMELDEDATEN', 'CHECKLISTE', 'VORFALLAKTE', 'STEUERUNTERLAGEN') NOT NULL,
    `zielArt` VARCHAR(191) NOT NULL,
    `zielId` VARCHAR(191) NOT NULL,
    `aktion` VARCHAR(191) NOT NULL,
    `grund` VARCHAR(191) NULL,
    `probelauf` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Loeschprotokoll_laufId_idx`(`laufId`),
    INDEX `Loeschprotokoll_zeitpunkt_idx`(`zeitpunkt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
