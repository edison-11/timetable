const pool = require('./server/config/database');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    
    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM teacher');
    console.log('Teacher count:', rows[0].count);
    
    // Test pending teachers
    const [pendingRows] = await connection.execute('SELECT * FROM teacher WHERE status = ?', ['pending']);
    console.log('Pending teachers:', pendingRows.length);
    
    if (pendingRows.length > 0) {
      console.log('First pending teacher:', pendingRows[0].name, pendingRows[0].email);
    }
    
    connection.release();
    
  } catch (error) {
    console.error('Database connection error:', error.message);
  }
}

testDatabaseConnection();
