<template>
  <TeacherLayout>
    <div class="timetable-container">
      <!-- Header Section -->
      <section class="timetable-header">
        <div class="header-content">
          <h1><i class="bi bi-calendar3"></i> My Weekly Timetable</h1>
          <p class="subtitle">{{ formattedWeek }}</p>
        </div>

        <div class="header-controls">
          <!-- View Mode Toggle -->
          <div class="view-controls">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'week' }"
              @click="viewMode = 'week'"
              title="Weekly View"
            >
              <i class="bi bi-layout-three-columns"></i>
              <span>Week</span>
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'day' }"
              @click="viewMode = 'day'"
              title="Daily View"
            >
              <i class="bi bi-calendar-day"></i>
              <span>Day</span>
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'compact' }"
              @click="viewMode = 'compact'"
              title="Compact View"
            >
              <i class="bi bi-zoom-in"></i>
              <span>Compact</span>
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="action-controls">
            <button class="action-btn filter-btn" @click="showFilters = !showFilters" title="Filters">
              <i class="bi bi-funnel"></i>
              <span>Filters</span>
            </button>
            <button class="action-btn free-toggle-btn" :class="{ active: !showFreeSlots }" @click="showFreeSlots = !showFreeSlots" title="Toggle free periods">
              <i class="bi bi-eye-slash"></i>
              <span>{{ showFreeSlots ? 'Hide Free' : 'Show Free' }}</span>
            </button>
            <button class="action-btn print-btn" @click="printTimetable" title="Print">
              <i class="bi bi-printer"></i>
              <span>Print</span>
            </button>
            <select v-model="exportFormat" class="export-select" aria-label="Download format">
              <option value="doc">Word</option>
              <option value="pdf">PDF</option>
            </select>
            <button class="action-btn download-btn" @click="downloadTimetable(exportFormat)" title="Download">
              <i class="bi bi-download"></i>
              <span>Download</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Filters Panel -->
      <section v-if="showFilters" class="filters-panel">
        <div class="filter-group">
          <label>Filter by Day</label>
          <select v-model="selectedDay" class="filter-input">
            <option value="">All Days</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Filter by Class</label>
          <select v-model="selectedClass" class="filter-input">
            <option value="">All Classes</option>
            <option v-for="cls in classes" :key="cls" :value="cls">
              {{ cls }}
            </option>
          </select>
        </div>

        <div class="filter-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="showBreaks" />
            <span>Show breaks and lunch</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="showFreeSlots" />
            <span>Show free periods</span>
          </label>
        </div>

        <button class="reset-btn" @click="resetFilters">Reset Filters</button>
      </section>

      <!-- Weekly Timetable View -->
      <section v-if="viewMode === 'week'" class="timetable-section">
        <div class="timetable-wrapper">
          <table class="timetable-grid">
            <!-- Table Header -->
            <thead>
              <tr class="header-row">
                <th class="slot-column">Slot</th>
                <th class="time-column">Time</th>
                <th
                  v-for="day in days"
                  :key="day"
                  class="day-column"
                  :class="{ today: isToday(day) }"
                >
                  <div class="day-header">
                    <span class="day-name">{{ day }}</span>
                    <span class="day-date">{{ getDayDate(day) }}</span>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody>
              <template v-for="row in processedTimetable" :key="row.key">
                <!-- Break/Special Slots -->
                <tr v-if="row.type === 'break'" class="break-row" :class="row.breakType">
                  <td class="period-col" :class="row.breakType">
                    <span class="break-label">{{ row.label }}</span>
                  </td>
                  <td class="time-col" :class="row.breakType">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                  <td :colspan="days.length" class="break-fill" :class="row.breakType"></td>
                </tr>

                <!-- Period Rows -->
                <tr v-else class="period-row">
                  <td class="period-col">{{ row.period }}</td>
                  <td class="time-col">{{ formatTimeRange(row.start_time, row.end_time) }}</td>

                  <!-- Lesson Cells -->
                  <td
                    v-for="day in days"
                    :key="`${row.key}-${day}`"
                    class="lesson-cell"
                    :class="{ today: isToday(day) }"
                  >
                    <div
                      v-if="row.entriesByDay[day]"
                      class="module-cell"
                      :class="{ 'activity-cell': row.entriesByDay[day].entry_type === 'activity' }"
                      :data-module="row.entriesByDay[day].module_name"
                      @click="showLessonDetails(toLesson(row.entriesByDay[day]))"
                    >
                      <strong>{{ row.entriesByDay[day].module_name }}</strong>
                      <small>{{ row.entriesByDay[day].class_name || 'General' }}</small>
                      <span v-if="row.entriesByDay[day].entry_type !== 'activity'" class="room-badge">
                        {{ row.entriesByDay[day].room_name || row.entriesByDay[day].room || 'TBA' }}
                      </span>
                    </div>
                    <span v-else class="empty-slot"></span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Legend -->
        <div class="timetable-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #dbeafe;"></div>
            <span>Lessons</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #fef3c7;"></div>
            <span>Breaks</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #fecaca;"></div>
            <span>Lunch</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f5f5f5;"></div>
            <span>Free Periods</span>
          </div>
        </div>
      </section>

      <!-- Day View -->
      <section v-else-if="viewMode === 'day'" class="day-view-section">
        <div class="day-selector">
          <button
            v-for="day in days"
            :key="day"
            class="day-selector-btn"
            :class="{ active: selectedDayView === day }"
            @click="selectedDayView = day"
          >
            {{ day }}
          </button>
        </div>

        <div class="day-schedule">
          <div v-if="getDayLessons(selectedDayView).length === 0" class="empty-day">
            <i class="bi bi-calendar-check"></i>
            <h3>No classes on {{ selectedDayView }}</h3>
            <p>You have a free day!</p>
          </div>

          <div v-else class="day-lessons">
            <div
              v-for="lesson in getDayLessons(selectedDayView)"
              :key="lesson.id"
              class="day-lesson-card"
            >
              <div class="day-lesson-time">
                <span class="day-lesson-start">{{ lesson.time }}</span>
                <span class="day-lesson-duration">{{ lesson.duration }}</span>
              </div>
              <div class="day-lesson-content" :style="{ borderLeftColor: lesson.color }">
                <h3>{{ lesson.subject }}</h3>
                <p>
                  <i class="bi bi-people"></i> {{ lesson.class }}
                </p>
                <p>
                  <i class="bi bi-door-closed"></i> {{ lesson.room }}
                </p>
                <div class="day-lesson-actions">
                  <button @click="showLessonDetails(lesson)">Details</button>
                  <button @click="requestChange(lesson)">Request Change</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Compact View -->
      <section v-else-if="viewMode === 'compact'" class="compact-view-section">
        <div class="compact-timetable">
          <div
            v-for="lesson in allLessons"
            :key="lesson.id"
            class="compact-lesson-item"
            :style="{ borderLeftColor: lesson.color }"
          >
            <div class="compact-day-time">
              <span class="compact-day">{{ lesson.day }}</span>
              <span class="compact-time">{{ lesson.time }}</span>
            </div>
            <div class="compact-details">
              <strong>{{ lesson.subject }}</strong>
              <small>{{ lesson.class }} • {{ lesson.room }}</small>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Lesson Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showDetailsModal = false">
          <i class="bi bi-x-lg"></i>
        </button>

        <div v-if="selectedLesson" class="lesson-details-modal">
          <h2>{{ selectedLesson.subject }}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>Class</label>
              <p>{{ selectedLesson.class }}</p>
            </div>
            <div class="detail-item">
              <label>Room</label>
              <p>{{ selectedLesson.room }}</p>
            </div>
            <div class="detail-item">
              <label>Time</label>
              <p>{{ selectedLesson.time }} ({{ selectedLesson.duration }})</p>
            </div>
            <div class="detail-item">
              <label>Day</label>
              <p>{{ selectedLesson.day }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="requestChange(selectedLesson)" class="btn-primary">
              <i class="bi bi-pencil"></i> Request Change
            </button>
            <button @click="showDetailsModal = false" class="btn-secondary">
              <i class="bi bi-x"></i> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TeacherLayout from '@/components/TeacherLayout.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { downloadTimetablePdf } from '@/utils/timetablePdf'
import { buildFixedTimetableRows } from '@/utils/fixedTimetableStructure'
import { SCHOOL_DAYS, getSchoolDayName, getSchoolWeekDate, getMondayOfWeek } from '@/utils/dayHelpers'

const router = useRouter()
const authStore = useAuthStore()

const viewMode = ref('week')
const selectedDay = ref('')
const selectedClass = ref('')
const showBreaks = ref(true)
const showFreeSlots = ref(true)
const showFilters = ref(false)
const selectedDayView = ref('Monday')
const showDetailsModal = ref(false)
const selectedLesson = ref(null)
const exportFormat = ref('pdf')
const timetableEntries = ref([])
const timetableSettings = ref(null)
const loading = ref(false)
const loadError = ref('')

const days = SCHOOL_DAYS
const moduleColors = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#22c55e', '#06b6d4', '#f97316']

const currentTeacherId = computed(() => authStore.currentUser?.teacher_id || authStore.currentUser?.id || null)
const teacherName = computed(() => {
  const user = authStore.currentUser || {}
  return user.name || user.full_name || user.teacher_name || user.email || 'Teacher'
})

const normalizeTime = (time) => String(time || '').slice(0, 5)

const formatTimeRange = (start, end) => `${normalizeTime(start)} - ${normalizeTime(end)}`

const isBreakEntry = (entry) => entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break')

const isActivityEntry = (entry) => entry?.entry_type === 'activity'

const getBreakTypeFromLabel = (label) => {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('lunch')) return 'lunch'
  if (normalized.includes('assembly') || normalized.includes('activity')) return 'assembly'
  return 'break'
}

