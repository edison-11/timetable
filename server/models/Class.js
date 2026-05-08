const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db');

class Class {
  static async create(classData) {
    const { class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id } = classData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO class (class_name, level, academic_year, class_teacher_id, shift_id, dos_id, section_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [class_name, level, academic_year, class_teacher_id || null, shift_id || null, dos_id || null, section_id || null],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, s.shift_name, s.teacher_changeover_minutes, d.name as dos_name, sec.section_name, t.name as class_teacher_name, t.department as class_teacher_department
        FROM class c
        LEFT JOIN teacher t ON c.class_teacher_id = t.teacher_id
        LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      ORDER BY c.level, c.class_name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findByName(class_name) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM class WHERE LOWER(class_name) = LOWER(?)',
        [class_name],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findByNameExcludingId(class_name, id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM class WHERE LOWER(class_name) = LOWER(?) AND class_id <> ?',
        [class_name, id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findBySectionId(section_id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM class WHERE section_id = ?',
        [section_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findBySectionIdExcludingId(section_id, id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM class WHERE section_id = ? AND class_id <> ?',
        [section_id, id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT c.*, s.shift_name, s.teacher_changeover_minutes, d.name as dos_name, sec.section_name, t.name as class_teacher_name, t.department as class_teacher_department
        FROM class c
      LEFT JOIN teacher t ON c.class_teacher_id = t.teacher_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
      WHERE c.class_id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async getByLevel(level) {
    const [rows] = await pool.execute(`
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name, t.name as class_teacher_name, t.department as class_teacher_department
      FROM class c
      LEFT JOIN teacher t ON c.class_teacher_id = t.teacher_id
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
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name, t.name as class_teacher_name, t.department as class_teacher_department
      FROM class c
      LEFT JOIN teacher t ON c.class_teacher_id = t.teacher_id
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
      SELECT c.*, s.shift_name, d.name as dos_name, sec.section_name, t.name as class_teacher_name, t.department as class_teacher_department
      FROM class c
      LEFT JOIN teacher t ON c.class_teacher_id = t.teacher_id
      LEFT JOIN shift s ON c.shift_id = s.shift_id
      LEFT JOIN dos d ON c.dos_id = d.dos_id
      LEFT JOIN section sec ON c.section_id = sec.section_id
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
    const academic_year = classData.academic_year ?? currentClass.academic_year;
    const class_teacher_id = Object.prototype.hasOwnProperty.call(classData, 'class_teacher_id')
      ? classData.class_teacher_id
      : currentClass.class_teacher_id;
    const shift_id = Object.prototype.hasOwnProperty.call(classData, 'shift_id')
      ? classData.shift_id
      : currentClass.shift_id;
    const dos_id = Object.prototype.hasOwnProperty.call(classData, 'dos_id')
      ? classData.dos_id
      : currentClass.dos_id;
    const section_id = Object.prototype.hasOwnProperty.call(classData, 'section_id')
      ? classData.section_id
      : currentClass.section_id;

    await pool.execute(
      'UPDATE class SET class_name = ?, level = ?, academic_year = ?, class_teacher_id = ?, shift_id = ?, dos_id = ?, section_id = ? WHERE class_id = ?',
      [class_name, level, academic_year, class_teacher_id || null, shift_id || null, dos_id || null, section_id || null, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM class WHERE class_id = ?', [id]);
  }

  static async getClassesByTeacher(teacher_id) {
    const [rows] = await pool.execute(`
      SELECT DISTINCT c.*, s.shift_name, d.name as dos_name, sec.section_name, ct.name as class_teacher_name, ct.department as class_teacher_department
      FROM class c
      INNER JOIN assignment a ON c.class_id = a.class_id
      LEFT JOIN teacher ct ON c.class_teacher_id = ct.teacher_id
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
