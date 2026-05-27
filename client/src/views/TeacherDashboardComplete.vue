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
            <span v-if="pendingRequestCount" class="request-badge">{{ pendingRequestCount }}</span>
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

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
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
import { SCHOOL_DAYS, getSchoolDayName, getNextSchoolWeekDate } from '@/utils/dayHelpers'

const router = useRouter()
const authStore = useAuthStore()
const todayClasses = ref([])
const weeklyLessons = ref(0)
const freePeriods = ref(0)
const freePeriodsDetail = ref([])
const upcomingClasses = ref([])
const timetableEntries = ref([])
const teachingClasses = ref([])
const headTeacherClasses = ref([])
const pendingRequestCount = ref(0)

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
  if (!years) return '0 years'
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

const schoolDays = SCHOOL_DAYS
const todayName = () => getSchoolDayName(new Date()) || ''

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
  return getNextSchoolWeekDate(dayName, new Date()) || new Date()
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
  await loadPendingRequests()
}

const loadPendingRequests = async () => {
  try {
    const requests = JSON.parse(localStorage.getItem('teacherRequests') || '[]')
    pendingRequestCount.value = requests.filter((request) => {
      const status = String(request.status || request.request_status || '').toLowerCase()
      return status === 'pending' || status === 'open'
    }).length
  } catch (error) {
    pendingRequestCount.value = 0
  }
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
  position: relative;
}

.secondary-btn:hover {
  background: #f0f9ff;
  transform: translateY(-2px);
}

.request-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
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

.empty-text {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.upcoming-list,
.free-periods-list {
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

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .teaching-strip {
    grid-template-columns: 1fr;
  }

}

:global(body.teacher-dark-mode) .dashboard-container {
  background: #020617;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .dashboard-card,
:global(body.teacher-dark-mode) .teaching-item {
  background: #111827;
  border-color: #243244;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .card-header,
:global(body.teacher-dark-mode) .upcoming-item,
:global(body.teacher-dark-mode) .free-period-item,
:global(body.teacher-dark-mode) .quick-action-btn {
  background: #0b1220;
  border-color: #243244;
}

:global(body.teacher-dark-mode) .card-header h2,
:global(body.teacher-dark-mode) .teaching-item strong,
:global(body.teacher-dark-mode) .upcoming-subject,
:global(body.teacher-dark-mode) .period-day,
:global(body.teacher-dark-mode) .quick-action-btn {
  color: #f8fafc;
}

:global(body.teacher-dark-mode) .teaching-item span,
:global(body.teacher-dark-mode) .upcoming-details small,
:global(body.teacher-dark-mode) .period-time,
:global(body.teacher-dark-mode) .empty-text {
  color: #cbd5e1;
}

:global(body.teacher-dark-mode) .upcoming-date {
  background: #1e3a8a;
  color: #dbeafe;
}

:global(body.teacher-dark-mode) .upcoming-time,
:global(body.teacher-dark-mode) .view-all-link,
:global(body.teacher-dark-mode) .card-header i,
:global(body.teacher-dark-mode) .quick-action-btn i {
  color: #93c5fd;
}
</style>
