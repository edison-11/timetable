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

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};

  for (const arg of args) {
    if (arg.startsWith('--school-id=')) {
      result.schoolId = Number(arg.split('=')[1]);
    }
    if (arg.startsWith('--school-name=')) {
      result.schoolName = arg.split('=')[1];
    }
  }

  return result;
};

(async () => {
  const { schoolId, schoolName } = parseArgs();
  const [schools] = await pool.query(
    `SELECT school_id, school_name
     FROM schools
     WHERE deleted_at IS NULL AND status = 'active'
     ORDER BY created_at DESC`
  );

  if (!schools.length) {
    throw new Error('No active school found to receive existing data.');
  }

  let school = null;
  if (schoolId) {
    school = schools.find((item) => Number(item.school_id) === Number(schoolId));
    if (!school) {
      throw new Error(`Active school with id=${schoolId} was not found.`);
    }
  } else if (schoolName) {
    school = schools.find((item) => item.school_name.toLowerCase() === schoolName.toLowerCase());
    if (!school) {
      throw new Error(`Active school with name='${schoolName}' was not found.`);
    }
  } else {
    school = schools.find((item) => item.school_name === 'MUBUGATSS') || schools[0];
  }

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
  console.log('Done. Existing unscoped data is now linked to the selected school.');
})().catch(async (error) => {
  console.error(error.message || error);
  try {
    await pool.end();
  } catch (_) {}
  process.exit(1);
});
