const FIXED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const FIXED_TIMETABLE_ROWS = [
  { type: 'period', slot_number: 1, start_time: '08:00', end_time: '08:40' },
  { type: 'period', slot_number: 2, start_time: '08:40', end_time: '09:20' },
  { type: 'period', slot_number: 3, start_time: '09:20', end_time: '10:00' },
  { type: 'break', label: 'MORNING BREAK', break_name: 'Morning Break', breakType: 'morning-break', start_time: '10:00', end_time: '10:30' },
  { type: 'period', slot_number: 4, start_time: '10:30', end_time: '11:10' },
  { type: 'period', slot_number: 5, start_time: '11:10', end_time: '11:50' },
  { type: 'break', label: 'LUNCH BREAK', break_name: 'Lunch Break', breakType: 'lunch-break', start_time: '11:50', end_time: '12:35' },
  { type: 'period', slot_number: 6, start_time: '12:35', end_time: '13:15' },
  { type: 'period', slot_number: 7, start_time: '13:15', end_time: '13:55' },
  { type: 'period', slot_number: 8, start_time: '13:55', end_time: '14:35' },
  { type: 'break', label: 'EVENING BREAK', break_name: 'Evening Break', breakType: 'evening-break', start_time: '14:35', end_time: '15:05' },
  { type: 'period', slot_number: 9, start_time: '15:05', end_time: '15:45' },
  { type: 'period', slot_number: 10, start_time: '15:45', end_time: '16:25' }
];

const normalizeTime = (time) => String(time || '').slice(0, 5);

const timeToMinutes = (time) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  return (hours * 60) + minutes;
};

const minutesToTime = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mins = String(normalized % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const toPositiveInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const toNonNegativeInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
};

const getBreakType = (name = '') => {
  const normalized = String(name).toLowerCase();
  if (normalized.includes('lunch')) return 'lunch-break';
  if (normalized.includes('evening') || normalized.includes('afternoon')) return 'evening-break';
  return 'morning-break';
};

const makeBreakRow = (breakItem) => ({
  type: 'break',
  label: String(breakItem.break_name || 'Break').toUpperCase(),
  break_name: breakItem.break_name || 'Break',
  breakType: getBreakType(breakItem.break_name),
  start_time: normalizeTime(breakItem.start_time),
  end_time: normalizeTime(breakItem.end_time)
});

const makeShiftRow = (start, end) => ({
  type: 'shift',
  label: 'SHIFT',
  break_name: 'Shift Change',
  breakType: 'shift-slot',
  start_time: minutesToTime(start),
  end_time: minutesToTime(end)
});

const buildRowsFromPeriodRules = (settings = {}) => {
  const rules = settings.break_period_rules || {};
  const periodMinutes = 40;
  const changeoverMinutes = toNonNegativeInteger(settings.teacher_changeover_minutes, 5);
  const rows = [];
  let cursor = timeToMinutes(settings.start_time || '08:00');
  let slotNumber = 1;
  let teachingSinceShift = 0;

  const addShiftIfDue = (hasNextPeriodBeforeBreak = true) => {
    if (!hasNextPeriodBeforeBreak || changeoverMinutes <= 0 || slotNumber > 10) return;
    const start = cursor;
    const end = cursor + changeoverMinutes;
    rows.push(makeShiftRow(start, end));
    cursor = end;
    teachingSinceShift = 0;
  };

  const addPeriods = (count) => {
    for (let index = 0; index < count && slotNumber <= 10; index += 1) {
      const start = cursor;
      const end = start + periodMinutes;
      rows.push({
        type: 'period',
        slot_number: slotNumber,
        period: slotNumber,
        start_time: minutesToTime(start),
        end_time: minutesToTime(end)
      });
      slotNumber += 1;
      cursor = end;
      teachingSinceShift += periodMinutes;
      addShiftIfDue(index < count - 1);
    }
  };

  const addBreak = (break_name, duration) => {
    if (slotNumber > 10) return;
    const start = cursor;
    const end = start + toPositiveInteger(duration, 30);
    rows.push(makeBreakRow({
      break_name,
      start_time: minutesToTime(start),
      end_time: minutesToTime(end)
    }));
    cursor = end;
    teachingSinceShift = 0;
  };

  addPeriods(toPositiveInteger(rules.periods_before_morning_break, 3));
  addBreak('Morning Break', rules.morning_break_minutes);
  addPeriods(toPositiveInteger(rules.periods_before_lunch, 2));
  addBreak('Lunch Break', rules.lunch_break_minutes);
  addPeriods(toPositiveInteger(rules.periods_before_afternoon_break, 3));
  addBreak('Evening Break', rules.afternoon_break_minutes);
  addPeriods(toPositiveInteger(rules.periods_after_afternoon_break, 2));

  while (slotNumber <= 10) addPeriods(1);

  return rows;
};

const buildRowsFromFixedBreaks = (settings = {}) => {
  const periodMinutes = 40;
  const changeoverMinutes = toNonNegativeInteger(settings.teacher_changeover_minutes, 5);
  const breaks = Array.isArray(settings.timetable_breaks)
    ? settings.timetable_breaks.map(makeBreakRow).filter((row) => row.start_time && row.end_time)
    : [];
  const rows = [];
  let cursor = timeToMinutes(settings.start_time || '08:00');
  let slotNumber = 1;
  let teachingSinceShift = 0;

  const addShiftIfDue = (limit = Infinity) => {
    if (changeoverMinutes <= 0 || cursor + changeoverMinutes + periodMinutes > limit) return;
    const start = cursor;
    const end = cursor + changeoverMinutes;
    rows.push(makeShiftRow(start, end));
    cursor = end;
    teachingSinceShift = 0;
  };

  breaks
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    .forEach((breakRow) => {
      const breakStart = timeToMinutes(breakRow.start_time);
      while (slotNumber <= 10 && cursor + periodMinutes <= breakStart) {
        rows.push({
          type: 'period',
          slot_number: slotNumber,
          period: slotNumber,
          start_time: minutesToTime(cursor),
          end_time: minutesToTime(cursor + periodMinutes)
        });
        slotNumber += 1;
        cursor += periodMinutes;
        teachingSinceShift += periodMinutes;
        addShiftIfDue(breakStart);
      }

      rows.push(breakRow);
      cursor = Math.max(cursor, timeToMinutes(breakRow.end_time));
      teachingSinceShift = 0;
    });

  while (slotNumber <= 10) {
    rows.push({
      type: 'period',
      slot_number: slotNumber,
      period: slotNumber,
      start_time: minutesToTime(cursor),
      end_time: minutesToTime(cursor + periodMinutes)
    });
    slotNumber += 1;
    cursor += periodMinutes;
    teachingSinceShift += periodMinutes;
    addShiftIfDue();
  }

  return rows.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
};

const buildTimetableRowsFromSettings = (settings = null) => {
  if (!settings) return FIXED_TIMETABLE_ROWS;
  return settings.break_period_rules?.enabled
    ? buildRowsFromPeriodRules(settings)
    : buildRowsFromFixedBreaks(settings);
};

const FIXED_PERIODS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'period');
const FIXED_BREAKS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'break');

const findFixedPeriod = (startTime, endTime, settings = null) => {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  return buildTimetableRowsFromSettings(settings)
    .filter((row) => row.type === 'period')
    .find((row) => row.start_time === start && row.end_time === end) || null;
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
  buildTimetableRowsFromSettings,
  findFixedPeriod,
  findFixedRow,
  normalizeTime
};
