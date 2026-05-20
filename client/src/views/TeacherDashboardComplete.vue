<template>
  <TeacherLayout>
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1>Welcome back, {{ teacher?.name }}!</h1>
          <p>{{ getGreeting }} Let's make today productive.</p>
        </div>
        <div class="welcome-actions">
          <button class="action-btn primary-btn" @click="navigateTo('/teacher/timetable')">
            <i class="bi bi-calendar"></i> View Timetable
          </button>
          <button class="action-btn secondary-btn" @click="navigateTo('/teacher/requests')">
            <i class="bi bi-chat-dots"></i> My Requests
          </button>
        </div>
      </section>

      <section class="teaching-strip">
        <div class="teaching-item">
          <span>Head teacher</span>
          <strong>{{ compactList(headTeacherClassNames) }}</strong>
        </div>
        <div class="teaching-item">
          <span>Teaching classes</span>
          <strong>{{ compactList(teachingClassNames) }}</strong>
        </div>
        <div class="teaching-item">
          <span>Modules</span>
          <strong>{{ compactList(moduleNames) }}</strong>
        </div>
        <div class="teaching-item">
          <span>Experience</span>
          <strong>{{ experienceLabel }}</strong>
        </div>
      </section>

      <!-- Quick Stats -->
      <section class="stats-grid">
        <div class="stat-card today-classes">
          <div class="stat-header">
            <i class="bi bi-calendar-check"></i>
            <span class="stat-label">Today's Classes</span>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ todayClasses.length }}</p>
            <small>{{ getTodayStatus }}</small>
          </div>
          <div class="stat-footer">
            <span class="badge info">{{ formattedDate }}</span>
          </div>
        </div>

        <div class="stat-card weekly-lessons">
          <div class="stat-header">
            <i class="bi bi-book"></i>
            <span class="stat-label">Weekly Lessons</span>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ weeklyLessons }}</p>
            <small>Mon - Fri</small>
          </div>
          <div class="stat-footer">
            <span class="badge success">{{ getWeeklyChange }}</span>
          </div>
        </div>

        <div class="stat-card free-periods">
          <div class="stat-header">
            <i class="bi bi-hourglass-split"></i>
            <span class="stat-label">Free Periods</span>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ freePeriods }}</p>
            <small>This week</small>
          </div>
          <div class="stat-footer">
            <span class="badge warning">Available</span>
          </div>
        </div>

        <div class="stat-card pending-requests">
          <div class="stat-header">
            <i class="bi bi-clock"></i>
            <span class="stat-label">Pending Requests</span>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ pendingRequests }}</p>
            <small>Awaiting approval</small>
          </div>
          <div class="stat-footer">
            <span class="badge danger">{{ pendingRequests > 0 ? 'Action needed' : 'All clear' }}</span>
          </div>
        </div>
      </section>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Today's Schedule Section -->
        <section class="dashboard-card large">
          <div class="card-header">
            <div class="header-left">
              <h2><i class="bi bi-calendar-event"></i> Today's Schedule</h2>
              <p class="header-date">{{ formattedDate }}</p>
            </div>
            <router-link to="/teacher/timetable" class="view-all-link">
              View Weekly <i class="bi bi-arrow-right"></i>
            </router-link>
          </div>

          <div class="card-body">
            <div v-if="todayClasses.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-calendar-check"></i>
              </div>
              <h3>No classes today</h3>
              <p>Enjoy your free day! Time for planning and preparation.</p>
            </div>

            <div v-else class="schedule-list">
              <div
                v-for="lesson in todayClasses"
                :key="lesson.id"
                class="schedule-item"
                :class="lesson.type"
              >
                <div class="schedule-time">
                  <span class="time">{{ formatTime(lesson.start_time) }}</span>
                  <span class="duration">{{ lesson.duration || '1h' }}</span>
                </div>
                <div class="schedule-indicator" :style="{ backgroundColor: getSubjectColor(lesson.subject) }"></div>
                <div class="schedule-content">
                  <h4 class="subject-name">{{ lesson.subject }}</h4>
                  <p class="class-info">
                    <i class="bi bi-people"></i> {{ lesson.class_name }}
                  </p>
                  <p class="room-info">
                    <i class="bi bi-door-closed"></i> {{ lesson.room || 'TBD' }}
                  </p>
                </div>
                <div class="schedule-actions">
                  <button class="icon-btn" title="View details">
                    <i class="bi bi-info-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Upcoming Classes Section -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2><i class="bi bi-calendar2-range"></i> Upcoming</h2>
            <router-link to="/teacher/timetable" class="view-all-link">
              All <i class="bi bi-arrow-right"></i>
            </router-link>
          </div>

          <div class="card-body">
            <div v-if="upcomingClasses.length === 0" class="empty-text">
              No upcoming classes
            </div>

            <div v-else class="upcoming-list">
              <div v-for="lesson in upcomingClasses.slice(0, 5)" :key="lesson.id" class="upcoming-item">
                <div class="upcoming-date">
                  <span class="day">{{ getDayName(lesson.day) }}</span>
                  <span class="date">{{ formatDateShort(lesson.date) }}</span>
                </div>
                <div class="upcoming-details">
                  <p class="upcoming-subject">{{ lesson.subject }}</p>
                  <small>{{ lesson.class_name }}</small>
                </div>
                <span class="upcoming-time">{{ formatTime(lesson.start_time) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Free Periods Section -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2><i class="bi bi-hourglass"></i> Free Periods</h2>
          </div>

          <div class="card-body">
            <div v-if="freePeriodsDetail.length === 0" class="empty-text">
              No free periods this week
            </div>

            <div v-else class="free-periods-list">
              <div v-for="(period, idx) in freePeriodsDetail.slice(0, 5)" :key="idx" class="free-period-item">
                <span class="period-day">{{ period.day }}</span>
                <span class="period-time">{{ period.time }}</span>
                <button class="schedule-btn" title="Request this free slot" @click="requestFreeSlot(period)">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Pending Requests Section -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2><i class="bi bi-chat-dots"></i> Requests</h2>
            <router-link to="/teacher/requests" class="view-all-link">
              All <i class="bi bi-arrow-right"></i>
            </router-link>
          </div>

          <div class="card-body">
            <div v-if="pendingRequests === 0" class="empty-text">
              No pending requests
            </div>

            <div v-else class="requests-list">
              <div v-for="req in recentRequests.slice(0, 4)" :key="req.id" class="request-item" :class="req.status">
                <div class="request-status" :class="req.status">
                  {{ req.status }}
                </div>
                <div class="request-details">
                  <p class="request-type">{{ req.type }}</p>
                  <small>{{ req.date }}</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Announcements Section -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2><i class="bi bi-megaphone"></i> Announcements</h2>
            <router-link to="/teacher/announcements" class="view-all-link">
              All <i class="bi bi-arrow-right"></i>
            </router-link>
          </div>

          <div class="card-body">
            <div v-if="announcements.length === 0" class="empty-text">
              No announcements
            </div>

            <div v-else class="announcements-list">
              <div v-for="ann in announcements.slice(0, 3)" :key="ann.id" class="announcement-item" :class="{ unread: !ann.read }">
                <div class="announcement-header">
                  <strong>{{ ann.title }}</strong>
                  <small class="announcement-date">{{ formatDateShort(ann.date) }}</small>
                </div>
                <p class="announcement-preview">{{ ann.message.substring(0, 80) }}...</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions Section -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2><i class="bi bi-lightning"></i> Quick Actions</h2>
          </div>

          <div class="card-body">
            <div class="quick-actions">
              <button class="quick-action-btn" @click="navigateTo('/teacher/requests')">
                <i class="bi bi-chat-dots"></i>
                <span>Request Change</span>
              </button>
              <button class="quick-action-btn" @click="navigateTo('/teacher/profile')">
                <i class="bi bi-person"></i>
                <span>Edit Profile</span>
              </button>
              <button class="quick-action-btn" @click="downloadTimetable">
                <i class="bi bi-download"></i>
                <span>Download Timetable</span>
              </button>
              <button class="quick-action-btn" @click="printTimetable">
                <i class="bi bi-printer"></i>
                <span>Print Timetable</span>
              </button>
            </div>
          </div>
        </section>
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

const router = useRouter()
const authStore = useAuthStore()
const todayClasses = ref([])
const weeklyLessons = ref(0)
const freePeriods = ref(0)
const freePeriodsDetail = ref([])
const pendingRequests = ref(0)
const upcomingClasses = ref([])
const recentRequests = ref([])
const announcements = ref([])
const timetableEntries = ref([])
const teachingClasses = ref([])
const headTeacherClasses = ref([])

const teacher = computed(() => {
  if (authStore.currentUserType === 'teacher' && authStore.currentUser) {
    return authStore.currentUser
  }

  const stored = localStorage.getItem('teacher')
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch (error) {
    return null
  }
})

const currentTeacherId = computed(() => teacher.value?.teacher_id || teacher.value?.id || null)

const teachingClassNames = computed(() => {
  return teachingClasses.value
    .map((classItem) => classItem.class_name)
    .filter(Boolean)
})

const headTeacherClassNames = computed(() => {
  return headTeacherClasses.value
    .map((classItem) => classItem.class_name)
    .filter(Boolean)
})

const moduleNames = computed(() => {
  const modules = timetableEntries.value
    .filter(isTeacherLesson)
    .map((entry) => entry.module_name)
    .filter(Boolean)
  return [...new Set(modules)].sort((a, b) => a.localeCompare(b))
})

const experienceLabel = computed(() => {
  const years = Number(teacher.value?.years_experience || teacher.value?.experience || 0)
  if (!years) return 'Not set'
  return `${years} ${years === 1 ? 'year' : 'years'}`
})

const formattedDate = computed(() => {
  const today = new Date()
  return today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

const getGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const getTodayStatus = computed(() => {
  if (todayClasses.value.length === 0) return 'No classes scheduled'
  return `${todayClasses.value.length} class${todayClasses.value.length !== 1 ? 'es' : ''}`
})

const getWeeklyChange = computed(() => {
  const variance = weeklyLessons.value > 20 ? 'High' : weeklyLessons.value > 10 ? 'Normal' : 'Light'
  return `${variance} load`
})

const formatTime = (time) => {
  if (!time) return 'TBD'
  return time.substring(0, 5)
}

const formatDateShort = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getDayName = (day) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return typeof day === 'number' ? days[day] : day
}

const schoolDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const todayName = () => schoolDays[new Date().getDay() - 1] || ''

const normalizeTime = (time) => String(time || '').slice(0, 5)

const formatTimeRange = (start, end) => `${normalizeTime(start)} - ${normalizeTime(end)}`

const isBreakEntry = (entry) => entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break')

const isTeacherLesson = (entry) => String(entry.teacher_id || '') === String(currentTeacherId.value || '') && !isBreakEntry(entry)

const compactList = (items) => {
  const values = Array.isArray(items)
    ? items.filter(Boolean)
    : String(items || '').split(',').map((item) => item.trim()).filter(Boolean)

  if (!values.length) return 'None'
  if (values.length <= 2) return values.join(', ')
  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`
}

const getNextDateForDay = (dayName) => {
  const dayIndex = schoolDays.indexOf(dayName)
  if (dayIndex === -1) return new Date()

  const today = new Date()
  const currentSchoolIndex = today.getDay() - 1
  let offset = dayIndex - currentSchoolIndex
  if (offset < 0) offset += 7

  const date = new Date(today)
  date.setDate(today.getDate() + offset)
  return date
}

const getSubjectColor = (subject) => {
  const colors = {
    'Mathematics': '#3b82f6',
    'English': '#8b5cf6',
    'Science': '#10b981',
    'History': '#f59e0b',
    'Geography': '#06b6d4',
    'Physics': '#ec4899',
    'Chemistry': '#14b8a6',
    'Biology': '#22c55e'
  }
  return colors[subject] || '#6366f1'
}

const navigateTo = (path) => {
  router.push(path)
}

const buildDashboardTimetableRows = () => {
  const rows = [['Day', 'Time', 'Subject', 'Class', 'Room']]
  todayClasses.value.forEach((lesson) => {
    rows.push([
      formattedDate.value,
      `${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}`,
      lesson.subject,
      lesson.class_name,
      lesson.room || 'TBD'
    ])
  })
  upcomingClasses.value.forEach((lesson) => {
    rows.push([
      getDayName(lesson.day),
      formatTime(lesson.start_time),
      lesson.subject,
      lesson.class_name,
      lesson.room || 'TBD'
    ])
  })
  return rows
}

const escapeCsvValue = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

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

const downloadTimetable = () => {
  const csv = buildDashboardTimetableRows().map(row => row.map(escapeCsvValue).join(',')).join('\n')
  downloadFile(csv, 'teacher-dashboard-timetable.csv', 'text/csv;charset=utf-8')
}

const printTimetable = () => {
  window.print()
}

const requestFreeSlot = (period) => {
  router.push({
    name: 'TeacherRequests',
    query: {
      type: 'free-slot',
      day: period.day,
      time: period.time
    }
  })
}

const toDashboardLesson = (entry) => ({
  id: entry.timetable_id,
  subject: entry.module_name || 'Lesson',
  class_name: entry.class_name || 'General',
  room: entry.room_name || 'TBD',
  start_time: entry.start_time,
  end_time: entry.end_time,
  duration: formatTimeRange(entry.start_time, entry.end_time),
  type: entry.entry_type || 'lesson',
  day: entry.day_of_week,
  date: getNextDateForDay(entry.day_of_week)
})

const hydrateDashboardFromTimetable = () => {
  const teacherLessons = timetableEntries.value
    .filter(isTeacherLesson)
    .sort((a, b) => {
      const dayDiff = schoolDays.indexOf(a.day_of_week) - schoolDays.indexOf(b.day_of_week)
      return dayDiff || normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
    })

  todayClasses.value = teacherLessons
    .filter((entry) => entry.day_of_week === todayName())
    .map(toDashboardLesson)

  weeklyLessons.value = teacherLessons.length

  upcomingClasses.value = teacherLessons
    .filter((entry) => entry.day_of_week !== todayName() || normalizeTime(entry.start_time) >= normalizeTime(new Date().toTimeString()))
    .map(toDashboardLesson)
    .slice(0, 8)

  const slots = [...new Set(timetableEntries.value
    .filter((entry) => !isBreakEntry(entry) && entry.start_time && entry.end_time)
    .map((entry) => `${normalizeTime(entry.start_time)}-${normalizeTime(entry.end_time)}`))]
    .sort()

  const occupied = new Set(teacherLessons.map((entry) => `${entry.day_of_week}|${normalizeTime(entry.start_time)}-${normalizeTime(entry.end_time)}`))
  const free = []
  schoolDays.forEach((day) => {
    slots.forEach((slot) => {
      if (!occupied.has(`${day}|${slot}`)) {
        free.push({ day, time: slot.replace('-', ' - ') })
      }
    })
  })

  freePeriodsDetail.value = free
  freePeriods.value = free.length
  pendingRequests.value = 0
  recentRequests.value = []
  announcements.value = []
}

const loadTeacherDashboardResources = async () => {
  await authStore.checkAuth()

  if (!currentTeacherId.value) {
    todayClasses.value = []
    weeklyLessons.value = 0
    freePeriods.value = 0
    freePeriodsDetail.value = []
    upcomingClasses.value = []
    teachingClasses.value = []
    headTeacherClasses.value = []
    pendingRequests.value = 0
    recentRequests.value = []
    announcements.value = []
    return
  }

  const [timetableResponse, classesResponse] = await Promise.all([
    api.get(`/timetable/teacher/${currentTeacherId.value}`),
    api.get('/teacher-auth/me/classes')
  ])
  timetableEntries.value = timetableResponse.data.timetables || []
  teachingClasses.value = classesResponse.data.teaching_classes || []
  headTeacherClasses.value = classesResponse.data.head_teacher_classes || []
  hydrateDashboardFromTimetable()
}

onMounted(async () => {
  try {
    await loadTeacherDashboardResources()
  } catch (error) {
    todayClasses.value = []
    weeklyLessons.value = 0
    freePeriods.value = 0
    freePeriodsDetail.value = []
    upcomingClasses.value = []
    teachingClasses.value = []
    headTeacherClasses.value = []
    pendingRequests.value = 0
    recentRequests.value = []
    announcements.value = []
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f0f4f8 0%, #f9fafb 100%);
  min-height: 100vh;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  padding: 2rem;
  border-radius: 12px;
  color: white;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2);
}

.welcome-content h1 {
  font-size: 1.875rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.welcome-content p {
  font-size: 1rem;
  opacity: 0.9;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
}

.teaching-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.teaching-item {
  min-width: 0;
  padding: 0.78rem 0.9rem;
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.07);
}

.teaching-item span {
  display: block;
  margin-bottom: 0.25rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.teaching-item strong {
  display: block;
  overflow: hidden;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.primary-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.primary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: translateY(-2px);
}

.secondary-btn {
  background: white;
  color: #2563eb;
}

.secondary-btn:hover {
  background: #f0f9ff;
  transform: translateY(-2px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 5px solid #2563eb;
}

.stat-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.stat-card.weekly-lessons {
  border-left-color: #10b981;
}

.stat-card.free-periods {
  border-left-color: #f59e0b;
}

.stat-card.pending-requests {
  border-left-color: #ef4444;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
}

.stat-header i {
  font-size: 1.25rem;
}

.stat-body {
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.stat-card small {
  color: #9ca3af;
  font-size: 0.875rem;
}

.stat-footer {
  display: flex;
  justify-content: flex-end;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.info {
  background: #dbeafe;
  color: #0c4a6e;
}

.badge.success {
  background: #dcfce7;
  color: #15803d;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.dashboard-card.large {
  grid-column: 1 / -1;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  font-size: 1.25rem;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header i {
  color: #2563eb;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-date {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

.view-all-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.view-all-link:hover {
  color: #1e40af;
  gap: 0.75rem;
}

.card-body {
  padding: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 0.875rem;
}

.empty-text {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f9fafb;
  border-left: 4px solid #2563eb;
  transition: all 0.3s ease;
}

.schedule-item:hover {
  background: #f3f4f6;
  border-left-color: #1e40af;
}

.schedule-time {
  display: flex;
  flex-direction: column;
  min-width: 70px;
  font-weight: 600;
}

.schedule-time .time {
  font-size: 1.125rem;
  color: #111827;
}

.schedule-time .duration {
  font-size: 0.75rem;
  color: #9ca3af;
}

.schedule-indicator {
  width: 4px;
  border-radius: 2px;
  margin: 0 0.5rem;
}

.schedule-content {
  flex: 1;
}

.subject-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.class-info,
.room-info {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-btn:hover {
  background: white;
  color: #2563eb;
}

.upcoming-list,
.free-periods-list,
.requests-list,
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.upcoming-item:hover {
  background: #f3f4f6;
}

.upcoming-date {
  display: flex;
  flex-direction: column;
  min-width: 70px;
  text-align: center;
  padding: 0.75rem;
  background: #dbeafe;
  border-radius: 6px;
  color: #0c4a6e;
}

.upcoming-date .day {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.upcoming-date .date {
  font-size: 1.125rem;
  font-weight: 700;
}

.upcoming-details {
  flex: 1;
}

.upcoming-subject {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.upcoming-details small {
  color: #9ca3af;
}

.upcoming-time {
  font-weight: 600;
  color: #2563eb;
  min-width: 60px;
  text-align: right;
}

.free-period-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.period-day {
  font-weight: 600;
  color: #111827;
  min-width: 100px;
}

.period-time {
  color: #6b7280;
  flex: 1;
  text-align: center;
}

.schedule-btn {
  background: #10b981;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.schedule-btn:hover {
  background: #059669;
  transform: scale(1.1);
}

.request-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #d1d5db;
}

.request-item.pending {
  border-left-color: #f59e0b;
}

.request-item.approved {
  border-left-color: #10b981;
}

.request-item.rejected {
  border-left-color: #ef4444;
}

.request-status {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.request-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.request-status.approved {
  background: #dcfce7;
  color: #15803d;
}

.request-status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.request-details {
  flex: 1;
}

.request-type {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.request-details small {
  color: #9ca3af;
}

.announcement-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #d1d5db;
  transition: all 0.3s ease;
}

.announcement-item.unread {
  background: #f0f9ff;
  border-left-color: #2563eb;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.announcement-header strong {
  color: #111827;
  flex: 1;
}

.announcement-date {
  color: #9ca3af;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.announcement-preview {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #f0f4f8 0%, #f9fafb 100%);
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #111827;
  transition: all 0.3s ease;
}

.quick-action-btn i {
  font-size: 1.5rem;
  color: #2563eb;
}

.quick-action-btn:hover {
  background: white;
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.quick-action-btn:hover i {
  color: #1e40af;
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .welcome-actions {
    width: 100%;
    flex-direction: column;
  }

  .teaching-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-card.large {
    grid-column: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: 1.5rem 1rem;
  }

  .welcome-content h1 {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .teaching-strip {
    grid-template-columns: 1fr;
  }

  .schedule-item {
    flex-wrap: wrap;
  }

  .schedule-content {
    width: 100%;
  }
}
</style>
