const pool = require('../config/database');

class Shift {
  static async create(shiftData) {
    const { shift_name, start_time, end_time, teacher_changeover_minutes } = shiftData;
    
    const [result] = await pool.execute(
      'INSERT INTO shift (shift_name, start_time, end_time, teacher_changeover_minutes) VALUES (?, ?, ?, ?)',
      [shift_name, start_time, end_time, teacher_changeover_minutes || 5]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM shift ORDER BY start_time'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM shift WHERE shift_id = ?',
      [id]
    );
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
    
    if (updates.length === 0) return;
    
    values.push(id);
    await pool.execute(
      `UPDATE shift SET ${updates.join(', ')} WHERE shift_id = ?`,
      values
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM shift WHERE shift_id = ?', [id]);
  }

  static async getShiftWithBreaks(shift_id) {
    const [rows] = await pool.execute(`
      SELECT s.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'break_id', b.break_id,
                 'break_name', b.break_name,
                 'start_time', b.start_time,
                 'end_time', b.end_time
               )
             ) as breaks
      FROM shift s
      LEFT JOIN break_time b ON s.shift_id = b.shift_id
      WHERE s.shift_id = ?
      GROUP BY s.shift_id
    `, [shift_id]);
    return rows[0];
  }

  static async getAllWithBreaks() {
    const [rows] = await pool.execute(`
      SELECT s.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'break_id', b.break_id,
                 'break_name', b.break_name,
                 'start_time', b.start_time,
                 'end_time', b.end_time
               )
             ) as breaks
      FROM shift s
      LEFT JOIN break_time b ON s.shift_id = b.shift_id
      GROUP BY s.shift_id
      ORDER BY s.start_time
    `);
    return rows;
  }
}

module.exports = Shift;
