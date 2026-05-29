<template>
  <div class="teacher-dashboard-page">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="#">
          <span class="me-2">👨‍🏫</span>
          Teacher Portal
        </a>
      </div>
    </nav>

    <div class="dashboard-layout">
      <main class="dashboard-main">
        <div class="dashboard-title-row">
          <div>
            <h1>Dashboard</h1>
          </div>
          <div class="week-picker">
            <span class="calendar-mark"></span>
            <span>{{ weekRange }}</span>
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-card blue">
            <div class="metric-icon"><i class="bi bi-clock"></i></div>
            <div class="metric-copy">
              <span>Periods</span>
              <strong>{{ scheduledPeriods }}</strong>
            </div>
          </div>
          <div class="metric-card green">
            <div class="metric-icon"><i class="bi bi-book"></i></div>
            <div class="metric-copy">
              <span>Subjects</span>
              <strong>{{ moduleCount }}</strong>
            </div>
          </div>
          <div class="metric-card violet">
            <div class="metric-icon"><i class="bi bi-grid-1x2"></i></div>
            <div class="metric-copy">
              <span>Empty Slots</span>
              <strong>{{ emptySlots }}</strong>
            </div>
          </div>
          <div class="metric-card amber">
            <div class="metric-icon"><i class="bi bi-house"></i></div>
            <div class="metric-copy">
              <span>Rooms</span>
              <strong>{{ roomCount }}</strong>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Timetable</h2>
            </div>
            <div class="panel-actions">
              <button class="btn btn-outline-secondary btn-sm" @click="refreshTimetable" :disabled="loading" title="Refresh">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
<<<<<<< HEAD
              <button class="btn btn-outline-secondary btn-sm" @click="downloadPDF" :disabled="loading || !gridRows.length">
                <i class="bi bi-download me-1"></i>Download PDF
              </button>
              <button class="btn btn-outline-secondary btn-sm" @click="downloadWord" :disabled="loading || !gridRows.length">
                <i class="bi bi-file-earmark-word me-1"></i>Download Word
=======
              <button class="btn btn-outline-secondary btn-sm" @click="downloadCSV" :disabled="loading || !gridRows.length" title="CSV">
                <i class="bi bi-download"></i>
              </button>
              <button class="btn btn-outline-secondary btn-sm" @click="downloadExcel" :disabled="loading || !gridRows.length" title="Excel">
                <i class="bi bi-file-earmark-spreadsheet"></i>
