/*
  Warnings:

  - Added the required column `courseId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` ADD COLUMN `courseId` INTEGER NOT NULL,
    ADD COLUMN `isRead` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
