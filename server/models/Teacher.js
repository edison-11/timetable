const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db');
const bcrypt = require('bcryptjs');

class Teacher {
  static async ensureProfilePhotoColumn() {
    return new Promise((resolve, reject) => {
      db.run('ALTER TABLE teacher ADD COLUMN profile_photo VARCHAR(255) NULL', (err) => {
        if (err && err.message.includes('duplicate column name')) {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static async create(teacherData) {
    const { name, email, password, department = 'SSOD', status = 'active', date_joined } = teacherData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO teacher (name, email, password, department, status, date_joined) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, department, status, date_joined || new Date()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM teacher WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findById(id) {
    await this.ensureProfilePhotoColumn();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT teacher_id, name, email, department, status, date_joined, profile_photo, created_at FROM teacher WHERE teacher_id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async findByEmailExcludingId(email, id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM teacher WHERE email = ? AND teacher_id != ?',
        [email, id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    await this.ensureProfilePhotoColumn();

    return new Promise((resolve, reject) => {
      db.all(
        'SELECT teacher_id, name, email, department, status, date_joined, profile_photo, created_at FROM teacher ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getByStatus(status) {
    await this.ensureProfilePhotoColumn();

    return new Promise((resolve, reject) => {
      db.all(
        'SELECT teacher_id, name, email, department, status, date_joined, profile_photo, created_at FROM teacher WHERE status = ? ORDER BY name',
        [status],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async update(id, teacherData) {
    await this.ensureProfilePhotoColumn();

    const { name, email, password, department, status, date_joined, profile_photo } = teacherData;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(department);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (date_joined !== undefined) {
      updateFields.push('date_joined = ?');
      updateValues.push(date_joined);
    }
    if (profile_photo !== undefined) {
      updateFields.push('profile_photo = ?');
      updateValues.push(profile_photo || null);
    }
    
    updateValues.push(id);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE teacher SET ${updateFields.join(', ')} WHERE teacher_id = ?`,
        updateValues,
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM teacher WHERE teacher_id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async getActiveTeachers() {
    await this.ensureProfilePhotoColumn();

    return new Promise((resolve, reject) => {
      db.all(
        'SELECT teacher_id, name, email, department, profile_photo FROM teacher WHERE status = "active" ORDER BY department, name',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = Teacher;
