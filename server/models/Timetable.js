const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db');

class Timetable {
  static async create(timetableData) {
    const { title, description, user_id, days, start_time, end_time, subject } = timetableData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO timetables (title, description, user_id, days, start_time, end_time, subject) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, user_id, JSON.stringify(days), start_time, end_time, subject],
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
        SELECT t.*, u.username as created_by 
        FROM timetables t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          days: JSON.parse(row.days)
        })));
      });
    });
  }

  static async getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
      SELECT t.*, u.username as created_by 
      FROM timetables t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `, [id]);
    
    if (rows.length === 0) return null;
    
    return {
      ...rows[0],
      days: JSON.parse(rows[0].days)
    };
  }

  static async getByUserId(user_id) {
    const [rows] = await pool.execute(`
      SELECT t.*, u.username as created_by 
      FROM timetables t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.user_id = ? 
      ORDER BY t.created_at DESC
    `, [user_id]);
    
    return rows.map(row => ({
      ...row,
      days: JSON.parse(row.days)
    }));
  }

  static async update(id, timetableData) {
    const { title, description, days, start_time, end_time, subject } = timetableData;
    
    await pool.execute(
      'UPDATE timetables SET title = ?, description = ?, days = ?, start_time = ?, end_time = ?, subject = ? WHERE id = ?',
      [title, description, JSON.stringify(days), start_time, end_time, subject, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM timetables WHERE id = ?', [id]);
  }

  static async getConflicts(user_id, days, start_time, end_time, exclude_id = null) {
    let query = `
      SELECT * FROM timetables 
      WHERE user_id = ? 
      AND JSON_CONTAINS(days, ?)
      AND (
        (start_time < ? AND end_time > ?) 
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `;
    let params = [user_id, JSON.stringify(days[0]), start_time, start_time, end_time, end_time, start_time, end_time];
    
    if (exclude_id) {
      query += ' AND id != ?';
      params.push(exclude_id);
    }
    
    const [rows] = await pool.execute(query, params);
    
    // Filter out conflicts that fall within break times
    const filteredRows = [];
    for (const row of rows) {
      const isBreakTime = await this.isTimeInBreakPeriod(start_time, end_time);
      if (!isBreakTime) {
        filteredRows.push(row);
      }
    }
    
    return filteredRows;
  }

  static async isTimeInBreakPeriod(start_time, end_time) {
    const [rows] = await pool.execute(`
      SELECT * FROM break_time 
      WHERE (
        (start_time < ? AND end_time > ?)
        OR (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `, [end_time, start_time, end_time, start_time, end_time, start_time]);
    
    return rows.length > 0;
  }
}

module.exports = Timetable;
