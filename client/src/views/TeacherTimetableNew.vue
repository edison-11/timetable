<template>
  <TeacherLayout>
    <div class="timetable-container">
      <!-- Header with Controls -->
      <div class="timetable-header">
        <div class="header-left">
          <h1>My Timetable</h1>
          <p class="header-subtitle">{{ formattedWeek }}</p>
        </div>

        <div class="header-controls">
          <div class="view-toggle">
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'week' }"
              @click="viewMode = 'week'"
              title="Weekly View"
            >
              <i class="bi bi-layout-three-columns"></i> Week
            </button>
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'day' }"
              @click="viewMode = 'day'"
              title="Daily View"
            >
              <i class="bi bi-calendar-day"></i> Day
            </button>
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'compact' }"
              @click="viewMode = 'compact'"
              title="Compact View"
            >
              <i class="bi bi-zoom-in"></i> Compact
            </button>
          </div>

          <div class="action-buttons">
            <button class="action-btn print-btn" @click="printTimetable" title="Print">
              <i class="bi bi-printer"></i> Print
            </button>
            <button class="action-btn download-btn" @click="downloadTimetable" title="Download">
              <i class="bi bi-download"></i> Download
            </button>
            <button class="action-btn filter-btn" @click="showFilters = !showFilters" title="Filters">
              <i class="bi bi-funnel"></i> Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Panel -->
      <div v-if="showFilters" class="filters-panel">
        <div class="filter-group">
          <label>Filter by Day</label>
          <select v-model="selectedDay">
            <option value="">All Days</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Filter by Class</label>
          <select v-model="selectedClass">
            <option value="">All Classes</option>
            <option value="10-a">Class 10-A</option>
            <option value="11-b">Class 11-B</option>
            <option value="12-c">Class 12-C</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Show Breaks</label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="showBreaks" />
            Include break times
          </label>
        </div>

        <button class="reset-btn" @click="resetFilters">Reset Filters</button>
      </div>

      <!-- Weekly Timetable View -->
      <div v-if="viewMode === 'week'" class="timetable-view">
        <div class="timetable-wrapper">
          <table class="timetable-grid">
            <thead>
              <tr>
                <th class="time-column">Time</th>
                <th v-for="day in days" :key="day" class="day-column" :class="{ today: isToday(day) }">
                  <span class="day-name">{{ day }}</span>
                  <span class="day-date">{{ getDayDate(day) }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, rowIndex) in timetableRows" :key="rowIndex">
                <tr v-if="shouldShowRow(row)" class="timetable-row" :class="row.type">
                  <td class="time-cell" :class="row.type">
                    <span v-if="row.type === 'period'" class="period-time">{{ row.time }}</span>
                    <span v-else class="break-time">{{ row.label }}</span>
                  </td>

                  <template v-if="row.type === 'break'">
                    <td :colspan="days.length" class="break-cell" :class="row.breakType">
                      <span class="break-label">{{ row.breakType.toUpperCase() }}</span>
                    </td>
                  </template>

                  <template v-else>
                    <td v-for="day in days" :key="day" class="lesson-cell">
                      <div
                        v-if="row.lessons[day]"
                        class="lesson-card"
                        :class="row.lessons[day].type"
                      >
                        <div class="lesson-header">
                          <strong class="lesson-subject">{{ row.lessons[day].subject }}</strong>
                          <span v-if="row.lessons[day].type === 'activity'" class="activity-badge">
                            {{ row.lessons[day].type }}
                          </span>
                        </div>
                        <div class="lesson-details">
                          <p class="lesson-class">
                            <i class="bi bi-people"></i>
                            {{ row.lessons[day].class || 'General' }}
                          </p>
                          <p class="lesson-room">
                            <i class="bi bi-door-closed"></i>
                            {{ row.lessons[day].room || 'TBD' }}
                          </p>
                        </div>
                        <div class="lesson-footer">
                          <small>{{ row.lessons[day].period }}</small>
                        </div>
                      </div>
                      <div v-else class="lesson-empty">
                        <span class="free-label">Free</span>
                      </div>
                    </td>
                  </template>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Day View -->
      <div v-else-if="viewMode === 'day'" class="timetable-view day-view">
        <div class="day-selector">
          <button v-for="day in days" :key="day" class="day-btn" :class="{ active: selectedDayView === day }" @click="selectedDayView = day">
            {{ day }}
          </button>
        </div>

        <div class="day-schedule">
          <div v-for="(lesson, index) in getSelectedDayLessons()" :key="index" class="day-lesson-card" :class="lesson.type">
            <div class="day-lesson-time">
              <span class="time-range">{{ lesson.time }}</span>
              <span class="duration">{{ lesson.duration }}</span>
            </div>
            <div class="day-lesson-info">
              <strong>{{ lesson.subject }}</strong>
              <p>
                <i class="bi bi-people"></i> {{ lesson.class || 'General' }}
              </p>
              <p>
                <i class="bi bi-door-closed"></i> {{ lesson.room || 'TBD' }}
              </p>
            </div>
            <div class="day-lesson-actions">
              <button class="mini-btn" title="Details">
                <i class="bi bi-info-circle"></i>
              </button>
            </div>
          </div>

          <div v-if="getSelectedDayLessons().length === 0" class="empty-day">
            <i class="bi bi-check2-circle"></i>
            <p>No classes scheduled</p>
            <small>You have a free day!</small>
          </div>
        </div>
      </div>

      <!-- Compact View -->
      <div v-else-if="viewMode === 'compact'" class="timetable-view compact-view">
        <div class="compact-list">
          <div v-for="(lesson, index) in allLessons" :key="index" class="compact-lesson-item" :class="lesson.type">
            <div class="compact-meta">
              <span class="compact-day">{{ lesson.day }}</span>
              <span class="compact-time">{{ lesson.time }}</span>
            </div>
            <div class="compact-info">
              <strong>{{ lesson.subject }}</strong>
              <small>{{ lesson.class }} • {{ lesson.room }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="timetable-legend">
        <div class="legend-item">
          <div class="legend-color lesson"></div>
          <span>Regular Lesson</span>
        </div>
        <div class="legend-item">
          <div class="legend-color break"></div>
          <span>Break</span>
        </div>
        <div class="legend-item">
          <div class="legend-color lunch"></div>
          <span>Lunch</span>
        </div>
        <div class="legend-item">
          <div class="legend-color assembly"></div>
          <span>Assembly</span>
        </div>
        <div class="legend-item">
          <div class="legend-color free"></div>
          <span>Free Period</span>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="timetable-stats">
        <div class="stat-box">
          <span class="stat-icon">📚</span>
          <div>
            <p class="stat-title">Total Lessons</p>
            <p class="stat-number">{{ totalLessons }}</p>
          </div>
        </div>
        <div class="stat-box">
          <span class="stat-icon">📍</span>
          <div>
            <p class="stat-title">Rooms Used</p>
            <p class="stat-number">{{ uniqueRooms }}</p>
          </div>
        </div>
        <div class="stat-box">
          <span class="stat-icon">⏱️</span>
          <div>
            <p class="stat-title">Teaching Hours</p>
            <p class="stat-number">{{ totalHours }}</p>
          </div>
        </div>
        <div class="stat-box">
          <span class="stat-icon">✨</span>
          <div>
            <p class="stat-title">Free Periods</p>
            <p class="stat-number">{{ freePeriods }}</p>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import { SCHOOL_DAYS, getSchoolDayName, getSchoolWeekDate } from '@/utils/dayHelpers'

const viewMode = ref('week')
const showFilters = ref(false)
const selectedDay = ref('')
const selectedClass = ref('')
const selectedDayView = ref('Monday')
const showBreaks = ref(true)

const days = SCHOOL_DAYS

// Sample timetable data
const timetableData = {
  Monday: [
    { period: 1, time: '08:00 - 09:00', subject: 'Mathematics', class: '10-A', room: '101', type: 'lesson' },
    { period: 2, time: '09:00 - 10:00', subject: 'Mathematics', class: '11-B', room: '102', type: 'lesson' },
    { label: 'BREAK', breakType: 'morning', type: 'break' },
    { period: 3, time: '10:30 - 11:30', subject: 'Mathematics', class: '12-C', room: '103', type: 'lesson' },
    { label: 'LUNCH', breakType: 'lunch', type: 'break' },
    { period: 4, time: '01:00 - 02:00', subject: 'Advanced Calculus', class: '12-A', room: '104', type: 'lesson' }
  ],
  Tuesday: [
    { period: 1, time: '08:00 - 09:00', subject: 'Physics', class: '10-B', room: '201', type: 'lesson' },
    { period: 2, time: '09:00 - 10:00', subject: 'Chemistry', class: '11-A', room: '202', type: 'lesson' },
    { label: 'BREAK', breakType: 'morning', type: 'break' },
    { period: 3, time: '10:30 - 11:30', subject: 'Assembly', class: 'General', room: 'Auditorium', type: 'activity' },
    { label: 'LUNCH', breakType: 'lunch', type: 'break' },
    { period: 4, time: '01:00 - 02:00', subject: 'Physics', class: '12-B', room: '203', type: 'lesson' }
  ],
  Wednesday: [
    { period: 1, time: '08:00 - 09:00', subject: 'Biology', class: '10-A', room: '301', type: 'lesson' },
    { period: 2, time: '09:00 - 10:00', subject: 'Biology Lab', class: '11-C', room: '302', type: 'lesson' },
    { label: 'BREAK', breakType: 'morning', type: 'break' },
    { period: 3, time: '10:30 - 11:30', subject: 'English', class: '12-A', room: '303', type: 'lesson' },
    { label: 'LUNCH', breakType: 'lunch', type: 'break' }
  ],
  Thursday: [
    { period: 1, time: '08:00 - 09:00', subject: 'Mathematics', class: '10-C', room: '401', type: 'lesson' },
    { period: 2, time: '09:00 - 10:00', subject: 'Statistics', class: '12-C', room: '402', type: 'lesson' },
    { label: 'BREAK', breakType: 'morning', type: 'break' },
    { period: 3, time: '10:30 - 11:30', subject: 'Mathematics', class: '11-A', room: '403', type: 'lesson' },
    { label: 'LUNCH', breakType: 'lunch', type: 'break' },
    { period: 4, time: '01:00 - 02:00', subject: 'Tutoring', class: 'General', room: '404', type: 'activity' }
  ],
  Friday: [
    { period: 1, time: '08:00 - 09:00', subject: 'Physics', class: '10-A', room: '501', type: 'lesson' },
    { period: 2, time: '09:00 - 10:00', subject: 'Physics', class: '11-B', room: '502', type: 'lesson' },
    { label: 'BREAK', breakType: 'morning', type: 'break' },
    { period: 3, time: '10:30 - 11:30', subject: 'Special Assembly', class: 'General', room: 'Auditorium', type: 'activity' }
  ]
}

const timetableRows = computed(() => {
  const rows = []
  const times = [
    { period: 1, time: '08:00 - 09:00' },
    { period: 2, time: '09:00 - 10:00' },
    { label: 'BREAK', breakType: 'morning' },
    { period: 3, time: '10:30 - 11:30' },
    { label: 'LUNCH', breakType: 'lunch' },
    { period: 4, time: '01:00 - 02:00' }
  ]

  times.forEach((timeSlot) => {
    if (timeSlot.period) {
      const row = { ...timeSlot, type: 'period', lessons: {} }
      days.forEach((day) => {
        const dayLessons = timetableData[day] || []
        const lesson = dayLessons.find((l) => l.period === timeSlot.period)
        if (lesson) {
          row.lessons[day] = lesson
        }
      })
      rows.push(row)
    } else {
      rows.push({ ...timeSlot, type: 'break' })
    }
  })

  return rows
})

const formattedWeek = computed(() => {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const options = { month: 'short', day: 'numeric' }
  return `Week of ${monday.toLocaleDateString('en-US', options)} - ${friday.toLocaleDateString('en-US', options)}`
})

const totalLessons = computed(() => {
  return Object.values(timetableData).reduce(
    (count, dayLessons) => count + dayLessons.filter((l) => l.period).length,
    0
  )
})

const uniqueRooms = computed(() => {
  const rooms = new Set()
  Object.values(timetableData).forEach((dayLessons) => {
    dayLessons.forEach((lesson) => {
      if (lesson.room) rooms.add(lesson.room)
    })
  })
  return rooms.size
})

const totalHours = computed(() => {
  return (totalLessons.value * 1).toFixed(1)
})

const freePeriods = computed(() => {
  let count = 0
  days.forEach((day) => {
    const dayLessons = timetableData[day] || []
    for (let i = 1; i <= 4; i++) {
      if (!dayLessons.find((l) => l.period === i)) count++
    }
  })
  return count
})

const allLessons = computed(() => {
  const lessons = []
  days.forEach((day) => {
    (timetableData[day] || []).forEach((lesson) => {
      if (lesson.period) {
        lessons.push({
          day: day.slice(0, 3),
          ...lesson
        })
      }
    })
  })
  return lessons
})

const isToday = (day) => {
  return day === getSchoolDayName(new Date())
}

const getDayDate = (day) => {
  const date = getSchoolWeekDate(day, new Date())
  return date ? date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : ''
}

const shouldShowRow = (row) => {
  if (row.type === 'break' && !showBreaks.value) return false
  return true
}

const getSelectedDayLessons = () => {
  return (timetableData[selectedDayView.value] || []).filter((l) => l.period)
}

const printTimetable = () => {
  window.print()
}

const downloadTimetable = () => {
  // Generate CSV
  let csv = 'Time,Monday,Tuesday,Wednesday,Thursday,Friday\n'

  timetableRows.value.forEach((row) => {
    if (row.type === 'period') {
      const values = [row.time]
      days.forEach((day) => {
        const lesson = row.lessons[day]
        if (lesson) {
          values.push(`${lesson.subject} (${lesson.class})`)
        } else {
          values.push('Free')
        }
      })
      csv += values.join(',') + '\n'
    }
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'timetable.csv'
  link.click()
}

const resetFilters = () => {
  selectedDay.value = ''
  selectedClass.value = ''
  showBreaks.value = true
}
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #06b6d4;
  --bg: #f9fafb;
  --surface: #ffffff;
  --text: #111827;
  --text-light: #6b7280;
  --border: #e5e7eb;
}

.timetable-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.timetable-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-left h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: var(--text);
}

.header-subtitle {
  margin: 0;
  color: var(--text-light);
  font-size: 1rem;
}

.header-controls {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-btn:hover {
  background: var(--border);
  color: var(--text);
}

.toggle-btn.active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

/* Filters Panel */
.filters-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
}

.filter-group select,
.checkbox-label input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 400;
  margin-top: 0.25rem;
}

