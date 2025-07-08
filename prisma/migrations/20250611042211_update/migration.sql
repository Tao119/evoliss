/*
  Warnings:

  - You are about to drop the column `timeSlotId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reservationId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reservationId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_timeSlotId_fkey`;

-- DropIndex
DROP INDEX `Payment_timeSlotId_key` ON `Payment`;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `timeSlotId`,
    ADD COLUMN `reservationId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Payment_reservationId_key` ON `Payment`(`reservationId`);

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
