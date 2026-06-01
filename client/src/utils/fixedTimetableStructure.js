export const FIXED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const FIXED_TIMETABLE_ROWS = [
  { type: 'period', slot_number: 1, period: 1, start_time: '08:00', end_time: '08:40' },
  { type: 'period', slot_number: 2, period: 2, start_time: '08:40', end_time: '09:20' },
  { type: 'period', slot_number: 3, period: 3, start_time: '09:20', end_time: '10:00' },
  { type: 'break', label: 'MORNING BREAK', break_name: 'Morning Break', breakType: 'morning-break', start_time: '10:00', end_time: '10:30' },
  { type: 'period', slot_number: 4, period: 4, start_time: '10:30', end_time: '11:10' },
  { type: 'period', slot_number: 5, period: 5, start_time: '11:10', end_time: '11:50' },
  { type: 'break', label: 'LUNCH BREAK', break_name: 'Lunch Break', breakType: 'lunch-break', start_time: '11:50', end_time: '12:35' },
  { type: 'period', slot_number: 6, period: 6, start_time: '12:35', end_time: '13:15' },
  { type: 'period', slot_number: 7, period: 7, start_time: '13:15', end_time: '13:55' },
  { type: 'period', slot_number: 8, period: 8, start_time: '13:55', end_time: '14:35' },
  { type: 'break', label: 'EVENING BREAK', break_name: 'Evening Break', breakType: 'evening-break', start_time: '14:35', end_time: '15:05' },
  { type: 'period', slot_number: 9, period: 9, start_time: '15:05', end_time: '15:45' },
  { type: 'period', slot_number: 10, period: 10, start_time: '15:45', end_time: '16:25' }
]

export const FIXED_PERIODS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'period')
export const FIXED_BREAKS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'break')

export const normalizeTime = (value) => String(value || '').slice(0, 5)