.reset-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: var(--border);
}

/* Timetable Grid */
.timetable-view {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  overflow: hidden;
}

.timetable-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.timetable-grid {
  width: 100%;
  border-collapse: collapse;
}

.timetable-grid th,
.timetable-grid td {
  border: 1px solid var(--border);
  padding: 1rem;
  text-align: left;
}

.timetable-grid thead {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-column {
  width: 140px;
  font-weight: 600;
}

.day-column {
  width: 180px;
  font-weight: 600;
  text-align: center;
}

.day-column.today {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(30, 64, 175, 0.8));
}

.day-name {
  display: block;
  font-size: 1rem;
}

.day-date {
  display: block;
  font-size: 0.8rem;
  opacity: 0.9;
}

.timetable-row {
  background: var(--bg);
  transition: background 0.2s;
}

.timetable-row:hover {
  background: #f3f4f6;
}

.timetable-row.break {
  background: transparent;
}

.time-cell {
  background: var(--surface);
  font-weight: 600;
  color: var(--text);
  width: 140px;
  position: sticky;
  left: 0;
  z-index: 5;
}

.period-time {
  color: var(--primary);
}

.break-time {
  color: var(--warning);
}

.break-cell {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  text-align: center;
  font-weight: 600;
  color: var(--warning);
  padding: 0.75rem;
}

