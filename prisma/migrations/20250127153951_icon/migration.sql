/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `image`,
    ADD COLUMN `header` VARCHAR(191) NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL;
