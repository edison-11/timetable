const pool = require('./config/database');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Teacher = require('./models/Teacher');

const createTeacherTableIfMissing = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher (
        teacher_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        department VARCHAR(50) NOT NULL DEFAULT 'SSOD',
        status ENUM('pending', 'active', 'inactive', 'on_leave') DEFAULT 'active',
        date_joined DATE,
        profile_photo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ teacher table exists or was created.');
  } catch (error) {
    console.error('❌ Failed to ensure teacher table:', error.message);
    throw error;
  }
};

const ensureUser = async ({ email, username, full_name, password, role, phone, status = 'active', is_verified = true }) => {
  const existing = await User.findByEmail(email);
  if (existing) {
    const query = 'UPDATE users SET username = ?, full_name = ?, role = ?, is_verified = ?, status = ? WHERE id = ?';
    await pool.query(query, [username, full_name, role, is_verified ? 1 : 0, status, existing.id]);
    await User.updatePassword(existing.id, password);
    return { id: existing.id, email, password, role };
  }

  const userId = await User.create({ username, full_name, email, phone, password, role, is_verified, status });
  return { id: userId, email, password, role };
};

const ensureTeacher = async ({ email, name, password, department = 'SSOD', status = 'active', phone = null }) => {
  await createTeacherTableIfMissing();

  let teacher = await Teacher.findByEmail(email);
  if (teacher) {
    await Teacher.update(teacher.teacher_id, {
      name,
      email,
      password,
      department,
      status,
      phone
    });
    teacher = await Teacher.findByEmail(email);
    return { teacher_id: teacher.teacher_id, email, password, status };
  }

  const teacherId = await Teacher.create({
    name,
    email,
    password,
    department,
    status,
    date_joined: new Date().toISOString().split('T')[0],
    phone
  });

  teacher = await Teacher.findByEmail(email);
  return { teacher_id: teacherId, email, password, status };
};

const seed = async () => {
  try {
    console.log('Seeding accounts...');

    const superAdmin = await ensureUser({
      email: 'superadmin@school.com',
      username: 'superadmin',
      full_name: 'Super Admin',
      password: 'SuperAdmin!2026',
      role: 'super_admin',
      phone: '+250788000000',
      status: 'active',
      is_verified: true
    });

    const dosAdmin = await ensureUser({
      email: 'dos@school.com',
      username: 'dosadmin',
      full_name: 'System Admin',
      password: 'DosAdmin!2026',
      role: 'dos',
      phone: '+250788000001',
      status: 'active',
      is_verified: true
    });

    const teacher = await ensureTeacher({
      email: 'teacher1@school.com',
      name: 'Teacher One',
      password: 'TeacherOne!2026',
      department: 'Mathematics',
      status: 'active',
      phone: '+250788000002'
    });

    await ensureUser({
      email: teacher.email,
      username: 'teacher1',
      full_name: 'Teacher One',
      password: teacher.password,
      role: 'teacher',
      phone: teacher.phone,
      status: 'active',
      is_verified: true
    });

    console.log('');
    console.log('✅ Accounts seeded successfully:');
    console.log('  Super Admin -> Email: superadmin@school.com | Password: SuperAdmin!2026 | Role: super_admin');
    console.log('  Admin / DOS -> Email: dos@school.com | Password: DosAdmin!2026 | Role: dos');
    console.log('  Teacher -> Email: teacher1@school.com | Password: TeacherOne!2026 | Role: teacher');
    console.log('');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

seed();
