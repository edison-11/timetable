const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    db.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables) => {
      if (err) {
        console.error('❌ Error listing tables:', err.message);
      } else {
        console.log('📋 Database tables:', tables.map(t => t.name));
      }
    });
    
    // Test basic query
    db.get('SELECT sqlite_version()', [], (err, row) => {
      if (err) {
        console.error('❌ Version query error:', err.message);
      } else {
        console.log('🔧 SQLite version:', row['sqlite_version()']);
      }
    });
    
    db.close();
  }
});
