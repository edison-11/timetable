const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./timetable.db');

// Check all users
db.all("SELECT id, email, username, role, password FROM users", (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('All users in database:');
  rows.forEach(row => {
    console.log(`ID: ${row.id}, Email: ${row.email}, Username: ${row.username}, Role: ${row.role}, Password Hash: ${row.password.substring(0, 20)}...`);
  });
  
  db.close();
});
