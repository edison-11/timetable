const pool = require('../config/database');

class SystemSetting {
  static async ensureTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS system_setting (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.execute('ALTER TABLE system_setting MODIFY setting_value TEXT NOT NULL');
    } catch (error) {
      // Older MySQL variants may report no-op ALTER differences differently; existing reads still work.
    }
  }

  static async get(key, defaultValue = null) {
    await this.ensureTable();

    const [rows] = await pool.execute(
      'SELECT setting_value FROM system_setting WHERE setting_key = ?',
      [key]
    );

    return rows[0]?.setting_value ?? defaultValue;
  }

  static async set(key, value) {
    await this.ensureTable();

    // First try to update
    await pool.execute(
      `UPDATE system_setting SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?`,
      [String(value), key]
    );

    // If nothing was updated, insert
    const [result] = await pool.execute(
      'SELECT * FROM system_setting WHERE setting_key = ?',
      [key]
    );

    if (!result.length) {
      await pool.execute(
        `INSERT INTO system_setting (setting_key, setting_value) VALUES (?, ?)`,
        [key, String(value)]
      );
    }
  }

  static async getTimetableSettings() {
    const teacherChangeoverMinutes = Number(
      await this.get('teacher_changeover_minutes', '5')
    );
    const periodMinutes = Number(await this.get('period_minutes', '45'));
    const timetableStartTime = await this.get('timetable_start_time', '08:00');
    const timetableEndTime = await this.get('timetable_end_time', '17:15');
    const breakStartTime = await this.get('break_start_time', '11:00');
    const breakEndTime = await this.get('break_end_time', '11:30');
    const timetableBreaksValue = await this.get('timetable_breaks', null);
    const breakPeriodRulesValue = await this.get('break_period_rules', null);
    let timetableBreaks = [];
    let breakPeriodRules = {
      enabled: true,
      periods_before_morning_break: 3,
      periods_before_lunch: 2,
      periods_before_afternoon_break: 3,
      periods_after_afternoon_break: 2,
      morning_break_minutes: 30,
      lunch_break_minutes: 45,
      afternoon_break_minutes: 30
    };

    if (timetableBreaksValue) {
      try {
        timetableBreaks = JSON.parse(timetableBreaksValue);
      } catch (error) {
        timetableBreaks = [];
      }
    }

    if (!Array.isArray(timetableBreaks) || !timetableBreaks.length) {
      timetableBreaks = [
        {
          break_name: 'Morning Break',
          start_time: breakStartTime,
          end_time: breakEndTime
        },
        {
          break_name: 'Lunch Break',
          start_time: '13:30',
          end_time: '14:15'
        },
        {
          break_name: 'Evening Break',
          start_time: '17:15',
          end_time: '17:45'
        }
      ];
    }

    if (breakPeriodRulesValue) {
      try {
        breakPeriodRules = {
          ...breakPeriodRules,
          ...JSON.parse(breakPeriodRulesValue)
        };
      } catch (error) {
        breakPeriodRules.enabled = false;
      }
    }

    return {
      teacher_changeover_minutes: Number.isFinite(teacherChangeoverMinutes)
        ? teacherChangeoverMinutes
        : 5,
      period_minutes: Number.isFinite(periodMinutes) && periodMinutes > 0
        ? periodMinutes
        : 45,
      start_time: timetableStartTime,
      end_time: timetableEndTime,
      break_start_time: breakStartTime,
      break_end_time: breakEndTime,
      timetable_breaks: timetableBreaks,
      break_period_rules: breakPeriodRules
    };
  }

  static async updateTimetableSettings(settings) {
    if (settings.teacher_changeover_minutes !== undefined) {
      await this.set(
        'teacher_changeover_minutes',
        settings.teacher_changeover_minutes
      );
    }

    if (settings.period_minutes !== undefined) {
      await this.set('period_minutes', settings.period_minutes);
    }

    if (settings.start_time !== undefined) {
      await this.set('timetable_start_time', settings.start_time);
    }

    if (settings.end_time !== undefined) {
      await this.set('timetable_end_time', settings.end_time);
    }

    if (settings.break_start_time !== undefined) {
      await this.set('break_start_time', settings.break_start_time);
    }

    if (settings.break_end_time !== undefined) {
      await this.set('break_end_time', settings.break_end_time);
    }

    if (settings.timetable_breaks !== undefined) {
      await this.set('timetable_breaks', JSON.stringify(settings.timetable_breaks));
    }

    if (settings.break_period_rules !== undefined) {
      await this.set('break_period_rules', JSON.stringify(settings.break_period_rules));
    }

    return this.getTimetableSettings();
  }
}

module.exports = SystemSetting;
