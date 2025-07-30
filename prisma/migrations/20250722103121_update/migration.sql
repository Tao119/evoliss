/*
  Warnings:

  - You are about to drop the column `customerId` on the `Refund` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Refund` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Refund` DROP FOREIGN KEY `Refund_customerId_fkey`;

-- DropIndex
DROP INDEX `Refund_customerId_fkey` ON `Refund`;

-- AlterTable
ALTER TABLE `Refund` DROP COLUMN `customerId`,
    DROP COLUMN `text`;
