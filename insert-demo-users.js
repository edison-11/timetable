const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

async function insertDemoUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'timetable_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('📊 Starting demo user insertion...\n');

    // First, get or create a default school
    const [schools] = await connection.query('SELECT school_id FROM schools LIMIT 1');
    let schoolId = null;
    
    if (schools.length === 0) {
      console.log('📍 Creating default school...');
      const [result] = await connection.query(
        'INSERT INTO schools (school_name, school_email, registration_number, status) VALUES (?, ?, ?, ?)',
        ['Demo School', 'school@demo.com', 'DEMO001', 'active']
      );
      schoolId = result.insertId;
      console.log(`✅ Default school created with ID: ${schoolId}\n`);
    } else {
      schoolId = schools[0].school_id;
      console.log(`✅ Using existing school ID: ${schoolId}\n`);
    }

    // Demo users to insert
    const demoUsers = [
      {
        email: 'superadmin@school.com',
        password: 'password123',
        name: 'Super Admin',
        full_name: 'Super Administrator',
        role: 'super_admin',
      },
      {
        email: 'admin@school.com',
        password: 'Admin@123456',
        name: 'Admin User',
        full_name: 'System Administrator',
        role: 'admin',
      },
      {
        email: 'teacher1@school.com',
        password: 'password123',
        name: 'Teacher One',
        full_name: 'Teacher One',
        role: 'teacher',
      },
      {
        email: 'teacher2@school.com',
        password: 'password123',
        name: 'Teacher Two',
        full_name: 'Teacher Two',
        role: 'teacher',
      },
      {
        email: 'dos@school.com',
        password: 'password123',
        name: 'Director of Studies',
        full_name: 'Director of Studies',
        role: 'dos',
      },
    ];

    for (const user of demoUsers) {
      try {
        // Hash password with bcryptjs
        const hashedPassword = await bcryptjs.hash(user.password, 10);

        // Check if user already exists
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE email = ?',
          [user.email]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${user.email} (already exists)`);
          continue;
        }

        // Insert user
        const [result] = await connection.query(
          `INSERT INTO users (
            name, full_name, email, password_hash, role, status, 
            is_verified, school_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            user.name,
            user.full_name,
            user.email,
            hashedPassword,
            user.role,
            'active',
            true,
            schoolId,
          ]
        );

        console.log(`✅ Created: ${user.email} (${user.role})`);
        console.log(`   📝 Email: ${user.email}`);
        console.log(`   🔐 Password: ${user.password}\n`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  Skipping ${user.email} (already exists)`);
        } else {
          console.error(`❌ Error inserting ${user.email}:`, error.message);
        }
      }
    }

    console.log('\n✨ Demo user insertion complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════\n');
    console.log('🔑 Super Admin:');
    console.log('   Email: superadmin@school.com');
    console.log('   Password: password123\n');
    console.log('👤 Admin:');
    console.log('   Email: admin@school.com');
    console.log('   Password: Admin@123456\n');
    console.log('👨‍🏫 Teacher 1:');
    console.log('   Email: teacher1@school.com');
    console.log('   Password: password123\n');
    console.log('👨‍🏫 Teacher 2:');
    console.log('   Email: teacher2@school.com');
    console.log('   Password: password123\n');
    console.log('👔 Director of Studies:');
    console.log('   Email: dos@school.com');
    console.log('   Password: password123\n');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

insertDemoUsers();
