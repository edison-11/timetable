const pool = require('../config/database');
const Notification = require('./Notification');

class AdminMessage {
  static tableReady = false;

  static async ensureTable() {
    if (this.tableReady) return;

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NULL,
        school_id INT NULL,
        sender_user_id INT NULL,
        sender_role VARCHAR(80) NULL,
        sender_name VARCHAR(255) NULL,
        sender_email VARCHAR(255) NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('open', 'replied', 'closed') NOT NULL DEFAULT 'open',
        seen_by_super_admin_at TIMESTAMP NULL,
        seen_by_school_at TIMESTAMP NULL,
        deleted_by_super_admin_at TIMESTAMP NULL,
        deleted_by_school_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin_messages_parent (parent_id),
        INDEX idx_admin_messages_school (school_id),
        INDEX idx_admin_messages_created (created_at)
      )
    `);

    const [columns] = await pool.execute('SHOW COLUMNS FROM admin_messages');
    const names = new Set(columns.map((column) => column.Field));
    if (!names.has('seen_by_super_admin_at')) await pool.execute('ALTER TABLE admin_messages ADD COLUMN seen_by_super_admin_at TIMESTAMP NULL');
    if (!names.has('seen_by_school_at')) await pool.execute('ALTER TABLE admin_messages ADD COLUMN seen_by_school_at TIMESTAMP NULL');
    if (!names.has('deleted_by_super_admin_at')) await pool.execute('ALTER TABLE admin_messages ADD COLUMN deleted_by_super_admin_at TIMESTAMP NULL');
    if (!names.has('deleted_by_school_at')) await pool.execute('ALTER TABLE admin_messages ADD COLUMN deleted_by_school_at TIMESTAMP NULL');

    await Notification.ensureTable();
    this.tableReady = true;
  }

  static userName(user = {}) {
    return user.name || user.username || user.email || user.role || 'User';
  }

  static userEmail(user = {}) {
    return user.email || user.school_email || user.dos_email || '';
  }

  static async create(data) {
    await this.ensureTable();

    const [result] = await pool.execute(
      `INSERT INTO admin_messages
        (parent_id, school_id, sender_user_id, sender_role, sender_name, sender_email, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.parent_id || null,
        data.school_id || null,
        data.sender_user_id || null,
        data.sender_role || null,
        data.sender_name || null,
        data.sender_email || null,
        data.subject,
        data.message,
        data.status || 'open'
      ]
    );

    return this.findById(result.insertId);
  }

  static async findById(id) {
    await this.ensureTable();

    const [rows] = await pool.execute(`
      SELECT message_id, parent_id, school_id, sender_user_id, sender_role, sender_name,
        sender_email, subject, message, status, seen_by_super_admin_at, seen_by_school_at,
        deleted_by_super_admin_at, deleted_by_school_at, created_at
      FROM admin_messages
      WHERE message_id = ?
    `, [id]);

    return rows[0] || null;
  }

  static async getThreads({ role, school_id } = {}) {
    await this.ensureTable();

    const values = [];
    let where = 'WHERE m.parent_id IS NULL';

    if (role === 'super_admin') {
      where += ' AND m.deleted_by_super_admin_at IS NULL';
    } else {
      where += ' AND m.school_id = ?';
      values.push(school_id || 0);
      where += ' AND m.deleted_by_school_at IS NULL';
    }

    const [rows] = await pool.execute(`
      SELECT
        m.message_id,
        m.school_id,
        m.sender_name,
        m.sender_email,
        m.sender_role,
        m.subject,
        m.message,
        m.status,
        m.seen_by_super_admin_at,
        m.seen_by_school_at,
        m.created_at,
        COUNT(r.message_id) AS reply_count,
        MAX(COALESCE(r.created_at, m.created_at)) AS last_activity_at
      FROM admin_messages m
      LEFT JOIN admin_messages r ON r.parent_id = m.message_id
      ${where}
      GROUP BY m.message_id
      ORDER BY last_activity_at DESC
      LIMIT 80
    `, values);

    return rows;
  }

  static async getThread(id, { role, school_id } = {}) {
    await this.ensureTable();
    const root = await this.findById(id);
    if (!root) return null;
    if (role !== 'super_admin' && Number(root.school_id || 0) !== Number(school_id || 0)) return null;

    const [replies] = await pool.execute(`
      SELECT message_id, parent_id, school_id, sender_user_id, sender_role, sender_name,
        sender_email, subject, message, status, seen_by_super_admin_at, seen_by_school_at,
        created_at
      FROM admin_messages
      WHERE parent_id = ?
      ORDER BY created_at ASC
    `, [id]);

    return { ...root, replies };
  }

  static async markReplied(id) {
    await this.ensureTable();
    await pool.execute('UPDATE admin_messages SET status = ? WHERE message_id = ?', ['replied', id]);
  }

  static async markSeen(id, role) {
    await this.ensureTable();
    const column = role === 'super_admin' ? 'seen_by_super_admin_at' : 'seen_by_school_at';
    await pool.execute(
      `UPDATE admin_messages SET ${column} = CURRENT_TIMESTAMP WHERE message_id = ? OR parent_id = ?`,
      [id, id]
    );
    return this.findById(id);
  }

  static async deleteThread(id, role, { requireSeen = true } = {}) {
    await this.ensureTable();
    const seenColumn = role === 'super_admin' ? 'seen_by_super_admin_at' : 'seen_by_school_at';
    const deleteColumn = role === 'super_admin' ? 'deleted_by_super_admin_at' : 'deleted_by_school_at';
    const where = requireSeen ? `AND ${seenColumn} IS NOT NULL` : '';
    const [result] = await pool.execute(
      `UPDATE admin_messages SET ${deleteColumn} = CURRENT_TIMESTAMP
       WHERE (message_id = ? OR parent_id = ?) ${where}`,
      [id, id]
    );
    return result.affectedRows > 0;
  }

  static async deleteSeen(role, school_id = null) {
    await this.ensureTable();
    const seenColumn = role === 'super_admin' ? 'seen_by_super_admin_at' : 'seen_by_school_at';
    const deleteColumn = role === 'super_admin' ? 'deleted_by_super_admin_at' : 'deleted_by_school_at';
    const values = [];
    let schoolWhere = '';
    if (role !== 'super_admin') {
      schoolWhere = 'AND school_id = ?';
      values.push(school_id || 0);
    }

    const [result] = await pool.execute(
      `UPDATE admin_messages
       SET ${deleteColumn} = CURRENT_TIMESTAMP
       WHERE parent_id IS NULL
        AND ${seenColumn} IS NOT NULL
        AND ${deleteColumn} IS NULL
        ${schoolWhere}`,
      values
    );
    return result.affectedRows;
  }
}

module.exports = AdminMessage;
