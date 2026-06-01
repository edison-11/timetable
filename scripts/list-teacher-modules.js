const pool = require('../server/config/database');

const email = process.argv[2] || 'teacher1@school.com';

const run = async () => {
  const [rows] = await pool.execute(
    `SELECT DISTINCT
        m.module_name,
        m.hours_per_year,
        c.class_name
     FROM assignment a
     JOIN teacher t ON t.teacher_id = a.teacher_id
     JOIN module m ON m.module_id = a.module_id
     JOIN class c ON c.class_id = a.class_id
     WHERE LOWER(t.email) = LOWER(?)
     ORDER BY c.class_name, m.hours_per_year DESC, m.module_name`,
    [email]
  );

  console.log(`Modules assigned to ${email}: ${rows.length}`);
  rows.forEach((row) => {
    console.log(`${row.class_name} | ${row.module_name} | ${row.hours_per_year} hours/year`);
  });
};

run()
  .catch((error) => {
    console.error('Failed to list teacher modules:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
