const pool = require('../server/config/database');

(async () => {
  try {
    console.log('Connecting to DB and updating user...');
    await pool.query("UPDATE users SET role='dos', school_id=1 WHERE LOWER(email)=LOWER('admin@school.com')");
    const [rows] = await pool.query("SELECT id, email, role, school_id, status FROM users WHERE LOWER(email)=LOWER('admin@school.com')");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
