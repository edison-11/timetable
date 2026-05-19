export const FIXED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const FIXED_TIMETABLE_ROWS = [
  { type: 'period', slot_number: 1, period: 1, start_time: '08:00', end_time: '08:45' },
  { type: 'period', slot_number: 2, period: 2, start_time: '08:45', end_time: '09:30' },
  { type: 'period', slot_number: 3, period: 3, start_time: '09:30', end_time: '10:15' },
  { type: 'break', label: 'MORNING BREAK', break_name: 'Morning Break', breakType: 'morning-break', start_time: '10:15', end_time: '10:45' },
  { type: 'period', slot_number: 4, period: 4, start_time: '10:45', end_time: '11:30' },
  { type: 'period', slot_number: 5, period: 5, start_time: '11:30', end_time: '12:15' },
  { type: 'break', label: 'LUNCH BREAK', break_name: 'Lunch Break', breakType: 'lunch-break', start_time: '12:15', end_time: '13:00' },
  { type: 'period', slot_number: 6, period: 6, start_time: '13:00', end_time: '13:45' },
  { type: 'period', slot_number: 7, period: 7, start_time: '13:45', end_time: '14:30' },
  { type: 'period', slot_number: 8, period: 8, start_time: '14:30', end_time: '15:15' },
  { type: 'break', label: 'EVENING BREAK', break_name: 'Evening Break', breakType: 'evening-break', start_time: '15:15', end_time: '15:45' },
  { type: 'period', slot_number: 9, period: 9, start_time: '15:45', end_time: '16:30' },
  { type: 'period', slot_number: 10, period: 10, start_time: '16:30', end_time: '17:15' }
]

export const FIXED_PERIODS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'period')
export const FIXED_BREAKS = FIXED_TIMETABLE_ROWS.filter((row) => row.type === 'break')

export const normalizeTime = (value) => String(value || '').slice(0, 5)

export const isBreakEntry = (entry) => {
  return entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break')
}

export const findFixedPeriod = (startTime, endTime) => {
  const start = normalizeTime(startTime)
  const end = normalizeTime(endTime)
  return FIXED_PERIODS.find((row) => row.start_time === start && row.end_time === end) || null
}

export const buildFixedTimetableRows = (entries = [], selectedDays = FIXED_DAYS) => {
  const days = selectedDays.filter((day) => FIXED_DAYS.includes(day))
  const entriesBySlot = new Map()

  entries.forEach((entry) => {
    if (!entry?.day_of_week || !days.includes(entry.day_of_week) || isBreakEntry(entry)) return

    const fixedPeriod = entry.slot_number
      ? FIXED_PERIODS.find((row) => Number(row.slot_number) === Number(entry.slot_number))
      : findFixedPeriod(entry.start_time, entry.end_time)

    if (!fixedPeriod) return

    const key = `${fixedPeriod.slot_number}-${entry.day_of_week}`
    entriesBySlot.set(key, entry)
  })

  return FIXED_TIMETABLE_ROWS.map((row) => {
    if (row.type === 'break') {
      return {
        ...row,
        key: `break-${row.start_time}-${row.end_time}`,
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