>>>>>>> 9029b97da280bddff03d081ceece29edd5345372
              </button>
              <button class="btn btn-outline-secondary btn-sm" @click="printTimetable" :disabled="!gridRows.length" title="Print">
                <i class="bi bi-printer"></i>
              </button>
              <button class="btn btn-primary btn-sm" @click="goToSettings" title="Settings">
                <i class="bi bi-gear"></i>
              </button>
            </div>
          </div>

          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
            <p class="mt-2">Loading timetable...</p>
          </div>

          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
          </div>

          <div v-else class="timetable-wrap">
            <table class="overview-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Time</th>
                  <th v-for="day in days" :key="day">{{ day }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gridRows.length">
                  <td colspan="7" class="empty-state">No timetable entries found</td>
                </tr>
                <tr v-for="row in gridRows" :key="row.key" :class="row.type === 'break' ? `break-row ${row.breakType}` : ''">
                  <td class="period-cell" :class="row.breakType">
                    <span v-if="row.type === 'break'" class="break-label">{{ row.label }}</span>
                    <span v-else>{{ row.period }}</span>
                  </td>
                  <td class="time-cell" :class="row.breakType">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                  <template v-if="row.type === 'break'">
                    <td :colspan="days.length" class="break-fill" :class="row.breakType"></td>
                  </template>
                  <template v-else>
                    <td v-for="day in days" :key="day">
                      <div v-if="row.entriesByDay[day]" class="class-block" :class="{ 'activity-cell': row.entriesByDay[day].entry_type === 'activity' }">
                        <strong>{{ row.entriesByDay[day].module_name }}</strong>
                        <small>{{ row.entriesByDay[day].class_name || 'General' }}</small>
                        <span v-if="row.entriesByDay[day].room_name || row.entriesByDay[day].room" class="room-badge">
                          {{ row.entriesByDay[day].room_name || row.entriesByDay[day].room }}
                        </span>
                      </div>
                      <div v-else class="empty-block">&nbsp;</div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel settings-panel">
          <div class="panel-header"><h2>Dashboard Settings</h2></div>
          <div class="settings-tabs">
            <div class="settings-tab" :class="{ active: settingsTab === 'display' }" @click="settingsTab = 'display'">
              <i class="bi bi-palette"></i> Display
            </div>
            <div class="settings-tab" :class="{ active: settingsTab === 'export' }" @click="settingsTab = 'export'">
              <i class="bi bi-download"></i> Export
            </div>
            <div class="settings-tab" :class="{ active: settingsTab === 'calendar' }" @click="settingsTab = 'calendar'">
              <i class="bi bi-calendar"></i> Calendar
            </div>
            <div class="settings-tab" :class="{ active: settingsTab === 'notifications' }" @click="settingsTab = 'notifications'">
              <i class="bi bi-bell"></i> Notifications
            </div>
            <div class="settings-tab" :class="{ active: settingsTab === 'availability' }" @click="settingsTab = 'availability'">
              <i class="bi bi-clock"></i> Availability
            </div>
          </div>

          <!-- Display Settings -->
          <div v-if="settingsTab === 'display'" class="settings-content">
            <h4>Display</h4>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.darkMode" @change="saveSetting('darkMode')" />
              <span>Dark Mode</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.compactView" @change="saveSetting('compactView')" />
              <span>Compact View</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.showMetrics" @change="saveSetting('showMetrics')" />
              <span>Metrics</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.showSidebar" @change="saveSetting('showSidebar')" />
              <span>Sidebar</span>
            </label>
          </div>

          <!-- Export Settings -->
          <div v-if="settingsTab === 'export'" class="settings-content">
            <h4>Export</h4>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.exportIncludeClass" @change="saveSetting('exportIncludeClass')" />
              <span>Classes</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.exportIncludeRoom" @change="saveSetting('exportIncludeRoom')" />
              <span>Rooms</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.exportIncludeTime" @change="saveSetting('exportIncludeTime')" />
              <span>Times</span>
            </label>
            <div class="setting-group">
              <label class="form-label">Format</label>
              <select v-model="settings.exportFormat" @change="saveSetting('exportFormat')" class="form-select form-select-sm">
<<<<<<< HEAD
                <option value="pdf">PDF Document</option>
                <option value="doc">Word Document</option>
=======
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
>>>>>>> 9029b97da280bddff03d081ceece29edd5345372
              </select>
            </div>
          </div>

          <!-- Calendar Settings -->
          <div v-if="settingsTab === 'calendar'" class="settings-content">
            <h4>Calendar</h4>
            <div class="setting-group">
              <label class="form-label">Start Day</label>
              <select v-model="settings.weekStartDay" @change="saveSetting('weekStartDay')" class="form-select form-select-sm">
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.showBreaks" @change="saveSetting('showBreaks')" />
              <span>Breaks</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.highlightToday" @change="saveSetting('highlightToday')" />
              <span>Highlight Today</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.show24Hour" @change="saveSetting('show24Hour')" />
              <span>24-Hour Time</span>
            </label>
          </div>

          <!-- Notification Settings -->
          <div v-if="settingsTab === 'notifications'" class="settings-content">
            <h4>Notifications</h4>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.notifyScheduleChanges" @change="saveSetting('notifyScheduleChanges')" />
              <span>Schedule Changes</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.notifyUpcomingClass" @change="saveSetting('notifyUpcomingClass')" />
              <span>Upcoming Classes</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.notifyRoomChange" @change="saveSetting('notifyRoomChange')" />
              <span>Room Changes</span>
            </label>
            <label class="form-check settings-option">
              <input type="checkbox" v-model="settings.notifyAdminMessages" @change="saveSetting('notifyAdminMessages')" />
              <span>Admin Messages</span>
            </label>
            <div class="setting-group">
              <label class="form-label">Frequency</label>
              <select v-model="settings.notificationFrequency" @change="saveSetting('notificationFrequency')" class="form-select form-select-sm">
                <option value="immediate">Immediate</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <!-- Availability Settings -->
          <div v-if="settingsTab === 'availability'" class="settings-content">
            <h4>Availability</h4>
            <div class="setting-group">
              <label class="form-label">Days</label>
              <div class="availability-days">
                <label class="day-checkbox" v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']" :key="day">
                  <input type="checkbox" :value="day" v-model="settings.availableDays" @change="saveSetting('availableDays')" />
                  <span>{{ day }}</span>
                </label>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <label class="form-label">From</label>
                <input type="time" v-model="settings.availableFrom" @change="saveSetting('availableFrom')" class="form-control form-control-sm" />
              </div>
              <div class="col-md-6">
                <label class="form-label">To</label>
                <input type="time" v-model="settings.availableTo" @change="saveSetting('availableTo')" class="form-control form-control-sm" />
              </div>
            </div>
          </div>

          <div class="settings-footer">
            <small class="text-muted">Settings are saved automatically</small>
          </div>
        </div>
      </main>

      <aside class="dashboard-sidebar">
        <div class="panel profile-panel">
          <div class="panel-header"><h3>Teacher Profile</h3></div>
          <div class="profile-summary">
            <div class="profile-name">{{ teacher?.name || 'Teacher' }}</div>
            <div class="profile-detail"><strong>Email:</strong> {{ teacher?.email || '—' }}</div>
            <div class="profile-detail"><strong>Dept:</strong> {{ teacher?.department || '—' }}</div>
            <div class="profile-detail"><strong>ID:</strong> {{ teacher?.employee_id || '—' }}</div>
            <div class="profile-detail"><strong>Phone:</strong> {{ teacher?.phone || '—' }}</div>
            <div class="profile-detail"><strong>Status:</strong>
              <span class="badge" :class="teacher?.status === 'active' ? 'bg-success' : 'bg-danger'">{{ teacher?.status || 'pending' }}</span>
            </div>
          </div>
        </div>

        <div class="panel" v-if="showAvailability">
          <div class="panel-header"><h3>Availability</h3></div>
          <div class="availability-list">
            <div><strong>Days:</strong> {{ teacherAvailableDays }}</div>
            <div><strong>Time:</strong> {{ teacherAvailableHours }}</div>
            <div><strong>Notes:</strong> {{ teacher?.notes || 'None' }}</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>Quick Actions</h3></div>
          <div class="actions-list">
            <button type="button" class="action-item" @click="refreshTimetable">
              <span class="action-icon blue"><i class="bi bi-arrow-clockwise"></i></span>
              <div><strong>Refresh Timetable</strong><small>Reload the latest schedule</small></div>
            </button>
            <button type="button" class="action-item" @click="goToSettings">
              <span class="action-icon violet"><i class="bi bi-gear"></i></span>
              <div><strong>Open Settings</strong><small>Edit your profile and availability</small></div>
            </button>
            <button type="button" class="action-item" @click="downloadPDF" :disabled="!gridRows.length">
              <span class="action-icon green"><i class="bi bi-download"></i></span>
              <div><strong>Export PDF</strong><small>Download your timetable</small></div>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { exportToPDF, exportToWord } from '@/utils/exportTimetable'

const authStore = useAuthStore()
const router = useRouter()

const storedTeacher = ref(null)
const teacher = computed(() => {
  return authStore.currentUserType === 'teacher' && authStore.currentUser
    ? authStore.currentUser
    : storedTeacher.value
})
const timetableEntries = ref([])
const loading = ref(false)
const error = ref('')
const showRoom = ref(true)
const showClass = ref(true)
const showAvailability = ref(true)
const settingsTab = ref('display')

const settings = ref({
  darkMode: false,
  compactView: false,
  showMetrics: true,
  showSidebar: true,
  exportIncludeClass: true,
  exportIncludeRoom: true,
  exportIncludeTime: true,
  exportFormat: 'pdf',
  weekStartDay: 'monday',
  showBreaks: true,
  highlightToday: true,
  show24Hour: false,
  notifyScheduleChanges: true,
  notifyUpcomingClass: true,
  notifyRoomChange: true,
  notifyAdminMessages: true,
  notificationFrequency: 'immediate',
  availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  availableFrom: '08:00',
  availableTo: '16:00'
})

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const currentWeek = ref(new Date())
const weekRange = computed(() => {
  const date = new Date(currentWeek.value)
  const dayOfWeek = (date.getDay() + 6) % 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - dayOfWeek)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const options = { month: 'short', day: 'numeric' }
  const start = monday.toLocaleDateString('en-US', options)
  const end = friday.toLocaleDateString('en-US', options)
  return `${start} — ${end}`
})

