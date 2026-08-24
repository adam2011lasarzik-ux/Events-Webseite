-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('ENTWURF', 'VEROEFFENTLICHT', 'ARCHIVIERT') NOT NULL DEFAULT 'ENTWURF',
    `kategorie` ENUM('SPORT', 'BUSINESS', 'NETWORKING', 'SCHULE', 'COMMUNITY', 'WORKSHOP', 'FREIZEIT', 'SONSTIGES') NOT NULL DEFAULT 'SONSTIGES',
    `titel` VARCHAR(191) NOT NULL,
    `untertitel` VARCHAR(191) NULL,
    `karteTitel` VARCHAR(191) NOT NULL,
    `karteKurz` TEXT NOT NULL,
    `karteZielgruppe` VARCHAR(191) NULL,
    `beschreibung` TEXT NOT NULL,
    `hinweise` TEXT NULL,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `ortName` VARCHAR(191) NULL,
    `strasse` VARCHAR(191) NULL,
    `plz` VARCHAR(191) NULL,
    `stadt` VARCHAR(191) NOT NULL,
    `bildUrl` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `maxPersonen` INTEGER NULL,
    `schwelleWenigPlaetze` INTEGER NOT NULL DEFAULT 10,
    `preisSchuelerCents` INTEGER NOT NULL,
    `preisErwachsenerCents` INTEGER NOT NULL,
    `familieAktiv` BOOLEAN NOT NULL DEFAULT false,
    `familieBasisCents` INTEGER NULL,
    `familieEnthaltenErwachsene` INTEGER NULL,
    `familieEnthaltenSchueler` INTEGER NULL,
    `familieWeitererSchuelerCents` INTEGER NULL,
    `familieMaxSchueler` INTEGER NULL,
    `anmeldungAb` DATETIME(3) NULL,
    `anmeldungBis` DATETIME(3) NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `geaendertAm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Event_slug_key`(`slug`),
    INDEX `Event_status_startAt_idx`(`status`, `startAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventAbschnitt` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `art` VARCHAR(191) NOT NULL,
    `titel` VARCHAR(191) NOT NULL,
    `inhalt` TEXT NOT NULL,
    `reihenfolge` INTEGER NOT NULL DEFAULT 0,

    INDEX `EventAbschnitt_eventId_reihenfolge_idx`(`eventId`, `reihenfolge`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Registration` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `kontaktVorname` VARCHAR(191) NOT NULL,
    `kontaktNachname` VARCHAR(191) NOT NULL,
    `kontaktEmail` VARCHAR(191) NOT NULL,
    `kontaktTelefon` VARCHAR(191) NULL,
    `buchungsart` ENUM('EINZEL', 'FAMILIE') NOT NULL DEFAULT 'EINZEL',
    `status` ENUM('BESTAETIGT', 'WARTELISTE', 'STORNIERT') NOT NULL DEFAULT 'BESTAETIGT',
    `istVormundBuchung` BOOLEAN NOT NULL DEFAULT false,
    `einwilligungVormund` BOOLEAN NOT NULL DEFAULT false,
    `einwilligungFotos` BOOLEAN NOT NULL DEFAULT false,
    `gesamtpreisCents` INTEGER NOT NULL,
    `zahlungsStatus` ENUM('OFFEN', 'BEZAHLT', 'ERSTATTET', 'TEILWEISE_ERSTATTET') NOT NULL DEFAULT 'OFFEN',
    `zahlungsWeg` ENUM('VOR_ORT', 'UEBERWEISUNG', 'ONLINE') NOT NULL DEFAULT 'ONLINE',
    `zahlungsReferenz` VARCHAR(191) NULL,
    `bezahlterBetragCents` INTEGER NULL,
    `bezahltAm` DATETIME(3) NULL,
    `angemeldetAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reaktiviertAm` DATETIME(3) NULL,
    `storniertAm` DATETIME(3) NULL,

    INDEX `Registration_eventId_status_idx`(`eventId`, `status`),
    UNIQUE INDEX `Registration_eventId_kontaktEmail_key`(`eventId`, `kontaktEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participant` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `vorname` VARCHAR(191) NOT NULL,
    `nachname` VARCHAR(191) NOT NULL,
    `typ` ENUM('SCHUELER', 'ERWACHSENER') NOT NULL,
    `geburtsjahr` INTEGER NULL,

    INDEX `Participant_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwortHash` VARCHAR(191) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `letzterLogin` DATETIME(3) NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventAbschnitt` ADD CONSTRAINT `EventAbschnitt_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Registration` ADD CONSTRAINT `Registration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
