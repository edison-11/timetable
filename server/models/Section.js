const pool = require('../config/database');

class Section {
  static schemaReady = false;

  static async columnExists(columnName) {
    const [rows] = await pool.query('SHOW COLUMNS FROM section LIKE ?', [columnName]);
    return rows.length > 0;
  }

  static async ensureSchema() {
    if (this.schemaReady) return;

    if (!(await this.columnExists('room_id'))) {
      await pool.query('ALTER TABLE section ADD COLUMN room_id INT NULL');
    }

    this.schemaReady = true;
  }

  static async create(sectionData) {
    await this.ensureSchema();
    const { section_name, level, description, room_id, class_ids } = sectionData;
    const [result] = await pool.execute(
      'INSERT INTO section (section_name, level, description, room_id) VALUES (?, ?, ?, ?)',
      [section_name, level, description, room_id || null]
    );
    const sectionId = result.insertId;

    // Link classes to section if provided
    if (class_ids && Array.isArray(class_ids) && class_ids.length > 0) {
      for (const classId of class_ids) {
        await pool.execute(
          'UPDATE class SET section_id = ? WHERE class_id = ?',
          [sectionId, classId]
        );
      }
    }

    return sectionId;
  }

  static async getAll() {
    await this.ensureSchema();
    const [rows] = await pool.execute('SELECT * FROM section ORDER BY level, section_name');
    return rows;
  }

  static async findById(id) {
    await this.ensureSchema();
    const [rows] = await pool.execute('SELECT * FROM section WHERE section_id = ?', [id]);
    return rows[0];
  }

  static async getByLevel(level) {
    await this.ensureSchema();
    const [rows] = await pool.execute(
      'SELECT * FROM section WHERE level = ? ORDER BY section_name',
      [level]
    );
    return rows;
  }

  static async update(id, sectionData) {
    await this.ensureSchema();
    const { section_name, level, description, room_id, class_ids } = sectionData;
    
    // Update section fields
    const updateFields = [];
    const updateValues = [];
    
    if (section_name !== undefined) {
      updateFields.push('section_name = ?');
      updateValues.push(section_name);
    }
    if (level !== undefined) {
      updateFields.push('level = ?');
      updateValues.push(level);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (room_id !== undefined) {
      updateFields.push('room_id = ?');
      updateValues.push(room_id || null);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE section SET ${updateFields.join(', ')} WHERE section_id = ?`,
        updateValues
      );
    }

    // Update class-section links if provided
    if (Array.isArray(class_ids)) {
      // First, remove all classes from this section
      await pool.execute('UPDATE class SET section_id = NULL WHERE section_id = ?', [id]);
      
      // Then add the new classes
      if (class_ids.length > 0) {
        for (const classId of class_ids) {
          await pool.execute(
            'UPDATE class SET section_id = ? WHERE class_id = ?',
            [id, classId]
          );
        }
      }
    }
  }

  static async delete(id) {
    await this.ensureSchema();
    await pool.execute('DELETE FROM section WHERE section_id = ?', [id]);
  }

  static async getSectionsWithClassCount() {
    await this.ensureSchema();
    const [rows] = await pool.execute(`
      SELECT
        s.section_id,
        s.section_name,
        s.level,
        s.description,
        s.room_id,
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
