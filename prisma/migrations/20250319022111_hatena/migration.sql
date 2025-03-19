-- DropForeignKey
ALTER TABLE `Course` DROP FOREIGN KEY `Course_coachId_fkey`;

-- DropForeignKey
ALTER TABLE `Course` DROP FOREIGN KEY `Course_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRoom` DROP FOREIGN KEY `MessageRoom_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRoom` DROP FOREIGN KEY `MessageRoom_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseMessage` DROP FOREIGN KEY `PurchaseMessage_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseMessage` DROP FOREIGN KEY `PurchaseMessage_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Refund` DROP FOREIGN KEY `Refund_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `Refund` DROP FOREIGN KEY `Refund_reservationId_fkey`;

-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `UserGame` DROP FOREIGN KEY `UserGame_gameId_fkey`;

-- DropIndex
DROP INDEX `Course_coachId_fkey` ON `Course`;

-- DropIndex
DROP INDEX `Course_gameId_fkey` ON `Course`;

-- DropIndex
DROP INDEX `Message_senderId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `MessageRoom_courseId_fkey` ON `MessageRoom`;

-- DropIndex
DROP INDEX `MessageRoom_customerId_fkey` ON `MessageRoom`;

-- DropIndex
DROP INDEX `Payment_scheduleId_fkey` ON `Payment`;

-- DropIndex
DROP INDEX `PurchaseMessage_scheduleId_fkey` ON `PurchaseMessage`;

-- DropIndex
DROP INDEX `PurchaseMessage_senderId_fkey` ON `PurchaseMessage`;

-- DropIndex
DROP INDEX `Refund_customerId_fkey` ON `Refund`;

-- DropIndex
DROP INDEX `Refund_reservationId_fkey` ON `Refund`;

-- DropIndex
DROP INDEX `Reservation_customerId_fkey` ON `Reservation`;

-- DropIndex
DROP INDEX `Reservation_scheduleId_fkey` ON `Reservation`;

-- DropIndex
DROP INDEX `Review_customerId_fkey` ON `Review`;

-- DropIndex
DROP INDEX `UserGame_gameId_fkey` ON `UserGame`;

-- AlterTable
ALTER TABLE `Course` MODIFY `gameId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Message` MODIFY `senderId` INTEGER NULL;

-- AlterTable
ALTER TABLE `MessageRoom` MODIFY `courseId` INTEGER NULL;

-- AlterTable
ALTER TABLE `PurchaseMessage` MODIFY `senderId` INTEGER NULL,
    MODIFY `scheduleId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Refund` MODIFY `customerId` INTEGER NULL,
    MODIFY `reservationId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_coachId_fkey` FOREIGN KEY (`coachId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRoom` ADD CONSTRAINT `MessageRoom_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRoom` ADD CONSTRAINT `MessageRoom_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseMessage` ADD CONSTRAINT `PurchaseMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseMessage` ADD CONSTRAINT `PurchaseMessage_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserGame` ADD CONSTRAINT `UserGame_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
