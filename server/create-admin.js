const pool = require('./config/database');
const bcryptjs = require('bcryptjs');

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@school.com']
    );
    
    if (existingAdmin.length > 0) {
      console.log('✓ Admin user already exists, updating password...');
      // Delete and recreate
      await pool.execute('DELETE FROM users WHERE email = ?', ['admin@school.com']);
    }

    // Hash password with bcryptjs
    const salt = bcryptjs.genSaltSync(10);
    const hashedPassword = bcryptjs.hashSync('admin123456', salt);

    // Create admin user directly
    await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@school.com', hashedPassword, 'admin']
    );

    // Verify it works
    const [user] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@school.com']
    );
    
    if (user.length > 0) {
      const match = bcryptjs.compareSync('admin123456', user[0].password);
      if (match) {
        console.log('✓ Admin user created successfully!');
        console.log('');
        console.log('Login Credentials:');
        console.log('  Email: admin@school.com');
        console.log('  Password: admin123456');
        console.log('');
      } else {
        console.log('✗ Password verification failed');
      }
    }
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

createAdminUser();
