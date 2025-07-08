/*
  Warnings:

  - You are about to drop the column `timeSlotId` on the `Reservation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_timeSlotId_fkey`;

-- DropIndex
DROP INDEX `Reservation_timeSlotId_key` ON `Reservation`;

-- AlterTable
ALTER TABLE `Reservation` DROP COLUMN `timeSlotId`;

-- AlterTable
ALTER TABLE `TimeSlot` ADD COLUMN `reservationId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `TimeSlot` ADD CONSTRAINT `TimeSlot_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
