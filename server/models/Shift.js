const pool = require('../config/database');

class Shift {
  static async create(shiftData) {
    const { shift_name, start_time, end_time, teacher_changeover_minutes } = shiftData;
    const [result] = await pool.execute(
      'INSERT INTO shift (shift_name, start_time, end_time, teacher_changeover_minutes) VALUES (?, ?, ?, ?)',
      [shift_name, start_time, end_time, teacher_changeover_minutes ?? 5]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute('SELECT * FROM shift ORDER BY start_time');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM shift WHERE shift_id = ?', [id]);
    return rows[0];
  }

  static async update(id, shiftData) {
    const { shift_name, start_time, end_time, teacher_changeover_minutes } = shiftData;
    const updates = [];
    const values = [];

    if (shift_name !== undefined) {
      updates.push('shift_name = ?');
      values.push(shift_name);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (teacher_changeover_minutes !== undefined) {
      updates.push('teacher_changeover_minutes = ?');
      values.push(teacher_changeover_minutes);
    }

    if (!updates.length) return;

    values.push(id);
    await pool.execute(`UPDATE shift SET ${updates.join(', ')} WHERE shift_id = ?`, values);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM shift WHERE shift_id = ?', [id]);
  }

  static async getShiftWithBreaks(shift_id) {
    const shift = await this.findById(shift_id);
    if (!shift) return null;

    const [breaks] = await pool.execute(
      'SELECT * FROM break_time WHERE shift_id = ? ORDER BY start_time',
      [shift_id]
    );

    return {
      ...shift,
      breaks
    };
  }

  static async getAllWithBreaks() {
    const shifts = await this.getAll();
    const [breaks] = await pool.execute('SELECT * FROM break_time ORDER BY start_time');
    return shifts.map((shift) => ({
      ...shift,
      breaks: breaks.filter((breakItem) => breakItem.shift_id === shift.shift_id)
    }));
  }
}

module.exports = Shift;
