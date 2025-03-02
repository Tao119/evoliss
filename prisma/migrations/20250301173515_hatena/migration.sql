/*
  Warnings:

  - Made the column `senderId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropIndex
DROP INDEX `Message_senderId_fkey` ON `Message`;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `senderId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
