/*
  Warnings:

  - You are about to drop the column `header` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserGame` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `UserGame` DROP FOREIGN KEY `UserGame_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `UserGame` DROP FOREIGN KEY `UserGame_userId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `header`,
    ADD COLUMN `gameId` INTEGER NULL;

-- DropTable
DROP TABLE `UserGame`;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
