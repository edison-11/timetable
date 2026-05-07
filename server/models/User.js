const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./timetable.db');
const bcrypt = require('bcryptjs');

class User {
  static async ensureProfilePhotoColumn() {
    return new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) NULL', (err) => {
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

  static async create(userData) {
    const { username, email, password, role = 'student' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role],
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
        'SELECT * FROM users WHERE email = ?',
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
        'SELECT id, username, email, role, profile_photo, created_at FROM users WHERE id = ?',
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
        'SELECT * FROM users WHERE email = ? AND id != ?',
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
        'SELECT id, username, email, role, profile_photo, created_at FROM users ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async update(id, userData) {
    const { username, email, role } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async updateProfile(id, userData) {
    await this.ensureProfilePhotoColumn();

    const { username, email, password, profile_photo } = userData;
    const updateFields = [];
    const updateValues = [];

    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (profile_photo !== undefined) {
      updateFields.push('profile_photo = ?');
      updateValues.push(profile_photo || null);
    }

    if (!updateFields.length) {
      return;
    }

    updateValues.push(id);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
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
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = User;
