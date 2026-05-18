const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const findOne = async (query, params) => {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
};

const ensureUser = async () => {
  const password = await bcrypt.hash('Admin@123456', 10);
  await pool.execute(
    `INSERT INTO users (username, email, password, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password), role = VALUES(role)`,
    ['admin', 'admin@school.com', password, 'admin']
  );
};

const ensureTeacher = async () => {
  const existing = await findOne('SELECT teacher_id FROM teacher WHERE email = ?', ['prince@gmail.com']);
  if (existing) return existing.teacher_id;

  const password = await bcrypt.hash('teacher123', 10);
  const [result] = await pool.execute(
    `INSERT INTO teacher (name, email, password, department, status, date_joined)
     VALUES (?, ?, ?, ?, ?, CURDATE())`,
    ['Mugisha Prince', 'prince@gmail.com', password, 'SSOD', 'active']
  );
  return result.insertId;
};

const ensureRow = async ({ table, keyColumn, keyValue, insertColumns, insertValues }) => {
  const existing = await findOne(`SELECT * FROM \`${table}\` WHERE \`${keyColumn}\` = ?`, [keyValue]);
  if (existing) return existing;

  const placeholders = insertColumns.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `INSERT INTO \`${table}\` (${insertColumns.map(column => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
    insertValues
  );

  const idColumn = `${table}_id`;
  return { [idColumn]: result.insertId, [keyColumn]: keyValue };
};

const run = async () => {
  await ensureUser();
  const teacherId = await ensureTeacher();

  const shift = await ensureRow({
    table: 'shift',
    keyColumn: 'shift_name',
    keyValue: 'Morning',
    insertColumns: ['shift_name', 'start_time', 'end_time', 'teacher_changeover_minutes'],
    insertValues: ['Morning', '08:00:00', '14:30:00', 5]
  });

  const section = await ensureRow({
    table: 'section',
    keyColumn: 'section_name',
    keyValue: 'Software Development',
    insertColumns: ['section_name', 'level', 'description'],
    insertValues: ['Software Development', 'S1', 'Software development section']
  });

  const module = await ensureRow({
    table: 'module',
    keyColumn: 'module_name',
    keyValue: 'Database Systems',
    insertColumns: ['module_name', 'department', 'hours_per_year', 'description'],
    insertValues: ['Database Systems', 'SSOD', 120, 'Relational database design and SQL']
  });

  const room = await ensureRow({
    table: 'room',
    keyColumn: 'room_name',
    keyValue: 'Lab 1',
    insertColumns: ['room_name', 'room_type', 'capacity'],
    insertValues: ['Lab 1', 'Computer Lab', 35]
  });

  const existingClass = await findOne('SELECT class_id FROM class WHERE class_name = ?', ['S1 SOD A']);
  let classId = existingClass?.class_id;
  if (!classId) {
    const [result] = await pool.execute(
      `INSERT INTO class (class_name, level, academic_year, class_teacher_id, shift_id, section_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['S1 SOD A', 'S1', '2024-2025', teacherId, shift.shift_id, section.section_id]
    );
    classId = result.insertId;
  }

  const existingAssignment = await findOne(
    'SELECT assignment_id FROM assignment WHERE teacher_id = ? AND module_id = ? AND class_id = ? AND academic_year = ? AND term = ?',
    [teacherId, module.module_id, classId, '2024-2025', 'Term 1']
  );

  if (!existingAssignment) {
    await pool.execute(
      `INSERT INTO assignment (teacher_id, module_id, class_id, shift_id, academic_year, term)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [teacherId, module.module_id, classId, shift.shift_id, '2024-2025', 'Term 1']
    );
  }

  await pool.execute(
    `INSERT INTO notification (type, title, message, path, tone)
     VALUES (?, ?, ?, ?, ?)`,
    ['system_ready', 'System data ready', 'Demo academic data has been prepared.', '/dashboard', 'blue']
  );

  console.log('Demo data ready');
  console.log('Admin: admin@school.com / Admin@123456');
  console.log('Teacher: prince@gmail.com / teacher123');
  await pool.end();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