.break-label {
  font-weight: 700;
  letter-spacing: 0.05em;
}

.lesson-cell {
  padding: 0.5rem;
  background: var(--bg);
  transition: background 0.2s;
}

.lesson-cell:hover {
  background: #f3f4f6;
}

.lesson-card {
  background: white;
  border: 2px solid var(--primary);
  border-radius: 0.75rem;
  padding: 0.75rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.lesson-card:hover {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  transform: translateY(-2px);
}

.lesson-card.activity {
  border-color: var(--info);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), white);
}

.lesson-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.lesson-subject {
  font-size: 0.95rem;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-badge {
  background: var(--info);
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.lesson-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lesson-class,
.lesson-room {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.lesson-class i,
.lesson-room i {
  font-size: 0.75rem;
}

.lesson-footer {
  border-top: 1px solid var(--border);
  padding-top: 0.5rem;
  text-align: center;
}

.lesson-footer small {
  color: var(--text-light);
  font-size: 0.75rem;
  font-weight: 500;
}

.lesson-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: var(--bg);
  border-radius: 0.5rem;
  border: 2px dashed var(--border);
  color: var(--text-light);
}

.free-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--success);
}

/* Day View */
.day-view {
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.day-selector {
  display: flex;
  gap: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.day-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}

.day-btn:hover {
  background: var(--bg);
  color: var(--text);
}

.day-btn.active {
  background: var(--primary);
  color: white;
}

.day-schedule {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.day-lesson-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s;
}

.day-lesson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.day-lesson-card.activity {
  border-left-color: var(--info);
}

.day-lesson-time {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 80px;
  text-align: center;
}

.time-range {
  font-weight: 700;
  color: var(--primary);
  font-size: 1rem;
}

.duration {
  color: var(--text-light);
  font-size: 0.8rem;
}

.day-lesson-info {
  flex: 1;
}

.day-lesson-info strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.day-lesson-info p {
  margin: 0.25rem 0;
  color: var(--text-light);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.day-lesson-actions {
  display: flex;
  align-items: center;
}

.mini-btn {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.mini-btn:hover {
  background: var(--primary-light);
}

.empty-day {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  color: var(--text-light);
}

.empty-day i {
  font-size: 3rem;
  color: var(--border);
  display: block;
  margin-bottom: 1rem;
}

/* Compact View */
.compact-view {
  border: none;
  background: transparent;
}

.compact-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.compact-lesson-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  transition: all 0.2s;
  border-left: 4px solid var(--primary);
}

.compact-lesson-item:hover {
  background: var(--bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.compact-lesson-item.activity {
  border-left-color: var(--info);
}

.compact-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 100px;
}

.compact-day {
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
}

.compact-time {
  color: var(--text-light);
  font-size: 0.85rem;
}

.compact-info {
  flex: 1;
}

.compact-info strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text);
}

.compact-info small {
  color: var(--text-light);
  font-size: 0.85rem;
}

/* Legend */
.timetable-legend {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 0.375rem;
  border: 1px solid var(--border);
}

.legend-color.lesson {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
}

.legend-color.break {
  background: var(--warning);
}

.legend-color.lunch {
  background: #f97316;
}

.legend-color.assembly {
  background: var(--info);
}

.legend-color.free {
  background: var(--success);
  opacity: 0.3;
}

/* Stats */
.timetable-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  transition: all 0.2s;
}

