const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'timetable_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [users] = await connection.query(
      'SELECT id, email, role, password_hash, password, status FROM users WHERE email = ?',
      ['superadmin@school.com']
    );

    if (users.length === 0) {
      console.log('❌ User superadmin@school.com not found');
    } else {
      console.log('👤 User found:');
      console.log(JSON.stringify(users[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUser();
