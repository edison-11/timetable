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

  const [schools] = await db.execute(
    `SELECT school_id, school_name
     FROM schools
     WHERE UPPER(school_name) LIKE '%MUBUGATSS%'
     ORDER BY school_id
     LIMIT 1`
  );

  if (!schools.length) {
    throw new Error('MUBUGATSS school record was not found.');
  }

  const schoolId = schools[0].school_id;

  const [teacherUsers] = await db.execute(
    `UPDATE users u
     JOIN teacher t ON LOWER(t.email) = LOWER(u.email)
     SET u.school_id = t.school_id
     WHERE u.role = 'teacher'
       AND t.school_id IS NOT NULL
       AND (u.school_id IS NULL OR u.school_id <> t.school_id)`
  );

  const [defaultAdmin] = await db.execute(
    `UPDATE users
     SET school_id = ?
     WHERE email = 'admin@school.com'
       AND role IN ('dos', 'admin')
       AND (school_id IS NULL OR school_id <> ?)`,
    [schoolId, schoolId]
  );

  const [schoolRows] = await db.execute(
    'SELECT school_id, school_name, status FROM schools WHERE school_id = ?',
    [schoolId]
  );
  const [userRows] = await db.execute(
    `SELECT id, username, email, role, school_id, status
     FROM users
     WHERE school_id = ?
     ORDER BY role, email`,
    [schoolId]
  );
  const [teacherRows] = await db.execute(
    `SELECT teacher_id, name, email, status, school_id
     FROM teacher
     WHERE school_id = ?
     ORDER BY teacher_id`,
    [schoolId]
  );

  console.log('Linked school:');
  console.table(schoolRows);
  console.log(`Teacher user accounts repaired: ${teacherUsers.affectedRows}`);
  console.log(`Default admin account repaired: ${defaultAdmin.affectedRows}`);
  console.log('\nUsers now linked to MUBUGATSS:');
  console.table(userRows);
  console.log('\nTeachers linked to MUBUGATSS:');
  console.table(teacherRows);

  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
