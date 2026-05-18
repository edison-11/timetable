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
      'INSERT INTO teacher (name, email, password, department, status, date_joined, school_code, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        email,
        hashedPassword,
        department,
        status,
        date_joined || new Date(),
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
      'SELECT teacher_id, name, email, password, department, status, date_joined, school_code, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to, notes, profile_photo, created_at FROM teacher WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    await this.ensureProfileColumns();
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, department, status, date_joined, profile_photo, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to, notes, created_at FROM teacher WHERE teacher_id = ?',
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

  static async getAll() {
    await this.ensureProfilePhotoColumn();
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, department, status, date_joined, profile_photo, created_at FROM teacher ORDER BY created_at DESC'
    );
    return rows;
  }

  static async getByStatus(status) {
    await this.ensureProfilePhotoColumn();
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, department, status, date_joined, profile_photo, created_at FROM teacher WHERE status = ? ORDER BY name',
      [status]
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

  static async getActiveTeachers() {
    await this.ensureProfilePhotoColumn();
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, department, profile_photo FROM teacher WHERE status = "active" ORDER BY department, name'
    );
    return rows;
  }
}

module.exports = Teacher;
