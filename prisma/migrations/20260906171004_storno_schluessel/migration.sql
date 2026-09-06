-- AlterTable
ALTER TABLE `Registration` ADD COLUMN `stornoSchluessel` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Registration_stornoSchluessel_key` ON `Registration`(`stornoSchluessel`);

