const pool = require('../config/database');

const up = async () => {
  await pool.query(`
    UPDATE users
    SET role = 'admin'
    WHERE role IS NULL OR role = ''
  `);

  await pool.query(`
    ALTER TABLE users
    MODIFY role ENUM('super_admin', 'dos', 'teacher', 'student', 'admin') NOT NULL DEFAULT 'teacher'
  `);

  await pool.query(`
    UPDATE users
    SET role = 'super_admin'
    WHERE LOWER(email) = LOWER('superadmin@test.com')
  `);
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(async () => {
      console.log('User role migration complete');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('User role migration failed:', error);
      await pool.end();
      process.exit(1);
    });
}
