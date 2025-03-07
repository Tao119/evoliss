-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `roomId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
