const pool = require('../config/database');

class Room {
  static async create(roomData) {
    const { room_name, room_type, capacity } = roomData;
    const [result] = await pool.execute(
      'INSERT INTO room (room_name, room_type, capacity) VALUES (?, ?, ?)',
      [room_name, room_type, capacity]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.execute('SELECT * FROM room ORDER BY room_name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM room WHERE room_id = ?', [id]);
    return rows[0];
  }

  static async getByType(room_type) {
    const [rows] = await pool.execute(
      'SELECT * FROM room WHERE room_type = ? ORDER BY room_name',
      [room_type]
    );
    return rows;
  }

  static async getAvailableRooms(start_time, end_time, day_of_week) {
    const [rows] = await pool.execute(`
      SELECT r.* FROM room r
      WHERE r.room_id NOT IN (
        SELECT DISTINCT t.room_id
        FROM timetable t
        WHERE t.day_of_week = ?
          AND t.room_id IS NOT NULL
          AND t.start_time < ?
          AND t.end_time > ?
      )
      ORDER BY r.room_name
    `, [day_of_week, end_time, start_time]);
    return rows;
  }

  static async update(id, roomData) {
    const currentRoom = await this.findById(id);
    if (!currentRoom) return;

    await pool.execute(
      'UPDATE room SET room_name = ?, room_type = ?, capacity = ? WHERE room_id = ?',
      [
        roomData.room_name ?? currentRoom.room_name,
        roomData.room_type ?? currentRoom.room_type,
        roomData.capacity ?? currentRoom.capacity,
        id
      ]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM room WHERE room_id = ?', [id]);
  }

  static async getRoomUsage(room_id) {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as usage_count,
             GROUP_CONCAT(DISTINCT day_of_week) as days_used
      FROM timetable
      WHERE room_id = ?
    `, [room_id]);
    return rows[0];
  }
}

module.exports = Room;
