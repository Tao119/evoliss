-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropIndex
DROP INDEX `Message_senderId_fkey` ON `Message`;

-- AlterTable
ALTER TABLE `Message` MODIFY `senderId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
