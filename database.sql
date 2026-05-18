CREATE DATABASE IF NOT EXISTS timetable_system;
USE timetable_system;

-- Users table (Admins and Teachers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'dos') DEFAULT 'teacher',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    login_attempts INT DEFAULT 0,
    lock_until TIMESTAMP NULL DEFAULT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    mfa_secret VARCHAR(255) NULL,
    google_id VARCHAR(255) UNIQUE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL
);

-- Modules table (referenced as subjects in some parts, standardized to modules for CRUD tests)
CREATE TABLE IF NOT EXISTS modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    hours_per_year INT,
    description TEXT,
    subject_code VARCHAR(20) UNIQUE
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    description TEXT
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    shift_name VARCHAR(50) NOT NULL
);

-- DOS (Director of Studies) table
CREATE TABLE IF NOT EXISTS dos (
    dos_id INT AUTO_INCREMENT PRIMARY KEY,
    dos_name VARCHAR(100) NOT NULL,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    academic_year VARCHAR(20),
    class_teacher_id INT,
    shift_id INT,
    section_id INT,
    dos_id INT,
    FOREIGN KEY (class_teacher_id) REFERENCES users(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (dos_id) REFERENCES dos(dos_id)
);

-- Timetable table (The Core)
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    teacher_id INT,
    room_id INT,
    class_id INT,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (module_id) REFERENCES modules(module_id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    -- Preventing exact duplicate entries
    UNIQUE KEY unique_schedule (teacher_id, day_of_week, start_time)
);

-- Initial Seed (Optional: Admin user - password: password123)
INSERT INTO users (name, email, password, role, status) VALUES 
('Admin User', 'admin@school.com', '$2b$10$EixBW5zGKnP6Ef.y01i86.e9o7m8I5.m8m8m8m8m8m8m8m8m8m8m', 'admin', 'active');

-- Initial shifts
INSERT INTO shifts (shift_name) VALUES ('Morning'), ('Afternoon');