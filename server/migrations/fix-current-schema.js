const pool = require('../config/database');

const columnExists = async (tableName, columnName) => {
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  console.log(`Added ${tableName}.${columnName}`);
};

const modifyColumn = async (tableName, definition) => {
  await pool.execute(`ALTER TABLE \`${tableName}\` MODIFY ${definition}`);
};

const run = async () => {
  await addColumnIfMissing('class', 'level', "level VARCHAR(20) NOT NULL DEFAULT 'S1' AFTER class_name");
  await addColumnIfMissing('class', 'academic_year', "academic_year VARCHAR(20) NOT NULL DEFAULT '2024-2025' AFTER level");
  await addColumnIfMissing('class', 'class_teacher_id', 'class_teacher_id INT NULL AFTER academic_year');
  await addColumnIfMissing('class', 'shift_id', 'shift_id INT NULL AFTER class_teacher_id');
  await addColumnIfMissing('class', 'dos_id', 'dos_id INT NULL AFTER shift_id');
  await addColumnIfMissing('section', 'level', "level VARCHAR(20) NOT NULL DEFAULT 'S1' AFTER section_name");
  await addColumnIfMissing('section', 'description', 'description TEXT NULL AFTER level');

  if (await columnExists('class', 'teacher_id')) {
    await pool.execute('UPDATE class SET class_teacher_id = COALESCE(class_teacher_id, teacher_id)');
  }

  await addColumnIfMissing('assignment', 'academic_year', "academic_year VARCHAR(20) NOT NULL DEFAULT '2024-2025' AFTER class_id");
  await addColumnIfMissing('assignment', 'term', "term VARCHAR(20) NOT NULL DEFAULT 'Term 1' AFTER academic_year");
  await addColumnIfMissing('shift', 'teacher_changeover_minutes', 'teacher_changeover_minutes INT NOT NULL DEFAULT 5 AFTER end_time');

  await addColumnIfMissing('timetable', 'class_id', 'class_id INT NULL AFTER timetable_id');
  await addColumnIfMissing('timetable', 'assignment_id', 'assignment_id INT NULL AFTER class_id');
  await addColumnIfMissing('timetable', 'day_of_week', "day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NULL AFTER assignment_id");
  await addColumnIfMissing('timetable', 'start_time', 'start_time TIME NULL AFTER day_of_week');
  await addColumnIfMissing('timetable', 'end_time', 'end_time TIME NULL AFTER start_time');
  await addColumnIfMissing('timetable', 'room_id', 'room_id INT NULL AFTER end_time');
  await addColumnIfMissing('timetable', 'module_name', 'module_name VARCHAR(255) NULL AFTER room_id');
  await addColumnIfMissing('timetable', 'entry_type', "entry_type VARCHAR(20) NOT NULL DEFAULT 'lesson' AFTER module_name");

  if (await columnExists('timetable', 'section_id')) {
    await modifyColumn('timetable', 'section_id INT NULL');
  }

  if (await columnExists('timetable', 'shift_id')) {
    await modifyColumn('timetable', 'shift_id INT NULL');
  }

  if (await columnExists('assignment', 'shift_id')) {
    await modifyColumn('assignment', 'shift_id INT NULL');
  }

  await modifyColumn('teacher', "status ENUM('pending','active','inactive','on_leave') DEFAULT 'active'");
  await pool.execute("UPDATE teacher SET status = 'active' WHERE status IS NULL OR status = ''");

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notification (
      notification_id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      path VARCHAR(255) DEFAULT '/dashboard',
      tone VARCHAR(20) DEFAULT 'blue',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Schema repair completed');
  await pool.end();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
