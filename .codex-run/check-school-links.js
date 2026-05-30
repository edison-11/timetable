const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const password = String(process.env.DB_PASSWORD || '').replace(/^"|"$/g, '');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password,
    database: process.env.DB_NAME || 'timetable_system',
    port: Number(process.env.DB_PORT || 3306)
  });

  const queries = [
    ['schools', 'SELECT school_id, school_name, school_code, school_email, registration_number, status FROM schools ORDER BY school_id'],
    ['users', 'SELECT id, username, email, role, school_id, status FROM users ORDER BY id'],
    ['teachers', 'SELECT teacher_id, name, email, department, status, school_id, module_name FROM teacher ORDER BY teacher_id'],
    ['assignments', 'SELECT assignment_id, teacher_id, module_id, class_id, school_id FROM assignment ORDER BY assignment_id'],
    ['classes', 'SELECT class_id, class_name, school_id FROM class ORDER BY class_id'],
    ['modules', 'SELECT module_id, module_name, school_id FROM module ORDER BY module_id']
  ];

  for (const [label, sql] of queries) {
    try {
      const [rows] = await db.execute(sql);
      console.log(`\n## ${label}`);
      console.table(rows);
    } catch (error) {
      console.log(`\n## ${label} ERROR ${error.message}`);
    }
  }

  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
