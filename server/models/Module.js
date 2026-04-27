const pool = require('../config/database');

class Module {
  static async create(moduleData) {
    const { module_name, hours_per_year, description } = moduleData;
    
    const [result] = await pool.execute(
      'INSERT INTO module (module_name, hours_per_year, description) VALUES (?, ?, ?)',
      [module_name, hours_per_year, description]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM module ORDER BY module_name'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM module WHERE module_id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, moduleData) {
    const { module_name, hours_per_year, description } = moduleData;
    await pool.execute(
      'UPDATE module SET module_name = ?, hours_per_year = ?, description = ? WHERE module_id = ?',
      [module_name, hours_per_year, description, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM module WHERE module_id = ?', [id]);
  }

  static async getModulesByTeacher(teacher_id) {
    const [rows] = await pool.execute(`
      SELECT m.* FROM module m
      INNER JOIN assignment a ON m.module_id = a.module_id
      WHERE a.teacher_id = ?
      GROUP BY m.module_id
      ORDER BY m.module_name
    `, [teacher_id]);
    return rows;
  }

  static async getModulesByClass(class_id) {
    const [rows] = await pool.execute(`
      SELECT m.* FROM module m
      INNER JOIN assignment a ON m.module_id = a.module_id
      WHERE a.class_id = ?
      GROUP BY m.module_id
      ORDER BY m.module_name
    `, [class_id]);
    return rows;
  }
}

module.exports = Module;
