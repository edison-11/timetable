const pool = require('../server/config/database');

const tenantTables = [
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

(async () => {
  const [schools] = await pool.query(
    `SELECT school_id, school_name
     FROM schools
     WHERE deleted_at IS NULL AND status = 'active'
     ORDER BY created_at DESC`
  );

  if (!schools.length) {
    throw new Error('No active school found to receive existing data.');
  }

  const school = schools.find((item) => item.school_name === 'MUBUGATSS') || schools[0];
  console.log(`Assigning existing unscoped data to ${school.school_name} (school_id=${school.school_id})`);

  for (const tableName of tenantTables) {
    try {
      const [result] = await pool.query(
        `UPDATE \`${tableName}\`
         SET school_id = ?
         WHERE school_id IS NULL`,
        [school.school_id]
      );
      console.log(`${tableName}: ${result.affectedRows} row(s) updated`);
    } catch (error) {
      if (['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR', 'ER_BAD_FIELD_ERROR'].includes(error.code)) {
        console.log(`${tableName}: skipped (${error.code})`);
      } else {
        throw error;
      }
    }
  }

  await pool.end();
})().catch(async (error) => {
  console.error(error.message || error);
  try {
    await pool.end();
  } catch (_) {}
  process.exit(1);
});
