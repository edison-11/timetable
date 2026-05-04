const pool = require('../config/database');

const defaultShifts = [
  {
    shift_name: 'Morning Shift',
    start_time: '07:30',
    end_time: '12:30'
  },
  {
    shift_name: 'Afternoon Shift',
    start_time: '12:30',
    end_time: '17:30'
  }
];

const seedDefaultShifts = async () => {
  try {
    for (const shift of defaultShifts) {
      const [existingRows] = await pool.execute(
        'SELECT shift_id FROM shift WHERE LOWER(shift_name) = LOWER(?) LIMIT 1',
        [shift.shift_name]
      );

      if (existingRows.length) {
        console.log(`${shift.shift_name} already exists`);
        continue;
      }

      await pool.execute(
        'INSERT INTO shift (shift_name, start_time, end_time) VALUES (?, ?, ?)',
        [shift.shift_name, shift.start_time, shift.end_time]
      );
      console.log(`${shift.shift_name} added`);
    }
  } catch (error) {
    console.error('Failed to seed default shifts:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedDefaultShifts();
