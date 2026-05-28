const pool = require('../config/database');

class Class {
  static schemaReady = false;

  static async columnExists(columnName) {
    const [rows] = await pool.query('SHOW COLUMNS FROM class LIKE ?', [columnName]);
    return rows.length > 0;
  }

  static async ensureSchema() {
    if (this.schemaReady) return;

    if (!(await this.columnExists('room_id'))) {
      await pool.query('ALTER TABLE class ADD COLUMN room_id INT NULL AFTER section_id');
    }
    if (!(await this.columnExists('school_id'))) {
      await pool.query('ALTER TABLE class ADD COLUMN school_id INT NULL');
    }

    this.schemaReady = true;
  }

  static async create(classData) {
    await this.ensureSchema();
    const {
      class_name,
      level,
      section_id,
      class_teacher_id,
      academic_year = null,
      shift_id = null,
      dos_id = null,
      room_id = null,
      school_id = null
    } = classData;

    const [result] = await pool.execute(
      'INSERT INTO class (class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [class_name, level, academic_year, class_teacher_id || null, shift_id || null, dos_id || null, section_id || null, room_id || null, school_id || null]
    );

    return result.insertId;
  }

  static baseSelect() {
    return `
      SELECT c.*,
             s.shift_name,
             d.name as dos_name,
             sec.section_name,
             r.room_name,
             r.room_type,
             r.capacity as room_capacity,
             t.name as class_teacher_name,
             t.department as class_teacher_department
      FROM class c
      LEFT JOIN teacher t ON c.class_teacher_id = t.teacher_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      LEFT JOIN room r ON c.room_id = r.room_id
    `;
  }

  static async getAll(filters = {}) {
    await this.ensureSchema();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('c.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.level, c.class_name
    `, values);
    return rows;
  }

  static async findByName(class_name, filters = {}) {
    await this.ensureSchema();
    const where = ['LOWER(class_name) = LOWER(?)'];
    const values = [class_name];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM class WHERE ${where.join(' AND ')}`,
      values
    );
    return rows[0];
  }

  static async findByNameExcludingId(class_name, id, filters = {}) {
    await this.ensureSchema();
    const where = ['LOWER(class_name) = LOWER(?)', 'class_id <> ?'];
    const values = [class_name, id];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM class WHERE ${where.join(' AND ')}`,
      values
    );
    return rows[0];
  }

  static async findBySectionId(section_id, filters = {}) {
    await this.ensureSchema();
    const where = ['section_id = ?'];
    const values = [section_id];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM class WHERE ${where.join(' AND ')}`,
      values
    );
    return rows[0];
  }

  static async findBySectionIdExcludingId(section_id, id, filters = {}) {
    await this.ensureSchema();
    const where = ['section_id = ?', 'class_id <> ?'];
    const values = [section_id, id];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM class WHERE ${where.join(' AND ')}`,
      values
    );
    return rows[0];
  }

  static async findByRoomId(room_id, filters = {}) {
    await this.ensureSchema();
    const where = ['room_id = ?'];
    const values = [room_id];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM class WHERE ${where.join(' AND ')}`,
      values
    );
    return rows[0];
  }

  static async findByRoomIdExcludingId(room_id, id, filters = {}) {
    await this.ensureSchema();
    const where = ['room_id = ?', 'class_id <> ?'];
    const values = [room_id, id];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM class WHERE ${where.join(' AND ')}`,
      values
    );
    return rows[0];
  }

  static async findById(id) {
    await this.ensureSchema();
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE c.class_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByLevel(level, filters = {}) {
    await this.ensureSchema();
    const where = ['c.level = ?'];
    const values = [level];
    if (filters.school_id) {
      where.push('c.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE ${where.join(' AND ')}
      ORDER BY c.class_name
    `, values);
    return rows;
  }

  static async getBySection(section_id, filters = {}) {
    await this.ensureSchema();
    const where = ['c.section_id = ?'];
    const values = [section_id];
    if (filters.school_id) {
      where.push('c.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE ${where.join(' AND ')}
      ORDER BY c.class_name
    `, values);
    return rows;
  }

  static async getByAcademicYear(academic_year, filters = {}) {
    await this.ensureSchema();
    const where = ['c.academic_year = ?'];
    const values = [academic_year];
    if (filters.school_id) {
      where.push('c.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE ${where.join(' AND ')}
      ORDER BY c.level, c.class_name
    `, values);
    return rows;
  }

  static async update(id, classData) {
    await this.ensureSchema();
    const currentClass = await this.findById(id);
    if (!currentClass) {
      return;
    }

    const valueOrCurrent = (field) => (
      Object.prototype.hasOwnProperty.call(classData, field)
        ? classData[field]
        : currentClass[field]
    );

    const class_name = classData.class_name ?? currentClass.class_name;
    const level = classData.level ?? currentClass.level;
    const section_id = valueOrCurrent('section_id');
    const class_teacher_id = valueOrCurrent('class_teacher_id');
    const academic_year = classData.academic_year ?? currentClass.academic_year;
    const shift_id = valueOrCurrent('shift_id');
    const dos_id = valueOrCurrent('dos_id');
    const room_id = valueOrCurrent('room_id');
    const school_id = valueOrCurrent('school_id');

    await pool.execute(
      'UPDATE class SET class_name = ?, level = ?, academic_year = ?, class_teacher_id = ?, shift_id = ?, dos_id = ?, section_id = ?, room_id = ?, school_id = ? WHERE class_id = ?',
      [class_name, level, academic_year, class_teacher_id || null, shift_id || null, dos_id || null, section_id || null, room_id || null, school_id || null, id]
    );
  }

  static async delete(id) {
    await this.ensureSchema();
    await pool.execute('DELETE FROM class WHERE class_id = ?', [id]);
  }

  static async getClassesByTeacher(teacher_id, filters = {}) {
    await this.ensureSchema();
    const where = ['a.teacher_id = ?'];
    const values = [teacher_id];
    if (filters.school_id) {
      where.push('c.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT DISTINCT c.*,
             s.shift_name,
             d.name as dos_name,
             sec.section_name,
             r.room_name,
             r.room_type,
             r.capacity as room_capacity,
             ct.name as class_teacher_name,
             ct.department as class_teacher_department
      FROM class c
      INNER JOIN assignment a ON c.class_id = a.class_id
      LEFT JOIN teacher ct ON c.class_teacher_id = ct.teacher_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      LEFT JOIN room r ON c.room_id = r.room_id
      WHERE ${where.join(' AND ')}
      ORDER BY c.level, c.class_name
    `, values);
    return rows;
  }
}

module.exports = Class;
