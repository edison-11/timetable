const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./timetable.db');

const createTeacher = async () => {
  try {
    const password = 'Teacher@123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userSql = `
      INSERT INTO users (username, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, 'teacher', datetime('now'), datetime('now'))
    `;
    
    db.run(userSql, ['Test Teacher', 'teacher@test.com', hashedPassword], function(err) {
      if (err) {
        console.error('Error creating user:', err);
        db.close();
        return;
      }
      
      console.log('Teacher user created with ID:', this.lastID);
      console.log('Email: teacher@test.com');
      console.log('Password: Teacher@123456');
      console.log('Plain password:', password);
      console.log('Hashed password:', hashedPassword);
      
      // Verify it was created
      db.get('SELECT id, email, role, password FROM users WHERE email = ?', ['teacher@test.com'], (err, row) => {
        if (err) {
          console.error('Error verifying user:', err);
        } else {
          console.log('Verified:', row);
        }
        db.close();
      });
    });
  } catch (err) {
    console.error('Error:', err);
    db.close();
  }
};

createTeacher();
