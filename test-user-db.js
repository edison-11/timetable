const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connection successful');
    
    // Test user table operations
    db.serialize(() => {
      // Check if admin user exists
      db.get('SELECT * FROM users WHERE email = ?', ['admin@school.com'], (err, user) => {
        if (err) {
          console.error('❌ User query error:', err.message);
        } else if (user) {
          console.log('✅ Admin user found:', { id: user.id, email: user.email, role: user.role });
        } else {
          console.log('ℹ️ Admin user not found');
        }
      });
      
      // Count total users
      db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
        if (err) {
          console.error('❌ Count error:', err.message);
        } else {
          console.log(`👥 Total users in database: ${result.count}`);
        }
      });
      
      // Test timetable table
      db.get('SELECT COUNT(*) as count FROM timetable', [], (err, result) => {
        if (err) {
          console.error('❌ Timetable count error:', err.message);
        } else {
          console.log(`📅 Total timetable entries: ${result.count}`);
        }
      });
      
      db.close((err) => {
        if (err) {
          console.error('❌ Database close error:', err.message);
        } else {
          console.log('✅ Database connection closed successfully');
        }
      });
    });
  }
});
