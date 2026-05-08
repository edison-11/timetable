const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db');

class Module {
  static async create(moduleData) {
    const { module_name, department = 'SSOD', hours_per_year, description } = moduleData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO module (module_name, department, hours_per_year, description) VALUES (?, ?, ?, ?)',
        [module_name, department, hours_per_year, description],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM module ORDER BY department, module_name',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM module WHERE module_id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
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

    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE module SET module_name = ?, department = ?, hours_per_year = ?, description = ? WHERE module_id = ?',
        [module_name, department, hours_per_year, description, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM module WHERE module_id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async getModulesByTeacher(teacher_id) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT m.* FROM module m
        INNER JOIN assignment a ON m.module_id = a.module_id
        WHERE a.teacher_id = ?
        GROUP BY m.module_id
        ORDER BY m.module_name
      `, [teacher_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getModulesByClass(class_id) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT m.* FROM module m
        INNER JOIN assignment a ON m.module_id = a.module_id
        WHERE a.class_id = ?
        GROUP BY m.module_id
        ORDER BY m.module_name
      `, [class_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Module;
