const mysql = require('mysql2/promise');
const path = require('path');

function cleanEnv(value, defaultValue = '') {
  if (typeof value !== 'string' || value.trim() === '') {
    return defaultValue;
  }
  let cleanValue = value.trim();
  if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
      (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
    cleanValue = cleanValue.slice(1, -1);
  }
  return cleanValue;
}

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const dbConfig = {
  host: cleanEnv(process.env.DB_HOST, '127.0.0.1'),
  user: cleanEnv(process.env.DB_USER, 'root'),
  password: cleanEnv(process.env.DB_PASSWORD, ''),
  database: cleanEnv(process.env.DB_NAME, 'timetable_system'),
  port: parseInt(cleanEnv(process.env.DB_PORT, '3306'), 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    const details = [
      err.message,
      err.code && `code=${err.code}`,
      err.errno && `errno=${err.errno}`,
      err.sqlState && `sqlState=${err.sqlState}`,
      `host=${dbConfig.host}`,
      `port=${dbConfig.port}`,
      `database=${dbConfig.database}`
    ].filter(Boolean).join(' ');

    console.error('MySQL connection error:', details);
  });

module.exports = pool;