.stat-box:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
}

.stat-title {
  margin: 0;
  color: var(--text-light);
  font-size: 0.9rem;
}

.stat-number {
  margin: 0.25rem 0 0;
  color: var(--text);
  font-size: 1.75rem;
  font-weight: 700;
}

/* Responsive */
@media (max-width: 1024px) {
  .timetable-grid th,
  .timetable-grid td {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .day-column {
    width: 150px;
  }

  .time-column {
    width: 120px;
  }

  .timetable-legend {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .header-controls {
    width: 100%;
    flex-direction: column;
    gap: 1rem;
  }

  .view-toggle,
  .action-buttons {
    width: 100%;
  }

  .toggle-btn,
  .action-btn {
    flex: 1;
  }

  .filters-panel {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .timetable-grid th,
  .timetable-grid td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .day-column {
    width: 120px;
  }

  .time-column {
    width: 100px;
  }

  .day-schedule {
    grid-template-columns: 1fr;
  }

  .timetable-legend {
    flex-direction: column;
    gap: 1rem;
  }

  .timetable-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .timetable-container {
    gap: 1rem;
  }

  .timetable-header {
    gap: 1rem;
  }

  .header-left h1 {
    font-size: 1.5rem;
  }

  .timetable-grid th,
  .timetable-grid td {
    padding: 0.25rem;
    font-size: 0.7rem;
  }

  .day-column {
    width: 80px;
  }

  .day-name {
    font-size: 0.8rem;
  }

  .day-date {
    font-size: 0.65rem;
  }

  .lesson-card {
    padding: 0.5rem;
  }

  .lesson-subject {
    font-size: 0.8rem;
  }

  .lesson-class,
  .lesson-room {
    font-size: 0.7rem;
  }

  .timetable-stats {
    grid-template-columns: 1fr;
  }

  .toggle-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }

  .action-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }
}

@media print {
  .header-controls,
  .filters-panel,
  .timetable-legend {
    display: none;
  }

  .timetable-grid {
    border-collapse: collapse;
  }

  .timetable-grid th,
  .timetable-grid td {
    border: 1px solid #333;
  }
}
</style>
