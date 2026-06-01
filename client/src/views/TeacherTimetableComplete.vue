<template>
  <TeacherLayout>
    <div class="timetable-container">
      <section class="studio-header">
        <div class="header-content">
          <p class="eyebrow">Teacher schedule</p>
          <h1>My Timetable</h1>
          <p class="studio-subtitle">{{ formattedWeek }} · week view</p>
        </div>

        <div class="header-controls">
          <div class="view-controls">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'week' }"
              @click="viewMode = 'week'"
              title="Weekly View"
            >
              <Columns3 :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Week</span>
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'day' }"
              :disabled="!canShowDayView"
              @click="setViewMode('day')"
              :title="dayViewDisabledReason || 'Daily View'"
            >
              <CalendarDays :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Day</span>
            </button>
          </div>

          <div class="action-controls studio-actions">
            <button
              class="btn-secondary modules-btn"
              type="button"
              :disabled="!moduleProgressCards.length"
              @click="showAssignedModulesModal = true"
              title="Assigned Modules"
            >
              <BookOpen :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Modules</span>
            </button>
            <button class="btn-secondary filter-btn" @click="showFilters = !showFilters" title="Filters">
              <Filter :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Filter</span>
            </button>
            <button class="btn-secondary print-btn" @click="printTimetable" title="Print">
              <Printer :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Print</span>
            </button>
            <select v-model="exportFormat" class="export-select" aria-label="Download format">
              <option value="doc">Word</option>
              <option value="pdf">PDF</option>
            </select>
            <button class="btn-primary download-btn" @click="downloadTimetable(exportFormat)" title="Download">
              <Download :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </section>

      <section class="metrics-grid teacher-metrics" aria-label="Timetable summary">
        <article>
          <span>Slots</span>
          <strong>{{ totalLessons }}</strong>
          <small>Week</small>
        </article>
        <article>
          <span>Classes</span>
          <strong>{{ classes.length }}</strong>
          <small>{{ classSummary }}</small>
        </article>
        <article>
          <span>Today</span>
          <strong>{{ todayLessons.length }}</strong>
          <small>{{ todayStatusLabel }}</small>
        </article>
        <article>
          <span>Next</span>
          <strong>{{ nextLesson ? nextLesson.time : 'Clear' }}</strong>
          <small>{{ nextLesson ? `${nextLesson.subject} · ${nextLesson.class}` : 'Free' }}</small>
        </article>
      </section>

      <div v-if="loading" class="state-panel">Loading timetable...</div>
      <div v-else-if="loadError" class="state-panel error">{{ loadError }}</div>
      <div v-else-if="viewMode === 'day' && !canShowDayView" class="state-panel info">
        {{ dayViewDisabledReason }} Weekly timetable is still available.
      </div>

      <section v-if="showFilters" class="filters-panel panel-card">
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
            <span>Breaks</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="showFreeSlots" />
            <span>Free periods</span>
          </label>
        </div>

        <button class="reset-btn" @click="resetFilters">Reset</button>
      </section>

      <section v-if="!loading && !loadError && viewMode === 'week'" class="timetable-section timetable-output-card">
        <div class="output-toolbar">
          <div>
            <p class="eyebrow">Weekly view</p>
            <h2>{{ teacherName }} Timetable</h2>
          </div>
          <span class="badge">{{ totalLessons }} entries</span>
        </div>
        <div class="timetable-wrapper table-responsive">
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
                <tr v-if="row.type !== 'period'" class="break-row" :class="row.breakType">
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
                      :title="`${row.entriesByDay[day].module_name || 'Lesson'} - ${row.entriesByDay[day].class_name || 'General'} - ${row.entriesByDay[day].room_name || row.entriesByDay[day].room || 'TBA'}`"
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

      <section v-else-if="!loading && !loadError && viewMode === 'day' && canShowDayView" class="day-view-section timetable-output-card">
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
            <CalendarCheck :size="36" :stroke-width="1.9" aria-hidden="true" />
            <h3>No classes on {{ selectedDayView }}</h3>
            <p>Free day.</p>
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
                  <Users :size="15" :stroke-width="2.2" aria-hidden="true" /> {{ lesson.class }}
                </p>
                <p>
                  <DoorClosed :size="15" :stroke-width="2.2" aria-hidden="true" /> {{ lesson.room }}
                </p>
                <div class="day-lesson-actions">
                  <button @click="showLessonDetails(lesson)">Details</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Assigned Modules Modal -->
    <div v-if="showAssignedModulesModal" class="modal-overlay" @click.self="showAssignedModulesModal = false">
      <div class="modal-content assigned-modules-modal">
        <button class="modal-close" @click="showAssignedModulesModal = false">
          <X :size="18" :stroke-width="2.4" aria-hidden="true" />
        </button>

        <div class="module-progress-header">
          <div>
            <p class="eyebrow">Assigned</p>
            <h2>My Modules</h2>
          </div>
          <span>{{ moduleProgressCards.length }} total</span>
        </div>

        <div class="module-progress-grid compact-module-grid">
          <button
            v-for="module in moduleProgressCards"
            :key="module.name"
            type="button"
            class="module-progress-card"
            @click="showModuleDetails(module)"
          >
            <div class="module-card-top">
              <strong>{{ module.name }}</strong>
              <span>{{ module.percent }}%</span>
            </div>
            <div class="progress-track-mini" aria-hidden="true">
              <span :style="{ width: `${module.percent}%` }"></span>
            </div>
            <div class="module-card-meta">
              <small>{{ module.levels || 'Level' }}</small>
              <small>{{ module.scheduledSlots }}/{{ module.targetSlots }}</small>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Module Details Modal -->
    <div v-if="showModuleDetailsModal" class="modal-overlay" @click.self="showModuleDetailsModal = false">
      <div class="modal-content module-detail-modal">
        <button class="modal-close" @click="showModuleDetailsModal = false">
          <X :size="18" :stroke-width="2.4" aria-hidden="true" />
        </button>

        <div v-if="selectedModule">
          <div class="module-detail-hero">
            <div>
              <p class="eyebrow">Module details</p>
              <h2>{{ selectedModule.name }}</h2>
              <span>{{ selectedModule.department || 'Software Development' }}</span>
            </div>
            <div class="module-percent-ring" :style="{ background: `conic-gradient(#2563eb 0 ${selectedModule.percent}%, #e2e8f0 ${selectedModule.percent}% 100%)` }">
              <strong>{{ selectedModule.percent }}%</strong>
              <small>covered</small>
            </div>
          </div>

          <div class="details-grid module-detail-grid">
            <div class="detail-item">
              <label>Classes</label>
              <p>{{ selectedModule.classes || 'Not assigned' }}</p>
            </div>
            <div class="detail-item">
              <label>Level</label>
              <p>{{ selectedModule.levels || 'Not set' }}</p>
            </div>
            <div class="detail-item">
              <label>Rooms</label>
              <p>{{ selectedModule.rooms || 'TBA' }}</p>
            </div>
            <div class="detail-item">
              <label>Weekly slots</label>
              <p>{{ selectedModule.scheduledSlots }} of {{ selectedModule.targetSlots }}</p>
            </div>
            <div class="detail-item">
              <label>Hours per year</label>
              <p>{{ selectedModule.hoursPerYear || 'Not set' }}</p>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <p>{{ selectedModule.status }}</p>
            </div>
          </div>

          <div class="module-schedule-list">
            <h3>Scheduled lessons</h3>
            <div v-if="selectedModule.lessons.length" class="module-schedule-items">
              <div v-for="lesson in selectedModule.lessons" :key="lesson.id || `${lesson.day}-${lesson.time}`">
                <strong>{{ lesson.day }} · {{ lesson.time }}</strong>
                <span>{{ lesson.class }} · {{ lesson.room }}</span>
              </div>
            </div>
            <p v-else class="empty-copy">This module is assigned but has not been placed on the weekly timetable yet.</p>
          </div>

          <div class="modal-actions">
            <button @click="showModuleDetailsModal = false" class="btn-secondary">
              <X :size="16" :stroke-width="2.4" aria-hidden="true" /> Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lesson Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showDetailsModal = false">
          <X :size="18" :stroke-width="2.4" aria-hidden="true" />
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
            <button @click="showDetailsModal = false" class="btn-secondary">
              <X :size="16" :stroke-width="2.4" aria-hidden="true" /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { downloadTimetablePdf } from '@/utils/timetablePdf'
