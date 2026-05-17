const pool = require('../config/database');

class Section {
  static async create(sectionData) {
    const { section_name, level, description } = sectionData;
    const [result] = await pool.execute(
      'INSERT INTO section (section_name, level, description) VALUES (?, ?, ?)',
      [section_name, level, description]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute('SELECT * FROM section ORDER BY level, section_name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM section WHERE section_id = ?', [id]);
    return rows[0];
  }

  static async getByLevel(level) {
    const [rows] = await pool.execute(
      'SELECT * FROM section WHERE level = ? ORDER BY section_name',
      [level]
    );
    return rows;
  }

  static async update(id, sectionData) {
    const { section_name, level, description } = sectionData;
    await pool.execute(
      'UPDATE section SET section_name = ?, level = ?, description = ? WHERE section_id = ?',
      [section_name, level, description, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM section WHERE section_id = ?', [id]);
  }

  static async getSectionsWithClassCount() {
    const [rows] = await pool.execute(`
      SELECT
        s.section_id,
        s.section_name,
        s.level,
        s.description,
        COALESCE(section_classes.class_count, 0) as class_count,
        section_classes.class_ids,
        section_classes.class_names
      FROM section s
      LEFT JOIN (
        SELECT
          section_id,
          COUNT(class_id) as class_count,
          GROUP_CONCAT(class_id ORDER BY class_name SEPARATOR ',') as class_ids,
          GROUP_CONCAT(class_name ORDER BY class_name SEPARATOR ', ') as class_names
        FROM class
        WHERE section_id IS NOT NULL
        GROUP BY section_id
      ) section_classes ON s.section_id = section_classes.section_id
      ORDER BY s.level, s.section_name
    `);
    return rows;
  }
}

module.exports = Section;
