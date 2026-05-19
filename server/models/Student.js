const db = require('../config/database');

class Student {
  static async create(studentData) {
    const { user_id, student_number, name, email, class_id, section_id, academic_year } = studentData;
    const query = `
      INSERT INTO student (user_id, student_number, name, email, class_id, section_id, academic_year, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    const [result] = await db.query(query, [user_id, student_number, name, email, class_id, section_id, academic_year]);
    return this.findById(result.insertId);
  }

  static async findById(studentId) {
    const query = `
      SELECT s.*, c.class_name, sec.section_name, sec.level
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
      SELECT s.*, c.class_name, sec.section_name, sec.level
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
      SELECT s.*, c.class_name, sec.section_name, sec.level
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
      SELECT s.*, c.class_name, sec.section_name, sec.level
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
    const { name, email, class_id, section_id, academic_year, status } = updateData;
    const query = `
      UPDATE student
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          class_id = COALESCE(?, class_id),
          section_id = COALESCE(?, section_id),
          academic_year = COALESCE(?, academic_year),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE student_id = ?
    `;
    await db.query(query, [name, email, class_id, section_id, academic_year, status, studentId]);
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
}

module.exports = Student;
