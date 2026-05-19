const pool = require('../config/database');

class TimetableEntry {
  static async ensureActivityColumns() {
    if (this.activityColumnsReady) {
      return;
    }

    const [columns] = await pool.execute('SHOW COLUMNS FROM timetable');
    const columnNames = new Set(columns.map((column) => column.Field));
    const assignmentColumn = columns.find((column) => column.Field === 'assignment_id');

    if (assignmentColumn && assignmentColumn.Null === 'NO') {
      await pool.execute('ALTER TABLE timetable MODIFY assignment_id INT NULL');
    }

    if (!columnNames.has('entry_type')) {
      await pool.execute("ALTER TABLE timetable ADD COLUMN entry_type VARCHAR(20) NOT NULL DEFAULT 'lesson' AFTER module_name");
    }

    if (!columnNames.has('slot_number')) {
      await pool.execute('ALTER TABLE timetable ADD COLUMN slot_number INT NULL AFTER entry_type');
    }

    this.activityColumnsReady = true;
  }

  static async create(timetableData) {
    await this.ensureActivityColumns();

    const {
      class_id,
      assignment_id,
      day_of_week,
      start_time,
      end_time,
      room_id,
      module_name,
      entry_type = 'lesson',
      slot_number = null
    } = timetableData;
    
    const [result] = await pool.execute(
      'INSERT INTO timetable (class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [class_id, assignment_id || null, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number]
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
             a.teacher_id,
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
             a.teacher_id,
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
             a.teacher_id,
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
             a.teacher_id,
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
         OR t.entry_type IN ('break', 'activity')
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
             a.teacher_id,
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
             a.teacher_id,
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
    await this.ensureActivityColumns();
    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type = 'lesson', slot_number = null } = timetableData;
    await pool.execute(
      'UPDATE timetable SET class_id = ?, assignment_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room_id = ?, module_name = ?, entry_type = ?, slot_number = ? WHERE timetable_id = ?',
      [class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number, id]
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
             a.teacher_id,
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
