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
    if (!(await this.columnExists('school_id'))) {
      await pool.query('ALTER TABLE section ADD COLUMN school_id INT NULL');
    }

    this.schemaReady = true;
  }

  static async create(sectionData) {
    await this.ensureSchema();
    const { section_name, level, description, room_id, class_ids, school_id = null } = sectionData;
    const [result] = await pool.execute(
      'INSERT INTO section (section_name, level, description, room_id, school_id) VALUES (?, ?, ?, ?, ?)',
      [section_name, level, description, room_id || null, school_id || null]
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

  static async getAll(filters = {}) {
    await this.ensureSchema();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`SELECT * FROM section ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY level, section_name`, values);
    return rows;
  }

  static async findById(id) {
    await this.ensureSchema();
    const [rows] = await pool.execute('SELECT * FROM section WHERE section_id = ?', [id]);
    return rows[0];
  }

  static async getByLevel(level, filters = {}) {
    await this.ensureSchema();
    const where = ['level = ?'];
    const values = [level];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM section WHERE ${where.join(' AND ')} ORDER BY section_name`,
      values
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
    if (sectionData.school_id !== undefined) {
      updateFields.push('school_id = ?');
      updateValues.push(sectionData.school_id || null);
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

  static async getSectionsWithClassCount(filters = {}) {
    await this.ensureSchema();
    const schoolClause = filters.school_id ? 'WHERE s.school_id = ?' : '';
    const classSchoolClause = filters.school_id ? 'AND school_id = ?' : '';
    const values = filters.school_id ? [filters.school_id, filters.school_id] : [];
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
        ${classSchoolClause}
        GROUP BY section_id
      ) section_classes ON s.section_id = section_classes.section_id
      ${schoolClause}
      ORDER BY s.level, s.section_name
    `, values);
    return rows;
  }
}

module.exports = Section;
