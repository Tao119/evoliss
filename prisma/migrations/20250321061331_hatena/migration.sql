-- DropForeignKey
ALTER TABLE `UserPayment` DROP FOREIGN KEY `UserPayment_userId_fkey`;

-- DropIndex
DROP INDEX `UserPayment_userId_key` ON `UserPayment`;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
