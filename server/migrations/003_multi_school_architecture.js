const pool = require('../config/database');

const tableExists = async (tableName) => {
  const [rows] = await pool.query('SHOW TABLES LIKE ?', [tableName]);
  return rows.length > 0;
};

const columnExists = async (tableName, columnName) => {
  if (!(await tableExists(tableName))) return false;
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  return rows.length > 0;
};

const indexExists = async (tableName, indexName) => {
  if (!(await tableExists(tableName))) return false;
  const [rows] = await pool.query(`SHOW INDEX FROM \`${tableName}\` WHERE Key_name = ?`, [indexName]);
  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (!(await tableExists(tableName))) return;
  if (await columnExists(tableName, columnName)) return;
  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
};

const addIndexIfMissing = async (tableName, indexName, definition) => {
  if (!(await tableExists(tableName))) return;
  if (await indexExists(tableName, indexName)) return;
  await pool.query(`ALTER TABLE \`${tableName}\` ADD ${definition}`);
};

const ensureStatusColumn = async (tableName, definition) => {
  if (!(await tableExists(tableName))) return;
  if (await columnExists(tableName, 'status')) return;
  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
};

const up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schools (
      school_id INT AUTO_INCREMENT PRIMARY KEY,
      school_name VARCHAR(255) NOT NULL,
      school_email VARCHAR(255) NOT NULL,
      registration_number VARCHAR(120) NOT NULL,
      school_address TEXT NULL,
      phone VARCHAR(100) NULL,
      status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'pending',
      profile_photo VARCHAR(255) NULL,
      approved_at TIMESTAMP NULL,
      rejected_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY uniq_schools_email (school_email),
      UNIQUE KEY uniq_schools_registration (registration_number),
      INDEX idx_schools_status (status)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS directors_of_studies (
      dos_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      school_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      national_id VARCHAR(120) NOT NULL,
      profile_photo VARCHAR(255) NULL,
      status ENUM('pending', 'active', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY uniq_dos_email (email),
      INDEX idx_dos_school (school_id),
      CONSTRAINT fk_dos_school FOREIGN KEY (school_id) REFERENCES schools(school_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS approvals (
      approval_id INT AUTO_INCREMENT PRIMARY KEY,
      entity_type VARCHAR(80) NOT NULL,
      entity_id INT NOT NULL,
      school_id INT NULL,
      requested_by INT NULL,
      reviewed_by INT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      review_note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      INDEX idx_approval_entity (entity_type, entity_id),
      INDEX idx_approval_school (school_id),
      INDEX idx_approval_status (status)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      activity_id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT NULL,
      user_id INT NULL,
      actor_role VARCHAR(80) NULL,
      action VARCHAR(120) NOT NULL,
      entity_type VARCHAR(80) NULL,
      entity_id INT NULL,
      message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_school (school_id),
      INDEX idx_activity_user (user_id)
    )
  `);

  const tenantTables = [
    'user',
    'teacher',
    'student',
    'class',
    'module',
    'section',
    'room',
    'assignment',
    'timetable',
    'student_attendance',
    'notification'
  ];

  for (const tableName of tenantTables) {
    await addColumnIfMissing(tableName, 'school_id', 'school_id INT NULL');
    await addIndexIfMissing(tableName, `idx_${tableName}_school`, `INDEX idx_${tableName}_school (school_id)`);
  }

  await ensureStatusColumn('user', "status ENUM('pending', 'active', 'rejected', 'suspended') NOT NULL DEFAULT 'active'");
  await ensureStatusColumn('teacher', "status ENUM('pending', 'active', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");

  await addColumnIfMissing('teacher', 'national_id', 'national_id VARCHAR(120) NULL');
  await addColumnIfMissing('teacher', 'staff_id', 'staff_id VARCHAR(120) NULL');
  await addColumnIfMissing('notification', 'recipient_role', 'recipient_role VARCHAR(80) NULL');
  await addColumnIfMissing('notification', 'read_at', 'read_at TIMESTAMP NULL');
  await addColumnIfMissing('schools', 'school_code', 'school_code VARCHAR(80) NULL');
  await addColumnIfMissing('schools', 'province', 'province VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'district', 'district VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'sector', 'sector VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'school_type', 'school_type VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'subscription_status', "subscription_status ENUM('trial', 'active', 'past_due', 'suspended') NOT NULL DEFAULT 'trial'");

  await addIndexIfMissing('teacher', 'idx_teacher_status_school', 'INDEX idx_teacher_status_school (school_id, status)');
  await addIndexIfMissing('timetable', 'idx_timetable_school_day', 'INDEX idx_timetable_school_day (school_id, day_of_week)');
  await addIndexIfMissing('assignment', 'idx_assignment_school_class', 'INDEX idx_assignment_school_class (school_id, class_id)');
  await addIndexIfMissing('student_attendance', 'idx_attendance_school_class_date', 'INDEX idx_attendance_school_class_date (school_id, class_id, attendance_date)');
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(async () => {
      console.log('Multi-school architecture migration complete');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('Multi-school architecture migration failed:', error);
      await pool.end();
      process.exit(1);
    });
}
