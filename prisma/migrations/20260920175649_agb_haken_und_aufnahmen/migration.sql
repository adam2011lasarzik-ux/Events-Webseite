/*
  Warnings:

  - You are about to drop the column `einwilligungFotos` on the `Registration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Registration` DROP COLUMN `einwilligungFotos`,
    ADD COLUMN `agbAkzeptiert` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `kenntnisAufnahmen` BOOLEAN NOT NULL DEFAULT false;