import { buildFixedTimetableRows } from '@/utils/fixedTimetableStructure'
import { SCHOOL_DAYS, getSchoolDayName, getSchoolWeekDate, getMondayOfWeek, isAcademicWeekend } from '@/utils/dayHelpers'
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Columns3,
  DoorClosed,
  Download,
  Filter,
  Printer,
  Users,
  X
} from '@lucide/vue'

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
const showAssignedModulesModal = ref(false)
const showModuleDetailsModal = ref(false)
const selectedModule = ref(null)
const exportFormat = ref('pdf')
const timetableEntries = ref([])
const teacherAssignments = ref([])
const timetableSettings = ref(null)
const loading = ref(false)
const loadError = ref('')

const days = SCHOOL_DAYS
const moduleColors = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#22c55e', '#06b6d4', '#f97316']

const currentTeacherId = computed(() => authStore.currentUser?.teacher_id || authStore.currentUser?.teacherId || null)
const teacherName = computed(() => {
  const user = authStore.currentUser || {}
  return user.name || user.full_name || user.teacher_name || user.email || 'Teacher'
})

const teacherWorkingDays = computed(() => {
  const rawDays = authStore.currentUser?.available_days || authStore.currentUser?.availableDays || ''
  const parsedDays = Array.isArray(rawDays)
    ? rawDays
    : String(rawDays || '').split(',').map(day => day.trim()).filter(Boolean)

  const validDays = parsedDays.filter(day => days.includes(day))
  return validDays.length ? validDays : days
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

const abbreviateClassName = (className) => {
  const text = String(className || '').trim()
  if (!text || text === 'General') return text || 'General'

  const levelMatch = text.match(/\blevel\s*(\d+)\b/i)
  const levelLabel = levelMatch ? `L${levelMatch[1]}` : ''
  const tradeText = text
    .replace(/\blevel\s*\d+\b/ig, '')
    .replace(/\b(class|section|year|group)\b/ig, '')
    .replace(/\b[A-Z]\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const knownTrades = {
    'software development': 'SWD',
    networking: 'NET',
    'computer science': 'CS',
    'information technology': 'IT',
    electronics: 'ELEC',
    electrical: 'ELEC'
  }
  const tradeKey = tradeText.toLowerCase()
  const tradeLabel = knownTrades[tradeKey] || tradeText
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()

  return [levelLabel, tradeLabel].filter(Boolean).join(' ') || text
}

const toLesson = (entry) => {
  const isSharedActivity = isActivityEntry(entry)
  const className = entry.class_name || 'General'
  return {
    id: entry.timetable_id,
    subject: entry.module_name || (isSharedActivity ? 'Shared Activity' : 'Lesson'),
    class: className,
    classShort: abbreviateClassName(className),
    room: entry.room_name || entry.room || 'TBA',
    type: isSharedActivity ? 'activity' : 'lesson',
    color: isSharedActivity ? '#16a34a' : getSubjectColor(entry.module_name),
    duration: formatTimeRange(entry.start_time, entry.end_time),
    time: formatTimeRange(entry.start_time, entry.end_time),
    start_time: entry.start_time,
    end_time: entry.end_time,
    day: entry.day_of_week
  }
}

const classes = computed(() => {
  const names = new Set()
  timetableEntries.value.forEach((entry) => {
    if (entry.class_name) names.add(entry.class_name)
  })
  teacherAssignments.value.forEach((assignment) => {
    if (assignment.class_name) names.add(assignment.class_name)
  })
  return Array.from(names).sort()
})

const classSummary = computed(() => {
  if (!classes.value.length) return 'No classes'
  if (classes.value.length <= 2) return classes.value.join(', ')
  return `${classes.value.slice(0, 2).join(', ')} +${classes.value.length - 2}`
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
    if (row.type !== 'period') return showBreaks.value
    return showFreeSlots.value || Object.keys(row.entriesByDay).length > 0
  })
})

const exportTimetableRows = computed(() => {
  const exportEntries = timetableEntries.value.filter((entry) => {
    const isOwnLesson = String(entry.teacher_id || '') === String(currentTeacherId.value || '')
    return isOwnLesson || isActivityEntry(entry) || isBreakEntry(entry)
  })
  return buildFixedTimetableRows(exportEntries, days, timetableSettings.value)
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

const todayName = computed(() => getSchoolDayName(new Date()) || '')

const isTodayTeacherWorkingDay = computed(() => {
  return Boolean(todayName.value && teacherWorkingDays.value.includes(todayName.value))
})

const canShowDayView = computed(() => !isAcademicWeekend(new Date()) && isTodayTeacherWorkingDay.value)

const todayStatusLabel = computed(() => {
  if (isAcademicWeekend(new Date())) return 'Weekend'
  if (!todayName.value) return 'No school day'
  if (!isTodayTeacherWorkingDay.value) return `${todayName.value} off`
  return todayName.value
})

const dayViewDisabledReason = computed(() => {
  if (canShowDayView.value) return ''
  if (isAcademicWeekend(new Date())) return 'Day view is hidden during the weekend.'
  if (todayName.value && !isTodayTeacherWorkingDay.value) return `Day view is hidden because ${todayName.value} is not your working day.`
  return 'Day view is hidden today.'
})

const totalLessons = computed(() => allLessons.value.length)

const todayLessons = computed(() => allLessons.value.filter((lesson) => lesson.day === todayName.value))

const nextLesson = computed(() => {
  const nowDay = todayName.value
  const nowTime = normalizeTime(new Date().toTimeString())
  return allLessons.value.find((lesson) => {
    if (lesson.day !== nowDay) return true
    return normalizeTime(lesson.start_time) >= nowTime
  }) || null
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

const setViewMode = (mode) => {
  if (mode === 'day' && !canShowDayView.value) {
    viewMode.value = 'week'
    return
  }

  viewMode.value = mode
  if (mode === 'day' && todayName.value) {
    selectedDayView.value = todayName.value
  }
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

const areSameLessonBlock = (first, second) => {
  if (!first || !second) return false
  if ((first.entry_type || 'lesson') !== (second.entry_type || 'lesson')) return false
  if (String(first.assignment_id || '') && String(second.assignment_id || '')) {
    return String(first.assignment_id) === String(second.assignment_id)
  }

  return String(first.module_name || '') === String(second.module_name || '')
    && String(first.class_name || '') === String(second.class_name || '')
    && String(first.room_id || first.room_name || first.room || '') === String(second.room_id || second.room_name || second.room || '')
}

const buildMergedTimetableRows = (sourceRows = processedTimetable.value) => {
  const rows = sourceRows
  return rows.map((row, rowIndex) => {
    if (row.type !== 'period') return row

    const cellsByDay = {}
    days.forEach((day) => {
      const entry = row.entriesByDay?.[day]
      if (!entry) {
        cellsByDay[day] = { entry: null, rowspan: 1, skip: false }
        return
      }

      const previousRow = rows[rowIndex - 1]
      const previousEntry = previousRow?.type === 'period' ? previousRow.entriesByDay?.[day] : null
      if (areSameLessonBlock(previousEntry, entry)) {
        cellsByDay[day] = { entry, rowspan: 1, skip: true }
        return
      }

      let rowspan = 1
      for (let nextIndex = rowIndex + 1; nextIndex < rows.length; nextIndex += 1) {
        const nextRow = rows[nextIndex]
        if (nextRow.type !== 'period' || !areSameLessonBlock(entry, nextRow.entriesByDay?.[day])) break
        rowspan += 1
      }

      cellsByDay[day] = { entry, rowspan, skip: false }
    })

    return { ...row, cellsByDay }
  })
}

const exportMergedRows = () => exportTimetableRows.value.map((row) => {
  if (row.type !== 'period') return row

  const cellsByDay = {}
  days.forEach((day) => {
    cellsByDay[day] = {
      entry: row.entriesByDay?.[day] || null,
      rowspan: 1,
      skip: false
    }
  })

  return { ...row, cellsByDay }
})

const formatExportLesson = (lesson, span = 1) => {
  const lines = [
    lesson.subject,
    `Class: ${lesson.classShort || lesson.class}`,
    `Room: ${lesson.room}`
  ]
  if (span > 1) lines.push(`${span} slots`)
  return lines.join('\n')
}

const exportLessons = computed(() => {
  const lessons = []
  exportTimetableRows.value.forEach((row) => {
    if (row.type !== 'break') {
      Object.values(row.entriesByDay || {}).forEach((entry) => {
        if (entry && !isBreakEntry(entry)) lessons.push(toLesson(entry))
      })
    }
  })
  return lessons
})

const exportModuleSummary = computed(() => {
  const modules = new Map()

  teacherAssignments.value.forEach((assignment) => {
    const name = assignment.module_name || assignment.subject_name || 'Assigned module'
    const current = modules.get(name) || { name, classes: new Set(), rooms: new Set(), count: 0 }
    if (assignment.class_name) current.classes.add(assignment.class_name)
    if (assignment.room_name || assignment.room) current.rooms.add(assignment.room_name || assignment.room)
    modules.set(name, current)
  })

  exportLessons.value.forEach((lesson) => {
    const name = lesson.subject || 'Lesson'
    const current = modules.get(name) || { name, classes: new Set(), rooms: new Set(), count: 0 }
    if (lesson.class) current.classes.add(lesson.class)
    if (lesson.room) current.rooms.add(lesson.room)
    current.count += 1
    modules.set(name, current)
  })

  return Array.from(modules.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((module) => ({
      name: module.name,
      classes: Array.from(module.classes).sort().join(', ') || 'General',
      rooms: Array.from(module.rooms).sort().join(', ') || 'TBA',
      count: module.count,
      status: module.count ? 'Scheduled' : 'Assigned'
    }))
})

const moduleProgressCards = computed(() => {
  const modules = new Map()

  teacherAssignments.value.forEach((assignment) => {
    const name = assignment.module_name || 'Assigned module'
    const current = modules.get(name) || {
      name,
      department: assignment.teacher_department || 'Software Development',
      classes: new Set(),
      levels: new Set(),
      rooms: new Set(),
      hoursPerYear: Number(assignment.hours_per_year || 0),
      scheduledSlots: 0,
      targetSlots: Math.max(1, Math.ceil(Number(assignment.hours_per_year || 40) / 40)),
      lessons: []
    }

    if (assignment.class_name) current.classes.add(assignment.class_name)
    if (assignment.level) current.levels.add(assignment.level)
    if (assignment.room_name || assignment.room) current.rooms.add(assignment.room_name || assignment.room)
    current.hoursPerYear = Math.max(current.hoursPerYear, Number(assignment.hours_per_year || 0))
    current.targetSlots = Math.max(current.targetSlots, Math.ceil(Number(assignment.hours_per_year || 40) / 40))
    modules.set(name, current)
  })

  exportLessons.value.forEach((lesson) => {
    const name = lesson.subject || 'Lesson'
    const current = modules.get(name) || {
      name,
      department: 'Software Development',
      classes: new Set(),
      levels: new Set(),
      rooms: new Set(),
      hoursPerYear: 0,
      scheduledSlots: 0,
      targetSlots: 1,
      lessons: []
    }

    current.scheduledSlots += 1
    if (lesson.class) current.classes.add(lesson.class)
    if (lesson.room) current.rooms.add(lesson.room)
    current.lessons.push(lesson)
    modules.set(name, current)
  })

  return Array.from(modules.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((module) => {
      const percent = Math.min(100, Math.round((module.scheduledSlots / Math.max(module.targetSlots, 1)) * 100))
      return {
        ...module,
        classes: Array.from(module.classes).sort().join(', '),
        levels: Array.from(module.levels).sort().join(', '),
        rooms: Array.from(module.rooms).sort().join(', '),
        percent,
        status: percent >= 100 ? 'Fully covered this week' : module.scheduledSlots ? 'In progress' : 'Assigned, not scheduled'
      }
    })
})

const getExportFileBaseName = () => {
  const safeName = String(teacherName.value || 'teacher')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${safeName || 'teacher'}-timetable`
}

const buildExportRows = () => {
  const rows = [
    ['Teacher', teacherName.value],
    ['Week', formattedWeek.value],
    [],
    ['Weekly Schedule'],
    ['Slot', 'Time', ...days]
  ]

  for (const row of exportMergedRows()) {
    if (row.type !== 'period') {
      rows.push([row.label, formatTimeRange(row.start_time, row.end_time), ...days.map(() => row.label)])
    } else {
      const rowData = [row.period, formatTimeRange(row.start_time, row.end_time)]
      for (const day of days) {
        const cell = row.cellsByDay?.[day]
        if (cell?.skip) {
          rowData.push('')
        } else if (cell?.entry) {
          rowData.push(formatExportLesson(toLesson(cell.entry), cell.rowspan))
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
  const body = exportMergedRows().map((row) => {
    if (row.type !== 'period') {
      return `<tr class="break-row ${row.breakType}"><td>${escapeHtml(row.label)}</td><td>${escapeHtml(formatTimeRange(row.start_time, row.end_time))}</td><td colspan="${days.length}"></td></tr>`
    }

    const cells = days.map((day) => {
      const cell = row.cellsByDay?.[day]
      if (cell?.skip) return ''
      const lesson = cell?.entry ? toLesson(cell.entry) : null
      if (!lesson) return '<td class="empty-cell"></td>'
      return `<td rowspan="${cell.rowspan || 1}"><div class="lesson-card ${escapeHtml(lesson.type)}" style="border-left-color:${lesson.color}">
        <strong>${escapeHtml(lesson.subject)}</strong>
        <span>Class: ${escapeHtml(lesson.classShort || lesson.class)}</span>
        <small>Room: ${escapeHtml(lesson.room)}</small>
        ${cell.rowspan > 1 ? `<em>${cell.rowspan} slots</em>` : ''}
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
    @page { size: landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; color: #111827; }
    .export-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #dbeafe; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #0f172a; }
    h2 { font-size: 13px; margin: 14px 0 6px; color: #0f172a; }
    .subtitle { margin: 0; color: #475569; font-size: 12px; }
    .teacher-meta { margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #111827; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 5px; font-size: 10px; vertical-align: top; height: 38px; }
    th { background: #2563eb; color: white; text-align: left; }
    .time-cell { background: #f8fafc; font-weight: 700; }
    .empty-cell { background: #ffffff; }
    .lesson-card { min-height: 14px; padding: 1px 2px; border-left: 3px solid #3b82f6; background: #eff6ff; border-radius: 3px; }
    .lesson-card.activity { background: #f0fdf4; }
    .lesson-card strong, .lesson-card span, .lesson-card small, .lesson-card em { display: block; }
    .lesson-card em { margin-top: 3px; color: #1d4ed8; font-style: normal; font-weight: 700; }
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
  <header class="export-header">
    <div>
      <h1>${escapeHtml(teacherName.value)} Timetable</h1>
      <p class="teacher-meta">Teacher: ${escapeHtml(teacherName.value)}</p>
      <p class="subtitle">Weekly timetable - ${escapeHtml(formattedWeek.value)}</p>
    </div>
  </header>
  <h2>Weekly Schedule</h2>
  <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`
}

const buildPdfRows = () => exportMergedRows().map((row) => {
  if (row.type !== 'period') {
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
        const cell = row.cellsByDay?.[day]
        if (cell?.skip) return { text: '', fill: '#eff6ff', color: '#1d4ed8', bold: false }
        const lesson = cell?.entry ? toLesson(cell.entry) : null
        if (!lesson) return { text: '', fill: '#ffffff' }
        return {
          text: formatExportLesson(lesson, cell.rowspan),
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

const downloadTimetable = (format = 'csv') => {
  const selectedFormat = String(format || 'csv').toLowerCase()
  const baseName = getExportFileBaseName()
  const html = buildTimetableHtml()

  if (selectedFormat === 'pdf') {
    downloadTimetablePdf({
      title: `${teacherName.value} Timetable`,
      subtitle: `Teacher: ${teacherName.value} - Weekly timetable - ${formattedWeek.value}`,
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

const showModuleDetails = (module) => {
  selectedModule.value = module
  showAssignedModulesModal.value = false
  showModuleDetailsModal.value = true
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

    const [settingsResponse, timetableResponse, assignmentsResponse] = await Promise.all([
      api.get('/settings/timetable').catch(() => ({ data: { settings: null } })),
      api.get(`/timetable/teacher/${teacherId}`),
      api.get('/teacher-auth/me/assignments').catch(() => ({ data: { assignments: [] } }))
    ])
    timetableSettings.value = settingsResponse.data.settings || null
    timetableEntries.value = timetableResponse.data.timetables || []
    teacherAssignments.value = assignmentsResponse.data.assignments || []
  } catch (error) {
    loadError.value = error.response?.data?.message || error.message || 'Failed to load timetable.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  selectedDayView.value = todayName.value || 'Monday'
  if (!canShowDayView.value) viewMode.value = 'week'
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

.timetable-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.timetable-summary article {
  min-width: 0;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.timetable-summary span,
.timetable-summary strong,
.timetable-summary small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timetable-summary span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.timetable-summary strong {
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 850;
}

.timetable-summary small {
  margin-top: 0.2rem;
  color: #64748b;
  font-weight: 650;
}

.state-panel {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 800;
  text-align: center;
}

.state-panel.error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.state-panel.info {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
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

.view-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  color: #94a3b8;
  background: transparent;
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

  .timetable-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .timetable-summary {
    grid-template-columns: 1fr;
  }
}

@media print {
  .timetable-container {
    background: white;
    padding: 0;
  }

  .studio-header,
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

.timetable-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 0 2rem;
  background: transparent;
  color: #0f172a;
}

.studio-header,
.panel-card,
.timetable-output-card,
.state-panel {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.studio-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: center;
  padding: 1.35rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1);
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: #2563eb;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.studio-header h1,
.output-toolbar h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.8rem;
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: 0;
}

.studio-subtitle {
  max-width: 740px;
  margin: 0.45rem 0 0;
  color: #52627a;
  font-size: 0.98rem;
}

.header-controls,
.studio-actions,
.action-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
}

.btn-primary {
  padding: 0.6rem 1rem;
  color: #fff;
  background: #2563eb;
}

.btn-secondary {
  padding: 0.55rem 0.85rem;
  color: #075985;
  background: #e0f2fe;
}

.view-controls {
  border: 1px solid #dbe3ef;
  background: #f8fafc;
  border-radius: 8px;
}

.view-btn {
  min-height: 38px;
  border-radius: 7px;
  border: 0;
  font-weight: 800;
}

.view-btn.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.export-select,
.filter-input {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  background: #fff;
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.teacher-metrics article {
  min-height: 86px;
  padding: 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
}

.teacher-metrics span,
.teacher-metrics strong,
.teacher-metrics small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teacher-metrics strong {
  margin-top: 0.28rem;
  color: #0f172a;
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 900;
}

.teacher-metrics span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.teacher-metrics small {
  margin-top: 0.28rem;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

:global(body.teacher-dark-mode) .teacher-metrics article {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34) !important;
}

:global(.teacher-shell.dark-mode) .teacher-metrics article {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34) !important;
}

:global(body.teacher-dark-mode) .teacher-metrics strong {
  color: #f8fafc !important;
}

:global(.teacher-shell.dark-mode) .teacher-metrics strong {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .teacher-metrics span,
:global(body.teacher-dark-mode) .teacher-metrics small {
  color: #cbd5e1 !important;
}

:global(.teacher-shell.dark-mode) .teacher-metrics span,
:global(.teacher-shell.dark-mode) .teacher-metrics small {
  color: #cbd5e1 !important;
}

:global(body:not(.teacher-dark-mode)) .teacher-metrics article {
  border-color: #dbe3ef !important;
  background: #ffffff !important;
  color: #0f172a !important;
}

:global(body:not(.teacher-dark-mode)) .teacher-metrics strong {
  color: #0f172a !important;
}

:global(body:not(.teacher-dark-mode)) .teacher-metrics span {
  color: #334155 !important;
}

:global(body:not(.teacher-dark-mode)) .teacher-metrics small {
  color: #52627a !important;
}

:global(.teacher-shell.dark-mode) .teacher-metrics article {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34) !important;
}

:global(.teacher-shell.dark-mode) .teacher-metrics strong {
  color: #f8fafc !important;
}

:global(.teacher-shell.dark-mode) .teacher-metrics span,
:global(.teacher-shell.dark-mode) .teacher-metrics small {
  color: #cbd5e1 !important;
}

.filters-panel {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.reset-btn {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 800;
}

.timetable-output-card {
  padding: 1rem;
  overflow: hidden;
}

.output-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  color: #fff;
  background: #2563eb;
  font-size: 0.72rem;
  font-weight: 850;
}

.table-responsive {
  overflow-x: auto;
  background: #fff;
}

.timetable-grid {
  width: 100%;
  min-width: 980px;
  table-layout: fixed;
  border-collapse: collapse;
  background: #fff;
}

.header-row th,
.timetable-grid th {
  min-width: 0;
  padding: 0.78rem 0.55rem;
  border: 1px solid #b8c2d1;
  color: #fff;
  background: #0f2f5f;
  font-size: 0.84rem;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
}

.header-row .day-column.today {
  background: #123d78;
  color: #fff;
}

.timetable-grid td {
  height: 64px;
  padding: 0.45rem;
  border: 1px solid #cbd5e1;
  text-align: center;
  vertical-align: middle;
  overflow: hidden;
}

.period-col,
.time-col {
  color: #0f172a;
  background: #f8fafc;
  font-weight: 900;
  white-space: nowrap;
}

.lesson-cell {
  min-width: 0;
  padding: 0.45rem;
  background: #ffffff;
  overflow: hidden;
}

.lesson-cell.today {
  background: #f8fbff;
}

.module-cell {
  min-height: 50px;
  max-width: 100%;
  padding: 0.38rem 0.42rem;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  background: #eff6ff;
  color: #111827;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}

.module-cell strong {
  display: block;
  max-width: 100%;
  color: #172554;
  font-size: 0.7rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-cell small {
  display: block;
  max-width: 100%;
  margin-top: 0.2rem;
  color: #475569;
  font-size: 0.62rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-badge {
  display: inline-flex;
  max-width: 100%;
  margin-top: 0.28rem;
  padding: 0.08rem 0.38rem;
  border-radius: 999px;
  color: #334155;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.62rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.break-label {
  display: block;
  color: #0f2f5f;
  font-size: 0.78rem;
  font-weight: 950;
}

.period-col.morning-break,
.time-col.morning-break,
.break-fill.morning-break {
  background: #e8f7e9;
}

.period-col.lunch-break,
.time-col.lunch-break,
.break-fill.lunch-break,
.period-col.lunch,
.time-col.lunch,
.break-fill.lunch {
  background: #fff4c7;
}

.period-col.evening-break,
.time-col.evening-break,
.break-fill.evening-break,
.period-col.assembly,
.time-col.assembly,
.break-fill.assembly {
  background: #e9f2ff;
}

.period-col.shift-slot,
.time-col.shift-slot,
.break-fill.shift-slot {
  background: #eef2ff;
  color: #1e3a8a;
}

/* DOS-aligned teacher timetable polish. */
.teacher-timetable-page {
  background: #f5f8fc;
}

.teacher-timetable-page .studio-header,
.teacher-timetable-page .teacher-metrics article,
.teacher-timetable-page .panel-card,
.teacher-timetable-page .timetable-output-card,
.teacher-timetable-page .filters-panel,
.teacher-timetable-page .day-view-section,
.teacher-timetable-page .compact-view-section {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
}

.teacher-timetable-page .studio-header {
  padding: 1.15rem 1.25rem;
}

.teacher-timetable-page .studio-header h1 {
  font-size: 1.45rem;
}

.teacher-timetable-page .studio-subtitle,
.teacher-timetable-page .teacher-metrics span,
.teacher-timetable-page .teacher-metrics small {
  color: #52627a;
}

.teacher-timetable-page .header-controls,
.teacher-timetable-page .output-toolbar {
  gap: 0.7rem;
}

.teacher-timetable-page .btn-primary,
.teacher-timetable-page .btn-secondary,
.teacher-timetable-page .export-select {
  min-height: 42px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 850;
}

.teacher-timetable-page .timetable-grid {
  min-width: 980px;
}

.teacher-timetable-page .timetable-grid th {
  background: #0f2f5f;
  color: #ffffff;
}

.teacher-timetable-page .module-cell {
  min-height: 50px;
  border-left-color: #2563eb;
  background: #eff6ff;
}

.teacher-timetable-page .module-cell strong {
  color: #172554;
  font-size: 0.76rem;
}

.teacher-timetable-page .module-cell small {
  color: #475569;
  font-size: 0.67rem;
}

.teacher-timetable-page .period-col,
.teacher-timetable-page .time-col {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 900;
}

.module-progress-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
}

.modules-btn {
  white-space: nowrap;
}

.assigned-modules-modal {
  max-width: 920px;
}

.compact-module-grid {
  max-height: min(62vh, 560px);
  overflow-y: auto;
  padding-right: 0.25rem;
}

.module-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.module-progress-header h2 {
  margin: 0.2rem 0 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 900;
}

.module-progress-header > span {
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 850;
}

.module-progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.module-progress-card {
  display: grid;
  gap: 0.75rem;
  min-height: 126px;
  padding: 0.95rem;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.module-progress-card:hover,
.module-progress-card:focus-visible {
  border-color: #60a5fa;
  box-shadow: 0 18px 38px rgba(37, 99, 235, 0.15);
  transform: translateY(-2px);
  outline: none;
}

.module-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.module-card-top strong {
  min-width: 0;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 900;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-card-top span {
  flex: 0 0 auto;
  color: #2563eb;
  font-size: 1rem;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}

.progress-track-mini {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress-track-mini span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #14b8a6);
}

.module-card-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: #52627a;
  font-size: 0.72rem;
  font-weight: 750;
}

.module-card-meta small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-detail-modal {
  max-width: 760px;
}

.module-detail-hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8fbff, #eff6ff);
}

.module-detail-hero h2 {
  margin: 0.2rem 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 950;
}

.module-detail-hero span {
  color: #52627a;
  font-weight: 800;
}

.module-percent-ring {
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  align-content: center;
  border-radius: 50%;
  background: conic-gradient(#2563eb 0 75%, #e2e8f0 75% 100%);
  color: #ffffff;
}

.module-percent-ring strong,
.module-percent-ring small {
  color: #ffffff;
  line-height: 1;
}

.module-percent-ring strong {
  font-size: 1.35rem;
  font-weight: 950;
}

.module-percent-ring small {
  margin-top: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.module-detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.module-schedule-list {
  margin-top: 1rem;
}

.module-schedule-list h3 {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.module-schedule-items {
  display: grid;
  gap: 0.55rem;
}

.module-schedule-items div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.module-schedule-items strong {
  color: #0f172a;
}

.module-schedule-items span {
  color: #52627a;
  font-weight: 750;
}

:global(body.teacher-dark-mode) .module-progress-section,
:global(.teacher-shell.dark-mode) .module-progress-section,
:global(body.teacher-dark-mode) .module-progress-card,
:global(.teacher-shell.dark-mode) .module-progress-card {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .module-progress-header h2,
:global(.teacher-shell.dark-mode) .module-progress-header h2,
:global(body.teacher-dark-mode) .module-card-top strong,
:global(.teacher-shell.dark-mode) .module-card-top strong,
:global(body.teacher-dark-mode) .module-schedule-list h3,
:global(.teacher-shell.dark-mode) .module-schedule-list h3,
:global(body.teacher-dark-mode) .module-schedule-items strong,
:global(.teacher-shell.dark-mode) .module-schedule-items strong {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .module-card-meta,
:global(.teacher-shell.dark-mode) .module-card-meta,
:global(body.teacher-dark-mode) .module-schedule-items span,
:global(.teacher-shell.dark-mode) .module-schedule-items span {
  color: #cbd5e1 !important;
}

:global(body.teacher-dark-mode) .module-detail-hero,
:global(.teacher-shell.dark-mode) .module-detail-hero,
:global(body.teacher-dark-mode) .module-schedule-items div,
:global(.teacher-shell.dark-mode) .module-schedule-items div {
  border-color: #243244 !important;
  background: #111827 !important;
}

@media (max-width: 760px) {
  .studio-header,
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .studio-header h1 {
    font-size: 1.45rem;
  }

  .header-controls,
  .studio-actions,
  .output-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