const normalizeTime = (value) => String(value || '').slice(0, 5)
const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  return `${normalizeTime(start)} - ${normalizeTime(end)}`
}

const isBreakEntry = (entry) => entry.entry_type === 'break' || String(entry.module_name || '').toLowerCase().includes('break')
const getBreakType = (label) => {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('morning')) return 'morning-break'
  if (normalized.includes('lunch')) return 'lunch-break'
  return 'evening-break'
}
const getBreakLabel = (label) => {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('morning')) return 'MORNING BREAK'
  if (normalized.includes('lunch')) return 'LUNCH BREAK'
  return 'EVENING BREAK'
}

const buildTimetableGridRows = (entries) => {
  const timeSlots = new Map()
  entries.filter((entry) => !isBreakEntry(entry)).forEach((entry) => {
    const start = normalizeTime(entry.start_time)
    const end = normalizeTime(entry.end_time)
    if (!start || !end) return

    const key = `${start}-${end}`
    if (!timeSlots.has(key)) {
      timeSlots.set(key, { key, type: 'period', start_time: start, end_time: end, entriesByDay: {} })
    }
    timeSlots.get(key).entriesByDay[entry.day_of_week] = entry
  })

  return [...timeSlots.values()].sort((a, b) => a.start_time.localeCompare(b.start_time)).map((row, index) => ({ ...row, period: index + 1 }))
}

