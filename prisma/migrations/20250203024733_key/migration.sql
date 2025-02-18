/*
  Warnings:

  - A unique constraint covering the columns `[roomKey]` on the table `MessageRoom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomKey` to the `MessageRoom` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MessageRoom` ADD COLUMN `roomKey` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `MessageRoom_roomKey_key` ON `MessageRoom`(`roomKey`);
