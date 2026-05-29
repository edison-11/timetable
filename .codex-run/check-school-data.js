const pool = require('../server/config/database');

const tables = ['teacher', 'student', 'class', 'module', 'section', 'room', 'assignment', 'timetable'];

(async () => {
  for (const tableName of tables) {
    try {
      const [rows] = await pool.query(
        `SELECT COALESCE(CAST(school_id AS CHAR), 'NULL') AS school_id, COUNT(*) AS count
         FROM \`${tableName}\`
         GROUP BY school_id
         ORDER BY school_id IS NULL DESC, school_id`
      );
      console.log(`\n${tableName}`);
      console.table(rows);
    } catch (error) {
      console.log(`\n${tableName}: ${error.code || error.message}`);
    }
  }

  await pool.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
