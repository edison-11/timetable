-- Migration: Add Advanced Features for Conflict Detection, Substitution, and Availability

-- Add teacher availability matrix to teacher table
ALTER TABLE teacher ADD COLUMN availability JSON COMMENT 'Availability matrix for each day/time slot (e.g., {"Monday":{"08:00-12:00":true,"13:00-17:00":false}})';

-- Add required room type to module table
ALTER TABLE module ADD COLUMN required_room_type VARCHAR(50) COMMENT 'Required room type for this module (e.g., Computer Lab, Chemistry Lab)';

-- Add timetable status for draft/published workflow
ALTER TABLE timetable ADD COLUMN status ENUM('draft', 'published') DEFAULT 'draft' COMMENT 'Draft or published status';
ALTER TABLE timetable ADD COLUMN academic_year VARCHAR(20) COMMENT 'Academic year for this timetable entry';
ALTER TABLE timetable ADD COLUMN term VARCHAR(20) COMMENT 'Term for this timetable entry';

-- Create absence_log table for substitution management
CREATE TABLE IF NOT EXISTS absence_log (
  absence_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  substitute_teacher_id INT,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE,
  FOREIGN KEY (substitute_teacher_id) REFERENCES teacher(teacher_id) ON DELETE SET NULL
);

-- Create substitution_log table for tracking temporary schedule changes
CREATE TABLE IF NOT EXISTS substitution_log (
  substitution_id INT AUTO_INCREMENT PRIMARY KEY,
  absence_id INT NOT NULL,
  timetable_id INT NOT NULL,
  original_teacher_id INT NOT NULL,
  substitute_teacher_id INT NOT NULL,
  substitution_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (absence_id) REFERENCES absence_log(absence_id) ON DELETE CASCADE,
  FOREIGN KEY (timetable_id) REFERENCES timetable(timetable_id) ON DELETE CASCADE,
  FOREIGN KEY (original_teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE,
  FOREIGN KEY (substitute_teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE
);

-- Create student table for student-specific data
CREATE TABLE IF NOT EXISTS student (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  student_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  class_id INT,
  section_id INT,
  academic_year VARCHAR(20) NOT NULL,
  status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (class_id) REFERENCES class(class_id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES section(section_id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX idx_absence_teacher ON absence_log(teacher_id);
CREATE INDEX idx_absence_dates ON absence_log(start_date, end_date);
CREATE INDEX idx_absence_status ON absence_log(status);
CREATE INDEX idx_substitution_absence ON substitution_log(absence_id);
CREATE INDEX idx_substitution_date ON substitution_log(substitution_date);
CREATE INDEX idx_student_class ON student(class_id);
CREATE INDEX idx_student_section ON student(section_id);
CREATE INDEX idx_student_academic_year ON student(academic_year);
CREATE INDEX idx_timetable_status ON timetable(status);
CREATE INDEX idx_timetable_academic_year ON timetable(academic_year, term);
