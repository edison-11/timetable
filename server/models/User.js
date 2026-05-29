const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static profilePhotoColumnReady = false;
  static authColumnsReady = false;

  /**
   * Check if column exists (MYSQL VERSION)
   */
  static async columnExists(columnName) {
    try {
      const [rows] = await pool.query(
        `SHOW COLUMNS FROM users LIKE ?`,
        [columnName]
      );

      return rows.length > 0;
    } catch (err) {
      console.error('Error checking column:', err);
      return false;
    }
  }

  /**
   * Add missing column
   */
  static async addColumnIfMissing(columnName, definition) {
    if (!(await this.columnExists(columnName))) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN ${definition}`
      );
    }
  }

  /**
   * Ensure auth columns exist
   */
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
      ['school_id', 'school_id INT NULL'],
      ['status', "status VARCHAR(40) NOT NULL DEFAULT 'active'"],
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
        if (
          !err.message?.includes('Duplicate column') &&
          err.code !== 'ER_DUP_FIELDNAME'
        ) {
          console.error(`Error adding column ${name}:`, err);
        }
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users
        MODIFY role ENUM('super_admin', 'dos', 'teacher', 'student', 'admin') NOT NULL DEFAULT 'teacher'
      `);
      await pool.query(`
        ALTER TABLE users
        MODIFY status ENUM('pending', 'active', 'disabled', 'suspended', 'rejected') NOT NULL DEFAULT 'active'
      `);
    } catch (err) {
      console.error('Error normalizing user auth columns:', err.message);
    }

    this.authColumnsReady = true;
  }

  /**
   * Normalize user object
   */
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

  /**
   * Ensure profile photo column
   */
  static async ensureProfilePhotoColumn() {
    await this.ensureAuthColumns();

    if (this.profilePhotoColumnReady) {
      return;
    }

    try {
      const hasProfilePhoto =
        await this.columnExists('profile_photo');

      if (!hasProfilePhoto) {
        await pool.query(`
          ALTER TABLE users
          ADD COLUMN profile_photo VARCHAR(255) NULL
        `);
      }

      this.profilePhotoColumnReady = true;
    } catch (err) {
      console.error(
        'Error checking profile_photo column:',
        err
      );

      this.profilePhotoColumnReady = true;
    }
  }

  /**
   * Create user
   */
  static async create(userData) {
    await this.ensureAuthColumns();

    const {
      username,
      full_name,
      email,
      phone,
      password,
      role = 'teacher',
      is_verified = false,
      profile_photo = null,
      school_id = null,
      status = 'active'
    } = userData;

    const displayName = full_name || username;

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertColumns = [
      'username',
      'full_name',
      'email',
      'phone',
      'password',
      'password_hash',
      'role',
      'is_verified',
      'profile_photo',
      'school_id',
      'status'
    ];

    const insertValues = [
      displayName,
      displayName,
      email,
      phone || null,
      hashedPassword,
      hashedPassword,
      role,
      Boolean(is_verified),
      profile_photo || null,
      school_id || null,
      status || 'active'
    ];

    if (await this.columnExists('name')) {
      insertColumns.unshift('name');
      insertValues.unshift(displayName);
    }

    const placeholders =
      insertColumns.map(() => '?').join(', ');

    const [result] = await pool.query(
      `INSERT INTO users (${insertColumns.join(', ')})
       VALUES (${placeholders})`,
      insertValues
    );

    return result.insertId;
  }

  /**
   * Find by email
   */
  static async findByEmail(email) {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    return this.normalize(rows[0] || null);
  }

  /**
   * Find by id
   */
  static async findById(id) {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      `SELECT id, username, full_name, email,
              phone, role, is_verified, school_id, status,
              profile_photo, created_at, last_login
       FROM users
       WHERE id = ?`,
      [id]
    );

    return this.normalize(rows[0] || null);
  }

  static async findByEmailExcludingId(email, id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND id != ?',
      [email, id]
    );

    return this.normalize(rows[0] || null);
  }

  static async updateProfile(id, data = {}) {
    await this.ensureAuthColumns();

    const assignments = [];
    const values = [];
    const displayName = data.full_name || data.username;

    if (displayName !== undefined) {
      assignments.push('username = ?', 'full_name = ?');
      values.push(displayName, displayName);
      if (await this.columnExists('name')) {
        assignments.push('name = ?');
        values.push(displayName);
      }
    }
    if (data.email !== undefined) {
      assignments.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      assignments.push('phone = ?');
      values.push(data.phone || null);
    }
    if (data.profile_photo !== undefined) {
      assignments.push('profile_photo = ?');
      values.push(data.profile_photo || null);
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      assignments.push('password = ?', 'password_hash = ?');
      values.push(hashedPassword, hashedPassword);
    }

    if (!assignments.length) return;

    values.push(id);
    await pool.query(
      `UPDATE users SET ${assignments.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Compare password
   */
  static async comparePassword(
    plainPassword,
    hashedPassword
  ) {
    return await bcrypt.compare(
      plainPassword,
      hashedPassword
    );
  }

  /**
   * Get all users
   */
  static async getAll() {
    await this.ensureAuthColumns();

    const [rows] = await pool.query(
      `SELECT id, username, full_name,
              email, phone, role, school_id, status,
              is_verified, profile_photo,
              created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    return rows.map((row) =>
      this.normalize(row)
    );
  }

  /**
   * Delete user
   */
  static async delete(id) {
    await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
  }

  /**
   * Update last login
   */
  static async touchLastLogin(id) {
    await this.ensureAuthColumns();

    await pool.query(
      `UPDATE users
       SET last_login = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
  }

  /**
   * Update password
   */
  static async updatePassword(id, password) {
    await this.ensureAuthColumns();

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
       SET password = ?,
           password_hash = ?
       WHERE id = ?`,
      [hashedPassword, hashedPassword, id]
    );
  }

  static async updateStatus(id, status) {
    await this.ensureAuthColumns();
    await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );
  }
}

module.exports = User;
