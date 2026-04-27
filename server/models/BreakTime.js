const pool = require('../config/database');

class BreakTime {
  static async create(breakData) {
    const { shift_id, break_name, start_time, end_time } = breakData;
    
    const [result] = await pool.execute(
      'INSERT INTO break_time (shift_id, break_name, start_time, end_time) VALUES (?, ?, ?, ?)',
      [shift_id, break_name, start_time, end_time]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT b.*, s.shift_name
      FROM break_time b
      LEFT JOIN shift s ON b.shift_id = s.shift_id
      ORDER BY s.shift_name, b.start_time
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT b.*, s.shift_name
      FROM break_time b
      LEFT JOIN shift s ON b.shift_id = s.shift_id
      WHERE b.break_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByShift(shift_id) {
    const [rows] = await pool.execute(`
      SELECT b.*, s.shift_name
      FROM break_time b
      LEFT JOIN shift s ON b.shift_id = s.shift_id
      WHERE b.shift_id = ?
      ORDER BY b.start_time
    `, [shift_id]);
    return rows;
  }

  static async update(id, breakData) {
    const { shift_id, break_name, start_time, end_time } = breakData;
    await pool.execute(
      'UPDATE break_time SET shift_id = ?, break_name = ?, start_time = ?, end_time = ? WHERE break_id = ?',
      [shift_id, break_name, start_time, end_time, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM break_time WHERE break_id = ?', [id]);
  }

  static async checkTimeConflict(shift_id, start_time, end_time, exclude_id = null) {
    let query = `
      SELECT * FROM break_time 
      WHERE shift_id = ? 
      AND (
        (start_time < ? AND end_time > ?) 
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `;
    let params = [shift_id, start_time, start_time, end_time, end_time, start_time, end_time];
    
    if (exclude_id) {
      query += ' AND break_id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = BreakTime;
