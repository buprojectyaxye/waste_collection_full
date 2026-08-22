-- Smart Waste Collection Management System Full Database Export
-- Generated: 2026-08-20 13:26:22

CREATE DATABASE IF NOT EXISTS `smart_waste_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_waste_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for `admins`
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'Admin',
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `admins`
INSERT INTO `admins` (`admin_id`, `name`, `email`, `password`, `role`, `profile_picture`, `created_at`) VALUES ('1', 'Super Admin', 'admin@waste.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', '../uploads/profiles/admin_1_1787138317.jpg', '2026-08-19 13:18:25');

-- Table structure for `residents`
DROP TABLE IF EXISTS `residents`;
CREATE TABLE `residents` (
  `resident_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `subscription_plan` varchar(100) DEFAULT 'Pay Per Pickup ($5/Pickup)',
  `password` varchar(255) NOT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`resident_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `residents`
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('15', 'khalid abdulkadir jimale', 'amiin@gmail.com', '6123344556', 'Hodan, Mogadishu (23) https://maps.google.com/?q=2.040770,45.299775', 'Pay Per Pickup ($5.00)', '$2y$10$8Z76g2nVvJWTZw3e4TmeFuHDvRvdt1uMCh5wWaLFIb7R6Z4o9mg6a', 'Active', NULL, '2026-08-19 17:19:45');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('16', 'Wadajir Resident', 'test_res_wada_1787216160@waste.com', '+252618999000', 'Wadajir, Mogadishu (Bulo Hubey)', 'Pay Per Pickup ($5/Pickup)', '$2y$10$UuIeknjrGWmcoG0bt.V8Pu8zy2QYygP2plC6D9M4wl7KeHNlPgx76', 'Active', NULL, '2026-08-20 11:56:00');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('17', 'najax', 'najax@gmail.com', '6123344559', 'Waberi, Mogadishu (26) https://maps.google.com/?q=2.040770,45.299776', 'Pay Per Pickup ($5.00)', '$2y$10$6K5yP8Cx4BRM6sfvf.9l9uZIkNMTXSsF0V2LXuxzOiiqMKYYN8FmK', 'Active', NULL, '2026-08-20 12:09:32');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('18', 'sadaq', 'sadaq@gmail.com', '6123344569', 'Howlwadaag, Mogadishu (28) https://maps.google.com/?q=2.040760,45.299756', 'Pay Per Pickup ($5.00)', '$2y$10$hHYFmcFgUpMRilczRfe3pOhatmP8iua.eUGdCVrH3munjciZ4Px0m', 'Active', NULL, '2026-08-20 12:26:14');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('19', 'naciimo', 'nacimo@gmail.com', '6123344568', 'Howlwadaag, Mogadishu (010101) https://maps.google.com/?q=2.032900,45.346200', 'Pay Per Pickup ($5.00)', '$2y$10$ET9YDINujCJXFPQ8F51fW.A6Mm4HO6GR8pE2Y.K0FnUyYOygk8c7i', 'Active', NULL, '2026-08-20 12:55:21');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('20', 'maxamed', 'maxamed@gmail.com', '6123344567', 'Howlwadaag, Mogadishu (010102) https://maps.google.com/?q=2.040772,45.299781', 'Pay Per Pickup ($5.00)', '$2y$10$hvb2eEiiLyjySa17BPYgdukIUf.Vr1x9eZUN45rQc94FN1UwTJ.dS', 'Active', NULL, '2026-08-20 12:56:48');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('21', 'bahal', 'bahal@gmail.com', '6123344566', 'Howlwadaag, Mogadishu (010103) https://maps.google.com/?q=2.040772,45.299781', 'Pay Per Pickup ($5.00)', '$2y$10$RDoVucC6RYLusXHGkFUs.eKvdoDSVXsRrs5upaOcuAJE7Mi2xwPle', 'Active', NULL, '2026-08-20 12:58:32');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('22', 'dhoobe', 'dhoobe@gmail.com', '618878994', 'Howlwadaag, Mogadishu (010104) https://maps.google.com/?q=2.040760,45.299755', 'Pay Per Pickup ($5.00)', '$2y$10$Be1qeyJe1XwPCyzgxq9/lu.sZC0NciQ9J/He2Gnfky198JRovLwke', 'Active', NULL, '2026-08-20 13:00:08');
INSERT INTO `residents` (`resident_id`, `name`, `email`, `phone`, `address`, `subscription_plan`, `password`, `status`, `profile_picture`, `created_at`) VALUES ('23', 'nafiso', 'nafiso@gmail.com', '+252615259394', 'Hodan, Mogadishu (12) https://maps.google.com/?q=2.040770,45.299775', 'Pay Per Pickup ($5.00)', '$2y$10$7Z81kURpH90YKUU.VIkpmuoQf0AuTuhh8l8oSb/10rhHJu5GKZ5PO', 'Active', NULL, '2026-08-20 13:37:28');

-- Table structure for `drivers`
DROP TABLE IF EXISTS `drivers`;
CREATE TABLE `drivers` (
  `driver_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `vehicle_info` varchar(100) DEFAULT 'Compact Dump Truck',
  `zone` varchar(100) DEFAULT NULL,
  `vehicle_plate` varchar(50) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `emergency_contact` varchar(50) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'On Duty',
  `approval_status` varchar(20) DEFAULT 'Approved',
  `rejection_reason` text DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `current_lat` decimal(10,8) DEFAULT NULL,
  `current_lng` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`driver_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `drivers`
INSERT INTO `drivers` (`driver_id`, `name`, `email`, `phone`, `vehicle_info`, `zone`, `vehicle_plate`, `license_number`, `emergency_contact`, `profile_picture`, `status`, `approval_status`, `rejection_reason`, `password`, `current_lat`, `current_lng`, `created_at`) VALUES ('16', 'amin', 'amin@gmail.com', '6123344556', 'Pickup Truck (BU-100)', 'Hodan', 'BU-100', '101010', '252612932957', NULL, 'On Duty', 'Approved', NULL, '$2y$10$8Z76g2nVvJWTZw3e4TmeFuHDvRvdt1uMCh5wWaLFIb7R6Z4o9mg6a', '40.71500263', '-74.00650118', '2026-08-19 17:17:32');
INSERT INTO `drivers` (`driver_id`, `name`, `email`, `phone`, `vehicle_info`, `zone`, `vehicle_plate`, `license_number`, `emergency_contact`, `profile_picture`, `status`, `approval_status`, `rejection_reason`, `password`, `current_lat`, `current_lng`, `created_at`) VALUES ('24', 'salman', 'salmaan@gmail.com', '0612932968', 'Isuzu Giga Heavy Lift 12-Ton (BU-107)', 'Howlwadaag', 'BU-107', '101017', '252612932988', NULL, 'On Duty', 'Approved', NULL, '$2y$10$2x78uBm4romNb2OFqOqoN.jrBBt/WRynDqgKzLfrl/tEWZaKIicw2', '40.71012661', '-74.00881047', '2026-08-20 12:28:36');

-- Table structure for `waste_requests`
DROP TABLE IF EXISTS `waste_requests`;
CREATE TABLE `waste_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `resident_id` int(11) NOT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `waste_type` varchar(50) DEFAULT 'General',
  `priority` varchar(20) DEFAULT 'Normal',
  `area` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `payment_status` varchar(50) NOT NULL DEFAULT 'Paid',
  `paid_amount` decimal(10,2) DEFAULT 5.00,
  `notes` text DEFAULT NULL,
  `request_time` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `waste_requests`
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('5', '3', '1', 'Hodan, Mogadishu (3) https://maps.google.com/?q=2.034247,45.311365', 'General Waste', 'Normal', NULL, 'Completed', 'Paid', '5.00', NULL, '2026-08-19 13:50:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('6', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:24:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('7', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:26:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('8', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:27:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('9', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:30:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('10', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:40:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('11', '8', '6', 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Completed', 'Paid', '5.00', NULL, '2026-08-19 14:41:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('12', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:48:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('13', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 14:54:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('14', '8', NULL, 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Cancelled', 'Paid', '5.00', NULL, '2026-08-19 15:11:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('15', '8', '5', 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Completed', 'Paid', '5.00', NULL, '2026-08-19 15:16:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('16', '8', '7', 'Hodan, Mogadishu (1) https://maps.google.com/?q=2.034247,45.311365, wadajir, 12', 'General Waste', 'Normal', NULL, 'Completed', 'Paid', '5.00', NULL, '2026-08-19 15:20:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('17', '9', '7', 'Wadajir, Mogadishu (23) https://maps.google.com/?q=2.040811,45.299845', 'General Waste', 'Normal', NULL, 'Completed', 'Paid', '5.00', NULL, '2026-08-19 15:44:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('18', '10', '8', 'Wadajir, Mogadishu (House #99)', 'General Waste', 'Normal', 'Wadajir', 'Completed', 'Paid', '5.00', NULL, '2026-08-19 16:26:15');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('19', '11', '9', 'Hodan, Mogadishu (House #77) https://maps.google.com/?q=2.04,45.32', 'General Waste', 'Normal', 'Hodan', 'Completed', 'Paid', '5.00', NULL, '2026-08-19 15:27:44');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('23', '14', '13', 'Hodan, Mogadishu (Street 15)', 'General Waste', 'Normal', 'Hodan', 'Accepted', 'Paid', '5.00', NULL, '2026-08-19 16:58:18');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('25', '16', '20', 'Wadajir, Mogadishu (Bulo Hubey)', 'General Waste', 'Normal', 'Wadajir', 'Assigned', 'Paid', '5.00', NULL, '2026-08-20 11:56:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('27', '15', '22', 'Hodan, Mogadishu (23) https://maps.google.com/?q=2.040770,45.299775', 'General Waste', 'Normal', 'Wadajir', 'Assigned', 'Paid', '5.00', NULL, '2026-08-20 11:07:07');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('28', '17', '23', 'Waberi, Mogadishu (26) https://maps.google.com/?q=2.040770,45.299776', 'General Waste', 'Normal', 'Waberi', 'Completed', 'Paid', '5.00', NULL, '2026-08-20 12:09:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('29', '18', '16', 'Howlwadaag, Mogadishu (28) https://maps.google.com/?q=2.040760,45.299756', 'General Waste', 'Normal', 'Howlwadaag', 'Completed', 'Paid', '5.00', NULL, '2026-08-20 12:30:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('30', '19', '24', 'Howlwadaag, Mogadishu (010101) https://maps.google.com/?q=2.032900,45.346200', 'General Waste', 'Normal', 'Howlwadaag', 'Assigned', 'Paid', '5.00', NULL, '2026-08-20 12:55:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('31', '20', '24', 'Howlwadaag, Mogadishu (010102) https://maps.google.com/?q=2.040772,45.299781', 'General Waste', 'Normal', 'Howlwadaag', 'Assigned', 'Paid', '5.00', NULL, '2026-08-20 12:56:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('32', '21', '24', 'Howlwadaag, Mogadishu (010103) https://maps.google.com/?q=2.040772,45.299781', 'General Waste', 'Normal', 'Howlwadaag', 'Completed', 'Paid', '5.00', NULL, '2026-08-20 12:58:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('33', '22', '24', 'Howlwadaag, Mogadishu (010104) https://maps.google.com/?q=2.040760,45.299755', 'General Waste', 'Normal', 'Howlwadaag', 'Completed', 'Paid', '5.00', NULL, '2026-08-20 13:00:00');
INSERT INTO `waste_requests` (`request_id`, `resident_id`, `driver_id`, `address`, `waste_type`, `priority`, `area`, `status`, `payment_status`, `paid_amount`, `notes`, `request_time`) VALUES ('34', '23', '16', 'Hodan, Mogadishu (12) https://maps.google.com/?q=2.040770,45.299775', 'General Waste', 'Normal', 'Hodan', 'Assigned', 'Paid', '5.00', NULL, '2026-08-20 13:38:00');

-- Table structure for `payments`
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) DEFAULT NULL,
  `resident_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(50) DEFAULT 'EVC Plus',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Completed',
  `paid_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `resident_id` (`resident_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`resident_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `payments`
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('23', '24', '15', '5.00', 'Mobile Money', '2026-08-19 17:20:12', 'Completed', '2026-08-19 17:20:12');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('24', '25', '16', '15.00', 'EVC Plus', '2026-08-20 11:56:00', 'Completed', '2026-08-20 11:56:00');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('26', '27', '15', '5.00', 'EVC Plus', '2026-08-20 12:07:07', 'Completed', '2026-08-20 12:07:07');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('27', '28', '17', '5.00', 'Mobile Money', '2026-08-20 12:10:03', 'Completed', '2026-08-20 12:10:03');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('28', '29', '18', '5.00', 'Mobile Money', '2026-08-20 12:31:09', 'Completed', '2026-08-20 12:31:09');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('29', '30', '19', '5.00', 'Mobile Money', '2026-08-20 12:55:44', 'Completed', '2026-08-20 12:55:44');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('30', '31', '20', '5.00', 'Mobile Money', '2026-08-20 12:57:08', 'Completed', '2026-08-20 12:57:08');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('31', '32', '21', '5.00', 'Mobile Money', '2026-08-20 12:58:55', 'Completed', '2026-08-20 12:58:55');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('32', '33', '22', '5.00', 'Mobile Money', '2026-08-20 13:00:33', 'Completed', '2026-08-20 13:00:33');
INSERT INTO `payments` (`payment_id`, `request_id`, `resident_id`, `amount`, `method`, `created_at`, `status`, `paid_at`) VALUES ('33', '34', '23', '5.00', 'Mobile Money', '2026-08-20 13:39:04', 'Completed', '2026-08-20 13:39:04');

-- Table structure for `assignments`
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `assigned_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `started_time` timestamp NULL DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Assigned',
  `waste_type` varchar(50) DEFAULT 'General',
  `weight_kg` decimal(8,2) DEFAULT 25.00,
  `driver_notes` text DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'Unpaid',
  `completed_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `request_id` (`request_id`),
  KEY `driver_id` (`driver_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`driver_id`) ON DELETE CASCADE,
  CONSTRAINT `assignments_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `assignments`
INSERT INTO `assignments` (`assignment_id`, `request_id`, `driver_id`, `admin_id`, `assigned_time`, `started_time`, `status`, `waste_type`, `weight_kg`, `driver_notes`, `payment_status`, `completed_time`) VALUES ('19', '29', '24', NULL, '2026-08-20 12:31:09', NULL, 'In Progress', 'General', '25.00', NULL, 'Unpaid', NULL);
INSERT INTO `assignments` (`assignment_id`, `request_id`, `driver_id`, `admin_id`, `assigned_time`, `started_time`, `status`, `waste_type`, `weight_kg`, `driver_notes`, `payment_status`, `completed_time`) VALUES ('20', '30', '24', NULL, '2026-08-20 12:55:44', NULL, 'Assigned', 'General', '25.00', NULL, 'Unpaid', NULL);
INSERT INTO `assignments` (`assignment_id`, `request_id`, `driver_id`, `admin_id`, `assigned_time`, `started_time`, `status`, `waste_type`, `weight_kg`, `driver_notes`, `payment_status`, `completed_time`) VALUES ('21', '31', '16', NULL, '2026-08-20 12:57:08', NULL, 'Assigned', 'General', '25.00', NULL, 'Unpaid', NULL);
INSERT INTO `assignments` (`assignment_id`, `request_id`, `driver_id`, `admin_id`, `assigned_time`, `started_time`, `status`, `waste_type`, `weight_kg`, `driver_notes`, `payment_status`, `completed_time`) VALUES ('22', '32', '24', NULL, '2026-08-20 12:58:54', NULL, 'Completed', 'General', '25.00', NULL, 'Unpaid', '2026-08-20 12:26:38');
INSERT INTO `assignments` (`assignment_id`, `request_id`, `driver_id`, `admin_id`, `assigned_time`, `started_time`, `status`, `waste_type`, `weight_kg`, `driver_notes`, `payment_status`, `completed_time`) VALUES ('23', '33', '24', NULL, '2026-08-20 13:00:33', NULL, 'Completed', 'General', '25.00', NULL, 'Unpaid', '2026-08-20 12:20:33');
INSERT INTO `assignments` (`assignment_id`, `request_id`, `driver_id`, `admin_id`, `assigned_time`, `started_time`, `status`, `waste_type`, `weight_kg`, `driver_notes`, `payment_status`, `completed_time`) VALUES ('24', '34', '16', NULL, '2026-08-20 13:39:04', NULL, 'Assigned', 'General', '25.00', NULL, 'Unpaid', NULL);

-- Table structure for `messages`
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `sender_type` varchar(20) DEFAULT 'Resident',
  `recipient_id` int(11) DEFAULT 1,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `messages`
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('1', '6', 'Resident', '1', 'I have successfully paid $15.00 via EVC Plus for Request #3. The request is now ready for driver assignment.', '0', '2026-08-19 13:48:20');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('2', '7', 'Resident', '1', 'I have successfully paid $15.00 via EVC Plus for Request #4. The request is now ready for driver assignment.', '0', '2026-08-19 13:49:54');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('3', '3', 'Resident', '1', 'I have successfully paid $15.00 via Mobile Money for Request #5. The request is now ready for driver assignment.', '0', '2026-08-19 13:50:44');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('4', '3', 'Resident', '1', '[Delayed Pickup] tyhjn', '1', '2026-08-19 13:52:09');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('5', '1', 'Admin', '1', 'To Resident #3: fgvhb', '0', '2026-08-19 13:52:21');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('6', '1', 'Driver', '1', '[🚨 Accident (Driver #1)]\nDriver Name: Malik Driver\nPhone: +252615001122\nVehicle Plate: TR-401\n\nDetails:\nrftyhbnj', '1', '2026-08-19 13:52:35');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('7', '1', 'Admin', '1', 'To Driver #1: rctvgyh', '0', '2026-08-19 13:52:44');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('8', '2', 'Driver', '1', '[New Driver Application]\nDriver Name: abdi\nPhone: +252615259397\nLicense: 1946568\nAwaiting admin review and vehicle plate assignment.', '0', '2026-08-19 13:53:14');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('9', '1', 'Admin', '1', 'To Driver #2: Application approved. Assigned Vehicle Plate: TR-103.', '0', '2026-08-19 13:53:30');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('10', '3', 'Driver', '1', '[New Driver Application]\nDriver Name: abdi\nPhone: +252615259397\nLicense: 1946561\nAwaiting admin review and vehicle plate assignment.', '0', '2026-08-19 13:58:49');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('11', '4', 'Driver', '1', '[New Driver Application]\nDriver Name: abdi\nPhone: +252615259397\nLicense: 1946562\nAwaiting admin review and vehicle plate assignment.', '0', '2026-08-19 13:59:54');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('12', '1', 'Admin', '1', 'To Driver #4: Application approved. Assigned Vehicle Plate: TR-105.', '0', '2026-08-19 14:00:08');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('13', '5', 'Driver', '1', '[New Driver Application]\nDriver Name: abdi\nPhone: +252615259397\nLicense: 1946561\nAwaiting admin review and vehicle plate assignment.', '0', '2026-08-19 14:01:41');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('14', '1', 'Admin', '1', 'To Driver #5: Application approved. Assigned Vehicle Plate: TR-105.', '0', '2026-08-19 14:02:06');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('15', '6', 'Driver', '1', '[New Driver Application]\nDriver Name: amin\nPhone: +252615259397\nLicense: 1946568\nAwaiting admin review and vehicle plate assignment.', '0', '2026-08-19 14:03:41');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('16', '1', 'Admin', '1', 'To Driver #6: Application approved. Assigned Vehicle Plate: TR-106.', '0', '2026-08-19 14:13:14');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('17', '8', 'Resident', '1', 'I have successfully paid $15.00 via Mobile Money for Request #6. The request is now ready for driver assignment.', '0', '2026-08-19 14:24:49');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('18', '8', 'Resident', '1', '[Request Cancelled]\nRequest #6 was cancelled by amiin', '0', '2026-08-19 14:26:21');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('19', '8', 'Resident', '1', 'I have successfully paid $5.00 via Mobile Money for Request #10. The request is now ready for driver assignment.', '0', '2026-08-19 14:40:41');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('20', '8', 'Resident', '1', '[Request Cancelled]\nRequest #10 was cancelled by amiin', '0', '2026-08-19 14:41:17');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('21', '8', 'Resident', '1', '[Request Cancelled]\nRequest #9 was cancelled by amiin', '0', '2026-08-19 14:41:22');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('22', '8', 'Resident', '1', '[Request Cancelled]\nRequest #8 was cancelled by amiin', '0', '2026-08-19 14:41:26');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('23', '8', 'Resident', '1', '[Request Cancelled]\nRequest #7 was cancelled by amiin', '0', '2026-08-19 14:41:31');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('24', '8', 'Resident', '1', 'I have successfully paid $5.00 via Mobile Money for Request #11. The request is now ready for driver assignment.', '0', '2026-08-19 14:41:46');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('25', '8', 'Resident', '1', 'I have successfully paid $5.00 via Mobile Money for Request #13. The request is now ready for driver assignment.', '0', '2026-08-19 14:57:51');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('26', '8', 'Resident', '1', '[Request Cancelled]\nRequest #12 was cancelled by amiin', '0', '2026-08-19 14:57:56');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('27', '8', 'Resident', '1', '[Request Cancelled]\nRequest #13 was cancelled by amiin', '0', '2026-08-19 15:01:03');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('28', '8', 'Resident', '1', '[Request Cancelled]\nRequest #14 was cancelled by amiin', '1', '2026-08-19 15:12:26');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('29', '1', 'Admin', '1', 'To Resident #8: 12', '1', '2026-08-19 15:18:31');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('30', '7', 'Driver', '1', '[New Driver Application]\nDriver Name: amin\nPhone: +252615259397\nLicense: 1946568\nAwaiting admin review and vehicle plate assignment.', '0', '2026-08-19 15:22:18');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('31', '1', 'Admin', '1', 'To Driver #7: Application approved. Assigned Vehicle Plate: TR-107.', '1', '2026-08-19 15:22:34');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('32', '18', 'Resident', '1', '[Delayed Pickup] maxamed aamin anaakuwaso', '1', '2026-08-20 12:34:11');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('33', '18', 'Resident', '1', '[Delayed Pickup] hi', '1', '2026-08-20 12:34:36');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('34', '1', 'Admin', '1', 'To Resident #18: adba anaa kucuno', '0', '2026-08-20 12:35:23');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('35', '24', 'Driver', '1', '[🚨 EMERGENCY: Road Blocked (Driver #24)]\nDriver Name: salman\nPhone: 0612932968\nVehicle Plate: BU-107\n\nDetails:\ntyu\n', '1', '2026-08-20 12:51:28');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('36', '1', 'Admin', '1', 'To Driver #24: tf6yunjmk', '0', '2026-08-20 12:51:47');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('37', '15', 'Resident', '1', '[Delayed Pickup] My waste was supposed to be picked up in Wadajir this morning.', '0', '2026-08-20 13:49:36');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('38', '23', 'Resident', '1', '[Missed Collection] szfdxgchjknl;\'', '1', '2026-08-20 13:56:36');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('39', '1', 'Admin', '23', 'To Resident #23: 📌 Re: \"[Missed Collection] szfdxgchjknl;\'\"\n----------------------------------------\n💬 Admin Reply:\nwesrdtfghjkn', '1', '2026-08-20 13:57:03');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('40', '16', 'Driver', '1', '[🚨 Fuel Request (Driver #16)]\nDriver Name: amin\nPhone: 6123344556\nVehicle Plate: BU-100\n\nDetails:\ng', '1', '2026-08-20 13:59:04');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('41', '1', 'Admin', '16', 'To Driver #16: 📌 Re: \"[🚨 Fuel Request (Driver #16)]\nDriver Name: amin\nPhone: 6123344556\nVehicle Plate: BU-100\n\nDetails:\ng\"\n----------------------------------------\n💬 Admin Reply:\nwtf', '0', '2026-08-20 13:59:14');
INSERT INTO `messages` (`message_id`, `sender_id`, `sender_type`, `recipient_id`, `message`, `is_read`, `created_at`) VALUES ('42', '15', 'Resident', '1', '[Delayed Pickup] Collection requested at Wadajir was delayed.', '0', '2026-08-20 14:01:36');

-- Table structure for `notifications`
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 1,
  `user_type` varchar(20) NOT NULL DEFAULT 'Admin',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `notifications`
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('1', '1', 'Admin', 'Payment Received', 'Fadumo E2E paid $15.00 via EVC Plus for Request #3. Ready for driver assignment.', '0', '2026-08-19 13:48:20');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('2', '1', 'Admin', 'Payment Received', 'Fadumo E2E paid $15.00 via EVC Plus for Request #4. Ready for driver assignment.', '0', '2026-08-19 13:49:54');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('3', '1', 'Admin', 'Payment Received', 'amiin paid $15.00 via Mobile Money for Request #5. Ready for driver assignment.', '0', '2026-08-19 13:50:44');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('4', '1', 'Admin', 'New Report', 'A new report was submitted by amiin:\n[Delayed Pickup] tyhjn', '0', '2026-08-19 13:52:09');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('5', '3', 'Resident', 'Admin Reply to Your Report', 'fgvhb', '0', '2026-08-19 13:52:21');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('6', '1', 'Admin', '🚨 Accident (Driver #1)', 'Driver Name: Malik Driver\nPhone: +252615001122\nVehicle Plate: TR-401\n\nDetails:\nrftyhbnj', '0', '2026-08-19 13:52:35');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('7', '1', 'Driver', 'Admin Reply to Your Report', 'rctvgyh', '0', '2026-08-19 13:52:44');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('8', '1', 'Admin', 'New Driver Application', 'New driver \'abdi\' (License: 1946568) registered. Please review in Driver Management to approve or reject.', '0', '2026-08-19 13:53:14');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('9', '2', 'Driver', 'Account Approved! 🎉', 'Congratulations! Your driver account has been approved by the Admin.\nAssigned Vehicle Plate: TR-103\nVehicle Type: Compact Dump Truck\nZone: Wadajir\nYou can now log in and access your dashboard.', '0', '2026-08-19 13:53:30');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('10', '1', 'Admin', 'New Driver Application', 'New driver \'abdi\' (License: 1946561) registered. Please review in Driver Management to approve or reject.', '0', '2026-08-19 13:58:49');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('11', '3', 'Driver', 'Application Rejected', 'Your driver application has been rejected by the administrator.\nReason: ana kuwaso', '0', '2026-08-19 13:59:11');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('12', '1', 'Admin', 'New Driver Application', 'New driver \'abdi\' (License: 1946562) registered. Please review in Driver Management to approve or reject.', '0', '2026-08-19 13:59:54');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('13', '4', 'Driver', 'Account Approved! 🎉', 'Congratulations! Your driver account has been approved by the Admin.\nAssigned Vehicle Plate: TR-105\nVehicle Type: Compact Dump Truck\nZone: Wadajir\nYou can now log in and access your dashboard.', '0', '2026-08-19 14:00:08');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('14', '1', 'Admin', 'New Driver Application', 'New driver \'abdi\' (License: 1946561) registered. Please review in Driver Management to approve or reject.', '0', '2026-08-19 14:01:41');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('15', '5', 'Driver', 'Account Approved! 🎉', 'Congratulations! Your driver account has been approved by the Admin.\nAssigned Vehicle Plate: TR-105\nVehicle Type: Compact Dump Truck\nZone: Wadajir\nYou can now log in and access your dashboard.', '1', '2026-08-19 14:02:06');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('16', '1', 'Admin', 'New Driver Application', 'New driver \'amin\' (License: 1946568) registered. Please review in Driver Management to approve or reject.', '0', '2026-08-19 14:03:41');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('17', '6', 'Driver', 'Account Approved! 🎉', 'Congratulations! Your driver account has been approved by the Admin.\nAssigned Vehicle Plate: TR-106\nYou can now log in and access your dashboard.', '0', '2026-08-19 14:13:14');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('18', '1', 'Admin', 'Payment Received', 'amiin paid $15.00 via Mobile Money for Request #6. Ready for driver assignment.', '0', '2026-08-19 14:24:49');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('19', '1', 'Admin', 'Request Cancelled', 'Request #6 was cancelled by amiin', '0', '2026-08-19 14:26:21');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('20', '1', 'Admin', 'Payment Received', 'amiin paid $5.00 via Mobile Money for Request #10. Ready for driver assignment.', '0', '2026-08-19 14:40:41');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('21', '1', 'Admin', 'Request Cancelled', 'Request #10 was cancelled by amiin', '0', '2026-08-19 14:41:17');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('22', '1', 'Admin', 'Request Cancelled', 'Request #9 was cancelled by amiin', '0', '2026-08-19 14:41:22');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('23', '1', 'Admin', 'Request Cancelled', 'Request #8 was cancelled by amiin', '0', '2026-08-19 14:41:26');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('24', '1', 'Admin', 'Request Cancelled', 'Request #7 was cancelled by amiin', '0', '2026-08-19 14:41:31');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('25', '1', 'Admin', 'Payment Received', 'amiin paid $5.00 via Mobile Money for Request #11. Ready for driver assignment.', '0', '2026-08-19 14:41:46');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('26', '1', 'Admin', 'Payment Received', 'amiin paid $5.00 via Mobile Money for Request #13. Ready for driver assignment.', '0', '2026-08-19 14:57:51');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('27', '1', 'Admin', 'Request Cancelled', 'Request #12 was cancelled by amiin', '0', '2026-08-19 14:57:56');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('28', '1', 'Admin', 'Request Cancelled', 'Request #13 was cancelled by amiin', '0', '2026-08-19 15:01:03');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('29', '1', 'Admin', 'Request Cancelled', 'Request #14 was cancelled by amiin', '1', '2026-08-19 15:12:26');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('30', '8', 'Resident', 'Admin Reply to Your Report', '12', '0', '2026-08-19 15:18:31');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('31', '1', 'Admin', 'New Driver Application', 'New driver \'amin\' (License: 1946568) registered. Please review in Driver Management to approve or reject.', '1', '2026-08-19 15:22:18');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('32', '7', 'Driver', 'Account Approved! 🎉', 'Congratulations! Your driver account has been approved by the Admin.\nAssigned Vehicle Plate: TR-107\nYou can now log in and access your dashboard.', '0', '2026-08-19 15:22:34');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('33', '7', 'Driver', 'New Job Auto-Dispatched', 'New pickup request #20 in your assigned zone (Wadajir) has been automatically dispatched to your truck (TR-107). Ready for collection!', '0', '2026-08-19 16:37:00');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('34', '7', 'Driver', 'New Job Auto-Dispatched', 'New pickup request #21 in your assigned zone (Wadajir) has been automatically dispatched to your truck (TR-107). Ready for collection!', '0', '2026-08-19 16:40:48');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('35', '7', 'Driver', 'New Job Auto-Dispatched', 'New pickup request #22 in your assigned zone (Wadajir) has been automatically dispatched to your truck (TR-107). Ready for collection!', '0', '2026-08-19 16:47:28');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('36', '16', 'Driver', 'New Job in Your Zone', 'New pickup request #24 in your assigned zone (Hodan) is available for collection. Open your dashboard to Accept!', '0', '2026-08-19 17:20:12');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('37', '17', 'Driver', 'New Job in Your Zone', 'New pickup request #24 in your assigned zone (Hodan) is available for collection. Open your dashboard to Accept!', '0', '2026-08-19 17:20:12');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('38', '1', 'Admin', 'Job Accepted by Driver', 'Driver nuur (BU-101) has officially accepted Pickup Request #24.', '0', '2026-08-19 17:21:24');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('40', '23', 'Driver', 'New Job Assigned to You', 'New pickup request #28 from Waberi resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 12:10:03');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('41', '1', 'Admin', 'Job Accepted by Driver', 'Driver nawal (BU-103) has officially accepted Pickup Request #28.', '0', '2026-08-20 12:11:49');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('42', '24', 'Driver', 'New Job Assigned to You', 'New pickup request #29 from Howlwadaag resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 12:31:09');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('43', '1', 'Admin', 'Job Accepted by Driver', 'Driver salman (BU-107) has officially accepted Pickup Request #29.', '1', '2026-08-20 12:32:04');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('44', '1', 'Admin', 'New Report', 'A new report was submitted by sadaq:\n[Delayed Pickup] maxamed aamin anaakuwaso', '0', '2026-08-20 12:34:11');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('45', '1', 'Admin', 'New Report', 'A new report was submitted by sadaq:\n[Delayed Pickup] hi', '1', '2026-08-20 12:34:36');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('46', '18', 'Resident', 'Admin Reply to Your Report', 'adba anaa kucuno', '0', '2026-08-20 12:35:23');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('47', '1', 'Admin', '🚨 EMERGENCY: Road Blocked (Driver #24)', 'Driver Name: salman\nPhone: 0612932968\nVehicle Plate: BU-107\n\nDetails:\ntyu\n', '0', '2026-08-20 12:51:28');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('48', '24', 'Driver', 'Admin Reply to Your Report', 'tf6yunjmk', '1', '2026-08-20 12:51:47');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('49', '24', 'Driver', 'New Job Assigned to You', 'New pickup request #30 from Howlwadaag resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 12:55:44');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('50', '24', 'Driver', 'New Job Assigned to You', 'New pickup request #31 from Howlwadaag resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 12:57:08');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('51', '24', 'Driver', 'New Job Assigned to You', 'New pickup request #32 from Howlwadaag resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 12:58:55');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('52', '24', 'Driver', 'New Job Assigned to You', 'New pickup request #33 from Howlwadaag resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 13:00:33');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('53', '1', 'Admin', 'Job Accepted by Driver', 'Driver salman (BU-107) has officially accepted Pickup Request #33.', '0', '2026-08-20 13:20:13');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('54', '1', 'Admin', 'Job Accepted by Driver', 'Driver salman (BU-107) has officially accepted Pickup Request #32.', '0', '2026-08-20 13:25:02');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('55', '16', 'Driver', 'New Job Assigned to You', 'New pickup request #34 from Hodan resident assigned to you! Open your dashboard to view & collect.', '0', '2026-08-20 13:39:04');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('56', '15', 'Resident', 'Admin Reply to Your Report', '📌 Re: \"[Delayed Pickup] My waste was supposed to be picked up in Wadajir this morning.\"\n----------------------------------------\n💬 Admin Reply:\nDriver Abdi with truck BU-101 has been dispatched and will arrive within 10 minutes.', '0', '2026-08-20 13:49:36');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('57', '1', 'Admin', 'New Report', 'A new report was submitted by nafiso:\n[Missed Collection] szfdxgchjknl;\'', '0', '2026-08-20 13:56:36');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('58', '23', 'Resident', 'Admin Reply to Your Report', '📌 Re: \"[Missed Collection] szfdxgchjknl;\'\"\n----------------------------------------\n💬 Admin Reply:\nwesrdtfghjkn', '0', '2026-08-20 13:57:03');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('59', '1', 'Admin', '🚨 Fuel Request (Driver #16)', 'Driver Name: amin\nPhone: 6123344556\nVehicle Plate: BU-100\n\nDetails:\ng', '0', '2026-08-20 13:59:04');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('60', '16', 'Driver', 'Admin Reply to Your Report', '📌 Re: \"[🚨 Fuel Request (Driver #16)]\nDriver Name: amin\nPhone: 6123344556\nVehicle Plate: BU-100\n\nDetails:\ng\"\n----------------------------------------\n💬 Admin Reply:\nwtf', '1', '2026-08-20 13:59:14');
INSERT INTO `notifications` (`notification_id`, `user_id`, `user_type`, `title`, `message`, `is_read`, `created_at`) VALUES ('61', '15', 'Resident', 'Admin Reply to Your Report', '📌 Re: \"[Delayed Pickup] Collection requested at Wadajir was delayed.\"\n----------------------------------------\n💬 Admin Reply:\nDriver Salman has been notified and will collect your waste within 15 minutes.', '0', '2026-08-20 14:01:36');

-- Table structure for `request_logs`
DROP TABLE IF EXISTS `request_logs`;
CREATE TABLE `request_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `request_id` (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for `request_logs`
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('5', '4', 'Created', 'Request submitted by resident (Awaiting Payment)', '2026-08-19 13:49:54');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('6', '4', 'Payment Received', 'Resident paid $15.00 via EVC Plus', '2026-08-19 13:49:54');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('7', '4', 'Assigned', 'Admin assigned driver Malik Driver', '2026-08-19 13:49:54');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('8', '4', 'Status Update', 'Driver updated status to: Completed', '2026-08-19 13:49:54');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('9', '5', 'Created', 'Request submitted by resident (Awaiting Payment)', '2026-08-19 13:50:37');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('10', '5', 'Payment Received', 'Resident paid $15.00 via Mobile Money', '2026-08-19 13:50:44');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('11', '5', 'Assigned', 'Admin assigned driver Malik Driver', '2026-08-19 13:51:09');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('12', '5', 'Status Update', 'Driver updated status to: Accepted', '2026-08-19 13:51:17');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('13', '5', 'Status Update', 'Driver updated status to: In Progress', '2026-08-19 13:51:29');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('14', '5', 'Status Update', 'Driver updated status to: Completed', '2026-08-19 13:51:45');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('15', '6', 'Created', 'Request submitted by resident (Awaiting Payment)', '2026-08-19 14:24:33');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('16', '6', 'Payment Received', 'Resident paid $15.00 via Mobile Money', '2026-08-19 14:24:49');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('17', '6', 'Cancelled', 'Request cancelled by resident', '2026-08-19 14:26:21');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('18', '7', 'Created', 'Request submitted by resident (Awaiting Payment)', '2026-08-19 14:26:52');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('19', '8', 'Created', 'Request submitted by resident (Awaiting Payment)', '2026-08-19 14:27:18');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('20', '9', 'Created', 'Request submitted by resident (Awaiting Payment)', '2026-08-19 14:30:02');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('21', '10', 'Created', 'Request submitted by resident', '2026-08-19 14:40:11');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('22', '10', 'Payment Received', 'Resident paid $5.00 via Mobile Money', '2026-08-19 14:40:41');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('23', '10', 'Cancelled', 'Request cancelled by resident', '2026-08-19 14:41:17');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('24', '9', 'Cancelled', 'Request cancelled by resident', '2026-08-19 14:41:22');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('25', '8', 'Cancelled', 'Request cancelled by resident', '2026-08-19 14:41:26');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('26', '7', 'Cancelled', 'Request cancelled by resident', '2026-08-19 14:41:31');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('27', '11', 'Created', 'Request submitted by resident', '2026-08-19 14:41:39');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('28', '11', 'Payment Received', 'Resident paid $5.00 via Mobile Money', '2026-08-19 14:41:46');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('29', '11', 'Assigned', 'Admin assigned driver amin', '2026-08-19 14:43:08');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('30', '11', 'Status Update', 'Driver updated status to: Accepted', '2026-08-19 14:44:56');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('31', '11', 'Status Update', 'Driver updated status to: In Progress', '2026-08-19 14:44:57');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('32', '11', 'Status Update', 'Driver updated status to: Completed', '2026-08-19 14:45:00');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('33', '12', 'Created', 'Request submitted by resident', '2026-08-19 14:48:32');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('34', '13', 'Created', 'Request submitted by resident', '2026-08-19 14:54:20');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('35', '13', 'Payment Received', 'Resident paid $5.00 via Mobile Money', '2026-08-19 14:57:51');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('36', '12', 'Cancelled', 'Request cancelled by resident', '2026-08-19 14:57:56');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('37', '13', 'Cancelled', 'Request cancelled by resident', '2026-08-19 15:01:03');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('38', '14', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money)', '2026-08-19 15:12:02');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('39', '14', 'Cancelled', 'Request cancelled by resident', '2026-08-19 15:12:26');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('40', '15', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money)', '2026-08-19 15:16:15');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('41', '15', 'Assigned', 'Admin assigned driver amin', '2026-08-19 15:17:02');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('42', '15', 'Status Update', 'Driver updated status to: Accepted', '2026-08-19 15:17:12');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('43', '15', 'Status Update', 'Driver updated status to: In Progress', '2026-08-19 15:17:27');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('44', '15', 'Status Update', 'Driver updated status to: Completed', '2026-08-19 15:18:07');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('45', '16', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money)', '2026-08-19 15:20:32');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('46', '16', 'Assigned', 'Admin assigned driver amin', '2026-08-19 15:20:44');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('47', '16', 'Status Update', 'Driver updated status to: Accepted', '2026-08-19 15:24:46');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('48', '16', 'Status Update', 'Driver updated status to: In Progress', '2026-08-19 15:38:03');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('49', '16', 'Status Update', 'Driver updated status to: In Progress', '2026-08-19 15:38:03');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('50', '16', 'Status Update', 'Driver updated status to: Completed', '2026-08-19 15:38:04');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('51', '17', 'Created', 'Pickup request scheduled and paid ($15.00 via Mobile Money)', '2026-08-19 15:45:33');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('52', '17', 'Assigned', 'Admin assigned driver amin', '2026-08-19 15:46:11');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('53', '17', 'Status Update', 'Driver updated status to: Accepted', '2026-08-19 15:59:46');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('54', '17', 'Status Update', 'Driver updated status to: Accepted', '2026-08-19 15:59:47');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('55', '17', 'Status Update', 'Driver updated status to: In Progress', '2026-08-19 15:59:48');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('58', '17', 'Status Update', 'Driver updated status to: Completed', '2026-08-19 16:41:41');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('75', '24', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Broadcast to 2 driver(s) in Hodan zone.', '2026-08-19 17:20:12');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('76', '24', 'Status Update', 'Driver nuur (BU-101) updated status to: Accepted for Request #24', '2026-08-19 17:21:24');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('77', '24', 'Status Update', 'Driver nuur (BU-101) updated status to: In Progress for Request #24', '2026-08-19 17:24:17');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('78', '24', 'Status Update', 'Driver nuur (BU-101) updated status to: Completed for Request #24', '2026-08-19 17:24:17');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('79', '27', 'Created', 'Pickup request scheduled and paid ($5.00 via EVC Plus). Assigned directly to driver abdi in Wadajir zone.', '2026-08-20 12:07:07');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('80', '28', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver nawal in Waberi zone.', '2026-08-20 12:10:03');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('81', '28', 'Status Update', 'Driver nawal (BU-103) updated status to: Accepted for Request #28', '2026-08-20 12:11:49');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('82', '28', 'Status Update', 'Driver nawal (BU-103) updated status to: In Progress for Request #28', '2026-08-20 12:12:18');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('83', '28', 'Status Update', 'Driver nawal (BU-103) updated status to: Completed for Request #28', '2026-08-20 12:12:23');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('84', '29', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver salman in Howlwadaag zone.', '2026-08-20 12:31:09');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('85', '29', 'Status Update', 'Driver salman (BU-107) updated status to: Accepted for Request #29', '2026-08-20 12:32:04');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('86', '29', 'Status Update', 'Driver salman (BU-107) updated status to: In Progress for Request #29', '2026-08-20 12:32:17');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('87', '29', 'Status Update', 'Driver amin (BU-100) updated status to: Completed for Request #29', '2026-08-20 12:33:35');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('88', '30', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver salman in Howlwadaag zone.', '2026-08-20 12:55:44');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('89', '31', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver salman in Howlwadaag zone.', '2026-08-20 12:57:08');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('90', '32', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver salman in Howlwadaag zone.', '2026-08-20 12:58:55');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('91', '33', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver salman in Howlwadaag zone.', '2026-08-20 13:00:33');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('92', '33', 'Status Update', 'Driver salman (BU-107) updated status to: Accepted for Request #33', '2026-08-20 13:20:13');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('93', '33', 'Status Update', 'Driver salman (BU-107) updated status to: In Progress for Request #33', '2026-08-20 13:20:24');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('94', '33', 'Status Update', 'Driver salman (BU-107) updated status to: Completed for Request #33', '2026-08-20 13:20:33');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('95', '32', 'Status Update', 'Driver salman (BU-107) updated status to: Accepted for Request #32', '2026-08-20 13:25:02');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('96', '32', 'Status Update', 'Driver salman (BU-107) updated status to: In Progress for Request #32', '2026-08-20 13:26:00');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('97', '32', 'Status Update', 'Driver salman (BU-107) updated status to: Completed for Request #32', '2026-08-20 13:26:38');
INSERT INTO `request_logs` (`log_id`, `request_id`, `action`, `message`, `created_at`) VALUES ('98', '34', 'Created', 'Pickup request scheduled and paid ($5.00 via Mobile Money). Assigned directly to driver amin in Hodan zone.', '2026-08-20 13:39:04');

SET FOREIGN_KEY_CHECKS = 1;
