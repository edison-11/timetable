const pool = require('../config/database');

class Class {
  static async create(classData) {
    const {
      class_name,
      level,
      section_id,
      class_teacher_id,
      academic_year = null,
      shift_id = null,
      dos_id = null,
      room_id = null
    } = classData;

    const [result] = await pool.execute(
      'INSERT INTO class (class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id, room_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [class_name, level, academic_year, class_teacher_id || null, shift_id || null, dos_id || null, section_id || null, room_id || null]
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

  static async getAll() {
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      ORDER BY c.level, c.class_name
    `);
    return rows;
  }

  static async findByName(class_name) {
    const [rows] = await pool.execute(
      'SELECT * FROM class WHERE LOWER(class_name) = LOWER(?)',
      [class_name]
    );
    return rows[0];
  }

  static async findByNameExcludingId(class_name, id) {
    const [rows] = await pool.execute(
      'SELECT * FROM class WHERE LOWER(class_name) = LOWER(?) AND class_id <> ?',
      [class_name, id]
    );
    return rows[0];
  }

  static async findBySectionId(section_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM class WHERE section_id = ?',
      [section_id]
    );
    return rows[0];
  }

  static async findBySectionIdExcludingId(section_id, id) {
    const [rows] = await pool.execute(
      'SELECT * FROM class WHERE section_id = ? AND class_id <> ?',
      [section_id, id]
    );
    return rows[0];
  }

  static async findByRoomId(room_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM class WHERE room_id = ?',
      [room_id]
    );
    return rows[0];
  }

  static async findByRoomIdExcludingId(room_id, id) {
    const [rows] = await pool.execute(
      'SELECT * FROM class WHERE room_id = ? AND class_id <> ?',
      [room_id, id]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE c.class_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByLevel(level) {
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE c.level = ?
      ORDER BY c.class_name
    `, [level]);
    return rows;
  }

  static async getBySection(section_id) {
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE c.section_id = ?
      ORDER BY c.class_name
    `, [section_id]);
    return rows;
  }

  static async getByAcademicYear(academic_year) {
    const [rows] = await pool.execute(`
      ${this.baseSelect()}
      WHERE c.academic_year = ?
      ORDER BY c.level, c.class_name
    `, [academic_year]);
    return rows;
  }

  static async update(id, classData) {
    const currentClass = await this.findById(id);
    if (!currentClass) {
      return;
    }

    const class_name = classData.class_name ?? currentClass.class_name;
    const level = classData.level ?? currentClass.level;
    const section_id = classData.section_id ?? currentClass.section_id;
    const class_teacher_id = Object.prototype.hasOwnProperty.call(classData, 'class_teacher_id')
      ? classData.class_teacher_id
      : currentClass.class_teacher_id;
    const academic_year = classData.academic_year ?? currentClass.academic_year;
    const shift_id = classData.shift_id ?? currentClass.shift_id;
    const dos_id = classData.dos_id ?? currentClass.dos_id;
    const room_id = classData.room_id ?? currentClass.room_id;

    await pool.execute(
      'UPDATE class SET class_name = ?, level = ?, academic_year = ?, class_teacher_id = ?, shift_id = ?, dos_id = ?, section_id = ?, room_id = ? WHERE class_id = ?',
      [class_name, level, academic_year, class_teacher_id || null, shift_id || null, dos_id || null, section_id || null, room_id || null, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM class WHERE class_id = ?', [id]);
  }

  static async getClassesByTeacher(teacher_id) {
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
      WHERE a.teacher_id = ?
      ORDER BY c.level, c.class_name
    `, [teacher_id]);
    return rows;
  }
}

module.exports = Class;
