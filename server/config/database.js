const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbPath = path.resolve(__dirname, '../../timetable.db');

let db = null;

// Create a wrapper to provide promise-based interface similar to mysql2/promise
class SQLitePool {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('✅ Connected to SQLite database:', dbPath);
        this.db.run('PRAGMA foreign_keys = ON');
      }
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve([rows || []]);
      });
    });
  }

  execute(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
      });
    });
  }

  getConnection() {
    return Promise.resolve(this);
  }

  release() {
    // No-op for SQLite
  }

  end() {
    if (this.db) {
      this.db.close();
    }
  }
}

const pool = new SQLitePool();

module.exports = pool;
