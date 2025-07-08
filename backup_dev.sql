-- MySQL dump 10.13  Distrib 8.0.40, for macos15.1 (arm64)
--
-- Host: database.cl2m4oa4m59h.ap-northeast-1.rds.amazonaws.com    Database: evoliss_dev
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Course`
--

LOCK TABLES `Course` WRITE;
/*!40000 ALTER TABLE `Course` DISABLE KEYS */;
INSERT INTO `Course` VALUES (1,'aaa','aaa',1500,NULL,2,'2025-03-21 17:25:03.304','2025-03-21 17:25:03.304',1,30),(2,'aaa','aaa',1800,'https://user-icon-bucket.s3.ap-northeast-1.amazonaws.com/course/2/course/1742578547719.jpeg',2,'2025-03-21 17:35:48.723','2025-03-21 17:35:48.723',1,30);
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CourseAccess`
--

LOCK TABLES `CourseAccess` WRITE;
/*!40000 ALTER TABLE `CourseAccess` DISABLE KEYS */;
INSERT INTO `CourseAccess` VALUES (1,1,2,'2025-03-21 17:25:04.486'),(2,2,NULL,'2025-03-21 17:36:16.227'),(3,2,NULL,'2025-03-21 17:49:27.045'),(4,1,1,'2025-03-21 17:49:56.841'),(5,1,1,'2025-03-21 17:49:56.855'),(6,1,1,'2025-03-21 18:29:19.854'),(7,1,2,'2025-03-22 03:00:07.265'),(8,2,2,'2025-03-24 01:59:47.618'),(9,2,3,'2025-03-24 02:00:24.045'),(10,2,3,'2025-03-24 02:00:24.056'),(11,2,2,'2025-03-25 01:50:45.073');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Game`
--

LOCK TABLES `Game` WRITE;
/*!40000 ALTER TABLE `Game` DISABLE KEYS */;
INSERT INTO `Game` VALUES (1,'test','2025-03-21 17:25:03.246',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Message`
--

