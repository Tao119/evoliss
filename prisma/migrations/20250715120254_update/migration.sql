/*
  Warnings:

  - A unique constraint covering the columns `[reservationId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reservationId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Review` ADD COLUMN `reservationId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Contact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Review_reservationId_key` ON `Review`(`reservationId`);

-- CreateIndex
CREATE INDEX `Review_reservationId_fkey` ON `Review`(`reservationId`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
