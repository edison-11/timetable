const pool = require('../config/database');

class Class {
  static async create(classData) {
    const { class_name, level, academic_year, shift_id, dos_id, section_id } = classData;
    
    const [result] = await pool.execute(
      'INSERT INTO class (class_name, level, academic_year, shift_id, dos_id, section_id) VALUES (?, ?, ?, ?, ?, ?)',
      [class_name, level, academic_year, shift_id, dos_id, section_id]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name
      FROM class c
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      ORDER BY c.level, c.class_name
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name
      FROM class c
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      WHERE c.class_id = ?
    `, [id]);
    return rows[0];
  }

  static async getByLevel(level) {
    const [rows] = await pool.execute(`
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name
      FROM class c
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      WHERE c.level = ?
      ORDER BY c.class_name
    `, [level]);
    return rows;
  }

  static async getBySection(section_id) {
    const [rows] = await pool.execute(`
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name
      FROM class c
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      WHERE c.section_id = ?
      ORDER BY c.class_name
    `, [section_id]);
    return rows;
  }

  static async getByAcademicYear(academic_year) {
    const [rows] = await pool.execute(`
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name
      FROM class c
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      WHERE c.academic_year = ?
      ORDER BY c.level, c.class_name
    `, [academic_year]);
    return rows;
  }

  static async update(id, classData) {
    const { class_name, level, academic_year, shift_id, dos_id, section_id } = classData;
    await pool.execute(
      'UPDATE class SET class_name = ?, level = ?, academic_year = ?, shift_id = ?, dos_id = ?, section_id = ? WHERE class_id = ?',
      [class_name, level, academic_year, shift_id, dos_id, section_id, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM class WHERE class_id = ?', [id]);
  }

  static async getClassesByTeacher(teacher_id) {
    const [rows] = await pool.execute(`
      SELECT DISTINCT c.*, s.shift_name, d.name as dos_name, sec.section_name
      FROM class c
      INNER JOIN assignment a ON c.class_id = a.class_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      WHERE a.teacher_id = ?
      ORDER BY c.level, c.class_name
    `, [teacher_id]);
    return rows;
  }
}

module.exports = Class;