const timeToMinutes = (value) => {
  const [hours, minutes] = normalizeTime(value).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const minutesToTime = (value) => {
  const normalized = ((value % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

const toPositiveInteger = (value, fallback) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

const toNonNegativeInteger = (value, fallback) => {
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : fallback
}

const formatBreakType = (name = '') => {
  const normalized = String(name).toLowerCase()
  if (normalized.includes('lunch')) return 'lunch-break'
  if (normalized.includes('evening') || normalized.includes('afternoon')) return 'evening-break'
  return 'morning-break'
}

const makeBreakRow = (breakItem) => ({
  type: 'break',
  label: String(breakItem.break_name || 'Break').toUpperCase(),
  break_name: breakItem.break_name || 'Break',
  breakType: formatBreakType(breakItem.break_name),
  start_time: normalizeTime(breakItem.start_time),
  end_time: normalizeTime(breakItem.end_time)
})

const makeShiftRow = (start, end) => ({
  type: 'shift',
  label: 'SHIFT',
  break_name: 'Shift Change',
  breakType: 'shift-slot',
  start_time: minutesToTime(start),
  end_time: minutesToTime(end)
})

const buildRowsFromPeriodRules = (settings) => {
  const rules = settings?.break_period_rules || {}
  const periodMinutes = 40
  const changeoverMinutes = toNonNegativeInteger(settings?.teacher_changeover_minutes, 5)
  const rows = []
  let cursor = timeToMinutes(settings?.start_time || '08:00') ?? timeToMinutes('08:00')
  let slotNumber = 1
  let teachingSinceShift = 0

  const addShiftIfDue = (hasNextPeriodBeforeBreak = true) => {
    if (!hasNextPeriodBeforeBreak || changeoverMinutes <= 0 || slotNumber > 10) return
    const start = cursor
    const end = cursor + changeoverMinutes
    rows.push(makeShiftRow(start, end))
    cursor = end
    teachingSinceShift = 0
  }

  const addPeriods = (count) => {
    for (let index = 0; index < count && slotNumber <= 10; index += 1) {
      const start = cursor
      const end = start + periodMinutes
      rows.push({
        type: 'period',
        slot_number: slotNumber,
        period: slotNumber,
        start_time: minutesToTime(start),
        end_time: minutesToTime(end)
      })
      slotNumber += 1
      cursor = end
      teachingSinceShift += periodMinutes
      addShiftIfDue(index < count - 1)
    }
  }

  const addBreak = (break_name, minutes) => {
    if (slotNumber > 10) return
    const start = cursor
    const end = start + toPositiveInteger(minutes, 30)
    rows.push(makeBreakRow({
      break_name,
      start_time: minutesToTime(start),
      end_time: minutesToTime(end)
    }))
    cursor = end
    teachingSinceShift = 0
  }

  addPeriods(toPositiveInteger(rules.periods_before_morning_break, 3))
  addBreak('Morning Break', rules.morning_break_minutes)
  addPeriods(toPositiveInteger(rules.periods_before_lunch, 2))
  addBreak('Lunch Break', rules.lunch_break_minutes)
  addPeriods(toPositiveInteger(rules.periods_before_afternoon_break, 3))
  addBreak('Evening Break', rules.afternoon_break_minutes)
  addPeriods(toPositiveInteger(rules.periods_after_afternoon_break, 2))

  while (slotNumber <= 10) addPeriods(1)

  return rows
}

const buildRowsFromFixedBreaks = (settings) => {
  const periodMinutes = 40
  const changeoverMinutes = toNonNegativeInteger(settings?.teacher_changeover_minutes, 5)
  const breaks = Array.isArray(settings?.timetable_breaks)
    ? settings.timetable_breaks.map(makeBreakRow).filter((row) => row.start_time && row.end_time)
    : []
  const rows = []
  let cursor = timeToMinutes(settings?.start_time || '08:00') ?? timeToMinutes('08:00')
  let slotNumber = 1
  let teachingSinceShift = 0

  const addShiftIfDue = (limit = Infinity) => {
    if (changeoverMinutes <= 0 || cursor + changeoverMinutes + periodMinutes > limit) return
    const start = cursor
    const end = cursor + changeoverMinutes
    rows.push(makeShiftRow(start, end))
    cursor = end
    teachingSinceShift = 0
  }

  breaks
    .sort((a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0))
    .forEach((breakRow) => {
      const breakStart = timeToMinutes(breakRow.start_time)
      if (breakStart === null) return

      while (slotNumber <= 10 && cursor + periodMinutes <= breakStart) {
        rows.push({
          type: 'period',
          slot_number: slotNumber,
          period: slotNumber,
          start_time: minutesToTime(cursor),
          end_time: minutesToTime(cursor + periodMinutes)
        })
        slotNumber += 1
        cursor += periodMinutes
        teachingSinceShift += periodMinutes
        addShiftIfDue(breakStart)
      }

      rows.push(breakRow)
      cursor = Math.max(cursor, timeToMinutes(breakRow.end_time) ?? cursor)
      teachingSinceShift = 0
    })

  while (slotNumber <= 10) {
    rows.push({
      type: 'period',
      slot_number: slotNumber,
      period: slotNumber,
      start_time: minutesToTime(cursor),
      end_time: minutesToTime(cursor + periodMinutes)
    })
    slotNumber += 1
    cursor += periodMinutes
    teachingSinceShift += periodMinutes
    addShiftIfDue()
  }

  return rows.sort((a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0))
}

export const buildTimetableRowsFromSettings = (settings = null) => {
  if (!settings) return FIXED_TIMETABLE_ROWS
  if (settings.break_period_rules?.enabled) {
    return buildRowsFromPeriodRules(settings)
  }
  return buildRowsFromFixedBreaks(settings)
}

export const isBreakEntry = (entry) => {
  return entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break')
}

export const findFixedPeriod = (startTime, endTime, settings = null) => {
  const start = normalizeTime(startTime)
  const end = normalizeTime(endTime)
  return buildTimetableRowsFromSettings(settings)
    .filter((row) => row.type === 'period')
    .find((row) => row.start_time === start && row.end_time === end) || null
}

const findBestFixedPeriod = (entry, settings = null) => {
  const periodRows = buildTimetableRowsFromSettings(settings).filter((row) => row.type === 'period')
  const exactPeriod = entry.slot_number
    ? periodRows.find((row) => Number(row.slot_number) === Number(entry.slot_number))
    : findFixedPeriod(entry.start_time, entry.end_time, settings)

  if (exactPeriod) return exactPeriod

  const entryStart = timeToMinutes(entry.start_time)
  const entryEnd = timeToMinutes(entry.end_time)
  if (entryStart === null || entryEnd === null || entryEnd <= entryStart) return null

  return periodRows
    .map((period) => {
      const periodStart = timeToMinutes(period.start_time)
      const periodEnd = timeToMinutes(period.end_time)
      if (periodStart === null || periodEnd === null) return null
      const overlap = Math.max(0, Math.min(entryEnd, periodEnd) - Math.max(entryStart, periodStart))
      const startDistance = Math.abs(entryStart - periodStart)
      return { period, overlap, startDistance }
    })
    .filter((item) => item?.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.startDistance - b.startDistance)[0]?.period || null
}

export const buildFixedTimetableRows = (entries = [], selectedDays = FIXED_DAYS, settings = null) => {
  const days = selectedDays.filter((day) => FIXED_DAYS.includes(day))
  const timetableRows = buildTimetableRowsFromSettings(settings)
  const entriesBySlot = new Map()

  entries.forEach((entry) => {
    if (!entry?.day_of_week || !days.includes(entry.day_of_week) || isBreakEntry(entry)) return

    const fixedPeriod = findBestFixedPeriod(entry, settings)
    if (!fixedPeriod) return

    const key = `${fixedPeriod.slot_number}-${entry.day_of_week}`
    entriesBySlot.set(key, entry)
  })

  return timetableRows.map((row) => {
    if (row.type !== 'period') {
      return {
        ...row,
        key: `${row.type}-${row.start_time}-${row.end_time}`,
        entriesByDay: {}
      }
    }

    const entriesByDay = {}
    days.forEach((day) => {
      const entry = entriesBySlot.get(`${row.slot_number}-${day}`)
      if (entry) entriesByDay[day] = entry
    })

    return {
      ...row,
      key: `slot-${row.slot_number}`,
      entriesByDay
    }
  })
}
