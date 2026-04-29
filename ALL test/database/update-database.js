const mysql = require('mysql2/promise');

async function updateDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'nsengiyumva#2007',
      database: process.env.DB_NAME || 'timetable_system'
    });

    console.log('Connected to database, updating teacher status column...');
    
    await connection.execute(`
      ALTER TABLE teacher 
      MODIFY COLUMN status ENUM('pending', 'active', 'inactive', 'on_leave') 
      DEFAULT 'pending'
    `);
    
    console.log('Database updated successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('Error updating database:', error.message);
  }
}

updateDatabase();
