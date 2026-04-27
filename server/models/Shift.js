const pool = require('../config/database');

class Shift {
  static async create(shiftData) {
    const { shift_name, start_time, end_time } = shiftData;
    
    const [result] = await pool.execute(
      'INSERT INTO shift (shift_name, start_time, end_time) VALUES (?, ?, ?)',
      [shift_name, start_time, end_time]
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
    const { shift_name, start_time, end_time } = shiftData;
    await pool.execute(
      'UPDATE shift SET shift_name = ?, start_time = ?, end_time = ? WHERE shift_id = ?',
      [shift_name, start_time, end_time, id]
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
