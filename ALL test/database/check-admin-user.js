const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAndCreateAdminUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'nsengiyumva#2007',
      database: process.env.DB_NAME || 'timetable_system'
    });

    console.log('Checking for admin user...');
    
    // Check if admin user exists
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['test@example.com']
    );
    
    if (users.length === 0) {
      console.log('Admin user not found, creating...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await connection.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'test@example.com', hashedPassword, 'admin']
      );
      
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user exists:', users[0]);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error checking admin user:', error.message);
  }
}

checkAndCreateAdminUser();
