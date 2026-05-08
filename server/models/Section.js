const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db');

class Section {
  static async create(sectionData) {
    const { section_name, level, description } = sectionData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO section (section_name, level, description) VALUES (?, ?, ?)',
        [section_name, level, description],
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
        'SELECT * FROM section ORDER BY level, section_name',
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
        'SELECT * FROM section WHERE section_id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async getByLevel(level) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM section WHERE level = ? ORDER BY section_name',
        [level],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async update(id, sectionData) {
    const { section_name, level, description } = sectionData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE section SET section_name = ?, level = ?, description = ? WHERE section_id = ?',
        [section_name, level, description, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM section WHERE section_id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async getSectionsWithClassCount() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.*, COUNT(c.class_id) as class_count
        FROM section s
        LEFT JOIN class c ON s.section_id = c.section_id
        GROUP BY s.section_id
        ORDER BY s.level, s.section_name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Section;