const buildBreakRows = (entries) => {
  const breakSlots = new Map()
  entries.filter(isBreakEntry).forEach((entry) => {
    const start = normalizeTime(entry.start_time)
    const end = normalizeTime(entry.end_time)
    if (!start || !end) return

    const label = getBreakLabel(entry.module_name)
    const key = `break-${label}-${start}-${end}`
    if (!breakSlots.has(key)) {
      breakSlots.set(key, {
        key,
        type: 'break',
        breakType: getBreakType(label),
        label,
        start_time: start,
        end_time: end,
        entriesByDay: {}
      })
    }
  })

  return [...breakSlots.values()].sort((a, b) => a.start_time.localeCompare(b.start_time))
}

const breakRules = {
  enabled: true,
  morningAfter: 3,
  lunchAfter: 5,
  eveningAfter: 8
}

const gridRows = computed(() => {
  const allRows = buildTimetableGridRows(timetableEntries.value)
  const breakRows = buildBreakRows(timetableEntries.value)

  if (!breakRules.enabled) {
    let period = 0
    return [...allRows, ...breakRows].sort((a, b) => a.start_time.localeCompare(b.start_time)).map((row) => {
      if (row.type === 'break') return row
      period += 1
      return { ...row, period }
    })
  }

  const rows = allRows.slice(0, breakRules.eveningAfter)
  const output = []
  rows.forEach((row, index) => {
    output.push(row)
    if (index + 1 === breakRules.morningAfter) {
      output.push({ key: `break-morning-${row.end_time}`, type: 'break', breakType: 'morning-break', label: 'MORNING BREAK', start_time: row.end_time, end_time: rows[index + 1]?.start_time || row.end_time, entriesByDay: {} })
    }
    if (index + 1 === breakRules.lunchAfter) {
      output.push({ key: `break-lunch-${row.end_time}`, type: 'break', breakType: 'lunch-break', label: 'LUNCH BREAK', start_time: row.end_time, end_time: rows[index + 1]?.start_time || row.end_time, entriesByDay: {} })
    }
    if (index + 1 === breakRules.eveningAfter) {
      output.push({ key: `break-evening-${row.end_time}`, type: 'break', breakType: 'evening-break', label: 'EVENING BREAK', start_time: row.end_time, end_time: rows[index + 1]?.start_time || row.end_time, entriesByDay: {} })
    }
  })

  return output
})

const moduleCount = computed(() => {
  const modules = new Set()
  timetableEntries.value.forEach((entry) => {
    if (entry.module_name) modules.add(entry.module_name)
  })
  return modules.size
})

