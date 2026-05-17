const db = require('../config/database');

class SubstitutionLog {
  static async create(substitutionData) {
    const { absence_id, timetable_id, original_teacher_id, substitute_teacher_id, substitution_date, notes } = substitutionData;
    const query = `
      INSERT INTO substitution_log (absence_id, timetable_id, original_teacher_id, substitute_teacher_id, substitution_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [absence_id, timetable_id, original_teacher_id, substitute_teacher_id, substitution_date, notes]);
    return this.findById(result.insertId);
  }

  static async findById(substitutionId) {
    const query = `
      SELECT sl.*, 
             t1.name as original_teacher_name, 
             t2.name as substitute_teacher_name,
             c.class_name,
             m.module_name
      FROM substitution_log sl
      JOIN teacher t1 ON sl.original_teacher_id = t1.teacher_id
      JOIN teacher t2 ON sl.substitute_teacher_id = t2.teacher_id
      JOIN timetable t ON sl.timetable_id = t.timetable_id
      JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      WHERE sl.substitution_id = ?
    `;
    const [rows] = await db.query(query, [substitutionId]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT sl.*, 
             t1.name as original_teacher_name, 
             t2.name as substitute_teacher_name,
             c.class_name,
             m.module_name
      FROM substitution_log sl
      JOIN teacher t1 ON sl.original_teacher_id = t1.teacher_id
      JOIN teacher t2 ON sl.substitute_teacher_id = t2.teacher_id
      JOIN timetable t ON sl.timetable_id = t.timetable_id
      JOIN class c ON t.class_id = c.class_id
      LEFT JOIN assignment a ON t.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.absence_id) {
      query += ' AND sl.absence_id = ?';
      params.push(filters.absence_id);
    }

    if (filters.substitution_date) {
      query += ' AND sl.substitution_date = ?';
      params.push(filters.substitution_date);
    }

    if (filters.original_teacher_id) {
      query += ' AND sl.original_teacher_id = ?';
      params.push(filters.original_teacher_id);
    }

    if (filters.substitute_teacher_id) {
      query += ' AND sl.substitute_teacher_id = ?';
      params.push(filters.substitute_teacher_id);
    }

    query += ' ORDER BY sl.substitution_date DESC, sl.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(substitutionId, updateData) {
    const { notes } = updateData;
    const query = `
      UPDATE substitution_log
      SET notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE substitution_id = ?
    `;
    await db.query(query, [notes, substitutionId]);
    return this.findById(substitutionId);
  }

  static async delete(substitutionId) {
    const query = 'DELETE FROM substitution_log WHERE substitution_id = ?';
    await db.query(query, [substitutionId]);
  }

  static async getByAbsenceId(absenceId) {
    return this.findAll({ absence_id });
  }

  static async getByDate(date) {
    return this.findAll({ substitution_date: date });
  }

  static async getByTeacher(teacherId) {
    return this.findAll({ substitute_teacher_id: teacherId });
  }
}

module.exports = SubstitutionLog;