const getSubjectColor = (subject) => {
  const key = String(subject || 'Lesson')
  const total = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return moduleColors[total % moduleColors.length]
}

const toLesson = (entry) => {
  const isSharedActivity = isActivityEntry(entry)
  return {
    id: entry.timetable_id,
    subject: entry.module_name || (isSharedActivity ? 'Shared Activity' : 'Lesson'),
    class: entry.class_name || 'General',
    room: entry.room_name || entry.room || 'TBA',
    type: isSharedActivity ? 'activity' : 'lesson',
    color: isSharedActivity ? '#16a34a' : getSubjectColor(entry.module_name),
    duration: formatTimeRange(entry.start_time, entry.end_time),
    time: formatTimeRange(entry.start_time, entry.end_time),
    day: entry.day_of_week
  }
}

const classes = computed(() => {
  const names = new Set()
  timetableEntries.value.forEach((entry) => {
    if (entry.class_name) names.add(entry.class_name)
  })
  return Array.from(names).sort()
})

const formattedWeek = computed(() => {
  const today = new Date()
  const start = getMondayOfWeek(today)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
})

const processedTimetable = computed(() => {
  const visibleEntries = timetableEntries.value.filter((entry) => {
    const isOwnLesson = String(entry.teacher_id || '') === String(currentTeacherId.value || '')
    const isSharedActivity = isActivityEntry(entry)
    const isBreak = isBreakEntry(entry)
    if (!isOwnLesson && !isSharedActivity && !isBreak) return false
    if (!isBreak && selectedDay.value && selectedDay.value !== entry.day_of_week) return false
    if (!isBreak && selectedClass.value && selectedClass.value !== entry.class_name) return false
    return true
  })
  const rows = buildFixedTimetableRows(visibleEntries, days, timetableSettings.value)

  return rows.filter((row) => {
    if (row.type === 'break') return showBreaks.value
    return showFreeSlots.value || Object.keys(row.entriesByDay).length > 0
  })
})

