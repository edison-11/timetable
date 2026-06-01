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

const getDefaultSchoolId = async () => {
  const [schools] = await pool.query(`
    SELECT school_id
    FROM schools
    WHERE status = 'active'
    ORDER BY school_id
    LIMIT 1
  `);

  if (schools[0]?.school_id) {
    return schools[0].school_id;
  }

  const [result] = await pool.query(`
    INSERT INTO schools (
      school_name,
      school_email,
      registration_number,
      status,
      subscription_status
    )
    VALUES (
      'Default School',
      'default-school@example.local',
      'DEFAULT-SCHOOL',
      'active',
      'active'
    )
  `);

  return result.insertId;
};

const assignNullSchoolRows = async (tableName, schoolId, extraWhere = '') => {
  if (!(await columnExists(tableName, 'school_id'))) return;

  const [result] = await pool.query(
    `UPDATE \`${tableName}\` SET school_id = ? WHERE school_id IS NULL ${extraWhere}`,
    [schoolId]
  );

  console.log(`Assigned ${result.affectedRows} ${tableName} rows to school ${schoolId}`);
};

const up = async () => {
  const schoolId = await getDefaultSchoolId();

  const tenantTables = [
    'teacher',
    'student',
    'class',
    'module',
    'section',
    'room',
    'assignment',
    'timetable',
    'timetable_entry',
    'student_attendance',
    'notification',
    'activity_logs',
    'approvals'
  ];

  for (const tableName of tenantTables) {
    await assignNullSchoolRows(tableName, schoolId);
  }

  await assignNullSchoolRows('users', schoolId, "AND role <> 'super_admin'");
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(async () => {
      console.log('Legacy data school assignment complete');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('Legacy data school assignment failed:', error);
      await pool.end();
      process.exit(1);
    });
}
