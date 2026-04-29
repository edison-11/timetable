const pool = require('../config/database');

class Module {
  static async create(moduleData) {
    const { module_name, department = 'SSOD', hours_per_year, description } = moduleData;
    
    const [result] = await pool.execute(
      'INSERT INTO module (module_name, department, hours_per_year, description) VALUES (?, ?, ?, ?)',
      [module_name, department, hours_per_year, description]
    );
    
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM module ORDER BY department, module_name'
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
    const currentModule = await this.findById(id);
    if (!currentModule) {
      return;
    }

    const module_name = moduleData.module_name ?? currentModule.module_name;
    const department = moduleData.department ?? currentModule.department;
    const hours_per_year = moduleData.hours_per_year ?? currentModule.hours_per_year;
    const description = moduleData.description ?? currentModule.description;

    await pool.execute(
      'UPDATE module SET module_name = ?, department = ?, hours_per_year = ?, description = ? WHERE module_id = ?',
      [module_name, department, hours_per_year, description, id]
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
