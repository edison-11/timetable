const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Teacher {
  static async create(teacherData) {
    const { name, email, password, status = 'active', date_joined } = teacherData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO teacher (name, email, password, status, date_joined) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, status, date_joined || new Date()]
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM teacher WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, status, date_joined, created_at FROM teacher WHERE teacher_id = ?',
      [id]
    );
    return rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, status, date_joined, created_at FROM teacher ORDER BY created_at DESC'
    );
    return rows;
  }

  static async getByStatus(status) {
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email, status, date_joined, created_at FROM teacher WHERE status = ? ORDER BY name',
      [status]
    );
    return rows;
  }

  static async update(id, teacherData) {
    const { name, email, status, date_joined } = teacherData;
    await pool.execute(
      'UPDATE teacher SET name = ?, email = ?, status = ?, date_joined = ? WHERE teacher_id = ?',
      [name, email, status, date_joined, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM teacher WHERE teacher_id = ?', [id]);
  }

  static async getActiveTeachers() {
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, email FROM teacher WHERE status = "active" ORDER BY name'
    );
    return rows;
  }
}

module.exports = Teacher;
