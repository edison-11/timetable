const pool = require('../config/database');

class Assignment {
  static schemaReady = false;

  static async columnExists(columnName) {
    const [rows] = await pool.query('SHOW COLUMNS FROM assignment LIKE ?', [columnName]);
    return rows.length > 0;
  }

  static async ensureSchema() {
    if (this.schemaReady) return;
    if (!(await this.columnExists('school_id'))) {
      await pool.query('ALTER TABLE assignment ADD COLUMN school_id INT NULL');
    }
    this.schemaReady = true;
  }

  static async create(assignmentData) {
    await this.ensureSchema();
    const { teacher_id, module_id, class_id, academic_year, term, school_id = null } = assignmentData;
    
    const [result] = await pool.execute(
      'INSERT INTO assignment (teacher_id, module_id, class_id, academic_year, term, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [teacher_id, module_id, class_id, academic_year, term, school_id || null]
    );
    
    return result.insertId;
  }

  static async getAll(filters = {}) {
    await this.ensureSchema();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('a.school_id = ?');
      values.push(filters.school_id);
    }
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
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY a.academic_year, a.term, c.level, c.class_name
    `, values);
    return rows;
  }

  static async findById(id) {
    await this.ensureSchema();
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

  static async getByTeacher(teacher_id, filters = {}) {
    await this.ensureSchema();
    const where = ['a.teacher_id = ?'];
    const values = [teacher_id];
    if (filters.school_id) {
      where.push('a.school_id = ?');
      values.push(filters.school_id);
    }
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
      WHERE ${where.join(' AND ')}
      ORDER BY a.academic_year, a.term, c.level, c.class_name
    `, values);
    return rows;
  }

  static async getByClass(class_id, filters = {}) {
    await this.ensureSchema();
    const where = ['a.class_id = ?'];
    const values = [class_id];
    if (filters.school_id) {
      where.push('a.school_id = ?');
      values.push(filters.school_id);
    }
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
      WHERE ${where.join(' AND ')}
      ORDER BY a.academic_year, a.term, m.module_name
    `, values);
    return rows;
  }

  static async getByModule(module_id, filters = {}) {
    await this.ensureSchema();
    const where = ['a.module_id = ?'];
    const values = [module_id];
    if (filters.school_id) {
      where.push('a.school_id = ?');
      values.push(filters.school_id);
    }
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
      WHERE ${where.join(' AND ')}
      ORDER BY a.academic_year, a.term, c.level, c.class_name
    `, values);
    return rows;
  }

  static async getByAcademicYear(academic_year, filters = {}) {
    await this.ensureSchema();
    const where = ['a.academic_year = ?'];
    const values = [academic_year];
    if (filters.school_id) {
      where.push('a.school_id = ?');
      values.push(filters.school_id);
    }
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
      WHERE ${where.join(' AND ')}
      ORDER BY a.term, c.level, c.class_name
    `, values);
    return rows;
  }

  static async update(id, assignmentData) {
    await this.ensureSchema();
    const { teacher_id, module_id, class_id, academic_year, term, school_id } = assignmentData;
    await pool.execute(
      'UPDATE assignment SET teacher_id = ?, module_id = ?, class_id = ?, academic_year = ?, term = ?, school_id = COALESCE(?, school_id) WHERE assignment_id = ?',
      [teacher_id, module_id, class_id, academic_year, term, school_id || null, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM assignment WHERE assignment_id = ?', [id]);
  }

  static async findByCombination(teacher_id, module_id, class_id, academic_year, term, filters = {}) {
    await this.ensureSchema();
    const schoolClause = filters.school_id ? 'AND a.school_id = ?' : '';
    const values = [teacher_id, module_id, class_id, academic_year, term];
    if (filters.school_id) values.push(filters.school_id);
    const [rows] = await pool.execute(
      `
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
        AND a.module_id = ?
        AND a.class_id = ?
        AND a.academic_year = ?
        AND a.term = ?
        ${schoolClause}
      LIMIT 1
      `,
      values
    );

    return rows[0] || null;
  }

  static async checkDifferentTeacherForClassAndYear(class_id, academic_year, teacher_id, filters = {}) {
    await this.ensureSchema();
    // If there are any existing assignments for this class+academic_year with a different teacher_id,
    // return true (conflict). If teacher_id is null/undefined, we treat it as "no teacher assignment desired"
    // and return false.
    if (!teacher_id) return false;

    const schoolClause = filters.school_id ? 'AND school_id = ?' : '';
    const values = [class_id, academic_year, teacher_id];
    if (filters.school_id) values.push(filters.school_id);
    const [rows] = await pool.execute(
      `
      SELECT 1
      FROM assignment
      WHERE class_id = ?
        AND academic_year = ?
        AND teacher_id <> ?
        ${schoolClause}
      LIMIT 1
      `,
      values
    );

    return rows.length > 0;
  }

  static async checkConflict(teacher_id, module_id, class_id, academic_year, term, exclude_id = null, filters = {}) {
    await this.ensureSchema();
    let query = `
      SELECT * FROM assignment 
      WHERE teacher_id = ? 
      AND module_id = ? 
      AND class_id = ? 
      AND academic_year = ? 
      AND term = ?
    `;
    let params = [teacher_id, module_id, class_id, academic_year, term];
    if (filters.school_id) {
      query += ' AND school_id = ?';
      params.push(filters.school_id);
    }
    
    if (exclude_id) {
      query += ' AND assignment_id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
}

module.exports = Assignment;
