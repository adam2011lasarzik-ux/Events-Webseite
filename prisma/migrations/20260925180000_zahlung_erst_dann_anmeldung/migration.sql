-- Anmeldung entsteht erst mit der bestaetigten Zahlung (25.09.2026).
--
-- Diese Migration legt nur an und macht eindeutig. Sie loescht nichts
-- und aendert keine vorhandene Zeile: Der Umbau des Ablaufs kommt in
-- einem zweiten Schritt, und bis dahin soll der bestehende Weg
-- unveraendert laufen.

-- CreateTable
CREATE TABLE `Fehlbuchung` (
    `id` VARCHAR(191) NOT NULL,
    `sitzungId` VARCHAR(191) NOT NULL,
    `betragCents` INTEGER NOT NULL,
    `grund` VARCHAR(191) NOT NULL,
    `angelegtAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `erstattetAm` DATETIME(3) NULL,
    `erstattungId` VARCHAR(191) NULL,

    UNIQUE INDEX `Fehlbuchung_sitzungId_key`(`sitzungId`),
    INDEX `Fehlbuchung_erstattetAm_idx`(`erstattetAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
--
-- Eindeutig, damit dieselbe Zahlung nicht zweimal zu einer Anmeldung
-- wird. Drei Wege duerfen kuenftig anlegen (Rueckmeldung des
-- Anbieters, Rueckfrage der Abschluss-Seite, naechtlicher Abgleich);
-- hier entscheidet die Datenbank, nicht eine Pruefung im Code.
--
-- Mehrere NULL bleiben erlaubt - MySQL zaehlt sie nicht als Dubletten.
-- Anmeldungen ohne Bezahlseite stoeren also nicht.
--
-- VOR DEM AUSROLLEN PRUEFEN, ob es Dubletten gibt; sonst scheitert
-- diese Zeile. Der Lesebefehl dafuer steht in docs/pruefen.md.
CREATE UNIQUE INDEX `Registration_zahlungsReferenz_key` ON `Registration`(`zahlungsReferenz`);
