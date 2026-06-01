const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pwd = (process.env.DB_PASSWORD || '').replace(/^"|"$/g, '');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: pwd,
    database: process.env.DB_NAME || 'timetable_system',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306
  });

  const tables = ['schools', 'classes', 'modules', 'rooms', 'timetable', 'assignment', 'users'];
  for (const table of tables) {
    try {
      const [rows] = await conn.execute(
        `SELECT COALESCE(CAST(school_id AS CHAR), 'NULL') AS school_id, COUNT(*) AS count FROM \`${table}\` GROUP BY school_id ORDER BY school_id IS NULL DESC, school_id;`
      );
      console.log('TABLE', table, JSON.stringify(rows, null, 2));
    } catch (err) {
      console.error('ERR', table, err.message);
    }
  }
  await conn.end();
})();
