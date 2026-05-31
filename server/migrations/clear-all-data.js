const pool = require('../config/database');

/**
 * Dedicated utility script to clear all application data.
 * Truncates tables to reset auto-increment IDs.
 */
const clearAllData = async () => {
  console.log('Starting full database cleanup...');
  try {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = [
      'student_attendance',
      'student',
      'timetable',
      'assignment',
      'class',
      'module',
      'room',
      'section',
      'shift',
      'teacher',
      'users'
    ];

    for (const table of tables) {
      console.log(`Truncating table: ${table}`);
      await pool.execute(`TRUNCATE TABLE \`${table}\``);
    }

    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Cleanup complete. All application records have been deleted.');
  } catch (error) {
    console.error('Failed to clear database records:', error);
  } finally {
    await pool.end();
  }
};

clearAllData();