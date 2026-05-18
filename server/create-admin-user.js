const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../timetable.db');

async function createAdminUser() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err);
        reject(err);
        return;
      }

      try {
        // Hash password
        const password = 'admin123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          'INSERT OR REPLACE INTO users (id, username, email, password, role, created_at, updated_at) VALUES (1, ?, ?, ?, ?, datetime("now"), datetime("now"))',
          ['Admin', 'admin@school.com', hashedPassword, 'admin'],
          (err) => {
            if (err) {
              console.error('❌ Error creating admin user:', err);
              reject(err);
              return;
            }

            console.log('✅ Admin user created/updated successfully');
            console.log('   Email: admin@school.com');
            console.log('   Password: admin123456');

            db.all('SELECT id, email, role FROM users LIMIT 5', (err, rows) => {
              if (err) {
                console.error('Error reading users:', err);
              } else {
                console.log('\n📋 Users in database:');
                rows.forEach(row => {
                  console.log(`   - ${row.email} (${row.role})`);
                });
              }

              db.close((err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  });
}

createAdminUser()
  .then(() => {
    console.log('\n✅ Setup completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  });
