-- DropForeignKey
ALTER TABLE `TimeSlot` DROP FOREIGN KEY `TimeSlot_reservationId_fkey`;

-- DropIndex
DROP INDEX `TimeSlot_reservationId_fkey` ON `TimeSlot`;

-- AddForeignKey
ALTER TABLE `TimeSlot` ADD CONSTRAINT `TimeSlot_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
