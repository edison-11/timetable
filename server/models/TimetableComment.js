const pool = require('../config/database');

class TimetableComment {
  static async create(commentData) {
    const { timetable_id, teacher_id, comment_text } = commentData;
    
    const [result] = await pool.execute(
      'INSERT INTO timetable_comment (timetable_id, teacher_id, comment_text) VALUES (?, ?, ?)',
      [timetable_id, teacher_id, comment_text]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT tc.*, 
             t.name as teacher_name,
             tt.class_id,
             c.class_name,
             c.level,
             COALESCE(NULLIF(tt.module_name, ''), m.module_name) as module_name,
             a.academic_year,
             a.term
      FROM timetable_comment tc
      LEFT JOIN teacher t ON tc.teacher_id = t.teacher_id
      LEFT JOIN timetable tt ON tc.timetable_id = tt.timetable_id
      LEFT JOIN class c ON tt.class_id = c.class_id
      LEFT JOIN assignment a ON tt.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      ORDER BY tc.comment_date DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT tc.*, 
             t.name as teacher_name,
             tt.class_id,
             c.class_name,
             c.level,
             COALESCE(NULLIF(tt.module_name, ''), m.module_name) as module_name,
             a.academic_year,
             a.term
      FROM timetable_comment tc
      LEFT JOIN teacher t ON tc.teacher_id = t.teacher_id
      LEFT JOIN timetable tt ON tc.timetable_id = tt.timetable_id
      LEFT JOIN class c ON tt.class_id = c.class_id
      LEFT JOIN assignment a ON tt.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      WHERE tc.comment_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByTimetable(timetable_id) {
    const [rows] = await pool.execute(`
      SELECT tc.*, 
             t.name as teacher_name
      FROM timetable_comment tc
      LEFT JOIN teacher t ON tc.teacher_id = t.teacher_id
      WHERE tc.timetable_id = ?
      ORDER BY tc.comment_date DESC
    `, [timetable_id]);
    return rows;
  }

  static async getByTeacher(teacher_id) {
    const [rows] = await pool.execute(`
      SELECT tc.*, 
             t.name as teacher_name,
             tt.class_id,
             c.class_name,
             c.level,
             COALESCE(NULLIF(tt.module_name, ''), m.module_name) as module_name,
             a.academic_year,
             a.term
      FROM timetable_comment tc
      LEFT JOIN teacher t ON tc.teacher_id = t.teacher_id
      LEFT JOIN timetable tt ON tc.timetable_id = tt.timetable_id
      LEFT JOIN class c ON tt.class_id = c.class_id
      LEFT JOIN assignment a ON tt.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      WHERE tc.teacher_id = ?
      ORDER BY tc.comment_date DESC
    `, [teacher_id]);
    return rows;
  }

  static async getByClass(class_id) {
    const [rows] = await pool.execute(`
      SELECT tc.*, 
             t.name as teacher_name,
             tt.class_id,
             c.class_name,
             c.level,
             COALESCE(NULLIF(tt.module_name, ''), m.module_name) as module_name,
             a.academic_year,
             a.term
      FROM timetable_comment tc
      LEFT JOIN teacher t ON tc.teacher_id = t.teacher_id
      LEFT JOIN timetable tt ON tc.timetable_id = tt.timetable_id
      LEFT JOIN class c ON tt.class_id = c.class_id
      LEFT JOIN assignment a ON tt.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      WHERE tt.class_id = ?
      ORDER BY tc.comment_date DESC
    `, [class_id]);
    return rows;
  }

  static async update(id, commentData) {
    const { comment_text } = commentData;
    await pool.execute(
      'UPDATE timetable_comment SET comment_text = ? WHERE comment_id = ?',
      [comment_text, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM timetable_comment WHERE comment_id = ?', [id]);
  }

  static async getRecentComments(limit = 10) {
    const [rows] = await pool.execute(`
      SELECT tc.*, 
             t.name as teacher_name,
             c.class_name,
             c.level,
             COALESCE(NULLIF(tt.module_name, ''), m.module_name) as module_name
      FROM timetable_comment tc
      LEFT JOIN teacher t ON tc.teacher_id = t.teacher_id
      LEFT JOIN timetable tt ON tc.timetable_id = tt.timetable_id
      LEFT JOIN class c ON tt.class_id = c.class_id
      LEFT JOIN assignment a ON tt.assignment_id = a.assignment_id
      LEFT JOIN module m ON a.module_id = m.module_id
      ORDER BY tc.comment_date DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }
}

module.exports = TimetableComment;
