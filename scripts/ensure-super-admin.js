const bcrypt = require('bcryptjs');
const pool = require('../server/config/database');
const User = require('../server/models/User');

const SUPER_ADMIN_ACCOUNT = {
  full_name: 'System Super Admin',
  username: 'System Super Admin',
  email: 'superadmin2@school.com',
  phone: '+250788900001',
  password: 'SuperAdmin@2026'
};

const ensureSuperAdmin = async () => {
  await User.ensureAuthColumns();

  const existing = await User.findByEmail(SUPER_ADMIN_ACCOUNT.email);

  if (!existing) {
    await User.create({
      ...SUPER_ADMIN_ACCOUNT,
      role: 'super_admin',
      is_verified: true,
      school_id: null,
      status: 'active'
    });
  } else {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_ACCOUNT.password, 10);
    await pool.execute(
      `UPDATE users
       SET username = ?,
           full_name = ?,
           phone = ?,
           password = ?,
           password_hash = ?,
           role = 'super_admin',
           is_verified = 1,
           school_id = NULL,
           status = 'active'
       WHERE id = ?`,
      [
        SUPER_ADMIN_ACCOUNT.username,
        SUPER_ADMIN_ACCOUNT.full_name,
        SUPER_ADMIN_ACCOUNT.phone,
        passwordHash,
        passwordHash,
        existing.id
      ]
    );
  }

  console.log('Super admin account is ready:');
  console.log(`Email: ${SUPER_ADMIN_ACCOUNT.email}`);
  console.log(`Password: ${SUPER_ADMIN_ACCOUNT.password}`);
};

ensureSuperAdmin()
  .catch((error) => {
    console.error('Failed to ensure super admin account:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