LOCK TABLES `Message` WRITE;
/*!40000 ALTER TABLE `Message` DISABLE KEYS */;
INSERT INTO `Message` VALUES (1,1,'111','2025-03-21 17:49:59.647',1,1),(2,2,'aaa','2025-03-21 17:50:16.324',1,1),(3,2,'111','2025-03-21 17:50:33.566',1,1),(4,2,'aaaa','2025-03-21 17:57:45.399',1,1),(5,1,'あ','2025-03-21 18:08:46.039',1,1),(6,2,'aaa','2025-03-21 18:10:02.256',1,1),(7,2,'ass','2025-03-21 18:10:22.475',1,1),(8,2,'aaaaaaaaa','2025-03-21 18:11:32.503',1,1),(9,2,'acs','2025-03-21 18:12:27.193',1,1),(10,1,'aaa','2025-03-21 18:15:07.252',1,1),(11,2,'cs','2025-03-21 18:15:14.075',1,1),(12,2,'aaaa','2025-03-21 18:15:50.893',1,1),(13,2,'aa','2025-03-21 18:18:00.291',1,1),(14,2,'as','2025-03-21 18:20:37.982',1,1),(15,2,'bb','2025-03-21 18:20:53.563',1,1),(16,2,'aaa','2025-03-21 18:21:50.901',1,1),(17,2,'あああ','2025-03-21 18:24:16.566',1,1),(18,1,'kei','2025-03-21 18:28:30.298',1,1),(19,1,'kai','2025-03-21 18:28:38.990',1,1),(20,1,'kai','2025-03-21 18:28:39.078',1,1),(21,1,'aaa','2025-03-21 18:29:01.846',1,1),(22,3,'a','2025-03-24 02:28:22.919',1,2),(23,3,'a','2025-03-24 02:29:30.358',1,2),(24,3,'a','2025-03-24 02:38:05.948',1,2),(25,3,'kk','2025-03-24 02:39:55.187',1,2),(26,3,'a','2025-03-24 02:48:19.546',1,2),(27,3,'a','2025-03-24 02:48:39.199',1,2),(28,3,'aaaaa','2025-03-24 02:49:56.527',1,2),(29,3,'aaa','2025-03-24 02:51:31.275',1,2),(30,3,'l','2025-03-24 02:54:19.436',1,2),(31,3,'aaaaa','2025-03-24 02:55:15.750',1,2),(32,3,'a','2025-03-24 02:55:24.821',1,2);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MessageRoom`
--

LOCK TABLES `MessageRoom` WRITE;
/*!40000 ALTER TABLE `MessageRoom` DISABLE KEYS */;
INSERT INTO `MessageRoom` VALUES (1,1,1,'iRlveVSk1-'),(2,2,3,'g5uMsZK_SH');
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
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES (1,2,'abcさんがメッセージを送信しました\n「111」\n        ','2025-03-21 17:50:00.109',1,1,NULL),(2,1,'さんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 17:50:16.289',0,2,NULL),(3,1,'さんがメッセージを送信しました\n「111」\n        ','2025-03-21 17:50:33.521',0,2,NULL),(4,1,'さんがメッセージを送信しました\n「aaaa」\n        ','2025-03-21 17:57:45.298',0,2,NULL),(5,2,'abcさんがメッセージを送信しました\n「あ」\n        ','2025-03-21 18:08:46.670',1,1,NULL),(6,1,'さんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 18:10:02.361',0,2,NULL),(7,1,'さんがメッセージを送信しました\n「ass」\n        ','2025-03-21 18:10:22.608',0,2,NULL),(8,1,'さんがメッセージを送信しました\n「aaaaaaaaa」\n        ','2025-03-21 18:11:32.977',0,2,NULL),(9,1,'さんがメッセージを送信しました\n「acs」\n        ','2025-03-21 18:12:27.323',0,2,NULL),(10,2,'abcさんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 18:15:07.679',1,1,NULL),(11,1,'さんがメッセージを送信しました\n「cs」\n        ','2025-03-21 18:15:14.183',0,2,NULL),(12,1,'さんがメッセージを送信しました\n「aaaa」\n        ','2025-03-21 18:15:50.988',0,2,NULL),(13,1,'さんがメッセージを送信しました\n「aa」\n        ','2025-03-21 18:18:00.448',0,2,NULL),(14,1,'さんがメッセージを送信しました\n「as」\n        ','2025-03-21 18:20:38.083',0,2,NULL),(15,1,'さんがメッセージを送信しました\n「bb」\n        ','2025-03-21 18:20:53.648',0,2,NULL),(16,1,'さんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 18:21:50.997',0,2,NULL),(17,1,'さんがメッセージを送信しました\n「あああ」\n        ','2025-03-21 18:24:16.823',0,2,NULL),(18,2,'abcさんがメッセージを送信しました\n「kei」\n        ','2025-03-21 18:28:30.636',1,1,NULL),(19,2,'abcさんがメッセージを送信しました\n「kai」\n        ','2025-03-21 18:28:39.070',1,1,NULL),(20,2,'abcさんがメッセージを送信しました\n「kai」\n        ','2025-03-21 18:28:39.167',1,1,NULL),(21,2,'abcさんがメッセージを送信しました\n「aaa」\n        ','2025-03-21 18:29:01.907',1,1,NULL),(22,2,'TESTさんがあなたの講座を購入しました。','2025-03-24 02:06:55.946',1,3,2),(23,2,'TESTさんがメッセージを送信しました\n「a」\n        ','2025-03-24 02:28:23.003',1,3,2),(24,2,'TESTさんがメッセージを送信しました\n「a」\n        ','2025-03-24 02:29:30.415',1,3,2),(25,2,'TESTさんがメッセージを送信しました\n「a」\n        ','2025-03-24 02:38:06.013',1,3,2),(26,2,'TESTさんがメッセージを送信しました\n「kk」\n        ','2025-03-24 02:39:55.249',1,3,2),(27,2,'TESTさんがメッセージを送信しました\n「a」\n        ','2025-03-24 02:48:19.606',1,3,2),(28,2,'TESTさんがメッセージを送信しました\n「a」\n        ','2025-03-24 02:48:39.265',1,3,2),(29,2,'TESTさんがメッセージを送信しました\n「aaaaa」\n        ','2025-03-24 02:49:57.296',1,3,2),(30,2,'TESTさんがメッセージを送信しました\n「aaa」\n        ','2025-03-24 02:51:32.119',1,3,2),(31,2,'TESTさんがメッセージを送信しました\n「l」\n        ','2025-03-24 02:54:19.514',1,3,2),(32,2,'TESTさんがメッセージを送信しました\n「aaaaa」\n        ','2025-03-24 02:55:15.833',1,3,2),(33,2,'TESTさんがメッセージを送信しました\n「a」\n        ','2025-03-24 02:55:24.865',1,3,2);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payment`
--

