const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    
    // Add department column to teacher table
    db.run('ALTER TABLE teacher ADD COLUMN department VARCHAR(100) DEFAULT "SSOD"', (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('❌ Error adding department column:', err.message);
      } else {
        console.log('✅ Department column added to teacher table');
      }
      
      // Check updated table structure
      db.all('PRAGMA table_info(teacher)', [], (err, columns) => {
        if (err) {
          console.error('❌ Error checking table:', err.message);
        } else {
          console.log('📋 Updated teacher table columns:', columns.map(c => c.name));
        }
        
        db.close();
      });
    });
  }
});
