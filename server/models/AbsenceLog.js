const db = require('../config/database');

class AbsenceLog {
  static async create(absenceData) {
    const { teacher_id, start_date, end_date, reason } = absenceData;
    const query = `
      INSERT INTO absence_log (teacher_id, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(query, [teacher_id, start_date, end_date, reason]);
    return this.findById(result.insertId);
  }

  static async findById(absenceId) {
    const query = `
      SELECT al.*, t.name as teacher_name, t.email as teacher_email, t.department
      FROM absence_log al
      JOIN teacher t ON al.teacher_id = t.teacher_id
      WHERE al.absence_id = ?
    `;
    const [rows] = await db.query(query, [absenceId]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT al.*, t.name as teacher_name, t.email as teacher_email, t.department,
             st.name as substitute_name
      FROM absence_log al
      JOIN teacher t ON al.teacher_id = t.teacher_id
      LEFT JOIN teacher st ON al.substitute_teacher_id = st.teacher_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND al.status = ?';
      params.push(filters.status);
    }

    if (filters.teacher_id) {
      query += ' AND al.teacher_id = ?';
      params.push(filters.teacher_id);
    }

    if (filters.start_date) {
      query += ' AND al.start_date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND al.end_date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY al.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(absenceId, updateData) {
    const { substitute_teacher_id, status } = updateData;
    const query = `
      UPDATE absence_log
      SET substitute_teacher_id = COALESCE(?, substitute_teacher_id),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE absence_id = ?
    `;
    await db.query(query, [substitute_teacher_id, status, absenceId]);
    return this.findById(absenceId);
  }

  static async delete(absenceId) {
    const query = 'DELETE FROM absence_log WHERE absence_id = ?';
    await db.query(query, [absenceId]);
  }

  static async findAvailableSubstitutes(teacherId, startDate, endDate) {
    // Get the absent teacher's department
    const [teacher] = await db.query(
      'SELECT department FROM teacher WHERE teacher_id = ?',
      [teacherId]
    );

    if (!teacher.length) return [];

    const department = teacher[0].department;

    // Find teachers in the same department who are active and not on leave
    const query = `
      SELECT t.teacher_id, t.name, t.email, t.department
      FROM teacher t
      WHERE t.department = ?
        AND t.teacher_id != ?
        AND t.status = 'active'
      ORDER BY t.name ASC
    `;

    const [teachers] = await db.query(query, [department, teacherId]);
    return teachers;
  }

  static async getTeacherSchedule(teacherId, date) {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    
    const query = `
      SELECT t.*, c.class_name, COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name, r.room_name
      FROM timetable t
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN class c ON t.class_id = c.class_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE a.teacher_id = ?
        AND t.day_of_week = ?
        AND t.status = 'published'
      ORDER BY t.start_time ASC
    `;

    const [rows] = await db.query(query, [teacherId, dayOfWeek]);
    return rows;
  }
}

module.exports = AbsenceLog;
