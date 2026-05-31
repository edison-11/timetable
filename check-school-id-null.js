const pool = require('./server/config/database');

async function checkTables() {
  const tables = ['teacher', 'classes', 'rooms', 'student', 'assignment', 'dos'];
  for (const table of tables) {
    try {
      // Check if table has school_id column
      const [cols] = await pool.execute(`SHOW COLUMNS FROM \`${table}\` WHERE Field = ?`, ['school_id']);
      if (cols.length > 0) {
        const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM \`${table}\` WHERE school_id IS NULL`);
        const [total] = await pool.execute(`SELECT COUNT(*) as total FROM \`${table}\``);
        console.log(`${table}: ${rows[0].count} NULL school_id out of ${total[0].total} total rows`);
      } else {
        console.log(`${table}: no school_id column`);
      }
    } catch (err) {
      console.log(`${table}: error - ${err.message}`);
    }
  }
  process.exit(0);
}
checkTables();