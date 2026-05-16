class Timetable {
  static unsupported() {
    throw new Error('Legacy Timetable model is not supported. Use TimetableEntry via /api/timetable.');
  }

  static async create() {
    this.unsupported();
  }

  static async getAll() {
    this.unsupported();
  }

  static async getById() {
    this.unsupported();
  }

  static async getByUserId() {
    this.unsupported();
  }

  static async update() {
    this.unsupported();
  }

  static async delete() {
    this.unsupported();
  }

  static async getConflicts() {
    this.unsupported();
  }

  static async isTimeInBreakPeriod() {
    this.unsupported();
  }
}

module.exports = Timetable;
