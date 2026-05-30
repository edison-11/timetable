const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'timetable_system',
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
