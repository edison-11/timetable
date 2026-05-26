const pool = require('../config/database');

const columnExists = async (tableName, columnName) => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (await columnExists(tableName, columnName)) return;
  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  console.log(`Added ${tableName}.${columnName}`);
};

const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student (
      student_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      student_number VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      sex VARCHAR(20) NULL,
      email VARCHAR(100) NULL UNIQUE,
      parent_name VARCHAR(100) NULL,
      parent_email VARCHAR(100) NULL,
      parent_phone VARCHAR(50) NULL,
      class_id INT NULL,
      section_id INT NULL,
      academic_year VARCHAR(20) NOT NULL,
      status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('student', 'sex', 'sex VARCHAR(20) NULL AFTER name');
  await addColumnIfMissing('student', 'parent_name', 'parent_name VARCHAR(100) NULL AFTER email');
  await addColumnIfMissing('student', 'parent_email', 'parent_email VARCHAR(100) NULL AFTER parent_name');
  await addColumnIfMissing('student', 'parent_phone', 'parent_phone VARCHAR(50) NULL AFTER parent_email');

  if (await columnExists('student', 'email')) {
    await pool.query('ALTER TABLE student MODIFY email VARCHAR(100) NULL');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_attendance (
      attendance_id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      class_id INT NOT NULL,
      timetable_id INT NULL,
      teacher_id INT NULL,
      attendance_date DATE NOT NULL,
      period_label VARCHAR(100) NULL,
      status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_student_attendance_period (student_id, attendance_date, timetable_id, period_label),
      INDEX idx_student_attendance_class_date (class_id, attendance_date),
      INDEX idx_student_attendance_teacher (teacher_id)
    )
  `);

  console.log('Student attendance schema ready');
  await pool.end();
};

run().catch((error) => {
  console.error('Error preparing student attendance schema:', error);
  process.exit(1);
});
