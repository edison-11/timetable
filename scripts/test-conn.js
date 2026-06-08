const mysql = require('mysql2/promise');
require('dotenv').config();

function cleanEnv(value, defaultValue = '') {
  if (typeof value !== 'string' || value.trim() === '') return defaultValue;
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

const config = {
  host: cleanEnv(process.env.DB_HOST, '127.0.0.1'),
  user: cleanEnv(process.env.DB_USER, 'root'),
  password: cleanEnv(process.env.DB_PASSWORD, ''),
  database: cleanEnv(process.env.DB_NAME, 'timetable_system'),
  port: parseInt(cleanEnv(process.env.DB_PORT, '3306'), 10) || 3306
};

(async () => {
  console.log('Testing DB connection with config:', { host: config.host, user: config.user, database: config.database, port: config.port });
  try {
    const pool = mysql.createPool(config);
    const conn = await pool.getConnection();
    console.log('Connection OK');
    conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:');
    console.error('message:', err.message);
    if (err.code) console.error('code:', err.code);
    if (err.errno) console.error('errno:', err.errno);
    if (err.sqlState) console.error('sqlState:', err.sqlState);
    process.exit(2);
  }
})();
