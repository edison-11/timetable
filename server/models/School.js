const pool = require('../config/database');

class School {
  static schemaReady = false;

  static async ensureSchema() {
    if (this.schemaReady) return;

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS schools (
        school_id INT AUTO_INCREMENT PRIMARY KEY,
        school_name VARCHAR(255) NOT NULL,
        school_email VARCHAR(255) NOT NULL UNIQUE,
        registration_number VARCHAR(120) NOT NULL UNIQUE,
        school_address TEXT NULL,
        phone VARCHAR(100) NULL,
        status ENUM('pending_approval', 'active', 'rejected', 'suspended', 'deactivated') NOT NULL DEFAULT 'pending_approval',
        profile_photo VARCHAR(255) NULL,
        approved_at TIMESTAMP NULL,
        rejected_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS directors_of_studies (
        dos_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        school_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(100) NOT NULL,
        national_id VARCHAR(120) NOT NULL,
        profile_photo VARCHAR(255) NULL,
        status ENUM('pending', 'active', 'rejected', 'suspended', 'disabled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_dos_school (school_id)
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS approvals (
        approval_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(80) NOT NULL,
        entity_id INT NOT NULL,
        school_id INT NULL,
        requested_by INT NULL,
        reviewed_by INT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        review_note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        INDEX idx_approval_entity (entity_type, entity_id),
        INDEX idx_approval_school (school_id)
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        activity_id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NULL,
        user_id INT NULL,
        actor_role VARCHAR(80) NULL,
        action VARCHAR(120) NOT NULL,
        entity_type VARCHAR(80) NULL,
        entity_id INT NULL,
        message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activity_school (school_id)
      )
    `);

    await this.ensureProfileColumns();

    this.schemaReady = true;
  }

  static async columnExists(tableName, columnName) {
    const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
    return rows.length > 0;
  }

  static async tableExists(tableName) {
    const [rows] = await pool.query('SHOW TABLES LIKE ?', [tableName]);
    return rows.length > 0;
  }

  static async addColumnIfMissing(tableName, columnName, definition) {
    if (await this.columnExists(tableName, columnName)) return;
    await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  }

  static async ensureProfileColumns() {
    try {
      await pool.query("UPDATE schools SET status = 'pending_approval' WHERE status = 'pending'");
      await pool.query("UPDATE schools SET status = 'deactivated' WHERE status = 'inactive'");
      await pool.query(`
        ALTER TABLE schools
        MODIFY status ENUM('pending_approval', 'active', 'rejected', 'suspended', 'deactivated') NOT NULL DEFAULT 'pending_approval'
      `);
      await pool.query(`
        ALTER TABLE directors_of_studies
        MODIFY status ENUM('pending', 'active', 'rejected', 'suspended', 'disabled') NOT NULL DEFAULT 'pending'
      `);
    } catch (error) {
      console.error('Error normalizing school lifecycle columns:', error.message);
    }
    await this.addColumnIfMissing('schools', 'school_code', 'school_code VARCHAR(80) NULL');
    await this.addColumnIfMissing('schools', 'province', 'province VARCHAR(120) NULL');
    await this.addColumnIfMissing('schools', 'district', 'district VARCHAR(120) NULL');
    await this.addColumnIfMissing('schools', 'sector', 'sector VARCHAR(120) NULL');
    await this.addColumnIfMissing('schools', 'school_type', 'school_type VARCHAR(120) NULL');
    await this.addColumnIfMissing('schools', 'subscription_status', "subscription_status ENUM('trial', 'active', 'past_due', 'suspended') NOT NULL DEFAULT 'trial'");
  }

  static async addSchoolColumn(tableName) {
    try {
      await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN school_id INT NULL`);
    } catch (error) {
      if (!String(error.message || '').toLowerCase().includes('duplicate')) {
        throw error;
      }
    }
  }

  static async ensureTenantColumns() {
    await this.ensureSchema();
    const tables = [
      'teacher',
      'student',
      'class',
      'module',
      'section',
      'room',
      'assignment',
      'timetable',
      'timetable_entries',
      'attendance',
      'notifications'
    ];

    for (const table of tables) {
      try {
        await this.addSchoolColumn(table);
      } catch (error) {
        if (!['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(error.code)) {
          throw error;
        }
      }
    }
  }

  static async create(data) {
    await this.ensureSchema();
    const [result] = await pool.execute(
      `INSERT INTO schools
        (school_name, school_email, registration_number, school_code, school_address, phone, province, district, sector, school_type, status, subscription_status, profile_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.school_name,
        data.school_email,
        data.registration_number,
        data.school_code || null,
        data.school_address || null,
        data.phone || null,
        data.province || null,
        data.district || null,
        data.sector || null,
        data.school_type || null,
        data.status || 'pending_approval',
        data.subscription_status || 'trial',
        data.profile_photo || null
      ]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    await this.ensureSchema();
    const [rows] = await pool.execute(
      'SELECT * FROM schools WHERE LOWER(school_email) = LOWER(?) AND deleted_at IS NULL',
      [email]
    );
    return rows[0] || null;
  }

  static async findByRegistrationNumber(registrationNumber) {
    await this.ensureSchema();
    const [rows] = await pool.execute(
      'SELECT * FROM schools WHERE LOWER(registration_number) = LOWER(?) AND deleted_at IS NULL',
      [registrationNumber]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    await this.ensureSchema();
    const [rows] = await pool.execute(
      'SELECT * FROM schools WHERE school_id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  }

  static async getAll(filters = {}) {
    await this.ensureSchema();
    await this.ensureTenantColumns();
    const where = ['s.deleted_at IS NULL'];
    const values = [];

    if (filters.status) {
      where.push('s.status = ?');
      values.push(filters.status);
    }

    if (filters.search) {
      where.push('(s.school_name LIKE ? OR s.school_email LIKE ? OR s.registration_number LIKE ?)');
      const term = `%${filters.search}%`;
      values.push(term, term, term);
    }

    const hasStudentTable = await this.tableExists('student');
    const studentCountSelect = hasStudentTable
      ? '(SELECT COUNT(*) FROM student st WHERE st.school_id = s.school_id) AS student_count'
      : '0 AS student_count';

    const [rows] = await pool.execute(`
      SELECT
        s.*,
        dos.dos_id,
        COALESCE(dos.full_name, dos_user.full_name, dos_user.username) AS dos_name,
        COALESCE(dos.email, dos_user.email) AS dos_email,
        COALESCE(dos.phone, dos_user.phone) AS dos_phone,
        COALESCE(dos.status, dos_user.status) AS dos_status,
        (SELECT COUNT(*) FROM teacher t WHERE t.school_id = s.school_id) AS teacher_count,
        (SELECT COUNT(*) FROM teacher t WHERE t.school_id = s.school_id AND t.status = 'active') AS active_teacher_count,
        (SELECT COUNT(*) FROM teacher t WHERE t.school_id = s.school_id AND t.status = 'pending') AS pending_teacher_count,
        ${studentCountSelect},
        (SELECT COUNT(*) FROM class c WHERE c.school_id = s.school_id) AS class_count,
        (SELECT COUNT(*) FROM module m WHERE m.school_id = s.school_id) AS subject_count,
        (SELECT COUNT(*) FROM assignment a WHERE a.school_id = s.school_id) AS combination_count,
        (SELECT COUNT(*) FROM room r WHERE r.school_id = s.school_id) AS room_count,
        (SELECT COUNT(*) FROM timetable tt WHERE tt.school_id = s.school_id) AS timetable_entry_count
      FROM schools s
      LEFT JOIN directors_of_studies dos ON dos.school_id = s.school_id AND dos.deleted_at IS NULL
      LEFT JOIN users dos_user ON dos_user.school_id = s.school_id AND dos_user.role = 'dos'
      WHERE ${where.join(' AND ')}
      ORDER BY s.created_at DESC
    `, values);

    return rows;
  }

  static async updateStatus(id, status) {
    await this.ensureSchema();
    const timestampColumn = status === 'active' ? 'approved_at' : status === 'rejected' ? 'rejected_at' : null;
    const assignments = ['status = ?'];
    const values = [status];

    if (timestampColumn) {
      assignments.push(`${timestampColumn} = CURRENT_TIMESTAMP`);
    }

    values.push(id);
    await pool.execute(`UPDATE schools SET ${assignments.join(', ')} WHERE school_id = ?`, values);
  }

  static async updateSubscriptionStatus(id, subscriptionStatus) {
    await this.ensureSchema();
    await pool.execute(
      'UPDATE schools SET subscription_status = ? WHERE school_id = ? AND deleted_at IS NULL',
      [subscriptionStatus, id]
    );
  }

  static async softDelete(id) {
    await this.ensureSchema();
    await pool.execute(
      "UPDATE schools SET status = 'deactivated', deleted_at = CURRENT_TIMESTAMP WHERE school_id = ?",
      [id]
    );
  }

  static async getPlatformStats() {
    await this.ensureSchema();
    const [[schoolStats]] = await pool.execute(`
      SELECT
        COUNT(*) AS total_schools,
        SUM(status = 'pending_approval') AS pending_schools,
        SUM(status = 'active') AS active_schools,
        SUM(status = 'suspended') AS suspended_schools,
        SUM(status IN ('deactivated', 'rejected')) AS inactive_schools
      FROM schools
      WHERE deleted_at IS NULL
    `);

    const [[teacherStats]] = await pool.execute('SELECT COUNT(*) AS total_teachers, SUM(status = "active") AS active_teachers FROM teacher');
    const [[classStats]] = await pool.execute('SELECT COUNT(*) AS total_classes FROM class');
    const [[subjectStats]] = await pool.execute('SELECT COUNT(*) AS total_subjects FROM module');
    const [[combinationStats]] = await pool.execute('SELECT COUNT(*) AS total_combinations FROM assignment');
    const [[timetableStats]] = await pool.execute('SELECT COUNT(*) AS total_timetable_entries, COUNT(DISTINCT school_id) AS schools_with_timetables FROM timetable');
    const [[dosStats]] = await pool.execute(`
      SELECT
        COUNT(DISTINCT user_id) AS total_dos,
        SUM(status = 'active') AS active_dos,
        SUM(status = 'pending') AS pending_dos
      FROM (
        SELECT COALESCE(user_id, CONCAT('director-', dos_id)) AS user_id, status
        FROM directors_of_studies
        WHERE deleted_at IS NULL
        UNION
        SELECT id AS user_id, status
        FROM users
        WHERE role = 'dos'
      ) dos_accounts
    `);

    return {
      total_schools: Number(schoolStats.total_schools || 0),
      pending_schools: Number(schoolStats.pending_schools || 0),
      active_schools: Number(schoolStats.active_schools || 0),
      suspended_schools: Number(schoolStats.suspended_schools || 0),
      inactive_schools: Number(schoolStats.inactive_schools || 0),
      total_teachers: Number(teacherStats.total_teachers || 0),
      active_teachers: Number(teacherStats.active_teachers || 0),
      total_classes: Number(classStats.total_classes || 0),
      total_subjects: Number(subjectStats.total_subjects || 0),
      total_combinations: Number(combinationStats.total_combinations || 0),
      total_timetable_entries: Number(timetableStats.total_timetable_entries || 0),
      schools_with_timetables: Number(timetableStats.schools_with_timetables || 0),
      total_dos: Number(dosStats.total_dos || 0),
      active_dos: Number(dosStats.active_dos || 0),
      pending_dos: Number(dosStats.pending_dos || 0)
    };
  }

  static async getRecentActivities(filters = {}) {
    await this.ensureSchema();
    const values = [];
    const where = [];

    if (filters.school_id) {
      where.push('a.school_id = ?');
      values.push(filters.school_id);
    }

    const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
    const [rows] = await pool.execute(`
      SELECT a.*, s.school_name
      FROM activity_logs a
      LEFT JOIN schools s ON a.school_id = s.school_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `, values);

    return rows;
  }

  static async createDirector(data) {
    await this.ensureSchema();
    const [result] = await pool.execute(
      `INSERT INTO directors_of_studies
        (user_id, school_id, full_name, email, phone, national_id, profile_photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id || null,
        data.school_id,
        data.full_name,
        data.email,
        data.phone,
        data.national_id,
        data.profile_photo || null,
        data.status || 'pending'
      ]
    );

    return result.insertId;
  }

  static async findDirectorByEmail(email) {
    await this.ensureSchema();
    const [rows] = await pool.execute(
      'SELECT * FROM directors_of_studies WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL',
      [email]
    );
    return rows[0] || null;
  }

  static async updateDirectorStatusBySchool(schoolId, status) {
    await this.ensureSchema();
    await pool.execute(
      'UPDATE directors_of_studies SET status = ? WHERE school_id = ? AND deleted_at IS NULL',
      [status, schoolId]
    );
  }

  static async logActivity(data) {
    await this.ensureSchema();
    await pool.execute(
      `INSERT INTO activity_logs
        (school_id, user_id, actor_role, action, entity_type, entity_id, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.school_id || null,
        data.user_id || null,
        data.actor_role || null,
        data.action,
        data.entity_type || null,
        data.entity_id || null,
        data.message || null
      ]
    );
  }
}

module.exports = School;
