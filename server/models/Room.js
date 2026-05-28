const pool = require('../config/database');

class Room {
  static schemaReady = false;

  static async columnExists(columnName) {
    const [rows] = await pool.query('SHOW COLUMNS FROM room LIKE ?', [columnName]);
    return rows.length > 0;
  }

  static async ensureSchema() {
    if (this.schemaReady) return;
    if (!(await this.columnExists('school_id'))) {
      await pool.query('ALTER TABLE room ADD COLUMN school_id INT NULL');
    }
    this.schemaReady = true;
  }

  static async create(roomData) {
    await this.ensureSchema();
    const { room_name, room_type, capacity, school_id = null } = roomData;
    const [result] = await pool.execute(
      'INSERT INTO room (room_name, room_type, capacity, school_id) VALUES (?, ?, ?, ?)',
      [room_name, room_type, capacity, school_id || null]
    );
    return result.insertId;
  }

  static async getAll(filters = {}) {
    await this.ensureSchema();
    const where = [];
    const values = [];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(`SELECT * FROM room ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY room_name`, values);
    return rows;
  }

  static async findById(id) {
    await this.ensureSchema();
    const [rows] = await pool.execute('SELECT * FROM room WHERE room_id = ?', [id]);
    return rows[0];
  }

  static async getByType(room_type, filters = {}) {
    await this.ensureSchema();
    const where = ['room_type = ?'];
    const values = [room_type];
    if (filters.school_id) {
      where.push('school_id = ?');
      values.push(filters.school_id);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM room WHERE ${where.join(' AND ')} ORDER BY room_name`,
      values
    );
    return rows;
  }

  static async getAvailableRooms(start_time, end_time, day_of_week, filters = {}) {
    await this.ensureSchema();
    const schoolClause = filters.school_id ? 'AND r.school_id = ?' : '';
    const timetableSchoolClause = filters.school_id ? 'AND t.school_id = ?' : '';
    const values = [day_of_week, end_time, start_time];
    if (filters.school_id) values.push(filters.school_id, filters.school_id);
    const [rows] = await pool.execute(`
      SELECT r.* FROM room r
      WHERE r.room_id NOT IN (
        SELECT DISTINCT t.room_id
        FROM timetable t
        WHERE t.day_of_week = ?
          AND t.room_id IS NOT NULL
          AND t.start_time < ?
          AND t.end_time > ?
          ${timetableSchoolClause}
      )
      ${schoolClause}
      ORDER BY r.room_name
    `, values);
    return rows;
  }

  static async update(id, roomData) {
    const currentRoom = await this.findById(id);
    if (!currentRoom) return;

    await pool.execute(
      'UPDATE room SET room_name = ?, room_type = ?, capacity = ?, school_id = ? WHERE room_id = ?',
      [
        roomData.room_name ?? currentRoom.room_name,
        roomData.room_type ?? currentRoom.room_type,
        roomData.capacity ?? currentRoom.capacity,
        roomData.school_id ?? currentRoom.school_id,
        id
      ]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM room WHERE room_id = ?', [id]);
  }

  static async getRoomUsage(room_id, filters = {}) {
    await this.ensureSchema();
    const schoolClause = filters.school_id ? 'AND school_id = ?' : '';
    const values = [room_id];
    if (filters.school_id) values.push(filters.school_id);
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as usage_count,
             GROUP_CONCAT(DISTINCT day_of_week) as days_used
      FROM timetable
      WHERE room_id = ?
      ${schoolClause}
    `, values);
    return rows[0];
  }
}

module.exports = Room;
