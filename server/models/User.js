const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static profilePhotoColumnReady = false;
  static authColumnsReady = false;

  static async columnExists(columnName) {
    try {
      // For SQLite, use PRAGMA table_info
      const [rows] = await pool.query(`PRAGMA table_info(users)`);
      return rows.some(row => row.name === columnName);
    } catch (err) {
      console.error('Error checking column:', err);
      return false;
    }
  }

  static async addColumnIfMissing(columnName, definition) {
    if (!(await this.columnExists(columnName))) {
      await pool.query(`ALTER TABLE users ADD COLUMN ${definition}`);
    }
  }

  static async ensureAuthColumns() {
    if (this.authColumnsReady) return;

    const columns = [
      ['username', 'username VARCHAR(255) NULL'],
      ['password', 'password VARCHAR(255) NULL'],
      ['full_name', 'full_name VARCHAR(255) NULL'],
      ['phone', 'phone VARCHAR(100) NULL'],
      ['password_hash', 'password_hash VARCHAR(255) NULL'],
      ['is_verified', 'is_verified BOOLEAN NOT NULL DEFAULT FALSE'],
      ['last_login', 'last_login TIMESTAMP NULL'],
      ['profile_photo', 'profile_photo VARCHAR(255) NULL'],
      ['reset_code_hash', 'reset_code_hash VARCHAR(255) NULL'],
      ['reset_code_expires_at', 'reset_code_expires_at TIMESTAMP NULL'],
      ['reset_code_used', 'reset_code_used BOOLEAN NOT NULL DEFAULT TRUE'],
      ['reset_resend_count', 'reset_resend_count INT NOT NULL DEFAULT 0'],
      ['reset_verify_attempts', 'reset_verify_attempts INT NOT NULL DEFAULT 0'],
      ['reset_last_sent_at', 'reset_last_sent_at TIMESTAMP NULL']
    ];

    for (const [name, definition] of columns) {
      try {
        await this.addColumnIfMissing(name, definition);
      } catch (err) {
        // Ignore duplicate column errors (MySQL and SQLite)
        if (!err.message?.includes('duplicate column') && err.code !== 'ER_DUP_FIELDNAME') {
          console.error(`Error adding column ${name}:`, err);
        }
      }
    }

    this.authColumnsReady = true;
  }

  static normalize(user) {
    if (!user) return null;

    return {
      ...user,
      full_name: user.full_name || user.username || user.name || '',
      username: user.username || user.full_name || user.name || '',
      password_hash: user.password_hash || user.password,
      is_verified: Boolean(user.is_verified)
    };
  }

  static async ensureProfilePhotoColumn() {
    await this.ensureAuthColumns();

    if (this.profilePhotoColumnReady) {
      return;
    }

    try {
      const [rows] = await pool.query(`PRAGMA table_info(users)`);
      const hasProfilePhoto = rows.some(row => row.name === 'profile_photo');

      if (!hasProfilePhoto) {
        await pool.query('ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) NULL');
      }

      this.profilePhotoColumnReady = true;
    } catch (err) {
      if (!err.message?.includes('duplicate column')) {
        console.error('Error checking profile_photo column:', err);
      }
      this.profilePhotoColumnReady = true;
    }
  }

  static async create(userData) {
    await this.ensureAuthColumns();

    const { username, full_name, email, phone, password, role = 'teacher', is_verified = false } = userData;
    const displayName = full_name || username;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const insertColumns = ['username', 'full_name', 'email', 'phone', 'password', 'password_hash', 'role', 'is_verified'];
    const insertValues = [displayName, displayName, email, phone || null, hashedPassword, hashedPassword, role, Boolean(is_verified)];

    if (await this.columnExists('name')) {
      insertColumns.unshift('name');
      insertValues.unshift(displayName);
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      insertValues
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return this.normalize(rows[0] || null);
  }

  static async findById(id) {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      'SELECT id, username, full_name, email, phone, role, is_verified, profile_photo, created_at, last_login FROM users WHERE id = ?',
      [id]
    );
    return this.normalize(rows[0] || null);
  }

  static async findByEmailExcludingId(email, id) {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    return this.normalize(rows[0] || null);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      'SELECT id, username, full_name, email, phone, role, is_verified, profile_photo, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    return rows.map((row) => this.normalize(row));
  }

  static async update(id, userData) {
    const { username, email, role } = userData;
    await pool.query(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
      [username, email, role, id]
    );
  }

  static async updateProfile(id, userData) {
    await this.ensureAuthColumns();

    const { username, full_name, email, phone, password, profile_photo } = userData;
    const updateFields = [];
    const updateValues = [];
    const displayName = full_name || username;

    if (displayName !== undefined) {
      updateFields.push('username = ?', 'full_name = ?');
      updateValues.push(displayName, displayName);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?', 'password_hash = ?');
      updateValues.push(hashedPassword, hashedPassword);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
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

  static async touchLastLogin(id) {
    await this.ensureAuthColumns();
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  static async saveResetCode(id, codeHash, expiresAt, resendCount) {
    await this.ensureAuthColumns();
    await pool.query(
      `UPDATE users
       SET reset_code_hash = ?,
           reset_code_expires_at = ?,
           reset_code_used = FALSE,
           reset_resend_count = ?,
           reset_verify_attempts = 0,
           reset_last_sent_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [codeHash, expiresAt, resendCount, id]
    );
  }

  static async markResetCodeUsed(id) {
    await this.ensureAuthColumns();
    await pool.query(
      'UPDATE users SET reset_code_used = TRUE, reset_code_hash = NULL, reset_code_expires_at = NULL, reset_resend_count = 0 WHERE id = ?',
      [id]
    );
  }

  static async incrementResetAttempts(id) {
    await this.ensureAuthColumns();
    await pool.query('UPDATE users SET reset_verify_attempts = reset_verify_attempts + 1 WHERE id = ?', [id]);
  }

  static async updatePassword(id, password) {
    await this.ensureAuthColumns();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = ?, password_hash = ? WHERE id = ?',
      [hashedPassword, hashedPassword, id]
    );
  }
}

module.exports = User;
