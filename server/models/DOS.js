const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class DOS {
  static async create(dosData) {
    const { name, email, password } = dosData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO dos (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM dos WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT dos_id, name, email, created_at FROM dos WHERE dos_id = ?',
      [id]
    );
    return rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT dos_id, name, email, created_at FROM dos ORDER BY created_at DESC'
    );
    return rows;
  }

  static async update(id, dosData) {
    const { name, email } = dosData;
    await pool.execute(
      'UPDATE dos SET name = ?, email = ? WHERE dos_id = ?',
      [name, email, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM dos WHERE dos_id = ?', [id]);
  }
}

module.exports = DOS;