const allLessons = computed(() => {
  const lessons = []
  processedTimetable.value.forEach((row) => {
    if (row.type !== 'break') {
      Object.values(row.entriesByDay).forEach((entry) => lessons.push(toLesson(entry)))
    }
  })
  return lessons
})

const getDayDate = (day) => {
  const date = getSchoolWeekDate(day, new Date())
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
}

const isToday = (day) => {
  return day === getSchoolDayName(new Date())
}

const getDayLessons = (day) => {
  return processedTimetable.value
    .filter(row => row.type !== 'break' && row.entriesByDay[day])
    .map(row => toLesson(row.entriesByDay[day]))
}

const getBreakIcon = (breakType) => {
  const icons = {
    break: 'bi bi-cup-hot',
    lunch: 'bi bi-cup-straw',
    assembly: 'bi bi-people'
  }
  return icons[breakType] || 'bi bi-clock'
}

const resetFilters = () => {
  selectedDay.value = ''
  selectedClass.value = ''
  showBreaks.value = true
  showFreeSlots.value = true
}

const printTimetable = () => {
  window.print()
}

const escapeCsvValue = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const buildExportRows = () => {
  const rows = [['Slot', 'Time', ...days]]

  for (const row of processedTimetable.value) {
    if (row.type === 'break') {
      rows.push([row.label, formatTimeRange(row.start_time, row.end_time), ...days.map(() => row.label)])
    } else {
      const rowData = [row.period, formatTimeRange(row.start_time, row.end_time)]
      for (const day of days) {
        if (row.entriesByDay[day]) {
          const lesson = toLesson(row.entriesByDay[day])
          rowData.push(`${lesson.subject} (${lesson.class}, ${lesson.room})`)
        } else {
          rowData.push('')
        }
      }
      rows.push(rowData)
    }
  }

  return rows
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const buildTimetableHtml = () => {
  const header = ['Slot', 'Time', ...days].map(cell => `<th>${escapeHtml(cell)}</th>`).join('')
  const body = processedTimetable.value.map((row) => {
    if (row.type === 'break') {
      return `<tr class="break-row ${row.breakType}"><td>${escapeHtml(row.label)}</td><td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td><td colspan="${days.length}"></td></tr>`
    }

    const cells = days.map((day) => {
      const entry = row.entriesByDay[day]
      const lesson = entry ? toLesson(entry) : null
      if (!lesson) return '<td class="empty-cell"></td>'
      return `<td><div class="lesson-card ${escapeHtml(lesson.type)}" style="border-left-color:${lesson.color}">
        <strong>${escapeHtml(lesson.subject)}</strong>
        <span>${escapeHtml(lesson.class)}</span>
        <small>${escapeHtml(lesson.room)}</small>
      </div></td>`
    }).join('')
    return `<tr><td class="slot-cell">${escapeHtml(row.period)}</td><td class="time-cell">${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td>${cells}</tr>`
  }).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(teacherName.value)} Timetable</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
    h1 { font-size: 11px; line-height: 1.05; margin: 0 0 1px; page-break-after: avoid; break-after: avoid; }
    .subtitle { margin: 0 0 3px; color: #475569; font-size: 6px; line-height: 1.05; page-break-after: avoid; break-after: avoid; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: avoid; break-inside: avoid; mso-page-break-inside: avoid; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th, td { border: 1px solid #cbd5e1; padding: 2px 3px; font-size: 6px; line-height: 1; vertical-align: top; height: 18px; }
    th { background: #2563eb; color: white; text-align: left; height: 14px; }
    .time-cell { background: #f8fafc; font-weight: 700; }
    .empty-cell { background: #ffffff; }
    .lesson-card { min-height: 14px; padding: 1px 2px; border-left: 3px solid #3b82f6; background: #eff6ff; border-radius: 3px; }
    .lesson-card.activity { background: #f0fdf4; }
    .lesson-card strong, .lesson-card span, .lesson-card small { display: block; }
    .lesson-card small { font-size: 5px; text-transform: uppercase; }
    .break-row td { background: #e8f7e9; font-weight: 700; text-align: center; }
    .break-row.lunch td { background: #fff4c7; }
    .break-row.assembly td { background: #e9f2ff; }
    @page { size: A4 landscape; margin: 3mm; mso-page-orientation: landscape; }
    @media print {
      html, body { width: 291mm; min-height: 204mm; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(teacherName.value)} Timetable</h1>
  <p class="subtitle">Weekly timetable - ${escapeHtml(formattedWeek.value)}</p>
  <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`
}

const buildPdfRows = () => processedTimetable.value.map((row) => {
  if (row.type === 'break') {
    const fill = row.breakType === 'lunch' ? '#fff4c7' : row.breakType === 'assembly' ? '#e9f2ff' : '#e8f7e9'
    return {
      type: 'break',
      cells: [
        { text: row.label, fill, bold: true },
        { text: formatTimeRange(row.start_time, row.end_time), fill, bold: true },
        ...days.map(() => ({ text: row.label, fill, bold: true }))
      ]
    }
  }

  return {
    type: 'period',
    cells: [
      { text: String(row.period), fill: '#f8fafc', bold: true },
      { text: formatTimeRange(row.start_time, row.end_time), fill: '#f8fafc', bold: true },
      ...days.map((day) => {
        const entry = row.entriesByDay[day]
        const lesson = entry ? toLesson(entry) : null
        if (!lesson) return { text: '', fill: '#ffffff' }
        return {
          text: `${lesson.subject}\n${lesson.class}\n${lesson.room}`,
          fill: lesson.type === 'activity' ? '#f0fdf4' : '#eff6ff',
          color: '#111827',
          bold: true
        }
      })
    ]
  }
})

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const openPdfPrintWindow = () => {
  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) {
    window.print()
    return
  }

  printWindow.document.write(buildTimetableHtml())
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const downloadTimetable = (format = 'pdf') => {
  const selectedFormat = String(format || 'pdf').toLowerCase()
  const baseName = 'teacher-timetable'
  const html = buildTimetableHtml()

  if (selectedFormat === 'pdf') {
    downloadTimetablePdf({
      title: `${teacherName.value} Timetable`,
      subtitle: `Weekly timetable - ${formattedWeek.value}`,
      headers: ['Slot', 'Time', ...days],
      rows: buildPdfRows(),
      filename: `${baseName}.pdf`,
      fitToOnePage: true
    })
  } else {
    downloadFile(html, `${baseName}.doc`, 'application/msword;charset=utf-8')
  }
}

const showLessonDetails = (lesson) => {
  selectedLesson.value = lesson
  showDetailsModal.value = true
}

const requestChange = (lesson) => {
  router.push({
    name: 'TeacherRequests',
    query: {
      lessonId: lesson.id,
      day: lesson.day,
      time: lesson.time,
      subject: lesson.subject,
      class: lesson.class,
      room: lesson.room
    }
  })
}

const requestFreeSlot = (day, row) => {
  router.push({
    name: 'TeacherRequests',
    query: {
      type: 'free-slot',
      day,
      time: formatTimeRange(row.start_time, row.end_time)
    }
  })
}

const loadTimetable = async () => {
  loading.value = true
  loadError.value = ''
  try {
    await authStore.checkAuth()
    const teacherId = currentTeacherId.value
    if (!teacherId) {
      throw new Error('Teacher profile was not loaded.')
    }

    const [settingsResponse, timetableResponse] = await Promise.all([
      api.get('/settings/timetable').catch(() => ({ data: { settings: null } })),
      api.get(`/timetable/teacher/${teacherId}`)
    ])
    timetableSettings.value = settingsResponse.data.settings || null
    timetableEntries.value = timetableResponse.data.timetables || []
  } catch (error) {
    loadError.value = error.response?.data?.message || error.message || 'Failed to load timetable.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  selectedDayView.value = 'Monday'
  await loadTimetable()
})
</script>

<style scoped>
.timetable-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f0f4f8 0%, #f9fafb 100%);
  min-height: 100vh;
}

.timetable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.875rem;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.header-content h1 i {
  color: #2563eb;
}

.subtitle {
  color: #9ca3af;
  margin: 0;
  font-size: 0.95rem;
}

.header-controls {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
  background: #f9fafb;
  padding: 0.375rem;
  border-radius: 8px;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.view-btn.active {
  background: white;
  color: #2563eb;
  border-color: #2563eb;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
}

.view-btn:hover {
  color: #111827;
  background: rgba(37, 99, 235, 0.05);
}

.action-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.625rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.action-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #f0f9ff;
}

.free-toggle-btn.active {
  border-color: #16a34a;
  background: #dcfce7;
  color: #166534;
}

.export-select {
  height: 42px;
  padding: 0 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-weight: 600;
}

.filters-panel {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.filter-input,
.checkbox-label {
  padding: 0.625rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-input:focus,
.filter-input:hover {
  border-color: #2563eb;
}

.checkbox-group {
  flex-direction: row;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  padding: 0;
  cursor: pointer;
  font-weight: normal;
  font-size: 0.875rem;
}

.checkbox-label input {
  cursor: pointer;
}

.reset-btn {
  padding: 0.625rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  font-weight: 600;
  transition: all 0.3s ease;
  align-self: flex-end;
}

.reset-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fee2e2;
}

.timetable-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.timetable-wrapper {
  overflow-x: auto;
}

.timetable-grid {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.header-row th {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-bottom: 2px solid #d1d5db;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #111827;
  min-width: 120px;
}

.header-row .time-column {
  text-align: center;
  color: #6b7280;
}

.header-row .day-column {
  min-width: 150px;
}

.header-row .day-column.today {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #0c4a6e;
}

.day-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.day-name {
  font-size: 0.95rem;
  font-weight: 700;
}

.day-date {
  font-size: 0.8rem;
  color: #9ca3af;
}

.break-row {
  background: linear-gradient(90deg, #fef3c7 0%, #fef3c7 100%);
}

.break-row.lunch,
.break-row.lunch-break {
  background: linear-gradient(90deg, #fecaca 0%, #fecaca 100%);
}

.break-row.assembly,
.break-row.evening-break {
  background: linear-gradient(90deg, #dbeafe 0%, #dbeafe 100%);
}

.break-row.morning-break {
  background: linear-gradient(90deg, #fef3c7 0%, #fef3c7 100%);
}

.break-cell {
  padding: 1rem;
  text-align: center;
}

.break-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #92400e;
  font-weight: 600;
}

.break-row.lunch .break-content {
  color: #991b1b;
}

.break-row.assembly .break-content {
  color: #0c4a6e;
}

.break-content i {
  font-size: 1.25rem;
}

.break-label {
  text-transform: uppercase;
  font-size: 0.875rem;
}

.break-time {
  font-size: 0.8rem;
  opacity: 0.8;
}

.period-row {
  border-bottom: 1px solid #e5e7eb;
}

.period-row:hover {
  background: #f9fafb;
}

.period-col,
.time-col,
.time-cell {
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 1rem 0.75rem;
  text-align: center;
  min-width: 90px;
  font-weight: 600;
}

.period-col {
  width: 76px;
  min-width: 76px;
  color: #111827;
}

.time-col {
  width: 118px;
  min-width: 118px;
  color: #374151;
}

.period-col.morning-break,
.period-col.lunch-break,
.period-col.evening-break,
.time-col.morning-break,
.time-col.lunch-break,
.time-col.evening-break,
.break-fill {
  border-color: rgba(255, 255, 255, 0.65);
}

.break-fill {
  min-height: 44px;
}

.period-time {
  display: block;
  font-size: 0.95rem;
  color: #111827;
}

.period-duration {
  display: block;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.lesson-cell {
  padding: 1rem;
  border-right: 1px solid #e5e7eb;
  min-width: 150px;
  vertical-align: top;
  background: #fafbfc;
}

.lesson-cell.today {
  background: #f0f9ff;
}

.module-cell {
  min-height: 76px;
  padding: 1rem;
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
}

.module-cell strong,
.module-cell small,
.module-cell span {
  display: block;
}

.module-cell strong {
  font-size: 0.9rem;
  line-height: 1.25;
}

.module-cell small {
  margin-top: 0.35rem;
  color: #374151;
}

.module-cell.activity-cell {
  background: #f0fdf4;
  border-left-color: #16a34a;
}

.room-badge {
  margin-top: 0.45rem;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
}

.empty-slot {
  display: block;
  min-height: 76px;
}

.lesson-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  height: 100%;
  border: 2px solid #e5e7eb;
}

.lesson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: #2563eb;
}

.lesson-color {
  height: 3px;
  width: 100%;
}

.lesson-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lesson-subject {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
  line-height: 1.2;
}

.lesson-class,
.lesson-room {
  font-size: 0.8rem;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
}

.lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
}

.lesson-time {
  font-size: 0.7rem;
  color: #9ca3af;
}

.lesson-action {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.lesson-action:hover {
  color: #2563eb;
}

.free-period {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
  text-align: center;
  height: 100%;
  min-height: 80px;
}

.free-label {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
}

.free-action {
  background: #10b981;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.free-action:hover {
  background: #059669;
  transform: scale(1.1);
}

.timetable-legend {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

/* Day View */
.day-view-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.day-selector {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.day-selector-btn {
  padding: 0.625rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  font-weight: 600;
  transition: all 0.3s ease;
}

.day-selector-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.day-selector-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.day-schedule {
  min-height: 300px;
}

.empty-day {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.empty-day i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-day h3 {
  color: #6b7280;
  margin: 1rem 0 0.5rem 0;
}

.day-lessons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-lesson-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.day-lesson-card:hover {
  background: #f3f4f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.day-lesson-time {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  text-align: center;
}

.day-lesson-start {
  font-size: 1.375rem;
  font-weight: 700;
  color: #111827;
}

.day-lesson-duration {
  font-size: 0.75rem;
  color: #9ca3af;
}

.day-lesson-content {
  flex: 1;
  border-left: 4px solid #2563eb;
  padding-left: 1rem;
}

.day-lesson-content h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  color: #111827;
  font-weight: 700;
}

.day-lesson-content p {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.day-lesson-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.day-lesson-actions button {
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  transition: all 0.3s ease;
}

.day-lesson-actions button:hover {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* Compact View */
.compact-view-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.compact-timetable {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.compact-lesson-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.compact-lesson-item:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.compact-day-time {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  text-align: center;
  background: white;
  padding: 0.5rem;
  border-radius: 6px;
}

.compact-day {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
}

.compact-time {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.compact-details {
  flex: 1;
}

.compact-details strong {
  display: block;
  color: #111827;
  margin-bottom: 0.35rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.compact-details small {
  color: #374151;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #111827;
  transform: rotate(90deg);
}

.lesson-details-modal h2 {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #111827;
}

.details-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.detail-item p {
  font-size: 1.125rem;
  color: #111827;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1e40af;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background: #d1d5db;
}

@media (max-width: 1024px) {
  .timetable-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    flex-direction: column;
  }

  .view-controls,
  .action-controls {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .timetable-container {
    padding: 1rem;
  }

  .timetable-grid {
    font-size: 0.85rem;
  }

  .header-row th {
    padding: 0.75rem 0.5rem;
    min-width: 100px;
  }

  .day-name {
    font-size: 0.8rem;
  }

  .lesson-subject {
    font-size: 0.8rem;
  }

  .lesson-class,
  .lesson-room {
    font-size: 0.7rem;
  }

  .action-controls {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-btn span {
    display: none;
  }

  .view-btn span {
    display: none;
  }
}

@media print {
  .timetable-container {
    background: white;
    padding: 0;
  }

  .timetable-header,
  .filters-panel,
  .header-controls,
  .action-controls {
    display: none;
  }

  .timetable-section {
    box-shadow: none;
  }

  .lesson-card {
    page-break-inside: avoid;
  }
}
</style>
