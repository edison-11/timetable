const pool = require('./server/config/database');
const bcrypt = require('bcryptjs');

async function setupSuperAdmin() {
  try {
    console.log('Setting up Super Admin...');

    // Check if super admin exists
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      ['superadmin@school.com']
    );

    // Hash the password
    const hashedPassword = await bcrypt.hash('SuperAdmin!202', 10);

    if (existing.length > 0) {
      console.log('Super admin exists, updating password and role...');
      await pool.execute(
        'UPDATE users SET password = ?, role = ? WHERE email = ?',
        [hashedPassword, 'super_admin', 'superadmin@school.com']
      );
    } else {
      console.log('Creating new super admin user...');
      await pool.execute(
        'INSERT INTO users (username, email, password, role, is_verified, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['superadmin', 'superadmin@school.com', hashedPassword, 'super_admin', 1, 'active']
      );
    }

    console.log('✓ Super admin setup complete!');
    console.log('  Email: superadmin@school.com');
    console.log('  Password: SuperAdmin!202');
    console.log('  Role: super_admin');

    // Verify
    const [user] = await pool.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      ['superadmin@school.com']
    );
    
    if (user.length > 0) {
      console.log('✓ Verified:', user[0]);
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupSuperAdmin();
