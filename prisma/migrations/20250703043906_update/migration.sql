-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `roomId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Reservation_roomId_fkey` ON `Reservation`(`roomId`);

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
