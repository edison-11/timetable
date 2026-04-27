-- Timetable Management System Database Schema (Based on ER Diagram)

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Director of Studies table
CREATE TABLE IF NOT EXISTS dos (
  dos_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Teacher table
CREATE TABLE IF NOT EXISTS teacher (
  teacher_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  date_joined DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Module table
CREATE TABLE IF NOT EXISTS module (
  module_id INT AUTO_INCREMENT PRIMARY KEY,
  module_name VARCHAR(255) NOT NULL,
  hours_per_year INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shift table
CREATE TABLE IF NOT EXISTS shift (
  shift_id INT AUTO_INCREMENT PRIMARY KEY,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Section table (for dividing classes by level)
CREATE TABLE IF NOT EXISTS section (
  section_id INT AUTO_INCREMENT PRIMARY KEY,
  section_name VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Class table
CREATE TABLE IF NOT EXISTS class (
  class_id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  shift_id INT,
  dos_id INT,
  section_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shift(shift_id) ON DELETE SET NULL,
  FOREIGN KEY (dos_id) REFERENCES dos(dos_id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES section(section_id) ON DELETE SET NULL
);

-- Room table
CREATE TABLE IF NOT EXISTS room (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  room_name VARCHAR(50) NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Assignment table
CREATE TABLE IF NOT EXISTS assignment (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  module_id INT NOT NULL,
  class_id INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  term VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES module(module_id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES class(class_id) ON DELETE CASCADE
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
  timetable_id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  assignment_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES class(class_id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignment(assignment_id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE SET NULL
);

-- Break_Time table
CREATE TABLE IF NOT EXISTS break_time (
  break_id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL,
  break_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shift(shift_id) ON DELETE CASCADE
);

-- Timetable_Comment table
CREATE TABLE IF NOT EXISTS timetable_comment (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  timetable_id INT NOT NULL,
  teacher_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timetable_id) REFERENCES timetable(timetable_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_dos_email ON dos(email);
CREATE INDEX idx_teacher_email ON teacher(email);
CREATE INDEX idx_teacher_status ON teacher(status);
CREATE INDEX idx_class_level ON class(level);
CREATE INDEX idx_class_academic_year ON class(academic_year);
CREATE INDEX idx_class_section ON class(section_id);
CREATE INDEX idx_assignment_teacher ON assignment(teacher_id);
CREATE INDEX idx_assignment_module ON assignment(module_id);
CREATE INDEX idx_assignment_class ON assignment(class_id);
CREATE INDEX idx_timetable_class ON timetable(class_id);
CREATE INDEX idx_timetable_assignment ON timetable(assignment_id);
CREATE INDEX idx_timetable_day_time ON timetable(day_of_week, start_time, end_time);
CREATE INDEX idx_timetable_room ON timetable(room_id);
CREATE INDEX idx_break_shift ON break_time(shift_id);
CREATE INDEX idx_comment_timetable ON timetable_comment(timetable_id);
CREATE INDEX idx_comment_teacher ON timetable_comment(teacher_id);

-- Sample data
INSERT INTO dos (name, email, password) VALUES 
('Dr. Smith', 'dos@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO teacher (name, email, password, status, date_joined) VALUES 
('John Doe', 'john@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', '2023-01-15'),
('Jane Smith', 'jane@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', '2023-02-20');

INSERT INTO module (module_name, hours_per_year, description) VALUES 
('Mathematics', 120, 'Basic mathematics course'),
('Physics', 100, 'Introduction to physics'),
('Chemistry', 80, 'Chemistry fundamentals');

INSERT INTO shift (shift_name, start_time, end_time) VALUES 
('Morning', '08:00:00', '12:00:00'),
('Afternoon', '13:00:00', '17:00:00'),
('Evening', '17:30:00', '21:30:00');

INSERT INTO section (section_name, level, description) VALUES 
('Science A', 'Grade 10', 'Advanced science section'),
('Science B', 'Grade 10', 'Regular science section'),
('Commerce A', 'Grade 11', 'Commerce stream section'),
('Commerce B', 'Grade 11', 'Commerce stream section');

INSERT INTO room (room_name, room_type, capacity) VALUES 
('Room 101', 'Classroom', 30),
('Room 102', 'Laboratory', 25),
('Room 201', 'Classroom', 35),
('Lab 301', 'Computer Lab', 40);

INSERT INTO class (class_name, level, academic_year, shift_id, dos_id, section_id) VALUES 
('10A', 'Grade 10', '2024-2025', 1, 1, 1),
('10B', 'Grade 10', '2024-2025', 1, 1, 2),
('11A', 'Grade 11', '2024-2025', 2, 1, 3),
('11B', 'Grade 11', '2024-2025', 2, 1, 4);

INSERT INTO break_time (shift_id, break_name, start_time, end_time) VALUES 
(1, 'Morning Break', '10:00:00', '10:15:00'),
(2, 'Afternoon Break', '15:00:00', '15:15:00'),
(1, 'Lunch Break', '12:00:00', '13:00:00'),
(2, 'Lunch Break', '17:00:00', '17:30:00');
