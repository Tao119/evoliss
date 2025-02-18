/*
  Warnings:

  - You are about to drop the `CourseReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserReview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CourseReview` DROP FOREIGN KEY `CourseReview_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `CourseReview` DROP FOREIGN KEY `CourseReview_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `Review_ReceiverId_fk`;

-- DropForeignKey
ALTER TABLE `UserReview` DROP FOREIGN KEY `Review_SenderId_fk`;

-- DropTable
DROP TABLE `CourseReview`;

-- DropTable
DROP TABLE `UserReview`;

-- CreateTable
CREATE TABLE `Review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
