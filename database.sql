-- Academic Bridge / Timetable Management System database
-- Complete MySQL schema rebuilt from the current server models and migrations.
-- Generated for DB_NAME=timetable_system.

CREATE DATABASE IF NOT EXISTS `timetable_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `timetable_system`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `schema_migrations`;
DROP TABLE IF EXISTS `substitution_log`;
DROP TABLE IF EXISTS `absence_log`;
DROP TABLE IF EXISTS `student_attendance`;
DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `timetable_comment`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `timetable`;
DROP TABLE IF EXISTS `break_time`;
DROP TABLE IF EXISTS `assignment`;
DROP TABLE IF EXISTS `class`;
DROP TABLE IF EXISTS `room`;
DROP TABLE IF EXISTS `section`;
DROP TABLE IF EXISTS `module`;
DROP TABLE IF EXISTS `shift`;
DROP TABLE IF EXISTS `notification`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `approvals`;
DROP TABLE IF EXISTS `directors_of_studies`;
DROP TABLE IF EXISTS `dos`;
DROP TABLE IF EXISTS `teacher`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `schools`;
DROP TABLE IF EXISTS `system_setting`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `schools` (
  `school_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_name` VARCHAR(255) NOT NULL,
  `school_email` VARCHAR(255) NOT NULL UNIQUE,
  `registration_number` VARCHAR(120) NOT NULL UNIQUE,
  `school_address` TEXT NULL,
  `phone` VARCHAR(100) NULL,
  `status` ENUM('pending_approval', 'active', 'rejected', 'suspended', 'deactivated') NOT NULL DEFAULT 'pending_approval',
  `profile_photo` VARCHAR(255) NULL,
  `school_code` VARCHAR(80) NULL,
  `province` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `sector` VARCHAR(120) NULL,
  `school_type` VARCHAR(120) NULL,
  `subscription_status` ENUM('trial', 'active', 'past_due', 'suspended') NOT NULL DEFAULT 'trial',
  `approved_at` TIMESTAMP NULL,
  `rejected_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  INDEX `idx_schools_status` (`status`),
  INDEX `idx_schools_code` (`school_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NULL,
  `username` VARCHAR(255) NULL,
  `full_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(100) NULL,
  `password` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('super_admin', 'dos', 'teacher', 'student', 'admin') NOT NULL DEFAULT 'teacher',
  `status` ENUM('pending', 'active', 'disabled', 'suspended', 'rejected') NOT NULL DEFAULT 'active',
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `profile_photo` VARCHAR(255) NULL,
  `school_id` INT NULL,
  `login_attempts` INT DEFAULT 0,
  `lock_until` TIMESTAMP NULL,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expiry` TIMESTAMP NULL,
  `reset_code_hash` VARCHAR(255) NULL,
  `reset_code_expires_at` TIMESTAMP NULL,
  `reset_code_used` BOOLEAN NOT NULL DEFAULT TRUE,
  `reset_resend_count` INT NOT NULL DEFAULT 0,
  `reset_verify_attempts` INT NOT NULL DEFAULT 0,
  `reset_last_sent_at` TIMESTAMP NULL,
  `mfa_secret` VARCHAR(255) NULL,
  `google_id` VARCHAR(255) NULL UNIQUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_school` (`school_id`),
  CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `teacher` (
  `teacher_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `school_code` VARCHAR(100) NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `department` VARCHAR(80) NOT NULL DEFAULT 'SSOD',
  `status` ENUM('pending', 'active', 'disabled', 'suspended', 'rejected') NOT NULL DEFAULT 'pending',
  `date_joined` DATE NULL,
  `profile_photo` VARCHAR(255) NULL,
  `employee_id` VARCHAR(100) NULL,
  `national_id` VARCHAR(120) NULL,
  `phone` VARCHAR(100) NULL,
  `gender` VARCHAR(40) NULL,
  `module_name` VARCHAR(255) NULL,
  `qualification` VARCHAR(255) NULL,
  `years_experience` INT NULL,
  `available_days` VARCHAR(255) NULL,
  `available_from` TIME NULL,
  `available_to` TIME NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_teacher_school` (`school_id`),
  INDEX `idx_teacher_status` (`status`),
  INDEX `idx_teacher_department` (`department`),
  CONSTRAINT `fk_teacher_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dos` (
  `dos_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `directors_of_studies` (
  `dos_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `school_id` INT NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(100) NOT NULL,
  `national_id` VARCHAR(120) NOT NULL,
  `profile_photo` VARCHAR(255) NULL,
  `status` ENUM('pending', 'active', 'rejected', 'suspended', 'disabled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  INDEX `idx_dos_school` (`school_id`),
  CONSTRAINT `fk_directors_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_directors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `approvals` (
  `approval_id` INT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` INT NOT NULL,
  `school_id` INT NULL,
  `requested_by` INT NULL,
  `reviewed_by` INT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `review_note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP NULL,
  INDEX `idx_approval_entity` (`entity_type`, `entity_id`),
  INDEX `idx_approval_school` (`school_id`),
  INDEX `idx_approval_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
  `activity_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `user_id` INT NULL,
  `actor_role` VARCHAR(80) NULL,
  `action` VARCHAR(120) NOT NULL,
  `entity_type` VARCHAR(80) NULL,
  `entity_id` INT NULL,
  `message` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_school` (`school_id`),
  INDEX `idx_activity_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `module` (
  `module_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `module_name` VARCHAR(255) NOT NULL,
  `department` VARCHAR(80) NOT NULL DEFAULT 'SSOD',
  `hours_per_year` INT NOT NULL DEFAULT 120,
  `description` TEXT NULL,
  `required_room_type` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_module_school` (`school_id`),
  INDEX `idx_module_department` (`department`),
  CONSTRAINT `fk_module_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shift` (
  `shift_id` INT AUTO_INCREMENT PRIMARY KEY,
  `shift_name` VARCHAR(50) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `teacher_changeover_minutes` INT NOT NULL DEFAULT 5,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_shift_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `section` (
  `section_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `section_name` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `room_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_section_school` (`school_id`),
  INDEX `idx_section_level` (`level`),
  CONSTRAINT `fk_section_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room` (
  `room_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `room_type` VARCHAR(80) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 30,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_room_school` (`school_id`),
  INDEX `idx_room_type` (`room_type`),
  CONSTRAINT `fk_room_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `class` (
  `class_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `class_name` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NOT NULL,
  `academic_year` VARCHAR(20) NOT NULL,
  `class_teacher_id` INT NULL,
  `shift_id` INT NULL,
  `dos_id` INT NULL,
  `section_id` INT NULL,
  `room_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_class_school` (`school_id`),
  INDEX `idx_class_level` (`level`),
  INDEX `idx_class_academic_year` (`academic_year`),
  INDEX `idx_class_section` (`section_id`),
  INDEX `idx_class_room` (`room_id`),
  CONSTRAINT `fk_class_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_class_teacher` FOREIGN KEY (`class_teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_class_shift` FOREIGN KEY (`shift_id`) REFERENCES `shift` (`shift_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_class_dos` FOREIGN KEY (`dos_id`) REFERENCES `directors_of_studies` (`dos_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_class_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_class_room` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `assignment` (
  `assignment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `teacher_id` INT NOT NULL,
  `module_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  `shift_id` INT NULL,
  `academic_year` VARCHAR(20) NOT NULL,
  `term` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_assignment_school` (`school_id`),
  INDEX `idx_assignment_teacher` (`teacher_id`),
  INDEX `idx_assignment_module` (`module_id`),
  INDEX `idx_assignment_class` (`class_id`),
  CONSTRAINT `fk_assignment_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assignment_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_module` FOREIGN KEY (`module_id`) REFERENCES `module` (`module_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_shift` FOREIGN KEY (`shift_id`) REFERENCES `shift` (`shift_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `timetable` (
  `timetable_id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT NULL,
  `class_id` INT NOT NULL,
  `assignment_id` INT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `room_id` INT NULL,
  `module_name` VARCHAR(255) NULL,
  `entry_type` VARCHAR(20) NOT NULL DEFAULT 'lesson',
  `slot_number` INT NULL,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  `academic_year` VARCHAR(20) NULL,
  `term` VARCHAR(20) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_timetable_school` (`school_id`),
  INDEX `idx_timetable_class` (`class_id`),
  INDEX `idx_timetable_assignment` (`assignment_id`),
  INDEX `idx_timetable_day_time` (`day_of_week`, `start_time`, `end_time`),
  INDEX `idx_timetable_room` (`room_id`),
  CONSTRAINT `fk_timetable_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_timetable_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_timetable_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignment` (`assignment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_timetable_room` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `timetable_id` INT NULL,
  `day_of_week` VARCHAR(20) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `subject` VARCHAR(255) NULL,
  `room` VARCHAR(255) NULL,
  `teacher` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `break_time` (
  `break_id` INT AUTO_INCREMENT PRIMARY KEY,
  `shift_id` INT NOT NULL,
  `break_name` VARCHAR(80) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_break_shift` (`shift_id`),
  CONSTRAINT `fk_break_shift` FOREIGN KEY (`shift_id`) REFERENCES `shift` (`shift_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_setting` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `timetable_comment` (
  `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `timetable_id` INT NOT NULL,
  `teacher_id` INT NOT NULL,
  `comment_text` TEXT NOT NULL,
  `comment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_comment_timetable` (`timetable_id`),
  INDEX `idx_comment_teacher` (`teacher_id`),
  CONSTRAINT `fk_comment_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`timetable_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notification` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NULL,
  `path` VARCHAR(255) DEFAULT '/dashboard',
  `tone` VARCHAR(20) DEFAULT 'blue',
  `school_id` INT NULL,
  `recipient_role` VARCHAR(80) NULL,
  `read_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notification_school` (`school_id`),
  INDEX `idx_notification_role` (`recipient_role`),
  CONSTRAINT `fk_notification_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `student` (
  `student_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `school_id` INT NULL,
  `student_number` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `sex` VARCHAR(20) NULL,
  `email` VARCHAR(100) NULL UNIQUE,
  `parent_name` VARCHAR(100) NULL,
  `parent_email` VARCHAR(100) NULL,
  `parent_phone` VARCHAR(50) NULL,
  `class_id` INT NULL,
  `section_id` INT NULL,
  `academic_year` VARCHAR(20) NOT NULL,
  `status` ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_student_school` (`school_id`),
  INDEX `idx_student_class` (`class_id`),
  INDEX `idx_student_section` (`section_id`),
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `student_attendance` (
  `attendance_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  `timetable_id` INT NULL,
  `teacher_id` INT NULL,
  `school_id` INT NULL,
  `attendance_date` DATE NOT NULL,
  `period_label` VARCHAR(100) NULL,
  `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_student_attendance_period` (`student_id`, `attendance_date`, `timetable_id`, `period_label`),
  INDEX `idx_student_attendance_class_date` (`class_id`, `attendance_date`),
  INDEX `idx_student_attendance_teacher` (`teacher_id`),
  INDEX `idx_student_attendance_school` (`school_id`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`timetable_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `absence_log` (
  `absence_id` INT AUTO_INCREMENT PRIMARY KEY,
  `teacher_id` INT NOT NULL,
  `substitute_teacher_id` INT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` TEXT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_absence_teacher` (`teacher_id`),
  INDEX `idx_absence_status` (`status`),
  CONSTRAINT `fk_absence_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_absence_substitute` FOREIGN KEY (`substitute_teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `substitution_log` (
  `substitution_id` INT AUTO_INCREMENT PRIMARY KEY,
  `absence_id` INT NULL,
  `timetable_id` INT NOT NULL,
  `original_teacher_id` INT NOT NULL,
  `substitute_teacher_id` INT NOT NULL,
  `substitution_date` DATE NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_substitution_absence` (`absence_id`),
  INDEX `idx_substitution_date` (`substitution_date`),
  CONSTRAINT `fk_substitution_absence` FOREIGN KEY (`absence_id`) REFERENCES `absence_log` (`absence_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_substitution_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`timetable_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_substitution_original_teacher` FOREIGN KEY (`original_teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_substitution_substitute_teacher` FOREIGN KEY (`substitute_teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `schema_migrations` (
  `migration_name` VARCHAR(255) PRIMARY KEY,
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings and demo rows
INSERT INTO `system_setting` (`setting_key`, `setting_value`) VALUES
('teacher_changeover_minutes', '5'),
('break_start_time', '11:00'),
('break_end_time', '11:30'),
('working_days', '["Monday","Tuesday","Wednesday","Thursday"]'),
('weekend_window', '{"starts":"Friday 06:00","ends":"Sunday 06:00"}'),
('timetable_breaks', '[{"break_name":"Morning Break","start_time":"10:00","end_time":"10:15"},{"break_name":"Lunch Break","start_time":"12:30","end_time":"13:30"}]')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

INSERT INTO `schools`
  (`school_id`, `school_name`, `school_email`, `registration_number`, `school_address`, `phone`, `status`, `school_code`, `subscription_status`, `approved_at`)
VALUES
  (1, 'Academic Bridge Demo School', 'demo-school@academicbridge.local', 'AB-DEMO-001', 'Kigali', '+250788000000', 'active', 'AB-DEMO', 'active', CURRENT_TIMESTAMP);

-- Default bcrypt hashes are provided. The plaintext 'password' column is for reference/dev demo.
INSERT INTO `users`
  (`id`, `username`, `full_name`, `email`, `phone`, `password`, `password_hash`, `role`, `status`, `is_verified`, `school_id`)
VALUES
  (1, 'superadmin', 'Super Admin', 'superadmin@school.com', '+250788000000', 'SuperAdmin!2026', '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa', 'super_admin', 'active', TRUE, NULL),
  (2, 'dosadmin', 'System Admin', 'dos@school.com', '+250788000001', 'DosAdmin!2026', '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa', 'dos', 'active', TRUE, 1),
  (3, 'teacher1', 'Teacher One', 'teacher1@school.com', '+250788000002', 'TeacherOne!2026', '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa', 'teacher', 'active', TRUE, 1),
  (4, 'claude', 'Claude', 'claude@school.com', '+250788100001', 'TeacherOne!2026', '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa', 'teacher', 'active', TRUE, 1);

INSERT INTO `directors_of_studies`
  (`dos_id`, `user_id`, `school_id`, `full_name`, `email`, `phone`, `national_id`, `status`)
VALUES
  (1, 2, 1, 'Demo DOS', 'dos@school.com', '+250788000011', '1199000000000000', 'active');

INSERT INTO `teacher`
  (`teacher_id`, `school_id`, `name`, `email`, `password`, `department`, `status`, `date_joined`, `phone`, `module_name`)
VALUES
  (1, 1, 'Teacher One', 'teacher1@school.com', '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa', 'Software Development', 'active', CURRENT_DATE, '+250788100000', 'Software Development Modules'),
  (2, 1, 'Claude', 'claude@school.com', '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa', 'Software Development', 'active', CURRENT_DATE, '+250788100001', 'Software Development Modules');

INSERT INTO `shift` (`shift_id`, `shift_name`, `start_time`, `end_time`, `teacher_changeover_minutes`) VALUES
  (1, 'Morning', '08:00:00', '12:30:00', 5),
  (2, 'Afternoon', '13:30:00', '17:00:00', 5);

INSERT INTO `room` (`room_id`, `school_id`, `room_name`, `room_type`, `capacity`) VALUES
  (1, 1, 'Computer Lab 1', 'Computer Lab', 40),
  (2, 1, 'Computer Lab 2', 'Computer Lab', 40),
  (3, 1, 'Networking Lab 1', 'Networking Lab', 35);

INSERT INTO `section` (`section_id`, `school_id`, `section_name`, `level`, `description`, `room_id`) VALUES
  (1, 1, 'Software Development', 'All Levels', 'Software development trade', 1),
  (2, 1, 'Networking', 'All Levels', 'Networking trade', 3);

INSERT INTO `class`
  (`class_id`, `school_id`, `class_name`, `level`, `academic_year`, `class_teacher_id`, `shift_id`, `dos_id`, `section_id`, `room_id`)
VALUES
  (1, 1, 'Software Development Level 3 A', 'Level 3', '2025-2026', 1, 1, 1, 1, 1),
  (2, 1, 'Software Development Level 4 A', 'Level 4', '2025-2026', 1, 1, 1, 1, 1),
  (3, 1, 'Software Development Level 5 A', 'Level 5', '2025-2026', 2, 1, 1, 1, 1);

INSERT INTO `module` (`module_id`, `school_id`, `module_name`, `department`, `hours_per_year`, `description`, `required_room_type`) VALUES
  (1, 1, 'Computer Essentials', 'Software Development', 120, 'Level 3 computer essentials', 'Computer Lab'),
  (2, 1, 'Introduction to Programming', 'Software Development', 120, 'Level 3 programming basics', 'Computer Lab'),
  (3, 1, 'Programming Fundamentals', 'Software Development', 180, 'Level 4 programming fundamentals', 'Computer Lab'),
  (4, 1, 'Database Systems', 'Software Development', 120, 'Level 4 database systems', 'Computer Lab'),
  (5, 1, 'Backend Application Development', 'Software Development', 120, 'Level 4 backend development', 'Computer Lab'),
  (6, 1, 'Data Structure and Algorithm Fundamentals', 'Software Development', 120, 'Level 4 algorithms', 'Computer Lab'),
  (7, 1, 'Front-End App Development', 'Software Development', 120, 'Level 5 frontend development', 'Computer Lab'),
  (8, 1, 'Mobile App Development', 'Software Development', 120, 'Level 5 mobile development', 'Computer Lab'),
  (9, 1, 'UI/UX Design', 'Software Development', 90, 'Level 3 and 5 interface design', 'Computer Lab'),
  (10, 1, 'Software Testing', 'Software Development', 90, 'Testing and quality assurance', 'Computer Lab');

INSERT INTO `assignment` (`assignment_id`, `school_id`, `teacher_id`, `module_id`, `class_id`, `shift_id`, `academic_year`, `term`) VALUES
  (1, 1, 1, 1, 1, 1, '2025-2026', 'Term 1'),
  (2, 1, 1, 2, 1, 1, '2025-2026', 'Term 1'),
  (3, 1, 1, 3, 2, 1, '2025-2026', 'Term 1'),
  (4, 1, 1, 4, 2, 1, '2025-2026', 'Term 1'),
  (5, 1, 1, 5, 2, 1, '2025-2026', 'Term 1'),
  (6, 1, 2, 6, 2, 1, '2025-2026', 'Term 1'),
  (7, 1, 2, 7, 3, 1, '2025-2026', 'Term 1'),
  (8, 1, 2, 8, 3, 1, '2025-2026', 'Term 1'),
  (9, 1, 2, 9, 3, 1, '2025-2026', 'Term 1'),
  (10, 1, 1, 10, 3, 1, '2025-2026', 'Term 1');

INSERT INTO `break_time` (`shift_id`, `break_name`, `start_time`, `end_time`) VALUES
  (1, 'Morning Break', '10:00:00', '10:15:00'),
  (1, 'Lunch Break', '12:30:00', '13:30:00');

INSERT INTO `student`
  (`school_id`, `student_number`, `name`, `sex`, `class_id`, `section_id`, `academic_year`, `status`)
VALUES
  (1, 'SWD3A-001', 'Aline Uwase', 'Female', 1, 1, '2025-2026', 'active'),
  (1, 'SWD3A-002', 'Eric Ndayisaba', 'Male', 1, 1, '2025-2026', 'active'),
  (1, 'SWD3A-003', 'Divine Ishimwe', 'Female', 1, 1, '2025-2026', 'active'),
  (1, 'SWD3A-004', 'Patrick Mugisha', 'Male', 1, 1, '2025-2026', 'active'),
  (1, 'SWD3A-005', 'Grace Uwera', 'Female', 1, 1, '2025-2026', 'active'),
  (1, 'SWD4A-001', 'Jean Bizimana', 'Male', 2, 1, '2025-2026', 'active'),
  (1, 'SWD4A-002', 'Claudine Mukamana', 'Female', 2, 1, '2025-2026', 'active'),
  (1, 'SWD4A-003', 'Kevin Manzi', 'Male', 2, 1, '2025-2026', 'active'),
  (1, 'SWD4A-004', 'Diane Umutesi', 'Female', 2, 1, '2025-2026', 'active'),
  (1, 'SWD4A-005', 'Olivier Niyonsenga', 'Male', 2, 1, '2025-2026', 'active'),
  (1, 'SWD5A-001', 'Sandrine Umuhoza', 'Female', 3, 1, '2025-2026', 'active'),
  (1, 'SWD5A-002', 'Emmanuel Hakizimana', 'Male', 3, 1, '2025-2026', 'active'),
  (1, 'SWD5A-003', 'Clarisse Mukeshimana', 'Female', 3, 1, '2025-2026', 'active'),
  (1, 'SWD5A-004', 'Aimable Nshimiyimana', 'Male', 3, 1, '2025-2026', 'active'),
  (1, 'SWD5A-005', 'Yvette Iradukunda', 'Female', 3, 1, '2025-2026', 'active');

SET FOREIGN_KEY_CHECKS = 1;
