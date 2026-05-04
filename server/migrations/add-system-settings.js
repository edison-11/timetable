const pool = require('../config/database');

async function addSystemSettings() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_setting (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('teacher_changeover_minutes', '5')
     ON DUPLICATE KEY UPDATE setting_value = setting_value`
  );

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('break_start_time', '10:00')
     ON DUPLICATE KEY UPDATE setting_value = setting_value`
  );

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('break_end_time', '10:15')
     ON DUPLICATE KEY UPDATE setting_value = setting_value`
  );

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('timetable_breaks', ?)
     ON DUPLICATE KEY UPDATE setting_value = setting_value`,
    [JSON.stringify([
      { break_name: 'Morning Break', start_time: '10:00', end_time: '10:15' },
      { break_name: 'Lunch Break', start_time: '12:00', end_time: '13:00' },
      { break_name: 'Afternoon Break', start_time: '15:00', end_time: '15:15' }
    ])]
  );

  console.log('system_setting table ready');
}

addSystemSettings()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
