const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

async function resetPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'timetable_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔐 Resetting all user passwords...\n');

    const users = [
      { email: 'superadmin@school.com', password: 'password123', role: 'super_admin' },
      { email: 'admin@school.com', password: 'Admin@123456', role: 'admin' },
      { email: 'teacher1@school.com', password: 'password123', role: 'teacher' },
      { email: 'teacher2@school.com', password: 'password123', role: 'teacher' },
      { email: 'dos@school.com', password: 'password123', role: 'dos' },
    ];

    for (const user of users) {
      const hashedPassword = await bcryptjs.hash(user.password, 10);
      
      await connection.query(
        'UPDATE users SET password_hash = ?, password = NULL WHERE email = ?',
        [hashedPassword, user.email]
      );
      
      console.log(`✅ ${user.email}`);
      console.log(`   Password: ${user.password}\n`);
    }

    console.log('\n✨ All passwords reset!\n');
    console.log('═══════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════\n');

    for (const user of users) {
      console.log(`${user.role === 'super_admin' ? '🔑' : user.role === 'admin' ? '👤' : user.role === 'dos' ? '👔' : '👨‍🏫'} ${user.email.split('@')[0].toUpperCase()}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}\n`);
    }
    
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetPasswords();
