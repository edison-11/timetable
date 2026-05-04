const pool = require('../config/database');

async function addTeacherChangeoverToShift() {
  try {
    // Add teacher_changeover_minutes column to shift table
    await pool.execute(`
      ALTER TABLE shift
      ADD COLUMN teacher_changeover_minutes INT DEFAULT 5 NOT NULL
    `);

    console.log('Added teacher_changeover_minutes column to shift table');

    // Optionally, set default values for existing shifts
    await pool.execute(`
      UPDATE shift
      SET teacher_changeover_minutes = 5
      WHERE teacher_changeover_minutes IS NULL
    `);

    console.log('Set default teacher_changeover_minutes for existing shifts');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

addTeacherChangeoverToShift()
  .then(() => {
    console.log('Migration completed successfully');
    pool.end();
  })
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  });