/*
  Warnings:

  - You are about to drop the column `courseId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `Message` table. All the data in the column will be lost.
  - Added the required column `roomId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_ReceiverId_fk`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_SenderId_fk`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_courseId_fkey`;

-- DropIndex
DROP INDEX `Message_ReceiverId_fk` ON `Message`;

-- DropIndex
DROP INDEX `Message_courseId_fkey` ON `Message`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `courseId`,
    DROP COLUMN `receiverId`,
    ADD COLUMN `roomId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `MessageRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `customerId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MessageRoom` ADD CONSTRAINT `MessageRoom_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRoom` ADD CONSTRAINT `MessageRoom_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
