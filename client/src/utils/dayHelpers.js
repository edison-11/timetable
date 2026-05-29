export const SCHOOL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKEND_START_HOUR = 18
const WEEKEND_END_HOUR = 6

export const getWeekdayName = (date = new Date()) => {
  return FULL_DAY_NAMES[date.getDay()] || ''
}

export const isAcademicWeekend = (date = new Date()) => {
  const day = date.getDay()
  const hour = date.getHours()
  return (day === 5 && hour >= WEEKEND_START_HOUR) || day === 6 || (day === 0 && hour < WEEKEND_END_HOUR)
}

export const getSchoolDayName = (date = new Date()) => {
  if (isAcademicWeekend(date)) return ''
  const index = (date.getDay() + 6) % 7
  return SCHOOL_DAYS[index] || ''
}

export const getSchoolDayIndex = (dayName) => {
  return SCHOOL_DAYS.indexOf(String(dayName || '').trim())
}

export const getMondayOfWeek = (date = new Date()) => {
  const monday = new Date(date)
  const weekday = monday.getDay()
  const diff = weekday === 0 ? -6 : 1 - weekday
  monday.setDate(monday.getDate() + diff)
  return monday
}

export const getSchoolWeekDate = (dayName, referenceDate = new Date()) => {
  const index = getSchoolDayIndex(dayName)
  if (index < 0) return null
  const monday = getMondayOfWeek(referenceDate)
  const result = new Date(monday)
  result.setDate(monday.getDate() + index)
  return result
}

export const getNextSchoolWeekDate = (dayName, referenceDate = new Date()) => {
  const index = getSchoolDayIndex(dayName)
  if (index < 0) return null
  if (isAcademicWeekend(referenceDate)) {
    const monday = new Date(referenceDate)
    const day = monday.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    monday.setDate(referenceDate.getDate() + daysUntilMonday)
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() + index)
    return monday
  }
  const todayIndex = (referenceDate.getDay() + 6) % 7
  let offset = index - todayIndex
  if (offset < 0) offset += 7
  const result = new Date(referenceDate)
  result.setDate(referenceDate.getDate() + offset)
  return result
}
