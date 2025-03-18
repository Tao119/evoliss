/*
  Warnings:

  - A unique constraint covering the columns `[roomId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `roomId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Reservation_roomId_key` ON `Reservation`(`roomId`);

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
