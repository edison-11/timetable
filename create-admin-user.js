const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'nsengiyumva#2007',
      database: process.env.DB_NAME || 'timetable_system'
    });

    console.log('Connected to database');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert or refresh the default admin user
    const [result] = await connection.execute(
      `INSERT INTO users (username, email, password, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password), role = VALUES(role)`,
      ['admin', 'admin@school.com', hashedPassword, 'admin']
    );

    console.log(result.insertId ? `Admin user created with ID: ${result.insertId}` : 'Admin user updated');
    console.log('Login credentials:');
    console.log('Email: admin@school.com');
    console.log('Password: admin123');

    await connection.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
