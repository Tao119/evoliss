/*
  Warnings:

  - You are about to drop the column `GameId` on the `UserGame` table. All the data in the column will be lost.
  - You are about to drop the `CourseGame` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CourseGame` DROP FOREIGN KEY `CourseGame_GameId_fkey`;

-- DropForeignKey
ALTER TABLE `CourseGame` DROP FOREIGN KEY `CourseGame_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `UserGame` DROP FOREIGN KEY `UserGame_GameId_fkey`;

-- DropIndex
DROP INDEX `UserGame_GameId_fkey` ON `UserGame`;

-- AlterTable
ALTER TABLE `Course` ADD COLUMN `gameId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `UserGame` DROP COLUMN `GameId`,
    ADD COLUMN `gameId` INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE `CourseGame`;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserGame` ADD CONSTRAINT `UserGame_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
