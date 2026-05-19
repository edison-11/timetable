const FIXED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const FIXED_TIMETABLE_ROWS = [
  { type: 'period', slot_number: 1, start_time: '08:00', end_time: '08:45' },
  { type: 'period', slot_number: 2, start_time: '08:45', end_time: '09:30' },
  { type: 'period', slot_number: 3, start_time: '09:30', end_time: '10:15' },
  { type: 'break', label: 'MORNING BREAK', break_name: 'Morning Break', breakType: 'morning-break', start_time: '10:15', end_time: '10:45' },
  { type: 'period', slot_number: 4, start_time: '10:45', end_time: '11:30' },
  { type: 'period', slot_number: 5, start_time: '11:30', end_time: '12:15' },
  { type: 'break', label: 'LUNCH BREAK', break_name: 'Lunch Break', breakType: 'lunch-break', start_time: '12:15', end_time: '13:00' },
  { type: 'period', slot_number: 6, start_time: '13:00', end_time: '13:45' },
  { type: 'period', slot_number: 7, start_time: '13:45', end_time: '14:30' },
  { type: 'period', slot_number: 8, start_time: '14:30', end_time: '15:15' },
  { type: 'break', label: 'EVENING BREAK', break_name: 'Evening Break', breakType: 'evening-break', start_time: '15:15', end_time: '15:45' },
  { type: 'period', slot_number: 9, start_time: '15:45', end_time: '16:30' },
  { type: 'period', slot_number: 10, start_time: '16:30', end_time: '17:15' }
];

const normalizeTime = (time) => String(time || '').slice(0, 5);

const FIXED_PERIODS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'period');
const FIXED_BREAKS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'break');

const findFixedPeriod = (startTime, endTime) => {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  return FIXED_PERIODS.find((row) => row.start_time === start && row.end_time === end) || null;
};

const findFixedRow = (startTime, endTime) => {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  return FIXED_TIMETABLE_ROWS.find((row) => row.start_time === start && row.end_time === end) || null;
};

module.exports = {
  FIXED_DAYS,
  FIXED_TIMETABLE_ROWS,
  FIXED_PERIODS,
  FIXED_BREAKS,
  findFixedPeriod,
  findFixedRow,
  normalizeTime
};
