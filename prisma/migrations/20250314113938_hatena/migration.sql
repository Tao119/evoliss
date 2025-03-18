/*
  Warnings:

  - You are about to alter the column `accountType` on the `PaymentAccount` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Int`.

*/
-- AlterTable
ALTER TABLE `PaymentAccount` MODIFY `accountType` INTEGER NOT NULL;
