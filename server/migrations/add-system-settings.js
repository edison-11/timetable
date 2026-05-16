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
     VALUES ('break_start_time', '11:00')
     ON DUPLICATE KEY UPDATE setting_value = setting_value`
  );

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('break_end_time', '11:30')
     ON DUPLICATE KEY UPDATE setting_value = setting_value`
  );

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('timetable_breaks', ?)
     ON DUPLICATE KEY UPDATE setting_value = setting_value`,
    [JSON.stringify([
      { break_name: 'Morning Break', start_time: '11:00', end_time: '11:30' },
      { break_name: 'Lunch Break', start_time: '13:30', end_time: '14:15' },
      { break_name: 'Evening Break', start_time: '17:15', end_time: '17:45' }
    ])]
  );

  await pool.query(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES ('break_period_rules', ?)
     ON DUPLICATE KEY UPDATE setting_value = setting_value`,
    [JSON.stringify({
      enabled: true,
      periods_before_morning_break: 3,
      periods_before_lunch: 2,
      periods_before_afternoon_break: 3,
      periods_after_afternoon_break: 2,
      morning_break_minutes: 30,
      lunch_break_minutes: 45,
      afternoon_break_minutes: 30
    })]
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
