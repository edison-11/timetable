const pool = require('../config/database');

async function addModuleDepartment() {
  const [columns] = await pool.query("SHOW COLUMNS FROM module LIKE 'department'");

  if (!columns.length) {
    await pool.query(
      "ALTER TABLE module ADD COLUMN department VARCHAR(50) NOT NULL DEFAULT 'SSOD' AFTER module_name"
    );
    console.log('department column added');
  } else {
    console.log('department column already exists');
  }
}

addModuleDepartment()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
