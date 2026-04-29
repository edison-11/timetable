const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const User = require('./server/models/User');

async function debugApproval() {
  try {
    console.log('Debugging teacher approval process...');
    
    // Test database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'nsengiyumva#2007',
      database: process.env.DB_NAME || 'timetable_system'
    });
    
    console.log('Database connection successful');
    
    // Test admin authentication
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Generated admin token');
    
    const user = await User.findById(4);
    console.log('Admin user found:', user?.role);
    
    // Test finding the teacher
    const [teacherRows] = await connection.execute(
      'SELECT * FROM teacher WHERE email = ?',
      ['johnsmith@school.com']
    );
    
    console.log('Teacher found:', teacherRows[0]?.name, teacherRows[0]?.status);
    
    // Test updating the teacher status
    if (teacherRows.length > 0) {
      await connection.execute(
        'UPDATE teacher SET status = ? WHERE teacher_id = ?',
        ['active', teacherRows[0].teacher_id]
      );
      
      console.log('Teacher status updated successfully');
      
      // Verify the update
      const [updatedRows] = await connection.execute(
        'SELECT * FROM teacher WHERE teacher_id = ?',
        [teacherRows[0].teacher_id]
      );
      
      console.log('Updated teacher status:', updatedRows[0]?.status);
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('Debug approval error:', error.message);
  }
}

debugApproval();
