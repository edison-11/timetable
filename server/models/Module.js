const pool = require('../config/database');

class Module {
  static schemaReady = false;

  static async columnExists(columnName) {
    const [rows] = await pool.query('SHOW COLUMNS FROM module LIKE ?', [columnName]);
    return rows.length > 0;
  }

  static async ensureSchema() {
    if (this.schemaReady) return;
    if (!(await this.columnExists('school_id'))) {
      await pool.query('ALTER TABLE module ADD COLUMN school_id INT NULL');
    }
    this.schemaReady = true;
  }

  static async create(moduleData) {
    await this.ensureSchema();
    const { module_name, department = 'SSOD', hours_per_year, description, required_room_type = null, school_id = null } = moduleData;
    const [result] = await pool.execute(
      'INSERT INTO module (module_name, department, hours_per_year, description, required_room_type, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [module_name, department, hours_per_year, description, required_room_type || null, school_id || null]
    );
    return result.insertId;
  }

  static async getAll(filters = {}) {
    await this.ensureSchema();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`SELECT * FROM module ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY department, module_name`, values);
    return rows;
  }

  static async findById(id) {
    await this.ensureSchema();
    const [rows] = await pool.execute('SELECT * FROM module WHERE module_id = ?', [id]);
    return rows[0];
  }

  static async update(id, moduleData) {
    const currentModule = await this.findById(id);
    if (!currentModule) return;

    const module_name = moduleData.module_name ?? currentModule.module_name;
    const department = moduleData.department ?? currentModule.department;
    const hours_per_year = moduleData.hours_per_year ?? currentModule.hours_per_year;
    const description = moduleData.description ?? currentModule.description;
    const required_room_type = moduleData.required_room_type ?? currentModule.required_room_type;
    const school_id = moduleData.school_id ?? currentModule.school_id;

    await pool.execute(
      'UPDATE module SET module_name = ?, department = ?, hours_per_year = ?, description = ?, required_room_type = ?, school_id = ? WHERE module_id = ?',
      [module_name, department, hours_per_year, description, required_room_type || null, school_id || null, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM module WHERE module_id = ?', [id]);
  }

  static async getModulesByTeacher(teacher_id, filters = {}) {
    await this.ensureSchema();
    const where = ['a.teacher_id = ?'];
    const values = [teacher_id];
    if (filters.school_id) {
      where.push('m.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT m.* FROM module m
      INNER JOIN assignment a ON m.module_id = a.module_id
      WHERE ${where.join(' AND ')}
      GROUP BY m.module_id
      ORDER BY m.module_name
    `, values);
    return rows;
  }

  static async getModulesByClass(class_id, filters = {}) {
    await this.ensureSchema();
    const where = ['a.class_id = ?'];
    const values = [class_id];
    if (filters.school_id) {
      where.push('m.school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`
      SELECT m.* FROM module m
      INNER JOIN assignment a ON m.module_id = a.module_id
      WHERE ${where.join(' AND ')}
      GROUP BY m.module_id
      ORDER BY m.module_name
    `, values);
    return rows;
  }
}

module.exports = Module;
