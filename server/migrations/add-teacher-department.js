const pool = require('../config/database');

async function addTeacherDepartment() {
  const [columns] = await pool.query("SHOW COLUMNS FROM teacher LIKE 'department'");

  if (!columns.length) {
    await pool.query(
      "ALTER TABLE teacher ADD COLUMN department VARCHAR(50) NOT NULL DEFAULT 'SSOD' AFTER password"
    );
    console.log('teacher department column added');
  } else {
    console.log('teacher department column already exists');
  }
}

addTeacherDepartment()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
