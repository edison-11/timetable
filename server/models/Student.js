const db = require('../config/database');
const User = require('./User');

class Student {
  static async createParentUserIfNeeded(studentData) {
    const parentEmail = String(studentData.parent_email || '').trim();
    const parentPassword = String(studentData.parent_password || '').trim();

    if (!parentEmail || !parentPassword) {
      return studentData.user_id || null;
    }

    const existingUser = await User.findByEmail(parentEmail);
    if (existingUser) return existingUser.id;

    return User.create({
      full_name: studentData.parent_name || `${studentData.name} Parent`,
      username: studentData.parent_name || `${studentData.name} Parent`,
      email: parentEmail,
      phone: studentData.parent_phone,
      password: parentPassword,
      role: 'student',
      is_verified: true
    });
  }

  static async create(studentData) {
    const user_id = await this.createParentUserIfNeeded(studentData);
    const {
      student_number,
      name,
      sex = null,
      email = null,
      parent_name = null,
      parent_email = null,
      parent_phone = null,
      class_id = null,
      section_id = null,
      academic_year
    } = studentData;
    const query = `
      INSERT INTO student
        (user_id, student_number, name, sex, email, parent_name, parent_email, parent_phone, class_id, section_id, academic_year, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    const [result] = await db.query(query, [
      user_id,
      student_number,
      name,
      sex || null,
      email || null,
      parent_name || null,
      parent_email || null,
      parent_phone || null,
      class_id || null,
      section_id || null,
      academic_year
    ]);
    return this.findById(result.insertId);
  }

  static async findById(studentId) {
    const query = `
      SELECT s.*, c.class_name, c.class_teacher_id, sec.section_name, sec.level
      FROM student s
      LEFT JOIN class c ON s.class_id = c.class_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      WHERE s.student_id = ?
    `;
    const [rows] = await db.query(query, [studentId]);
    return rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT s.*, c.class_name, c.class_teacher_id, sec.section_name, sec.level
      FROM student s
      LEFT JOIN class c ON s.class_id = c.class_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      WHERE s.user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows[0];
  }

  static async findByStudentNumber(studentNumber) {
    const query = `
      SELECT s.*, c.class_name, c.class_teacher_id, sec.section_name, sec.level
      FROM student s
      LEFT JOIN class c ON s.class_id = c.class_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      WHERE s.student_number = ?
    `;
    const [rows] = await db.query(query, [studentNumber]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, c.class_name, c.class_teacher_id, sec.section_name, sec.level
      FROM student s
      LEFT JOIN class c ON s.class_id = c.class_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.class_id) {
      query += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.section_id) {
      query += ' AND s.section_id = ?';
      params.push(filters.section_id);
    }

    if (filters.academic_year) {
      query += ' AND s.academic_year = ?';
      params.push(filters.academic_year);
    }

    if (filters.status) {
      query += ' AND s.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY s.name ASC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(studentId, updateData) {
    const allowed = [
      'name',
      'sex',
      'email',
      'parent_name',
      'parent_email',
      'parent_phone',
      'class_id',
      'section_id',
      'academic_year',
      'status'
    ];
    const assignments = [];
    const params = [];

    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        assignments.push(`${field} = ?`);
        params.push(updateData[field] || null);
      }
    }

    if (!assignments.length) return this.findById(studentId);

    params.push(studentId);
    await db.query(
      `UPDATE student SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?`,
      params
    );
    return this.findById(studentId);
  }

  static async delete(studentId) {
    const query = 'DELETE FROM student WHERE student_id = ?';
    await db.query(query, [studentId]);
  }

  static async getTimetable(studentId, academicYear, term) {
    const student = await this.findById(studentId);
    if (!student || !student.class_id) return [];

    const query = `
      SELECT t.*, c.class_name, COALESCE(NULLIF(t.module_name, ''), m.module_name) as module_name, r.room_name,
             te.name as teacher_name
      FROM timetable t
      JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher te ON a.teacher_id = te.teacher_id
      LEFT JOIN room r ON t.room_id = r.room_id
      WHERE t.class_id = ?
        AND t.status = 'published'
        ${academicYear ? 'AND t.academic_year = ?' : ''}
        ${term ? 'AND t.term = ?' : ''}
      ORDER BY 
        FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        t.start_time ASC
    `;

    const params = [student.class_id];
    if (academicYear) params.push(academicYear);
    if (term) params.push(term);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getTeacherClasses(teacherId) {
    const [rows] = await db.query(`
      SELECT DISTINCT c.*,
             sec.section_name,
             COUNT(DISTINCT s.student_id) as student_count,
             CASE
               WHEN c.class_teacher_id = ? THEN 'class_teacher'
               ELSE 'subject_teacher'
             END as teacher_relation
      FROM class c
      LEFT JOIN section sec ON c.section_id = sec.section_id
      LEFT JOIN student s ON s.class_id = c.class_id AND s.status = 'active'
      LEFT JOIN assignment a ON a.class_id = c.class_id
      WHERE c.class_teacher_id = ? OR a.teacher_id = ?
      GROUP BY c.class_id
      ORDER BY c.level, c.class_name
    `, [teacherId, teacherId, teacherId]);

    return rows;
  }

  static async getClassStudentsForTeacher(classId, teacherId) {
    const [allowedRows] = await db.query(`
      SELECT c.class_id
      FROM class c
      LEFT JOIN assignment a ON a.class_id = c.class_id
      WHERE c.class_id = ? AND (c.class_teacher_id = ? OR a.teacher_id = ?)
      LIMIT 1
    `, [classId, teacherId, teacherId]);

    if (!allowedRows.length) return null;

    return this.findAll({ class_id: classId, status: 'active' });
  }

  static async getAttendance({ class_id, attendance_date, timetable_id = null, period_label = null }) {
    const params = [class_id, attendance_date];
    let filter = 'class_id = ? AND attendance_date = ?';

    if (timetable_id) {
      filter += ' AND timetable_id = ?';
      params.push(timetable_id);
    } else {
      filter += ' AND timetable_id IS NULL';
    }

    if (period_label) {
      filter += ' AND period_label = ?';
      params.push(period_label);
    }

    const [rows] = await db.query(`
      SELECT * FROM student_attendance
      WHERE ${filter}
    `, params);

    return rows;
  }

  static async getAttendanceHistory(studentId, filters = {}) {
    const params = [studentId];
    let query = `
      SELECT sa.*,
             s.name as student_name,
             s.student_number,
             c.class_name,
             COALESCE(NULLIF(t.module_name, ''), m.module_name, sa.period_label) as module_name,
             te.name as teacher_name,
             t.day_of_week,
             t.start_time,
             t.end_time
      FROM student_attendance sa
      INNER JOIN student s ON sa.student_id = s.student_id
      LEFT JOIN class c ON sa.class_id = c.class_id
      LEFT JOIN timetable t ON sa.timetable_id = t.timetable_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN teacher te ON sa.teacher_id = te.teacher_id
      WHERE sa.student_id = ?
    `;

    if (filters.status) {
      query += ' AND sa.status = ?';
      params.push(filters.status);
    }

    if (filters.from_date) {
      query += ' AND sa.attendance_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ' AND sa.attendance_date <= ?';
      params.push(filters.to_date);
    }

    query += ' ORDER BY sa.attendance_date DESC, t.start_time ASC, sa.period_label ASC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async saveAttendance({ class_id, timetable_id = null, teacher_id, attendance_date, period_label = null, records = [] }) {
    const saved = [];

    for (const record of records) {
      const lookupParams = [record.student_id, attendance_date];
      let lookupWhere = 'student_id = ? AND attendance_date = ?';

      if (timetable_id) {
        lookupWhere += ' AND timetable_id = ?';
        lookupParams.push(timetable_id);
      } else {
        lookupWhere += ' AND timetable_id IS NULL';
      }

      if (period_label) {
        lookupWhere += ' AND period_label = ?';
        lookupParams.push(period_label);
      } else {
        lookupWhere += ' AND period_label IS NULL';
      }

      const [existingRows] = await db.query(
        `SELECT attendance_id FROM student_attendance WHERE ${lookupWhere} LIMIT 1`,
        lookupParams
      );

      const values = [
        record.student_id,
        class_id,
        timetable_id || null,
        teacher_id || null,
        attendance_date,
        period_label || null,
        record.status || 'present',
        record.notes || null
      ];

      if (existingRows[0]) {
        await db.query(`
          UPDATE student_attendance
          SET class_id = ?,
              timetable_id = ?,
              teacher_id = ?,
              period_label = ?,
              status = ?,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE attendance_id = ?
        `, [
          class_id,
          timetable_id || null,
          teacher_id || null,
          period_label || null,
          record.status || 'present',
          record.notes || null,
          existingRows[0].attendance_id
        ]);
        saved.push({ ...record, attendance_id: existingRows[0].attendance_id });
        continue;
      }

      const [result] = await db.query(`
        INSERT INTO student_attendance
          (student_id, class_id, timetable_id, teacher_id, attendance_date, period_label, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, values);

      saved.push({ ...record, attendance_id: result.insertId || record.attendance_id || null });
    }

    return saved;
  }
}

module.exports = Student;
