const mysql = require('mysql2/promise');

async function testDirectPendingTeachers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'nsengiyumva#2007',
      database: process.env.DB_NAME || 'timetable_system'
    });

    console.log('Testing direct database query for pending teachers...');
    
    // Query pending teachers directly
    const [rows] = await connection.execute(
      'SELECT teacher_id, name, email, status, date_joined, created_at FROM teacher WHERE status = ? ORDER BY created_at DESC',
      ['pending']
    );
    
    console.log('Pending teachers found:', rows.length);
    console.log('Pending teachers data:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error testing direct pending teachers:', error.message);
  }
}

testDirectPendingTeachers();
