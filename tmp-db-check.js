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

  const [rows] = await conn.execute('SELECT id, email, role, school_id, status FROM users ORDER BY id LIMIT 50');
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
})();
