const pool = require('../config/database');

class TimetableEntry {
  static async create(timetableData) {
    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name } = timetableData;
    
    const [result] = await pool.execute(
      'INSERT INTO timetable (class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      ORDER BY t.day_of_week, t.start_time
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE t.timetable_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByClass(class_id) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE t.class_id = ?
      ORDER BY t.day_of_week, t.start_time
    `, [class_id]);
    return rows;
  }

  static async getByTeacher(teacher_id) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE a.teacher_id = ?
      ORDER BY t.day_of_week, t.start_time
    `, [teacher_id]);
    return rows;
  }

  static async getByRoom(room_id) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE t.room_id = ?
      ORDER BY t.day_of_week, t.start_time
    `, [room_id]);
    return rows;
  }

  static async getByDay(day_of_week) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE t.day_of_week = ?
      ORDER BY t.start_time
    `, [day_of_week]);
    return rows;
  }

  static async getConflicts(class_id, day_of_week, start_time, end_time, exclude_id = null) {
    let query = `
      SELECT * FROM timetable 
      WHERE class_id = ? 
      AND day_of_week = ?
      AND (
        (start_time < ? AND end_time > ?) 
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `;
    let params = [class_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time];
    
    if (exclude_id) {
      query += ' AND timetable_id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getTeacherConflicts(teacher_id, day_of_week, start_time, end_time, exclude_id = null) {
    let query = `
      SELECT t.* FROM timetable t
      INNER JOIN assignment a ON t.assignment_id = a.assignment_id
      WHERE a.teacher_id = ? 
      AND t.day_of_week = ?
      AND (
        (t.start_time < ? AND t.end_time > ?) 
        OR (t.start_time < ? AND t.end_time > ?)
        OR (t.start_time >= ? AND t.end_time <= ?)
      )
    `;
    let params = [teacher_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time];
    
    if (exclude_id) {
      query += ' AND t.timetable_id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getRoomConflicts(room_id, day_of_week, start_time, end_time, exclude_id = null) {
    let query = `
      SELECT * FROM timetable 
      WHERE room_id = ? 
      AND day_of_week = ?
      AND (
        (start_time < ? AND end_time > ?) 
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `;
    let params = [room_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time];
    
    if (exclude_id) {
      query += ' AND timetable_id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(id, timetableData) {
    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id } = timetableData;
    await pool.execute(
      'UPDATE timetable SET class_id = ?, assignment_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room_id = ? WHERE timetable_id = ?',
      [class_id, assignment_id, day_of_week, start_time, end_time, room_id, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM timetable WHERE timetable_id = ?', [id]);
  }

  static async deleteByClass(class_id) {
    await pool.execute('DELETE FROM timetable WHERE class_id = ?', [class_id]);
  }

  static async getWeeklySchedule(class_id) {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             tr.name as teacher_name,
             t.module_name,
             r.room_name,
             r.room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE t.class_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time
    `, [class_id]);
    return rows;
  }
}

module.exports = TimetableEntry;
