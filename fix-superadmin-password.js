const pool = require('./server/config/database');
const bcrypt = require('bcryptjs');

async function setupSuperAdmin() {
  try {
    console.log('Updating Super Admin with password_hash...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('SuperAdmin!202', 10);

    // Update both password and password_hash
    await pool.execute(
      'UPDATE users SET password = ?, password_hash = ? WHERE email = ?',
      [hashedPassword, hashedPassword, 'superadmin@school.com']
    );

    console.log('✓ Super admin password updated!');

    // Test the hash
    const [user] = await pool.execute(
      'SELECT id, email, role, password FROM users WHERE email = ?',
      ['superadmin@school.com']
    );
    
    if (user.length > 0) {
      const isMatch = await bcrypt.compare('SuperAdmin!202', user[0].password);
      console.log('✓ Password verification:', isMatch ? 'PASSED' : 'FAILED');
      console.log('✓ User:', { id: user[0].id, email: user[0].email, role: user[0].role });
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupSuperAdmin();