const scheduledPeriods = computed(() => gridRows.value.filter((row) => row.type !== 'break').length)
const filledSlots = computed(() => gridRows.value.reduce((count, row) => {
  if (row.type === 'break') return count
  return count + days.reduce((dayCount, day) => dayCount + (row.entriesByDay[day] ? 1 : 0), 0)
}, 0))
const totalSlots = computed(() => gridRows.value.filter((row) => row.type !== 'break').length * days.length)
const emptySlots = computed(() => Math.max(totalSlots.value - filledSlots.value, 0))

const roomCount = computed(() => {
  const rooms = new Set()
  timetableEntries.value.forEach((entry) => {
    const name = entry.room_name || entry.room
    if (name) rooms.add(name)
  })
  return rooms.size
})

const teacherAvailableDays = computed(() => {
  const daysList = teacher.value?.available_days ? teacher.value.available_days.split(', ').filter(Boolean) : []
  return daysList.length ? daysList.join(', ') : 'Not set'
})

const teacherAvailableHours = computed(() => {
  if (!teacher.value?.available_from || !teacher.value?.available_to) return 'Not set'
  return `${teacher.value.available_from} – ${teacher.value.available_to}`
})

const loadTeacherData = () => {
  const teacherData = localStorage.getItem('teacher')
  if (teacherData) {
    storedTeacher.value = JSON.parse(teacherData)
  }
}

const goToSettings = () => {
  router.push('/teacher/settings')
}

const loadTimetable = async () => {
  const teacherId = teacher.value?.teacher_id || teacher.value?.id
  if (!teacherId) {
    error.value = 'Teacher information not found'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await api.get(`/timetable/teacher/${teacherId}`)
    timetableEntries.value = response.data.timetables || []
  } catch (err) {
    console.error('Error loading timetable:', err)
    error.value = err.response?.data?.message || 'Failed to load timetable'
  } finally {
    loading.value = false
  }
}

const refreshTimetable = () => {
  loadTimetable()
}

const teacherTimetableName = computed(() => teacher.value?.name || 'Teacher_Timetable')

const downloadPDF = () => {
  exportToPDF(timetableEntries.value, teacherTimetableName.value)
}

const downloadWord = () => {
  exportToWord(timetableEntries.value, teacherTimetableName.value)
}

const printTimetable = () => {
  window.print()
}

