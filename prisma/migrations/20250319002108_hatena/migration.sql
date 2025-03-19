-- DropForeignKey
ALTER TABLE `CourseAccess` DROP FOREIGN KEY `CourseAccess_userId_fkey`;

-- DropIndex
DROP INDEX `CourseAccess_userId_fkey` ON `CourseAccess`;

-- AlterTable
ALTER TABLE `CourseAccess` MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `CourseAccess` ADD CONSTRAINT `CourseAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
