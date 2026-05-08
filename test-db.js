const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    
    // Test basic operations
    db.serialize(() => {
      // Create test table
      db.run(`CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('❌ Table creation error:', err.message);
        } else {
          console.log('✅ Test table created/verified');
          
          // Insert test data
          const stmt = db.prepare('INSERT INTO test_table (name) VALUES (?)');
          stmt.run('Database Test', function(err) {
            if (err) {
              console.error('❌ Insert error:', err.message);
            } else {
              console.log(`✅ Test data inserted (ID: ${this.lastID})`);
              
              // Query test data
              db.all('SELECT * FROM test_table', [], (err, rows) => {
                if (err) {
                  console.error('❌ Query error:', err.message);
                } else {
                  console.log(`✅ Query successful: Found ${rows.length} records`);
                  console.log('📊 Records:', rows);
                  
                  // Clean up
                  db.run('DROP TABLE test_table', (err) => {
                    if (err) {
                      console.error('❌ Cleanup error:', err.message);
                    } else {
                      console.log('✅ Test table cleaned up');
                    }
                  });
                }
              });
            }
          });
          stmt.finalize();
        }
      });
    });
  }
});