const saveSetting = (settingKey) => {
  try {
    const allSettings = JSON.parse(localStorage.getItem('teacherDashboardSettings') || '{}')
    allSettings[settingKey] = settings.value[settingKey]
    localStorage.setItem('teacherDashboardSettings', JSON.stringify(allSettings))
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

const loadSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('teacherDashboardSettings') || '{}')
    Object.keys(saved).forEach(key => {
      if (key in settings.value) {
        settings.value[key] = saved[key]
      }
    })
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

onMounted(() => {
  loadTeacherData()
  loadSettings()
  loadTimetable()
})
</script>

<style scoped>
.navbar-brand {
  font-size: 1.5rem;
  font-weight: 600;
}

.teacher-dashboard-page {
  min-height: 100vh;
  background: #f8fafc;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 24rem);
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.dashboard-main {
  min-width: 0;
}

.dashboard-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-title-row h1 {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.dashboard-title-row p {
  color: #64748b;
  font-size: 0.9rem;
}

.week-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 0.95rem;
}

.calendar-mark {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #3b82f6;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.06);
}

.metric-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: inherit;
}

.metric-icon i {
  font-size: 1.1rem;
}

.metric-copy span {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #64748b;
}

.metric-copy strong {
  display: block;
  font-size: 1.35rem;
}

.blue { background: #dbeafe; color: #1d4ed8; }
.green { background: #dcfce7; color: #047857; }
.violet { background: #ede9fe; color: #6d28d9; }
.amber { background: #fef3c7; color: #b45309; }

.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.06);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.panel-header h2,
.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.panel-subtitle {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.timetable-wrap {
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.overview-table th,
.overview-table td {
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  vertical-align: middle;
}

.period-cell,
.time-cell {
  background: #f8fafc;
  font-weight: 600;
  white-space: nowrap;
}

.period-cell {
  text-align: center;
  width: 5rem;
}

.class-block {
  background: #eff6ff;
  padding: 0.5rem;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.class-block strong {
  display: block;
  font-size: 0.86rem;
}

.class-block small,
.class-block span {
  display: block;
  font-size: 0.78rem;
  color: #475569;
}

.room-badge {
  display: inline-block;
  width: fit-content;
  margin-top: 0.35rem;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
}

.empty-block {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.break-row td {
  height: 2.1rem;
  text-align: center;
  font-weight: 700;
}

.break-label {
  font-size: 0.75rem;
}

.break-fill,
.period-cell.lunch-break,
.time-cell.lunch-break {
  background: #fef3c7;
}

.break-fill.morning-break,
.period-cell.morning-break,
.time-cell.morning-break {
  background: #dcfce7;
}

.break-fill.evening-break,
.period-cell.evening-break,
.time-cell.evening-break {
  background: #e9d5ff;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-summary {
  display: grid;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.profile-name {
  font-size: 1.05rem;
  font-weight: 700;
}

.profile-detail {
  font-size: 0.9rem;
  color: #475569;
}

.availability-list {
  display: grid;
  gap: 0.75rem;
  color: #475569;
}

.actions-list {
  display: grid;
  gap: 0.75rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  width: 100%;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.action-item:hover {
  background: #eff6ff;
}

.action-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.action-icon i {
  font-size: 1rem;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.95rem;
}

.settings-grid {
  display: grid;
  gap: 0.85rem;
}

.timetable-wrap {
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.overview-table th,
.overview-table td {
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  vertical-align: middle;
}

.overview-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #0f172a;
}

.period-cell,
.time-cell {
  background: #f8fafc;
  font-weight: 600;
  white-space: nowrap;
  width: 10%;
}

.period-cell {
  text-align: center;
}

.class-block {
  background: #eff6ff;
  padding: 0.5rem;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.class-block strong {
  display: block;
  font-size: 0.9rem;
  color: #1d4ed8;
  margin-bottom: 0.25rem;
}

.class-block small {
  display: block;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 0.35rem;
}

.class-block.activity-cell {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.class-block.activity-cell strong {
  color: #b45309;
}

.room-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
  font-size: 0.75rem;
}

.empty-block {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  background: #f8fafc;
}

.break-row td {
  height: 2.2rem;
  text-align: center;
  font-weight: 600;
}

.break-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.break-fill {
  background: #fef3c7 !important;
}

.break-row.lunch-break .break-fill,
.break-row.lunch-break .period-cell,
.break-row.lunch-break .time-cell {
  background: #fef3c7 !important;
  color: #b45309;
}

.break-row.morning-break .break-fill,
.break-row.morning-break .period-cell,
.break-row.morning-break .time-cell {
  background: #dcfce7 !important;
  color: #047857;
}

.break-row.evening-break .break-fill,
.break-row.evening-break .period-cell,
.break-row.evening-break .time-cell {
  background: #e9d5ff !important;
  color: #6d28d9;
}

/* Settings panel styles */
.settings-panel {
  max-width: 100%;
}

.settings-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.settings-tab {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  color: #64748b;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-tab:hover {
  color: #0f172a;
}

.settings-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.settings-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-content h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #0f172a;
}

.settings-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.2s ease;
}

.settings-option:hover {
  background: #eff6ff;
}

.settings-option input[type="checkbox"] {
  margin-top: 0.25rem;
  cursor: pointer;
}

.settings-option span {
  display: block;
  font-weight: 500;
}

.settings-option small {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.2rem;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #0f172a;
}

.setting-group select,
.setting-group input {
  width: 100%;
}

.availability-days {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
}

.day-checkbox input {
  cursor: pointer;
}

.settings-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #64748b;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 1100px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
}

@media print {
  .navbar,
  .panel-actions,
  .action-item,
  .settings-panel,
  .dashboard-sidebar {
    display: none !important;
  }
  
  .overview-table {
    font-size: 0.8rem;
  }
  
  .overview-table td,
  .overview-table th {
    padding: 0.5rem;
  }
  
  .class-block,
  .empty-block {
    border: 1px solid #ccc !important;
    background: #fff !important;
    min-height: 50px;
  }
  
  .break-fill,
  .break-row.lunch-break .break-fill,
  .break-row.morning-break .break-fill,
  .break-row.evening-break .break-fill {
    background: #e8e8e8 !important;
  }
}
</style>
