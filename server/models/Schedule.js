const pool = require('../config/database');

class Schedule {
  static async create(scheduleData) {
    const { timetable_id, day_of_week, start_time, end_time, subject, room, teacher } = scheduleData;
    
    const [result] = await pool.execute(
      'INSERT INTO schedules (timetable_id, day_of_week, start_time, end_time, subject, room, teacher) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [timetable_id, day_of_week, start_time, end_time, subject, room, teacher]
    );
    
    return result.insertId;
  }

  static async getByTimetableId(timetable_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM schedules WHERE timetable_id = ? ORDER BY day_of_week, start_time',
      [timetable_id]
    );
    return rows;
  }

  static async update(id, scheduleData) {
    const { day_of_week, start_time, end_time, subject, room, teacher } = scheduleData;
    
    await pool.execute(
      'UPDATE schedules SET day_of_week = ?, start_time = ?, end_time = ?, subject = ?, room = ?, teacher = ? WHERE id = ?',
      [day_of_week, start_time, end_time, subject, room, teacher, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM schedules WHERE id = ?', [id]);
  }

  static async deleteByTimetableId(timetable_id) {
    await pool.execute('DELETE FROM schedules WHERE timetable_id = ?', [timetable_id]);
  }

  static async getConflicts(timetable_id, day_of_week, start_time, end_time, exclude_id = null) {
    let query = `
      SELECT * FROM schedules 
      WHERE timetable_id = ? 
      AND day_of_week = ?
      AND (
        (start_time < ? AND end_time > ?) 
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `;
    let params = [timetable_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time];
    
    if (exclude_id) {
      query += ' AND id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Schedule;
