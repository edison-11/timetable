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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        tone = 'blue'
      } = notificationData;

      const [result] = await pool.execute(
        'INSERT INTO notification (type, title, message, path, tone) VALUES (?, ?, ?, ?, ?)',
        [type, title, message, path, tone]
      );

      return result.insertId;
    } catch (error) {
      console.error('Notification create failed:', error.message);
      return null;
    }
  }

  static async getRecent(limit = 12) {
    await this.ensureTable();

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const [rows] = await pool.execute(
      `SELECT notification_id, type, title, message, path, tone, created_at
       FROM notification
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`
    );

    return rows;
  }

  static async count() {
    await this.ensureTable();

    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM notification');
    return rows[0]?.total || 0;
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
