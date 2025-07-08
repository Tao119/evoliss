-- MySQL dump 10.13  Distrib 8.0.40, for macos15.1 (arm64)
--
-- Host: database.cl2m4oa4m59h.ap-northeast-1.rds.amazonaws.com    Database: evoliss
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `Course`
--

DROP TABLE IF EXISTS `Course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Course` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coachId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `gameId` int DEFAULT NULL,
  `duration` int NOT NULL DEFAULT '30',
  PRIMARY KEY (`id`),
  KEY `Course_coachId_fkey` (`coachId`),
  KEY `Course_gameId_fkey` (`gameId`),
  CONSTRAINT `Course_coachId_fkey` FOREIGN KEY (`coachId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Course_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Course`
--

LOCK TABLES `Course` WRITE;
/*!40000 ALTER TABLE `Course` DISABLE KEYS */;
INSERT INTO `Course` VALUES (1,'ポケモンカード初心者講座','初心者も頑張りましょう',1800,'https://user-icon-bucket.s3.ap-northeast-1.amazonaws.com/course/2/course/1742577823467.jpeg',2,'2025-03-21 17:23:43.907','2025-03-21 17:23:43.907',1,30),(2,'ポケモンカード　中級者向け','中級者はこちらへ！',4000,'https://user-icon-bucket.s3.ap-northeast-1.amazonaws.com/course/2/course/1742579190375.png',2,'2025-03-21 17:45:21.846','2025-03-21 17:46:30.639',1,30),(3,'ポケカ上級者','大会で勝ちましょう',20000,'https://user-icon-bucket.s3.ap-northeast-1.amazonaws.com/course/2/course/1742579161645.jpeg',2,'2025-03-21 17:46:02.173','2025-03-21 17:46:02.173',1,30),(4,'test','test',20000,NULL,2,'2025-03-22 13:08:57.173','2025-03-22 13:08:57.173',1,30),(5,'TEST2','',1500,NULL,2,'2025-03-22 13:09:28.155','2025-03-22 13:09:28.155',1,30),(6,'pokemon 1','',2000,'https://user-icon-bucket.s3.ap-northeast-1.amazonaws.com/course/2/course/1742649007080.jpeg',2,'2025-03-22 13:10:07.540','2025-03-22 13:10:07.540',2,30),(7,'pokemon go','',20000,NULL,2,'2025-03-22 13:10:20.133','2025-03-22 13:10:20.133',2,30),(8,'1','1',10000,NULL,2,'2025-03-22 13:11:04.289','2025-03-22 13:11:04.289',1,30),(9,'2','2',20000,NULL,2,'2025-03-22 13:11:10.153','2025-03-22 13:11:10.153',1,30),(10,'3','3',30000,NULL,2,'2025-03-22 13:11:14.123','2025-03-22 13:11:14.123',1,30),(11,'4','4',40000,NULL,2,'2025-03-22 13:11:17.943','2025-03-22 13:11:17.943',1,30),(12,'5','5',49999,NULL,2,'2025-03-22 13:11:22.863','2025-03-22 13:11:22.863',1,30),(13,'6','',6000,NULL,2,'2025-03-22 13:11:28.153','2025-03-22 13:11:28.153',1,30),(14,'7','',7000,NULL,2,'2025-03-22 13:11:32.533','2025-03-22 13:11:32.533',1,30),(15,'8','',8000,NULL,2,'2025-03-22 13:11:36.733','2025-03-22 13:11:36.733',1,30),(16,'9','',9000,NULL,2,'2025-03-22 13:11:40.915','2025-03-22 13:11:40.915',1,30),(17,'10','',99999,NULL,2,'2025-03-22 13:11:45.413','2025-03-22 13:11:45.413',1,30),(18,'11','',12000,NULL,2,'2025-03-22 13:11:49.743','2025-03-22 13:11:49.743',1,30),(19,'12','',12000,NULL,2,'2025-03-22 13:11:53.703','2025-03-22 13:11:53.703',1,30),(20,'13','',13999,NULL,2,'2025-03-22 13:11:57.903','2025-03-22 13:11:57.903',1,30),(21,'14','',30000,NULL,2,'2025-03-22 13:12:07.408','2025-03-22 13:12:07.408',1,30),(22,'9000','',111111,NULL,2,'2025-03-22 13:12:13.392','2025-03-22 13:12:13.392',1,30);
/*!40000 ALTER TABLE `Course` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CourseAccess`
--

DROP TABLE IF EXISTS `CourseAccess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CourseAccess` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int NOT NULL,
  `userId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CourseAccess_courseId_fkey` (`courseId`),
  KEY `CourseAccess_userId_fkey` (`userId`),
  CONSTRAINT `CourseAccess_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CourseAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CourseAccess`
--

LOCK TABLES `CourseAccess` WRITE;
/*!40000 ALTER TABLE `CourseAccess` DISABLE KEYS */;
INSERT INTO `CourseAccess` VALUES (1,1,NULL,'2025-03-21 17:42:15.553'),(2,2,2,'2025-03-21 17:45:22.068'),(3,3,2,'2025-03-21 17:46:02.342'),(4,2,2,'2025-03-22 02:48:31.664'),(5,2,NULL,'2025-03-22 03:45:26.224'),(6,2,3,'2025-03-22 03:45:31.975'),(7,4,2,'2025-03-22 13:08:57.384'),(8,5,2,'2025-03-22 13:09:28.334'),(9,6,2,'2025-03-22 13:10:07.689'),(10,7,2,'2025-03-22 13:10:20.275'),(11,8,2,'2025-03-22 13:11:04.533'),(12,9,2,'2025-03-22 13:11:10.371'),(13,10,2,'2025-03-22 13:11:14.324'),(14,11,2,'2025-03-22 13:11:18.081'),(15,12,2,'2025-03-22 13:11:23.041'),(16,13,2,'2025-03-22 13:11:28.319'),(17,14,2,'2025-03-22 13:11:32.701'),(18,15,2,'2025-03-22 13:11:36.864'),(19,16,2,'2025-03-22 13:11:41.041'),(20,17,2,'2025-03-22 13:11:45.559'),(21,18,2,'2025-03-22 13:11:49.880'),(22,19,2,'2025-03-22 13:11:53.880'),(23,20,2,'2025-03-22 13:11:58.165'),(24,21,2,'2025-03-22 13:12:07.548'),(25,22,2,'2025-03-22 13:12:13.544'),(26,1,2,'2025-03-22 13:13:02.573'),(27,3,2,'2025-03-22 13:14:26.833'),(28,9,3,'2025-03-22 13:14:41.908'),(29,2,3,'2025-03-22 13:14:56.555'),(30,2,NULL,'2025-03-23 03:43:33.554'),(31,1,NULL,'2025-03-23 03:43:40.721'),(32,1,3,'2025-03-23 03:43:51.345');
/*!40000 ALTER TABLE `CourseAccess` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Game`
--

DROP TABLE IF EXISTS `Game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Game` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Game`
--

LOCK TABLES `Game` WRITE;
/*!40000 ALTER TABLE `Game` DISABLE KEYS */;
INSERT INTO `Game` VALUES (1,'ポケモンカード','2025-03-21 17:23:43.887',NULL),(2,'pokemon','2025-03-22 13:10:07.522',NULL);
/*!40000 ALTER TABLE `Game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Message`
--

DROP TABLE IF EXISTS `Message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `senderId` int DEFAULT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `roomId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Message_roomId_fkey` (`roomId`),
  KEY `Message_senderId_fkey` (`senderId`),
  CONSTRAINT `Message_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Message`
--

LOCK TABLES `Message` WRITE;
/*!40000 ALTER TABLE `Message` DISABLE KEYS */;
INSERT INTO `Message` VALUES (1,3,'こんにちは！','2025-03-21 17:47:37.382',1,1),(2,3,'aaa','2025-03-21 18:03:57.886',1,1),(3,2,'aaaaaa','2025-03-21 18:04:06.107',1,1),(4,2,'ほい','2025-03-21 18:08:28.903',1,1),(5,3,'a','2025-03-22 02:40:18.603',1,1),(6,2,'こんちゃ','2025-03-22 02:45:19.317',1,1),(7,3,'よろしくです','2025-03-22 13:13:30.168',1,1),(8,3,'はい','2025-03-22 13:13:43.108',1,1);
/*!40000 ALTER TABLE `Message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MessageRoom`
--

DROP TABLE IF EXISTS `MessageRoom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MessageRoom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int DEFAULT NULL,
  `customerId` int NOT NULL,
  `roomKey` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MessageRoom_roomKey_key` (`roomKey`),
  KEY `MessageRoom_courseId_fkey` (`courseId`),
  KEY `MessageRoom_customerId_fkey` (`customerId`),
  CONSTRAINT `MessageRoom_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `MessageRoom_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MessageRoom`
--

LOCK TABLES `MessageRoom` WRITE;
/*!40000 ALTER TABLE `MessageRoom` DISABLE KEYS */;
INSERT INTO `MessageRoom` VALUES (1,2,3,'yPOsRU0xrr');
/*!40000 ALTER TABLE `MessageRoom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `senderId` int DEFAULT NULL,
  `roomId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Notification_roomId_fkey` (`roomId`),
  KEY `Notification_senderId_fkey` (`senderId`),
  KEY `Notification_userId_fkey` (`userId`),
  CONSTRAINT `Notification_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES (1,2,'さんがメッセージを送信しました\n「こんにちは！」\n        ','2025-03-21 17:47:37.431',0,3,NULL),(2,3,'TAOですさんがメッセージを送信しました\n「ヨロです」\n        ','2025-03-21 17:50:59.645',0,2,NULL),(3,3,'TAOですさんがメッセージを送信しました\n「ヨロです！」\n        ','2025-03-21 17:51:10.631',0,2,NULL),(4,2,'さんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 17:51:43.288',0,3,NULL),(5,2,'さんがメッセージを送信しました\n「a」\n        ','2025-03-21 17:52:09.244',0,3,NULL),(6,2,'さんがメッセージを送信しました\n「hai」\n        ','2025-03-21 17:53:30.692',0,3,NULL),(7,2,'さんがメッセージを送信しました\n「はい」\n        ','2025-03-21 17:53:34.515',0,3,NULL),(8,2,'さんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 18:03:57.972',0,3,NULL),(9,3,'TAOですさんがメッセージを送信しました\n「aaaaaa」\n        ','2025-03-21 18:04:06.170',0,2,NULL),(10,3,'TAOですさんがメッセージを送信しました\n「ほい」\n        ','2025-03-21 18:08:28.939',0,2,NULL),(11,2,'さんがメッセージを送信しました\n「a」\n        ','2025-03-22 02:40:18.676',0,3,NULL),(12,3,'TAOですさんがメッセージを送信しました\n「こんちゃ」\n        ','2025-03-22 02:45:19.363',0,2,NULL),(13,2,'さんがあなたの講座を購入しました。','2025-03-22 03:45:52.406',0,3,1),(14,2,'testさんがメッセージを送信しました\n「よろしくです」\n        ','2025-03-22 13:13:30.208',0,3,1),(15,2,'testさんがメッセージを送信しました\n「はい」\n        ','2025-03-22 13:13:43.158',0,3,1),(16,2,'testさんがあなたの講座を購入しました。','2025-03-22 13:15:20.726',0,3,1),(17,2,'testさんがあなたの講座を購入しました。','2025-03-22 13:19:26.588',0,3,1),(18,2,'testさんがあなたの講座を購入しました。','2025-03-24 02:02:12.147',0,3,1),(19,2,'testさんがあなたの講座を購入しました。','2025-03-24 02:06:55.587',0,3,1);
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Payment`
--

DROP TABLE IF EXISTS `Payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `amount` int NOT NULL,
  `method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `scheduleId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Payment_scheduleId_key` (`scheduleId`),
  KEY `Payment_customerId_fkey` (`customerId`),
  CONSTRAINT `Payment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Payment_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payment`
--

LOCK TABLES `Payment` WRITE;
/*!40000 ALTER TABLE `Payment` DISABLE KEYS */;
INSERT INTO `Payment` VALUES (1,3,4000,'card',1,'2025-03-22 03:45:39.658','2025-03-24 02:06:55.528',42),(2,3,4000,'card',2,'2025-03-22 13:15:04.142','2025-03-22 13:15:30.986',44),(3,3,4000,'card',2,'2025-03-22 13:19:12.058','2025-03-22 13:19:38.164',46);
/*!40000 ALTER TABLE `Payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PaymentAccount`
--

DROP TABLE IF EXISTS `PaymentAccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PaymentAccount` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountType` int NOT NULL,
  `accountNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountHolder` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PaymentAccount_userId_key` (`userId`),
  CONSTRAINT `PaymentAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PaymentAccount`
--

LOCK TABLES `PaymentAccount` WRITE;
/*!40000 ALTER TABLE `PaymentAccount` DISABLE KEYS */;
INSERT INTO `PaymentAccount` VALUES (1,2,'UFJ','麹町',0,'0361462','Tao Matsumura','2025-03-21 17:42:54.024','2025-03-21 17:42:54.024');
/*!40000 ALTER TABLE `PaymentAccount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PurchaseMessage`
--

DROP TABLE IF EXISTS `PurchaseMessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseMessage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `senderId` int DEFAULT NULL,
  `scheduleId` int DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `sentAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PurchaseMessage_roomId_fkey` (`roomId`),
  KEY `PurchaseMessage_scheduleId_fkey` (`scheduleId`),
  KEY `PurchaseMessage_senderId_fkey` (`senderId`),
  CONSTRAINT `PurchaseMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `MessageRoom` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PurchaseMessage_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseMessage`
--

LOCK TABLES `PurchaseMessage` WRITE;
/*!40000 ALTER TABLE `PurchaseMessage` DISABLE KEYS */;
INSERT INTO `PurchaseMessage` VALUES (1,1,3,42,1,'2025-03-22 03:45:52.373'),(2,1,3,44,1,'2025-03-22 13:15:20.689'),(3,1,3,46,1,'2025-03-22 13:19:26.557'),(4,1,3,13,0,'2025-03-24 02:02:12.108'),(5,1,3,13,0,'2025-03-24 02:06:55.561');
/*!40000 ALTER TABLE `PurchaseMessage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Refund`
--

DROP TABLE IF EXISTS `Refund`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Refund` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `reservationId` int DEFAULT NULL,
  `status` int NOT NULL,
  `text` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Refund_customerId_fkey` (`customerId`),
  KEY `Refund_reservationId_fkey` (`reservationId`),
  CONSTRAINT `Refund_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Refund_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Refund`
--

LOCK TABLES `Refund` WRITE;
/*!40000 ALTER TABLE `Refund` DISABLE KEYS */;
/*!40000 ALTER TABLE `Refund` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Reservation`
--

DROP TABLE IF EXISTS `Reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reservation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `scheduleId` int NOT NULL,
  `courseId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `roomId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Reservation_scheduleId_key` (`scheduleId`),
  KEY `Reservation_courseId_fkey` (`courseId`),
  KEY `Reservation_customerId_fkey` (`customerId`),
  CONSTRAINT `Reservation_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Reservation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Reservation_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reservation`
--

LOCK TABLES `Reservation` WRITE;
/*!40000 ALTER TABLE `Reservation` DISABLE KEYS */;
INSERT INTO `Reservation` VALUES (1,3,42,2,'2025-03-22 03:45:52.434','2025-03-22 03:45:52.434',1);
/*!40000 ALTER TABLE `Reservation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Review`
--

DROP TABLE IF EXISTS `Review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Review` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `courseId` int NOT NULL,
  `rating` int NOT NULL,
  `comment` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Review_courseId_fkey` (`courseId`),
  KEY `Review_customerId_fkey` (`customerId`),
  CONSTRAINT `Review_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Review`
--

LOCK TABLES `Review` WRITE;
/*!40000 ALTER TABLE `Review` DISABLE KEYS */;
/*!40000 ALTER TABLE `Review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Schedule`
--

DROP TABLE IF EXISTS `Schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int NOT NULL,
  `startTime` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Schedule_courseId_fkey` (`courseId`),
  CONSTRAINT `Schedule_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Schedule`
--

LOCK TABLES `Schedule` WRITE;
/*!40000 ALTER TABLE `Schedule` DISABLE KEYS */;
INSERT INTO `Schedule` VALUES (1,1,'2025-03-21 18:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(2,1,'2025-03-21 18:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(3,1,'2025-03-21 19:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(4,1,'2025-03-21 19:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(5,1,'2025-03-21 20:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(6,1,'2025-03-21 20:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(7,1,'2025-03-21 21:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(8,1,'2025-03-21 21:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(9,1,'2025-03-21 22:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(10,1,'2025-03-21 22:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(11,1,'2025-03-21 23:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(12,1,'2025-03-21 23:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(13,1,'2025-03-22 00:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(14,1,'2025-03-22 00:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(15,1,'2025-03-22 01:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(16,1,'2025-03-22 01:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(17,1,'2025-03-22 02:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(18,1,'2025-03-22 02:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(19,1,'2025-03-22 03:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(20,1,'2025-03-22 03:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(21,1,'2025-03-28 18:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(22,1,'2025-03-28 18:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(23,1,'2025-03-28 19:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(24,1,'2025-03-28 19:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(25,1,'2025-03-28 20:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(26,1,'2025-03-28 20:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(27,1,'2025-03-28 21:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(28,1,'2025-03-28 21:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(29,1,'2025-03-28 22:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(30,1,'2025-03-28 22:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(31,1,'2025-03-28 23:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(32,1,'2025-03-28 23:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(33,1,'2025-03-29 00:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(34,1,'2025-03-29 00:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(35,1,'2025-03-29 01:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(36,1,'2025-03-29 01:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(37,1,'2025-03-29 02:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(38,1,'2025-03-29 02:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(39,1,'2025-03-29 03:00:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(40,1,'2025-03-29 03:30:00.000','2025-03-21 17:23:43.928','2025-03-21 17:23:43.928'),(41,2,'2025-03-26 15:00:00.000','2025-03-21 17:45:21.868','2025-03-21 17:45:21.868'),(42,2,'2025-03-26 15:30:00.000','2025-03-21 17:45:21.868','2025-03-21 17:45:21.868'),(43,2,'2025-03-26 16:00:00.000','2025-03-21 17:45:21.868','2025-03-21 17:45:21.868'),(44,2,'2025-03-26 16:30:00.000','2025-03-21 17:45:21.868','2025-03-21 17:45:21.868'),(45,2,'2025-03-26 17:00:00.000','2025-03-21 17:45:21.868','2025-03-21 17:45:21.868'),(46,2,'2025-03-26 17:30:00.000','2025-03-21 17:45:21.868','2025-03-21 17:45:21.868'),(47,3,'2025-03-25 15:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(48,3,'2025-03-25 15:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(49,3,'2025-03-25 16:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(50,3,'2025-03-25 16:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(51,3,'2025-03-25 17:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(52,3,'2025-03-25 17:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(53,3,'2025-03-25 18:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(54,3,'2025-03-25 18:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(55,3,'2025-03-25 19:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(56,3,'2025-03-25 19:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(57,3,'2025-03-25 20:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(58,3,'2025-03-25 20:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(59,3,'2025-03-25 21:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(60,3,'2025-03-25 21:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(61,3,'2025-03-25 22:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(62,3,'2025-03-25 22:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(63,3,'2025-03-25 23:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(64,3,'2025-03-25 23:30:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(65,3,'2025-03-26 00:00:00.000','2025-03-21 17:46:02.188','2025-03-21 17:46:02.188'),(66,5,'2025-03-21 15:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(67,5,'2025-03-21 15:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(68,5,'2025-03-21 16:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(69,5,'2025-03-21 16:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(70,5,'2025-03-21 17:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(71,5,'2025-03-21 17:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(72,5,'2025-03-21 18:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(73,5,'2025-03-21 18:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(74,5,'2025-03-21 19:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(75,5,'2025-03-21 19:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(76,5,'2025-03-26 15:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(77,5,'2025-03-26 15:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(78,5,'2025-03-26 16:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(79,5,'2025-03-26 16:30:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179'),(80,5,'2025-03-26 17:00:00.000','2025-03-22 13:09:28.179','2025-03-22 13:09:28.179');
/*!40000 ALTER TABLE `Schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SearchHistory`
--

DROP TABLE IF EXISTS `SearchHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SearchHistory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `query` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `searchedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `show` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `SearchHistory_userId_fkey` (`userId`),
  CONSTRAINT `SearchHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SearchHistory`
--

LOCK TABLES `SearchHistory` WRITE;
/*!40000 ALTER TABLE `SearchHistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `SearchHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `bio` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `header` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (2,'TAOです','tao.dama.art@gmail.com','2025-03-21 17:22:26.154','2025-03-21 17:43:06.690','こんにちは。',NULL,'https://user-icon-bucket.s3.ap-northeast-1.amazonaws.com/icon/2/icon/1742578951456.jpeg',1),(3,'test','taoswim2@gmail.com','2025-03-21 17:47:03.737','2025-03-22 13:05:05.167',NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserGame`
--

DROP TABLE IF EXISTS `UserGame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserGame` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `gameId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserGame_gameId_fkey` (`gameId`),
  KEY `UserGame_userId_fkey` (`userId`),
  CONSTRAINT `UserGame_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserGame_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserGame`
--

LOCK TABLES `UserGame` WRITE;
/*!40000 ALTER TABLE `UserGame` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserGame` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserPayment`
--

DROP TABLE IF EXISTS `UserPayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserPayment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `amount` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `UserPayment_userId_fkey` (`userId`),
  CONSTRAINT `UserPayment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserPayment`
--

LOCK TABLES `UserPayment` WRITE;
/*!40000 ALTER TABLE `UserPayment` DISABLE KEYS */;
INSERT INTO `UserPayment` VALUES (1,2,500,'2025-03-22 13:06:02.664'),(2,2,100,'2025-03-22 13:06:21.473');
/*!40000 ALTER TABLE `UserPayment` ENABLE KEYS */;
UNLOCK TABLES;

SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-26 22:40:11
