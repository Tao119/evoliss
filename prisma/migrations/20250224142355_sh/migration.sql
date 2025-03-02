/*
  Warnings:

  - You are about to drop the column `courseId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `scheduleId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_courseId_fkey`;

-- DropIndex
DROP INDEX `Payment_courseId_fkey` ON `Payment`;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `courseId`,
    ADD COLUMN `scheduleId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
