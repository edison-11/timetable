const pool = require('../config/database');

class Assignment {
  static async create(assignmentData) {
    const { teacher_id, module_id, class_id, academic_year, term } = assignmentData;
    
    const [result] = await pool.execute(
      'INSERT INTO assignment (teacher_id, module_id, class_id, academic_year, term) VALUES (?, ?, ?, ?, ?)',
      [teacher_id, module_id, class_id, academic_year, term]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT a.*, 
             t.name as teacher_name,
             t.department as teacher_department,
             m.module_name,
             m.hours_per_year,
             c.class_name,
             c.level,
             c.shift_id,
             s.shift_name
      FROM assignment a
      LEFT JOIN teacher t ON a.teacher_id = t.teacher_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN class c ON a.class_id = c.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      ORDER BY a.academic_year, a.term, c.level, c.class_name
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT a.*, 
             t.name as teacher_name,
             t.department as teacher_department,
             m.module_name,
             m.hours_per_year,
             c.class_name,
             c.level,
             c.shift_id,
             s.shift_name
      FROM assignment a
      LEFT JOIN teacher t ON a.teacher_id = t.teacher_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN class c ON a.class_id = c.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      WHERE a.assignment_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByTeacher(teacher_id) {
    const [rows] = await pool.execute(`
      SELECT a.*, 
             t.name as teacher_name,
             t.department as teacher_department,
             m.module_name,
             m.hours_per_year,
             c.class_name,
             c.level,
             c.shift_id,
             s.shift_name
      FROM assignment a
      LEFT JOIN teacher t ON a.teacher_id = t.teacher_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN class c ON a.class_id = c.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      WHERE a.teacher_id = ?
      ORDER BY a.academic_year, a.term, c.level, c.class_name
    `, [teacher_id]);
    return rows;
  }

  static async getByClass(class_id) {
    const [rows] = await pool.execute(`
      SELECT a.*, 
             t.name as teacher_name,
             t.department as teacher_department,
             m.module_name,
             m.hours_per_year,
             c.class_name,
             c.level,
             c.shift_id,
             s.shift_name
      FROM assignment a
      LEFT JOIN teacher t ON a.teacher_id = t.teacher_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN class c ON a.class_id = c.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      WHERE a.class_id = ?
      ORDER BY a.academic_year, a.term, m.module_name
    `, [class_id]);
    return rows;
  }

  static async getByModule(module_id) {
    const [rows] = await pool.execute(`
      SELECT a.*, 
             t.name as teacher_name,
             t.department as teacher_department,
             m.module_name,
             m.hours_per_year,
             c.class_name,
             c.level,
             c.shift_id,
             s.shift_name
      FROM assignment a
      LEFT JOIN teacher t ON a.teacher_id = t.teacher_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN class c ON a.class_id = c.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      WHERE a.module_id = ?
      ORDER BY a.academic_year, a.term, c.level, c.class_name
    `, [module_id]);
    return rows;
  }

  static async getByAcademicYear(academic_year) {
    const [rows] = await pool.execute(`
      SELECT a.*, 
             t.name as teacher_name,
             t.department as teacher_department,
             m.module_name,
             m.hours_per_year,
             c.class_name,
             c.level,
             c.shift_id,
             s.shift_name
      FROM assignment a
      LEFT JOIN teacher t ON a.teacher_id = t.teacher_id
      LEFT JOIN module m ON a.module_id = m.module_id
      LEFT JOIN class c ON a.class_id = c.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      WHERE a.academic_year = ?
      ORDER BY a.term, c.level, c.class_name
    `, [academic_year]);
    return rows;
  }

  static async update(id, assignmentData) {
    const { teacher_id, module_id, class_id, academic_year, term } = assignmentData;
    await pool.execute(
      'UPDATE assignment SET teacher_id = ?, module_id = ?, class_id = ?, academic_year = ?, term = ? WHERE assignment_id = ?',
      [teacher_id, module_id, class_id, academic_year, term, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM assignment WHERE assignment_id = ?', [id]);
  }

  static async checkConflict(teacher_id, module_id, class_id, academic_year, term, exclude_id = null) {
    let query = `
      SELECT * FROM assignment 
      WHERE teacher_id = ? 
      AND module_id = ? 
      AND class_id = ? 
      AND academic_year = ? 
      AND term = ?
    `;
    let params = [teacher_id, module_id, class_id, academic_year, term];
    
    if (exclude_id) {
      query += ' AND assignment_id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
}

module.exports = Assignment;
