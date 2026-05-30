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

const pool = mysql.createPool({
  host: cleanEnv(process.env.DB_HOST, 'localhost'),
  user: cleanEnv(process.env.DB_USER, 'root'),
  password: cleanEnv(process.env.DB_PASSWORD, ''),
  database: cleanEnv(process.env.DB_NAME, 'timetable_system'),
  port: parseInt(cleanEnv(process.env.DB_PORT, '3306'), 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

module.exports = pool;