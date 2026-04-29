const mysql = require('mysql2/promise');
require('dotenv').config();

async function createUsersTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: 'nsengiyumva#2007',
      database: process.env.DB_NAME || 'timetable_system'
    });

    console.log('Connected to database');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'student') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createTableSQL);
    console.log('Users table created successfully!');

    // Insert a test user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await connection.execute(
      'INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['testuser', 'test@example.com', hashedPassword, 'admin']
    );
    console.log('Test user created/updated');

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

createUsersTable();
