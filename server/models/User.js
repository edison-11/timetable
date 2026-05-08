const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static profilePhotoColumnReady = false;

  static async ensureProfilePhotoColumn() {
    if (this.profilePhotoColumnReady) {
      return;
    }

    try {
      const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'profile_photo'
      `);

      if (!columns.length) {
        await pool.query('ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) NULL');
      }

      this.profilePhotoColumnReady = true;
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        throw err;
      }
      this.profilePhotoColumnReady = true;
    }
  }

  static async create(userData) {
    const { username, email, password, role = 'student' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    await this.ensureProfilePhotoColumn();

    const [rows] = await pool.query(
      'SELECT id, username, email, role, profile_photo, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmailExcludingId(email, id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    return rows[0] || null;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    await this.ensureProfilePhotoColumn();

    const [rows] = await pool.query(
      'SELECT id, username, email, role, profile_photo, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  static async update(id, userData) {
    const { username, email, role } = userData;
    await pool.query(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
      [username, email, role, id]
    );
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

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  }
}

module.exports = User;
