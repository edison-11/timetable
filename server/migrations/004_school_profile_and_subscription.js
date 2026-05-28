const pool = require('../config/database');

const columnExists = async (tableName, columnName) => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (await columnExists(tableName, columnName)) return;
  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
};

const up = async () => {
  await addColumnIfMissing('schools', 'school_code', 'school_code VARCHAR(80) NULL');
  await addColumnIfMissing('schools', 'province', 'province VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'district', 'district VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'sector', 'sector VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'school_type', 'school_type VARCHAR(120) NULL');
  await addColumnIfMissing('schools', 'subscription_status', "subscription_status ENUM('trial', 'active', 'past_due', 'suspended') NOT NULL DEFAULT 'trial'");
};

module.exports = { up };

if (require.main === module) {
  up()
    .then(async () => {
      console.log('School profile and subscription migration complete');
      await pool.end();
    })
    .catch(async (error) => {
      console.error('School profile and subscription migration failed:', error);
      await pool.end();
      process.exit(1);
    });
}
