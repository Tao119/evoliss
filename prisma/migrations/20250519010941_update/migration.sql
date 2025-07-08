/*
  Warnings:

  - You are about to drop the column `status` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Schedule` table. All the data in the column will be lost.
  - Added the required column `status` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coachId` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Schedule` DROP FOREIGN KEY `Schedule_courseId_fkey`;

-- DropIndex
DROP INDEX `Schedule_courseId_fkey` ON `Schedule`;

-- AlterTable
ALTER TABLE `Course` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `status` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Schedule` DROP COLUMN `courseId`,
    ADD COLUMN `coachId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `Schedule_coachId_fkey` ON `Schedule`(`coachId`);

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_coachId_fkey` FOREIGN KEY (`coachId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