LOCK TABLES `Payment` WRITE;
/*!40000 ALTER TABLE `Payment` DISABLE KEYS */;
INSERT INTO `Payment` VALUES (1,3,1800,'card',2,'2025-03-24 02:01:58.501','2025-03-24 02:07:06.636',13);
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
INSERT INTO `PaymentAccount` VALUES (1,2,'aa','a',0,'a1','aa','2025-03-21 17:28:19.096','2025-03-21 17:28:19.096');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseMessage`
--

LOCK TABLES `PurchaseMessage` WRITE;
/*!40000 ALTER TABLE `PurchaseMessage` DISABLE KEYS */;
INSERT INTO `PurchaseMessage` VALUES (1,2,3,13,1,'2025-03-24 02:06:55.882');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Refund`
--

LOCK TABLES `Refund` WRITE;
/*!40000 ALTER TABLE `Refund` DISABLE KEYS */;
INSERT INTO `Refund` VALUES (1,3,1,1,'先生が来なかった');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reservation`
--

LOCK TABLES `Reservation` WRITE;
/*!40000 ALTER TABLE `Reservation` DISABLE KEYS */;
INSERT INTO `Reservation` VALUES (1,3,13,2,'2025-03-24 02:06:56.282','2025-03-24 02:06:56.282',2);
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
  CONSTRAINT `Review_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Schedule`
--

LOCK TABLES `Schedule` WRITE;
/*!40000 ALTER TABLE `Schedule` DISABLE KEYS */;
INSERT INTO `Schedule` VALUES (1,2,'2025-03-26 15:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(2,2,'2025-03-26 15:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(3,2,'2025-03-26 16:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(4,2,'2025-03-26 16:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(5,2,'2025-03-26 17:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(6,2,'2025-03-26 17:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(7,2,'2025-03-26 18:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(8,2,'2025-03-26 18:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(9,2,'2025-03-26 19:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(10,2,'2025-03-26 19:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(11,2,'2025-03-24 15:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(12,2,'2025-03-24 15:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(13,2,'2025-03-24 16:00:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785'),(14,2,'2025-03-24 16:30:00.000','2025-03-21 17:35:48.785','2025-03-21 17:35:48.785');
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
INSERT INTO `User` VALUES (1,'abc','tao.dama.art@gmail.com','2025-03-21 17:18:22.760','2025-03-21 17:49:39.792',NULL,NULL,NULL,1),(2,'TAOTAO','taoswim@gmail.com','2025-03-21 17:24:38.013','2025-03-24 01:59:40.503',NULL,NULL,NULL,1),(3,'TEST','matsumurataosoakai@gmail.com','2025-03-24 02:00:12.771','2025-03-24 02:01:47.299',NULL,NULL,NULL,0);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserPayment`
--

LOCK TABLES `UserPayment` WRITE;
/*!40000 ALTER TABLE `UserPayment` DISABLE KEYS */;
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

-- Dump completed on 2025-03-26 22:39:41
