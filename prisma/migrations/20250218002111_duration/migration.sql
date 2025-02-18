/*
  Warnings:

  - You are about to drop the column `endTime` on the `Schedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Course` ADD COLUMN `duration` INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE `Schedule` DROP COLUMN `endTime`;
