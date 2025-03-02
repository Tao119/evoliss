/*
  Warnings:

  - You are about to drop the column `isSystem` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `isSystem`;

-- CreateTable
CREATE TABLE `PurchaseMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `scheduleId` INTEGER NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PurchaseMessage` ADD CONSTRAINT `PurchaseMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseMessage` ADD CONSTRAINT `PurchaseMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseMessage` ADD CONSTRAINT `PurchaseMessage_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
