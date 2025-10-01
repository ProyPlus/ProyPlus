-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: gestor_inversores
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id_address` bigint NOT NULL AUTO_INCREMENT,
  `city` varchar(255) NOT NULL,
  `number` int NOT NULL,
  `postal_code` int NOT NULL,
  `province` enum('BUENOS_AIRES','CABA','CATAMARCA','CHACO','CHUBUT','CORDOBA','CORRIENTES','ENTRE_RIOS','FORMOSA','JUJUY','LA_PAMPA','LA_RIOJA','MENDOZA','MISIONES','NEUQUEN','RIO_NEGRO','SALTA','SANTA_CRUZ','SANTA_FE','SANTIAGO_DEL_ESTERO','SAN_JUAN','SAN_LUIS','TIERRA_DEL_FUEGO','TUCUMAN') NOT NULL,
  `street` varchar(255) NOT NULL,
  PRIMARY KEY (`id_address`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,'Lanús',123,1824,'BUENOS_AIRES','Calle Falsa'),(2,'San Miguel de Tucumán',456,4000,'TUCUMAN','Calle Mitre');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbotfaqs`
--

DROP TABLE IF EXISTS `chatbotfaqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbotfaqs` (
  `id_chatbotfaq` bigint NOT NULL AUTO_INCREMENT,
  `answer` varchar(255) DEFAULT NULL,
  `question` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_chatbotfaq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbotfaqs`
--

LOCK TABLES `chatbotfaqs` WRITE;
/*!40000 ALTER TABLE `chatbotfaqs` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatbotfaqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `earnings`
--

DROP TABLE IF EXISTS `earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `earnings` (
  `id_earning` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(15,2) NOT NULL,
  `confirmed_at` date DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `currency` enum('ARS','CNY','EUR','USD') NOT NULL,
  `status` enum('IN_PROGRESS','NOT_RECEIVED','RECEIVED') NOT NULL,
  `confirmed_by_id` bigint DEFAULT NULL,
  `generated_by_id` bigint NOT NULL,
  `project_id` bigint NOT NULL,
  PRIMARY KEY (`id_earning`),
  KEY `FKgwe0ikk4m9e61pudfam0hc6jc` (`confirmed_by_id`),
  KEY `FK5n3hrj0ure4gsk8m9ksyj46bx` (`generated_by_id`),
  KEY `FKrx842vijqaxy87e341ea04j3t` (`project_id`),
  CONSTRAINT `FK5n3hrj0ure4gsk8m9ksyj46bx` FOREIGN KEY (`generated_by_id`) REFERENCES `students` (`id`),
  CONSTRAINT `FKgwe0ikk4m9e61pudfam0hc6jc` FOREIGN KEY (`confirmed_by_id`) REFERENCES `investors` (`id`),
  CONSTRAINT `FKrx842vijqaxy87e341ea04j3t` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id_project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `earnings`
--

LOCK TABLES `earnings` WRITE;
/*!40000 ALTER TABLE `earnings` DISABLE KEYS */;
/*!40000 ALTER TABLE `earnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investments`
--

DROP TABLE IF EXISTS `investments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investments` (
  `id_investment` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(15,2) NOT NULL,
  `confirmed_at` date DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `currency` enum('ARS','CNY','EUR','USD') NOT NULL,
  `status` enum('IN_PROGRESS','NOT_RECEIVED','RECEIVED') NOT NULL,
  `confirmed_by_student_id` bigint DEFAULT NULL,
  `generated_by_investor_id` bigint NOT NULL,
  `project_id` bigint NOT NULL,
  PRIMARY KEY (`id_investment`),
  KEY `FKl6j8utrdkqi3xqbr8box4jhm8` (`confirmed_by_student_id`),
  KEY `FKpge2v4cisj0l7rrfveulgy35x` (`generated_by_investor_id`),
  KEY `FKhn9dehsfw66j02x1ogyu1uaos` (`project_id`),
  CONSTRAINT `FKhn9dehsfw66j02x1ogyu1uaos` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id_project`),
  CONSTRAINT `FKl6j8utrdkqi3xqbr8box4jhm8` FOREIGN KEY (`confirmed_by_student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `FKpge2v4cisj0l7rrfveulgy35x` FOREIGN KEY (`generated_by_investor_id`) REFERENCES `investors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investments`
--

LOCK TABLES `investments` WRITE;
/*!40000 ALTER TABLE `investments` DISABLE KEYS */;
/*!40000 ALTER TABLE `investments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investors`
--

DROP TABLE IF EXISTS `investors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investors` (
  `contact_person` varchar(255) NOT NULL,
  `cuit` varchar(11) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `web_site` varchar(100) DEFAULT NULL,
  `id` bigint NOT NULL,
  `address_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKanyy58r47nhva7gml9ejims2x` (`cuit`),
  UNIQUE KEY `UK59gv6a4ga1ru1361n90vud92r` (`address_id`),
  CONSTRAINT `FK9t284so3vpgitl5lhtqg9ssre` FOREIGN KEY (`id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqcnp6s3w126mh5l0p2buagxde` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investors`
--

LOCK TABLES `investors` WRITE;
/*!40000 ALTER TABLE `investors` DISABLE KEYS */;
INSERT INTO `investors` VALUES ('Juan Pérez','30799887766','+543814556677','https://www.bancotucuman.com',5,2);
/*!40000 ALTER TABLE `investors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_token`
--

DROP TABLE IF EXISTS `password_reset_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_token` (
  `id` bigint NOT NULL,
  `expiry_date` datetime(6) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf90ivichjaokvmovxpnlm5nin` (`user_id`),
  CONSTRAINT `FK83nsrttkwkb6ym0anu051mtxn` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_token`
--

LOCK TABLES `password_reset_token` WRITE;
/*!40000 ALTER TABLE `password_reset_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_token_seq`
--

DROP TABLE IF EXISTS `password_reset_token_seq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_token_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_token_seq`
--

LOCK TABLES `password_reset_token_seq` WRITE;
/*!40000 ALTER TABLE `password_reset_token_seq` DISABLE KEYS */;
INSERT INTO `password_reset_token_seq` VALUES (1);
/*!40000 ALTER TABLE `password_reset_token_seq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKnry1f3jmc4abb5yvkftlvn6vg` (`permission_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (3,'CREATE'),(4,'DELETE'),(1,'READ'),(2,'UPDATE');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_tags`
--

DROP TABLE IF EXISTS `project_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_tags` (
  `id_project_tag` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_project_tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_tags`
--

LOCK TABLES `project_tags` WRITE;
/*!40000 ALTER TABLE `project_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id_project` bigint NOT NULL AUTO_INCREMENT,
  `budget_goal` double NOT NULL,
  `current_goal` double NOT NULL,
  `description` varchar(500) NOT NULL,
  `end_date` date DEFAULT NULL,
  `estimated_end_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `status` varchar(255) NOT NULL,
  `tag_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id_project`),
  KEY `FK45bxf5dp9mnugp6p7f8shbymt` (`tag_id`),
  CONSTRAINT `FK45bxf5dp9mnugp6p7f8shbymt` FOREIGN KEY (`tag_id`) REFERENCES `project_tags` (`id_project_tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects_documents`
--

DROP TABLE IF EXISTS `projects_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects_documents` (
  `id_project_document` bigint NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `project_id` bigint NOT NULL,
  PRIMARY KEY (`id_project_document`),
  KEY `FK93qmoxc604xkinu963eehaq47` (`project_id`),
  CONSTRAINT `FK93qmoxc604xkinu963eehaq47` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id_project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects_documents`
--

LOCK TABLES `projects_documents` WRITE;
/*!40000 ALTER TABLE `projects_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `FKegdk29eiy7mdtefy5c7eirr6e` (`permission_id`),
  CONSTRAINT `FKegdk29eiy7mdtefy5c7eirr6e` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  CONSTRAINT `FKn5fotdgk8d1xvo8nav9uv3muc` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(1,3),(2,3),(3,3),(1,4),(2,4),(3,4);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN'),(2,'INVESTOR'),(3,'STUDENT');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_project`
--

DROP TABLE IF EXISTS `student_project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_project` (
  `student_id` bigint NOT NULL,
  `project_id` bigint NOT NULL,
  PRIMARY KEY (`student_id`,`project_id`),
  KEY `FKa7cccnoevsnp33m5l59sn434n` (`project_id`),
  CONSTRAINT `FK86y7i7fvkh46b49ecwliymo8a` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `FKa7cccnoevsnp33m5l59sn434n` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id_project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_project`
--

LOCK TABLES `student_project` WRITE;
/*!40000 ALTER TABLE `student_project` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `career` varchar(255) NOT NULL,
  `date_of_birth` date NOT NULL,
  `degree_status` enum('ABANDONED','COMPLETED','IN_PROGRESS','SUSPENDED') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `dni` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `university` enum('AUSTRAL','ISALUD','ITBA','TORCUATO_DI_TELLA','UADE','UAI','UAI_RN','UBA','UCALCHA','UCAMI','UCASAL','UCA_SANTA_FE','UCC','UCC_MENDOZA','UCES','UCSE_TUCUMAN','UCU','UNAHUR','UNC','UNCuyo','UNER','UNGS','UNIVERSIDAD_CATOLICA_DE_CORDOBA','UNLAM','UNLP','UNLZ','UNLu','UNMdP','UNNE','UNPAZ','UNR','UNRN','UNSa','UNT','UNaM','USAL','UTN_CORDOBA','UTN_MENDOZA','UTN_SANTA_FE','UTN_TUCUMAN') NOT NULL,
  `id` bigint NOT NULL,
  `address_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcmyptcbd3gj911vn3hhrq7yh` (`dni`),
  UNIQUE KEY `UKopab8dbthaah3udqf9l64u5d7` (`address_id`),
  CONSTRAINT `FK7xqmtv7r2eb5axni3jm0a80su` FOREIGN KEY (`id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKefnng0g6wqmnmuo7tt0kumd5r` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES ('Medicina','2001-08-20','IN_PROGRESS','Estudiante de medicina comprometida con la salud y la investigación.','342112334','Martina','González','https://www.linkedin.com/in/martina-gonzalez','1199887766','UNLZ',4,1);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `FKh8ciramu9cc9q3qcqiv4ue8a6` (`role_id`),
  CONSTRAINT `FKh8ciramu9cc9q3qcqiv4ue8a6` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `FKhfh9dx7w3ubf1co1vdev94g3f` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (3,1),(6,1),(5,2),(4,3);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_not_expired` bit(1) DEFAULT NULL,
  `account_not_locked` bit(1) DEFAULT NULL,
  `credential_not_expired` bit(1) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `enabled` bit(1) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,_binary '',_binary '',_binary '','lucasberonvonbrand@gmail.com',_binary '','$2a$10$O2MyO0YYG1tCv0UpJBiVVOyFwRG40jG5jv9hf.Ofz7U99fuSoqnba',NULL,'lucas'),(4,_binary '',_binary '',_binary '','martina@gmail.com',_binary '','$2a$10$JrZG4jiG/Gh71IMp5TadGOR7mbnmpz/pl4fRe71JtcZfugza32yOG','https://example.com/foto_martina.png','martina'),(5,_binary '',_binary '',_binary '','contacto@bancotucuman.com',_binary '','$2a$10$fkVPRtCdCnFhul1LX1NvYOo39umEpqClpv7Ax9vopPgkzW9kaJGDO','https://example.com/logo_bancotucuman.png','bancotucuman'),(6,_binary '',_binary '',_binary '','pruebadavid@example.com',_binary '','$2a$10$wLQ1gsq/awK8jYsYve2MFOwaNFICnC9..Dxrc5SwbVyZPRp18bl8.','https://example.com/foto.jpg','david');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'gestor_inversores'
--

--
-- Dumping routines for database 'gestor_inversores'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-20 15:32:49
