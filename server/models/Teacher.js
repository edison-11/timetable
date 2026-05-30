const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Teacher {
  static async ensureProfilePhotoColumn() {
    try {
      await pool.execute('ALTER TABLE teacher ADD COLUMN profile_photo VARCHAR(255) NULL');
    } catch (error) {
      if (!String(error.message || '').toLowerCase().includes('duplicate')) {
        throw error;
      }
    }
  }

  static async ensureProfileColumns() {
    const columns = [
      'school_id INT NULL',
      'school_code VARCHAR(100) NULL',
      'profile_photo VARCHAR(255) NULL',
      'employee_id VARCHAR(100) NULL',
      'phone VARCHAR(100) NULL',
      'module_name VARCHAR(255) NULL',
      'qualification VARCHAR(255) NULL',
      'years_experience INT NULL',
      'available_days VARCHAR(255) NULL',
      'available_from TIME NULL',
      'available_to TIME NULL',
      'notes TEXT NULL'
    ]

    for (const column of columns) {
      try {
        await pool.execute(`ALTER TABLE teacher ADD COLUMN ${column}`)
      } catch (error) {
        if (!String(error.message || '').toLowerCase().includes('duplicate')) {
          throw error
        }
      }
    }
  }

  static async create(teacherData) {
    await this.ensureProfileColumns();
    const {
      name,
      email,
      password,
      department = 'SSOD',
      status = 'active',
      date_joined,
      school_id,
      school_code,
      employee_id,
      phone,
      module_name,
      qualification,
      years_experience,
      available_days,
      available_from,
      available_to,
      notes
    } = teacherData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO teacher (name, email, password, department, status, date_joined, school_id, school_code, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        email,
        hashedPassword,
        department,
        status,
        date_joined || new Date(),
        school_id || null,
        school_code || null,
        employee_id || null,
        phone || null,
        module_name || null,
        qualification || null,
        years_experience || null,
        available_days || null,
        available_from || null,
        available_to || null,
        notes || null
      ]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    await this.ensureProfileColumns();
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, password, department, status, date_joined, school_id, school_code, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to, notes, profile_photo, created_at FROM teacher WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    await this.ensureProfileColumns();
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, department, status, date_joined, school_id, profile_photo, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to, notes, created_at FROM teacher WHERE teacher_id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmailExcludingId(email, id) {
    const [rows] = await pool.execute(
      'SELECT * FROM teacher WHERE LOWER(email) = LOWER(?) AND teacher_id != ?',
      [email, id]
    );
    return rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(filters = {}) {
    await this.ensureProfileColumns();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('t.school_id = ?');
      values.push(filters.school_id);
    }

    const [rows] = await pool.execute(`
      SELECT
        t.teacher_id,
        t.name,
        t.email,
        t.department,
        t.status,
        t.date_joined,
        t.school_id,
        t.profile_photo,
        t.employee_id,
        t.phone,
        t.module_name,
        t.qualification,
        t.years_experience,
        t.created_at,
        GROUP_CONCAT(DISTINCT head_class.class_name ORDER BY head_class.class_name SEPARATOR ', ') AS head_teacher_classes,
        GROUP_CONCAT(DISTINCT taught_class.class_name ORDER BY taught_class.class_name SEPARATOR ', ') AS teaching_classes,
        GROUP_CONCAT(DISTINCT assigned_module.module_name ORDER BY assigned_module.module_name SEPARATOR ', ') AS assigned_modules
      FROM teacher t
      LEFT JOIN class head_class ON head_class.class_teacher_id = t.teacher_id
      LEFT JOIN assignment a ON a.teacher_id = t.teacher_id
      LEFT JOIN class taught_class ON taught_class.class_id = a.class_id
      LEFT JOIN module assigned_module ON assigned_module.module_id = a.module_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY
        t.teacher_id,
        t.name,
        t.email,
        t.department,
        t.status,
        t.date_joined,
        t.school_id,
        t.profile_photo,
        t.employee_id,
        t.phone,
        t.module_name,
        t.qualification,
        t.years_experience,
        t.created_at
      ORDER BY t.created_at DESC
    `, values);
    return rows;
  }

  static async getByStatus(status, filters = {}) {
    await this.ensureProfileColumns();
    const where = ['status = ?'];
    const values = [status];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT teacher_id, name, email, department, status, date_joined, school_id, profile_photo, created_at
       FROM teacher
       WHERE ${where.join(' AND ')}
       ORDER BY name`,
      values
    );
    return rows;
  }

  static async update(id, teacherData) {
    await this.ensureProfileColumns();
    const {
      name,
      email,
      password,
      department,
      status,
      date_joined,
      school_id,
      profile_photo,
      employee_id,
      phone,
      module_name,
      qualification,
      years_experience,
      available_days,
      available_from,
      available_to,
      notes
    } = teacherData;
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
    if (school_id !== undefined) {
      updateFields.push('school_id = ?');
      updateValues.push(school_id || null);
    }
    if (profile_photo !== undefined) {
      updateFields.push('profile_photo = ?');
      updateValues.push(profile_photo || null);
    }
    if (employee_id !== undefined) {
      updateFields.push('employee_id = ?');
      updateValues.push(employee_id || null);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }
    if (module_name !== undefined) {
      updateFields.push('module_name = ?');
      updateValues.push(module_name || null);
    }
    if (qualification !== undefined) {
      updateFields.push('qualification = ?');
      updateValues.push(qualification || null);
    }
    if (years_experience !== undefined) {
      updateFields.push('years_experience = ?');
      updateValues.push(years_experience || null);
    }
    if (available_days !== undefined) {
      updateFields.push('available_days = ?');
      updateValues.push(available_days || null);
    }
    if (available_from !== undefined) {
      updateFields.push('available_from = ?');
      updateValues.push(available_from || null);
    }
    if (available_to !== undefined) {
      updateFields.push('available_to = ?');
      updateValues.push(available_to || null);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes || null);
    }

    if (!updateFields.length) return;

    updateValues.push(id);
    await pool.execute(`UPDATE teacher SET ${updateFields.join(', ')} WHERE teacher_id = ?`, updateValues);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM teacher WHERE teacher_id = ?', [id]);
  }

  static async getActiveTeachers(filters = {}) {
    await this.ensureProfileColumns();
    const where = ['status = "active"'];
    const values = [];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT teacher_id, school_id, name, email, department, profile_photo FROM teacher WHERE ${where.join(' AND ')} ORDER BY department, name`,
      values
    );
    return rows;
  }
}

module.exports = Teacher;
