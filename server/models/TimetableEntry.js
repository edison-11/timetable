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

    if (!columnNames.has('status')) {
      await pool.execute("ALTER TABLE timetable ADD COLUMN status ENUM('draft', 'published') DEFAULT 'draft' AFTER slot_number");
    }

    if (!columnNames.has('academic_year')) {
      await pool.execute('ALTER TABLE timetable ADD COLUMN academic_year VARCHAR(20) NULL AFTER status');
    }

    if (!columnNames.has('term')) {
      await pool.execute('ALTER TABLE timetable ADD COLUMN term VARCHAR(20) NULL AFTER academic_year');
    }

    if (!columnNames.has('school_id')) {
      await pool.execute('ALTER TABLE timetable ADD COLUMN school_id INT NULL');
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
      slot_number = null,
      status = 'draft',
      academic_year = null,
      term = null,
      school_id = null
    } = timetableData;
    
    const [result] = await pool.execute(
      'INSERT INTO timetable (class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number, status, academic_year, term, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [class_id, assignment_id || null, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number, status, academic_year, term, school_id || null]
    );
    
    return result.insertId;
  }

  static async getAll(filters = {}) {
    await this.ensureActivityColumns();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('t.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             a.teacher_id,
             tr.name as teacher_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY t.day_of_week, t.start_time
    `, values);
    return rows;
  }

  static async findById(id) {
    await this.ensureActivityColumns();
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             a.teacher_id,
             tr.name as teacher_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      WHERE t.timetable_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByClass(class_id, filters = {}) {
    await this.ensureActivityColumns();
    const where = ['t.class_id = ?'];
    const values = [class_id];
    if (filters.school_id) {
      where.push('t.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             a.teacher_id,
             tr.name as teacher_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.day_of_week, t.start_time
    `, values);
    return rows;
  }

  static async getByTeacher(teacher_id, filters = {}) {
    await this.ensureActivityColumns();
    const schoolClause = filters.school_id ? 'AND t.school_id = ?' : '';
    const values = [teacher_id];
    if (filters.school_id) values.push(filters.school_id);
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             a.teacher_id,
             tr.name as teacher_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      WHERE a.teacher_id = ?
      ${schoolClause}
      ORDER BY t.day_of_week, t.start_time
    `, values);
    return rows;
  }

  static async getByRoom(room_id, filters = {}) {
    await this.ensureActivityColumns();
    const where = ['t.room_id = ?'];
    const values = [room_id];
    if (filters.school_id) {
      where.push('t.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             a.teacher_id,
             tr.name as teacher_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.day_of_week, t.start_time
    `, values);
    return rows;
  }

  static async getByDay(day_of_week, filters = {}) {
    await this.ensureActivityColumns();
    const where = ['t.day_of_week = ?'];
    const values = [day_of_week];
    if (filters.school_id) {
      where.push('t.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT t.*, 
             c.class_name,
             c.level,
             a.academic_year,
             a.term,
             a.teacher_id,
             tr.name as teacher_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.start_time
    `, values);
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
    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type = 'lesson', slot_number = null, status = 'draft', academic_year = null, term = null, school_id = null } = timetableData;
    await pool.execute(
      'UPDATE timetable SET class_id = ?, assignment_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room_id = ?, module_name = ?, entry_type = ?, slot_number = ?, status = ?, academic_year = ?, term = ?, school_id = COALESCE(?, school_id) WHERE timetable_id = ?',
      [class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number, status, academic_year, term, school_id || null, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM timetable WHERE timetable_id = ?', [id]);
  }

  static async deleteByClass(class_id, filters = {}) {
    const schoolClause = filters.school_id ? ' AND school_id = ?' : '';
    const values = [class_id];
    if (filters.school_id) values.push(filters.school_id);
    await pool.execute(`DELETE FROM timetable WHERE class_id = ?${schoolClause}`, values);
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
             COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name,
             COALESCE(r.room_name, cr.room_name) as room_name,
             COALESCE(r.room_type, cr.room_type) as room_type
      FROM timetable t
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher tr ON a.teacher_id = tr.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      LEFT JOIN room cr ON c.room_id = cr.room_id
      WHERE t.class_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time
    `, [class_id]);
    return rows;
  }
}

module.exports = TimetableEntry;
