const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./timetable.db');

const password = 'Sarah@123456';
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);

const userSql = `
  INSERT INTO users (username, email, password, role, created_at, updated_at)
  VALUES (?, ?, ?, 'teacher', datetime('now'), datetime('now'))
`;

db.run(userSql, ['Sarah Teacher', 'sarah@test.com', hashedPassword], function(err) {
  if (err) {
    console.error('Error creating user:', err);
    db.close();
    return;
  }
  
  console.log('Teacher user created with ID:', this.lastID);
  
  // Verify it was created
  db.get('SELECT id, email, role FROM users WHERE email = ?', ['sarah@test.com'], (err, row) => {
    if (err) {
      console.error('Error verifying user:', err);
    } else {
      console.log('Verified:', row);
    }
    db.close();
  });
});
