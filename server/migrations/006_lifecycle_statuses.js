const pool = require('../config/database');

const up = async () => {
  await pool.query("UPDATE schools SET status = 'pending_approval' WHERE status = 'pending'");
  await pool.query("UPDATE schools SET status = 'deactivated' WHERE status = 'inactive'");
  await pool.query("UPDATE teacher SET status = 'active' WHERE status = 'approved'");
  await pool.query("UPDATE teacher SET status = 'disabled' WHERE status = 'inactive'");
  await pool.query("UPDATE teacher SET status = 'suspended' WHERE status = 'on_leave'");
  await pool.query("UPDATE users SET status = 'disabled' WHERE status = 'inactive'");

  await pool.query(`
    ALTER TABLE schools
    MODIFY status ENUM('pending_approval', 'active', 'rejected', 'suspended', 'deactivated') NOT NULL DEFAULT 'pending_approval'
  `);

  await pool.query(`
    ALTER TABLE directors_of_studies
    MODIFY status ENUM('pending', 'active', 'rejected', 'suspended', 'disabled') NOT NULL DEFAULT 'pending'
  `);

  await pool.query(`
    ALTER TABLE users
    MODIFY status ENUM('pending', 'active', 'disabled', 'suspended', 'rejected') NOT NULL DEFAULT 'active'
  `);

  await pool.query(`
    ALTER TABLE teacher
    MODIFY status ENUM('pending', 'active', 'disabled', 'suspended', 'rejected') NOT NULL DEFAULT 'pending'
  `);

  const [columns] = await pool.query("SHOW COLUMNS FROM teacher LIKE 'gender'");
  if (!columns.length) {
    await pool.query('ALTER TABLE teacher ADD COLUMN gender VARCHAR(40) NULL AFTER phone');
  }
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(async () => {
      console.log('Lifecycle status migration complete');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('Lifecycle status migration failed:', error);
      await pool.end();
      process.exit(1);
    });
}
