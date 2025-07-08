/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleId` on the `PurchaseMessage` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleId` on the `Reservation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[timeSlotId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[timeSlotId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timeSlotId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlotId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseMessage` DROP FOREIGN KEY `PurchaseMessage_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_scheduleId_fkey`;

-- DropIndex
DROP INDEX `Payment_scheduleId_key` ON `Payment`;

-- DropIndex
DROP INDEX `PurchaseMessage_scheduleId_fkey` ON `PurchaseMessage`;

-- DropIndex
DROP INDEX `Reservation_scheduleId_key` ON `Reservation`;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `scheduleId`,
    ADD COLUMN `timeSlotId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `PurchaseMessage` DROP COLUMN `scheduleId`,
    ADD COLUMN `timeSlotId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reservation` DROP COLUMN `scheduleId`,
    ADD COLUMN `timeSlotId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Payment_timeSlotId_key` ON `Payment`(`timeSlotId`);

-- CreateIndex
CREATE INDEX `PurchaseMessage_timeSlotId_fkey` ON `PurchaseMessage`(`timeSlotId`);

-- CreateIndex
CREATE UNIQUE INDEX `Reservation_timeSlotId_key` ON `Reservation`(`timeSlotId`);

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `TimeSlot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseMessage` ADD CONSTRAINT `PurchaseMessage_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `TimeSlot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `TimeSlot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
