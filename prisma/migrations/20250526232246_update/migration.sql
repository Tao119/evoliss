/*
  Warnings:

  - You are about to drop the column `courseId` on the `MessageRoom` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `MessageRoom` DROP FOREIGN KEY `MessageRoom_courseId_fkey`;

-- DropIndex
DROP INDEX `MessageRoom_courseId_fkey` ON `MessageRoom`;

-- AlterTable
ALTER TABLE `MessageRoom` DROP COLUMN `courseId`,
    ADD COLUMN `coachId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `MessageRoom_coachId_fkey` ON `MessageRoom`(`coachId`);

-- AddForeignKey
ALTER TABLE `MessageRoom` ADD CONSTRAINT `MessageRoom_coachId_fkey` FOREIGN KEY (`coachId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
