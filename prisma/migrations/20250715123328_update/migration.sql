-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `TagCourse` DROP FOREIGN KEY `TagCourse_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `TagCourse` DROP FOREIGN KEY `TagCourse_tagId_fkey`;

-- DropIndex
DROP INDEX `TagCourse_courseId_fkey` ON `TagCourse`;

-- DropIndex
DROP INDEX `TagCourse_tagId_fkey` ON `TagCourse`;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagCourse` ADD CONSTRAINT `TagCourse_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagCourse` ADD CONSTRAINT `TagCourse_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
