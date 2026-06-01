const pool = require('../config/database');

class Notification {
  static tableReady = false;

  static async ensureTable() {
    if (this.tableReady) return;

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notification (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        path VARCHAR(255) DEFAULT '/dashboard',
        tone VARCHAR(20) DEFAULT 'blue',
        school_id INT NULL,
        recipient_role VARCHAR(80) NULL,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [columns] = await pool.execute('SHOW COLUMNS FROM notification');
    const names = new Set(columns.map((column) => column.Field));
    if (!names.has('school_id')) await pool.execute('ALTER TABLE notification ADD COLUMN school_id INT NULL');
    if (!names.has('recipient_role')) await pool.execute('ALTER TABLE notification ADD COLUMN recipient_role VARCHAR(80) NULL');
    if (!names.has('read_at')) await pool.execute('ALTER TABLE notification ADD COLUMN read_at TIMESTAMP NULL');
    if (!names.has('archived_at')) await pool.execute('ALTER TABLE notification ADD COLUMN archived_at TIMESTAMP NULL');

    this.tableReady = true;
  }

  static async create(notificationData) {
    try {
      await this.ensureTable();

      const {
        type,
        title,
        message = '',
        path = '/dashboard',
        tone = 'blue',
        school_id = null,
        recipient_role = null
      } = notificationData;

      const [result] = await pool.execute(
        'INSERT INTO notification (type, title, message, path, tone, school_id, recipient_role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [type, title, message, path, tone, school_id || null, recipient_role || null]
      );

      return result.insertId;
    } catch (error) {
      console.error('Notification create failed:', error.message);
      return null;
    }
  }

  static async getRecent(limit = 12, filters = {}) {
    await this.ensureTable();

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    if (filters.recipient_role) {
      where.push('(recipient_role = ? OR recipient_role IS NULL)');
      values.push(filters.recipient_role);
    }
    if (!filters.include_archived) {
      where.push('archived_at IS NULL');
    }
    const [rows] = await pool.execute(
      `SELECT notification_id, type, title, message, path, tone, school_id, recipient_role, read_at, archived_at, created_at
       FROM notification
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`,
      values
    );

    return rows;
  }

  static async count(filters = {}) {
    await this.ensureTable();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM notification ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, values);
    return rows[0]?.total || 0;
  }

  static async markRead(id = null, filters = {}) {
    await this.ensureTable();
    const where = [];
    const values = [];
    if (id) {
      where.push('notification_id = ?');
      values.push(id);
    }
    if (filters.recipient_role) {
      where.push('(recipient_role = ? OR recipient_role IS NULL)');
      values.push(filters.recipient_role);
    }
    await pool.execute(
      `UPDATE notification SET read_at = CURRENT_TIMESTAMP ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      values
    );
  }

  static async archive(id = null, filters = {}) {
    await this.ensureTable();
    const where = [];
    const values = [];
    if (id) {
      where.push('notification_id = ?');
      values.push(id);
    }
    if (filters.recipient_role) {
      where.push('(recipient_role = ? OR recipient_role IS NULL)');
      values.push(filters.recipient_role);
    }
    await pool.execute(
      `UPDATE notification SET archived_at = CURRENT_TIMESTAMP ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      values
    );
  }

  static async delete(id) {
    await this.ensureTable();

    const [result] = await pool.execute('DELETE FROM notification WHERE notification_id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async clearAll() {
    await this.ensureTable();

    await pool.execute('DELETE FROM notification');
  }
}

module.exports = Notification;
