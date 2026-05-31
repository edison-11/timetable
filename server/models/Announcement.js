const pool = require('../config/database');
const Notification = require('./Notification');
const School = require('./School');

class Announcement {
  static tableReady = false;

  static async ensureTable() {
    if (this.tableReady) return;

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS announcements (
        announcement_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('Normal', 'Important', 'Urgent') NOT NULL DEFAULT 'Normal',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS announcement_targets (
        target_id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        school_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_announcement_school (announcement_id, school_id),
        INDEX idx_announcement_targets_announcement (announcement_id),
        INDEX idx_announcement_targets_school (school_id)
      )
    `);

    await Notification.ensureTable();
    this.tableReady = true;
  }

  static normalizePriority(priority) {
    return ['Normal', 'Important', 'Urgent'].includes(priority) ? priority : 'Normal';
  }

  static toneForPriority(priority) {
    if (priority === 'Urgent') return 'rose';
    if (priority === 'Important') return 'amber';
    return 'blue';
  }

  static async resolveTargetSchools(targetSchoolIds = []) {
    const schools = await School.getAll();
    const requested = targetSchoolIds.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    if (!requested.length) return schools;

    const requestedSet = new Set(requested);
    return schools.filter((school) => requestedSet.has(Number(school.school_id)));
  }

  static async create(data) {
    await this.ensureTable();

    const title = String(data.title || '').trim();
    const message = String(data.message || '').trim();
    const priority = this.normalizePriority(data.priority);
    const targetSchools = await this.resolveTargetSchools(data.target_school_ids || []);

    const [result] = await pool.execute(
      'INSERT INTO announcements (title, message, priority, created_by) VALUES (?, ?, ?, ?)',
      [title, message, priority, data.created_by || null]
    );

    const announcementId = result.insertId;
    await Promise.all(targetSchools.map((school) => pool.execute(
      'INSERT IGNORE INTO announcement_targets (announcement_id, school_id) VALUES (?, ?)',
      [announcementId, school.school_id]
    )));

    await Promise.all(targetSchools.map((school) => Notification.create({
      type: 'announcement',
      title,
      message,
      path: '/dashboard#notifications',
      tone: this.toneForPriority(priority),
      school_id: school.school_id,
      recipient_role: null
    })));

    return this.findById(announcementId);
  }

  static async findById(id) {
    await this.ensureTable();

    const [rows] = await pool.execute(`
      SELECT
        a.announcement_id,
        a.title,
        a.message,
        a.priority,
        a.created_by,
        a.created_at,
        COUNT(at.school_id) AS target_count
      FROM announcements a
      LEFT JOIN announcement_targets at ON at.announcement_id = a.announcement_id
      WHERE a.announcement_id = ?
      GROUP BY a.announcement_id
    `, [id]);

    return rows[0] || null;
  }

  static async getRecent(options = {}) {
    await this.ensureTable();

    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const values = [];
    let targetJoin = '';
    let where = '';

    if (options.school_id) {
      targetJoin = 'JOIN announcement_targets ast ON ast.announcement_id = a.announcement_id';
      where = 'WHERE ast.school_id = ?';
      values.push(options.school_id);
    }

    const [rows] = await pool.execute(`
      SELECT
        a.announcement_id,
        a.title,
        a.message,
        a.priority,
        a.created_by,
        a.created_at,
        COUNT(at.school_id) AS target_count
      FROM announcements a
      ${targetJoin}
      LEFT JOIN announcement_targets at ON at.announcement_id = a.announcement_id
      ${where}
      GROUP BY a.announcement_id
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `, values);

    return rows;
  }
}

module.exports = Announcement;
