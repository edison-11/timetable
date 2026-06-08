-- Run this as a privileged MySQL user (root) to create an application user
-- Replace 'A_StrongPassword!' below with a secure password of your choice.

CREATE USER IF NOT EXISTS 'timetable_app'@'localhost' IDENTIFIED BY 'A_StrongPassword!';
GRANT ALL PRIVILEGES ON `timetable_system`.* TO 'timetable_app'@'localhost';
FLUSH PRIVILEGES;

-- If the database does not exist, create it first:
-- CREATE DATABASE IF NOT EXISTS `timetable_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
