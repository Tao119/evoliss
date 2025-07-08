/*
  Warnings:

  - You are about to drop the column `roomId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseMessage` DROP FOREIGN KEY `PurchaseMessage_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseMessage` DROP FOREIGN KEY `PurchaseMessage_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseMessage` DROP FOREIGN KEY `PurchaseMessage_timeSlotId_fkey`;

-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_roomId_fkey`;

-- DropIndex
DROP INDEX `Reservation_roomId_fkey` ON `Reservation`;

-- AlterTable
ALTER TABLE `Reservation` DROP COLUMN `roomId`;

-- DropTable
DROP TABLE `Notification`;

-- DropTable
DROP TABLE `PurchaseMessage`;
