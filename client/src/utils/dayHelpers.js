export const SCHOOL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const getWeekdayName = (date = new Date()) => {
  return FULL_DAY_NAMES[date.getDay()] || ''
}

export const getSchoolDayName = (date = new Date()) => {
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
  const todayIndex = (referenceDate.getDay() + 6) % 7
  let offset = index - todayIndex
  if (offset < 0) offset += 7
  const result = new Date(referenceDate)
  result.setDate(referenceDate.getDate() + offset)
  return result
}
