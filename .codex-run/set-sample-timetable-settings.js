const pool = require('../server/config/database');

const rules = {
  enabled: true,
  periods_before_morning_break: 3,
  periods_before_lunch: 2,
  periods_before_afternoon_break: 3,
  morning_break_minutes: 30,
  lunch_break_minutes: 45,
  afternoon_break_minutes: 30
};

(async () => {
  await pool.execute(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    ['teacher_changeover_minutes', '0']
  );

  await pool.execute(
    `INSERT INTO system_setting (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    ['break_period_rules', JSON.stringify(rules)]
  );

  console.log(JSON.stringify({
    teacher_changeover_minutes: 0,
    break_period_rules: rules
  }, null, 2));

  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
