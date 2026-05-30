<template>
  <TeacherLayout>
    <div class="teacher-dashboard-page">
      <section class="dashboard-hero">
        <div>
          <span class="eyebrow">{{ getGreeting }}</span>
          <h1>{{ teacherName }}</h1>
          <p>{{ todaySummary }}</p>
        </div>
        <div class="hero-actions">
          <button class="primary-action" type="button" @click="navigateTo('/teacher/timetable')">
            <i class="bi bi-calendar3"></i>
            Timetable
          </button>
        </div>
      </section>

      <section class="metric-grid" aria-label="Teacher summary">
        <article v-for="card in overviewCards" :key="card.label" class="metric-card">
          <span class="metric-icon" :class="card.tone"><i :class="card.icon"></i></span>
          <div>
            <strong>{{ card.value }}</strong>
            <span>{{ card.label }}</span>
            <small>{{ card.detail }}</small>
          </div>
        </article>
      </section>

      <div v-if="loadingDashboard" class="dashboard-grid">
        <section v-for="index in 5" :key="index" class="panel skeleton-card">
          <span class="skeleton-line title"></span>
          <span class="skeleton-line"></span>
          <span class="skeleton-line short"></span>
        </section>
      </div>

      <div v-else class="dashboard-grid">
        <section class="panel next-panel">
          <div class="panel-header">
            <div>
              <span>Next</span>
              <h2>{{ nextLesson ? nextLesson.subject : 'No Lesson' }}</h2>
            </div>
            <i class="bi bi-alarm"></i>
          </div>

          <div v-if="nextLesson" class="next-lesson">
            <strong>{{ getDayName(nextLesson.day) }} · {{ formatTimeRange(nextLesson.start_time, nextLesson.end_time) }}</strong>
            <span>{{ nextLesson.class_name }} · {{ nextLesson.room }}</span>
          </div>
          <p v-else class="empty-copy">Your remaining week is clear.</p>
        </section>

        <section class="panel wide-panel">
          <div class="panel-header">
            <div>
              <span>Today</span>
              <h2>{{ todayName() || 'Schedule' }}</h2>
            </div>
            <router-link to="/teacher/timetable">Open</router-link>
          </div>

          <div v-if="todayClasses.length" class="timeline-list">
            <button
              v-for="lesson in todayClasses"
              :key="lesson.id"
              type="button"
              class="timeline-item"
              @click="navigateTo('/teacher/timetable')"
            >
              <span class="time-pill">{{ formatTimeRange(lesson.start_time, lesson.end_time) }}</span>
              <strong>{{ lesson.subject }}</strong>
              <small>{{ lesson.class_name }} · {{ lesson.room }}</small>
            </button>
          </div>
          <p v-else class="empty-copy">No classes today.</p>
        </section>

        <section class="panel wide-panel">
          <div class="panel-header">
            <div>
              <span>Week</span>
              <h2>Upcoming</h2>
            </div>
            <router-link to="/teacher/timetable">All</router-link>
          </div>

          <div v-if="upcomingClasses.length" class="lesson-table">
            <div class="lesson-table-head">
              <span>Day</span>
              <span>Time</span>
              <span>Lesson</span>
              <span>Class</span>
              <span>Room</span>
            </div>
            <button
              v-for="lesson in upcomingClasses.slice(0, 6)"
              :key="lesson.id"
              type="button"
              class="lesson-row"
              @click="navigateTo('/teacher/timetable')"
            >
              <span>{{ getDayName(lesson.day) }}</span>
              <span>{{ formatTimeRange(lesson.start_time, lesson.end_time) }}</span>
              <strong>{{ lesson.subject }}</strong>
              <span>{{ lesson.class_name }}</span>
              <span>{{ lesson.room }}</span>
            </button>
          </div>
          <p v-else class="empty-copy">No upcoming lessons.</p>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <span>Classes</span>
              <h2>Assigned</h2>
            </div>
          </div>
          <div v-if="teachingClassNames.length" class="tag-list">
            <span v-for="className in teachingClassNames" :key="className">{{ className }}</span>
          </div>
          <p v-else class="empty-copy">No classes assigned.</p>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <span>Free</span>
              <h2>Open Slots</h2>
            </div>
          </div>
          <div v-if="freePeriodsDetail.length" class="free-list">
            <button
              v-for="(period, index) in freePeriodsDetail.slice(0, 5)"
              :key="`${period.day}-${period.time}-${index}`"
              type="button"
              @click="navigateTo('/teacher/timetable')"
            >
              <span>{{ period.day }}</span>
              <strong>{{ period.time }}</strong>
              <i class="bi bi-calendar3"></i>
            </button>
          </div>
          <p v-else class="empty-copy">No free slots found.</p>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <span>Updates</span>
              <h2>Latest</h2>
            </div>
          </div>
          <div v-if="recentActivities.length" class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <span class="activity-dot" :class="activity.tone"></span>
              <div>
                <strong>{{ activity.title }}</strong>
                <small>{{ activity.description }}</small>
              </div>
            </div>
          </div>
          <p v-else class="empty-copy">No updates yet.</p>
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
const loadingDashboard = ref(true)
const notifications = ref([])

const teacher = computed(() => {
  if (authStore.currentUserType === 'teacher' && authStore.currentUser) return authStore.currentUser

  const stored = localStorage.getItem('teacher')
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch (error) {
    return null
  }
})

const currentTeacherId = computed(() => teacher.value?.teacher_id || teacher.value?.id || null)
const teacherName = computed(() => teacher.value?.name || teacher.value?.email || 'Teacher')
const schoolDays = SCHOOL_DAYS

const teachingClassNames = computed(() => teachingClasses.value.map((classItem) => classItem.class_name).filter(Boolean))
const moduleNames = computed(() => {
  const modules = timetableEntries.value.filter(isTeacherLesson).map((entry) => entry.module_name).filter(Boolean)
  return [...new Set(modules)].sort((a, b) => a.localeCompare(b))
})

const totalStudents = computed(() => {
  const counts = teachingClasses.value
    .map((classItem) => Number(classItem.student_count || classItem.students_count || classItem.total_students || 0))
    .filter(Boolean)

  if (counts.length) return counts.reduce((sum, count) => sum + count, 0)
  return teachingClassNames.value.length * 28
})

const nextLesson = computed(() => upcomingClasses.value[0] || null)

const todaySummary = computed(() => {
  const count = todayClasses.value.length
  if (!count) return 'No classes today. Use the free time to prepare lessons.'
  return `${count} lesson${count === 1 ? '' : 's'} today. ${nextLesson.value ? `Next at ${formatTime(nextLesson.value.start_time)}.` : ''}`
})

const overviewCards = computed(() => [
  {
    label: 'Today',
    value: todayClasses.value.length,
    detail: nextLesson.value ? `Next ${formatTime(nextLesson.value.start_time)}` : 'Clear',
    icon: 'bi bi-calendar-day',
    tone: 'blue'
  },
  {
    label: 'Week',
    value: weeklyLessons.value,
    detail: `${moduleNames.value.length} subject${moduleNames.value.length === 1 ? '' : 's'}`,
    icon: 'bi bi-calendar-week',
    tone: 'green'
  },
  {
    label: 'Classes',
    value: teachingClassNames.value.length,
    detail: compactList(teachingClassNames.value),
    icon: 'bi bi-collection',
    tone: 'amber'
  },
  {
    label: 'Students',
    value: totalStudents.value,
    detail: 'Estimated load',
    icon: 'bi bi-people',
    tone: 'purple'
  },
  {
    label: 'Free',
    value: freePeriods.value,
    detail: 'Open slots',
    icon: 'bi bi-hourglass-split',
    tone: 'rose'
  }
])

const recentActivities = computed(() => {
  const activities = []

  notifications.value.slice(0, 2).forEach((notification) => {
    activities.push({
      id: `notification-${notification.notification_id || notification.id}`,
      title: notification.title || 'Notification',
      description: notification.message || 'New update',
      tone: 'green'
    })
  })

  upcomingClasses.value.slice(0, 2).forEach((lesson) => {
    activities.push({
      id: `lesson-${lesson.id}`,
      title: lesson.subject,
      description: `${lesson.class_name} · ${getDayName(lesson.day)} ${formatTime(lesson.start_time)}`,
      tone: 'blue'
    })
  })

  return activities.slice(0, 5)
})

const getGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const formatTime = (time) => {
  if (!time) return 'TBD'
  return String(time).slice(0, 5)
}

const getDayName = (day) => day || 'Day'
const todayName = () => getSchoolDayName(new Date()) || ''
const normalizeTime = (time) => String(time || '').slice(0, 5)
const formatTimeRange = (start, end) => `${normalizeTime(start)} - ${normalizeTime(end)}`
const isBreakEntry = (entry) => entry?.entry_type === 'break' || String(entry?.module_name || '').toLowerCase().includes('break')
const isTeacherLesson = (entry) => String(entry.teacher_id || '') === String(currentTeacherId.value || '') && !isBreakEntry(entry)

const compactList = (items) => {
  const values = Array.isArray(items) ? items.filter(Boolean) : []
  if (!values.length) return 'None'
  if (values.length <= 2) return values.join(', ')
  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`
}

const getNextDateForDay = (dayName) => getNextSchoolWeekDate(dayName, new Date()) || new Date()
const navigateTo = (path) => router.push(path)

const toDashboardLesson = (entry) => ({
  id: entry.timetable_id,
  subject: entry.module_name || 'Lesson',
  class_name: entry.class_name || 'General',
  room: entry.room_name || 'TBD',
  start_time: entry.start_time,
  end_time: entry.end_time,
  type: entry.entry_type || 'lesson',
  day: entry.day_of_week,
  date: getNextDateForDay(entry.day_of_week)
})

const hydrateDashboardFromTimetable = () => {
  const nowTime = normalizeTime(new Date().toTimeString())
  const today = todayName()
  const teacherLessons = timetableEntries.value
    .filter(isTeacherLesson)
    .sort((a, b) => {
      const dayDiff = schoolDays.indexOf(a.day_of_week) - schoolDays.indexOf(b.day_of_week)
      return dayDiff || normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
    })

  todayClasses.value = teacherLessons
    .filter((entry) => entry.day_of_week === today)
    .map(toDashboardLesson)

  weeklyLessons.value = teacherLessons.length

  upcomingClasses.value = teacherLessons
    .filter((entry) => entry.day_of_week !== today || normalizeTime(entry.start_time) >= nowTime)
    .map(toDashboardLesson)
    .slice(0, 10)

  const slots = [...new Set(timetableEntries.value
    .filter((entry) => !isBreakEntry(entry) && entry.start_time && entry.end_time)
    .map((entry) => `${normalizeTime(entry.start_time)}-${normalizeTime(entry.end_time)}`))]
    .sort()

  const occupied = new Set(teacherLessons.map((entry) => `${entry.day_of_week}|${normalizeTime(entry.start_time)}-${normalizeTime(entry.end_time)}`))
  const free = []
  schoolDays.forEach((day) => {
    slots.forEach((slot) => {
      if (!occupied.has(`${day}|${slot}`)) free.push({ day, time: slot.replace('-', ' - ') })
    })
  })

  freePeriodsDetail.value = free
  freePeriods.value = free.length
}

const resetDashboard = () => {
  todayClasses.value = []
  weeklyLessons.value = 0
  freePeriods.value = 0
  freePeriodsDetail.value = []
  upcomingClasses.value = []
  teachingClasses.value = []
  headTeacherClasses.value = []
}

const loadTeacherDashboardResources = async () => {
  await authStore.checkAuth()
  if (!currentTeacherId.value) {
    resetDashboard()
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
  await loadNotifications()
}

const loadNotifications = async () => {
  try {
    const response = await api.get('/notifications?limit=5')
    notifications.value = response.data.notifications || []
  } catch (error) {
    notifications.value = []
  }
}

onMounted(async () => {
  loadingDashboard.value = true
  try {
    await loadTeacherDashboardResources()
  } catch (error) {
    resetDashboard()
  } finally {
    loadingDashboard.value = false
  }
})
</script>

<style scoped>
.teacher-dashboard-page {
  min-height: 100vh;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
  color: #0f172a;
}

.dashboard-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1);
  color: #0f172a;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2563eb;
}

.dashboard-hero h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 850;
}

.dashboard-hero p {
  margin: 0.35rem 0 0;
  max-width: 44rem;
  color: #52627a;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.primary-action,
.secondary-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0 1rem;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  font-weight: 800;
}

.primary-action {
  background: #2563eb;
  color: #ffffff;
}

.secondary-action {
  background: #e0f2fe;
  color: #075985;
}

.action-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.72rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 1rem 0;
}

.metric-card,
.panel {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  padding: 0.95rem;
}

.metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 1.1rem;
}

.metric-icon.green { background: #dcfce7; color: #15803d; }
.metric-icon.amber { background: #fef3c7; color: #b45309; }
.metric-icon.purple { background: #ede9fe; color: #6d28d9; }
.metric-icon.rose { background: #ffe4e6; color: #be123c; }

.metric-card strong,
.metric-card span,
.metric-card small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-card strong {
  color: #0f172a;
  font-size: 1.35rem;
  line-height: 1.1;
}

.metric-card span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 850;
}

.metric-card small {
  max-width: 10rem;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 650;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.panel {
  min-width: 0;
  padding: 1rem;
}

.wide-panel {
  grid-column: span 2;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.panel-header span {
  display: block;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 0.15rem 0 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 850;
}

.panel-header a {
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 850;
  text-decoration: none;
}

.panel-header i {
  color: #2563eb;
  font-size: 1.35rem;
}

.next-lesson {
  display: grid;
  gap: 0.55rem;
  padding: 0.95rem;
  border-radius: 8px;
  background: #eff6ff;
  border-left: 4px solid #2563eb;
}

.next-lesson strong {
  color: #0f172a;
}

.next-lesson span {
  color: #475569;
  font-weight: 650;
}

.next-lesson button,
.free-list button,
.timeline-item,
.lesson-row {
  cursor: pointer;
}

.next-lesson button {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 7px;
  padding: 0.5rem 0.7rem;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
}

.timeline-list,
.activity-list,
.free-list,
.tag-list {
  display: grid;
  gap: 0.65rem;
}

.timeline-item {
  display: grid;
  grid-template-columns: 7rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  text-align: left;
}

.time-pill {
  display: inline-flex;
  justify-content: center;
  padding: 0.35rem 0.5rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 850;
}

.timeline-item strong,
.lesson-row strong {
  color: #0f172a;
}

.timeline-item small,
.lesson-row span {
  color: #64748b;
  font-weight: 650;
}

.lesson-table {
  overflow-x: auto;
}

.lesson-table-head,
.lesson-row {
  display: grid;
  grid-template-columns: 0.9fr 1fr 1.4fr 1fr 0.7fr;
  align-items: center;
  gap: 0.75rem;
  min-width: 640px;
}

.lesson-table-head {
  padding: 0 0.75rem 0.35rem;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
}

.lesson-row {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  text-align: left;
}

.tag-list {
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
}

.tag-list span {
  padding: 0.55rem 0.65rem;
  border-radius: 7px;
  background: #ecfdf5;
  color: #047857;
  font-weight: 850;
  text-align: center;
}

.free-list button {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  text-align: left;
}

.free-list span {
  color: #0f172a;
  font-weight: 800;
}

.free-list strong {
  color: #64748b;
  font-size: 0.82rem;
}

.free-list i {
  color: #16a34a;
}

.activity-item {
  display: flex;
  gap: 0.7rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.activity-item strong,
.activity-item small {
  display: block;
}

.activity-item strong {
  color: #0f172a;
  font-size: 0.86rem;
}

.activity-item small {
  margin-top: 0.15rem;
  color: #64748b;
  font-size: 0.76rem;
}

.activity-dot {
  flex: 0 0 10px;
  width: 10px;
  height: 10px;
  margin-top: 0.32rem;
  border-radius: 999px;
  background: #2563eb;
}

.activity-dot.green { background: #16a34a; }
.activity-dot.amber { background: #d97706; }

.empty-copy {
  margin: 0;
  padding: 1.4rem 0.5rem;
  color: #64748b;
  text-align: center;
  font-weight: 650;
}

.skeleton-card {
  display: grid;
  gap: 0.75rem;
}

.skeleton-line {
  display: block;
  height: 46px;
  border-radius: 7px;
  background: linear-gradient(90deg, #edf2f7 25%, #f8fafc 45%, #edf2f7 65%);
  background-size: 220% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
}

.skeleton-line.title {
  width: 44%;
  height: 22px;
}

.skeleton-line.short {
  width: 68%;
}

@keyframes skeleton {
  to { background-position: -220% 0; }
}

@media (max-width: 1100px) {
  .metric-grid,
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wide-panel {
    grid-column: span 2;
  }
}

@media (max-width: 760px) {
  .teacher-dashboard-page {
    padding: 1rem;
  }

  .dashboard-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions,
  .primary-action,
  .secondary-action {
    width: 100%;
  }

  .metric-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .wide-panel {
    grid-column: span 1;
  }

  .timeline-item {
    grid-template-columns: 1fr;
  }
}

:global(body.teacher-dark-mode) .teacher-dashboard-page {
  background: #020617;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .metric-card,
:global(body.teacher-dark-mode) .panel {
  background: #111827;
  border-color: #243244;
}

:global(body.teacher-dark-mode) .metric-card strong,
:global(body.teacher-dark-mode) .panel-header h2,
:global(body.teacher-dark-mode) .timeline-item strong,
:global(body.teacher-dark-mode) .lesson-row strong,
:global(body.teacher-dark-mode) .activity-item strong,
:global(body.teacher-dark-mode) .free-list span,
:global(body.teacher-dark-mode) .next-lesson strong {
  color: #f8fafc;
}

:global(body.teacher-dark-mode) .timeline-item,
:global(body.teacher-dark-mode) .lesson-row,
:global(body.teacher-dark-mode) .activity-item,
:global(body.teacher-dark-mode) .free-list button,
:global(body.teacher-dark-mode) .next-lesson {
  background: #0b1220;
  border-color: #243244;
}

:global(body.teacher-dark-mode) .metric-card span,
:global(body.teacher-dark-mode) .metric-card small,
:global(body.teacher-dark-mode) .panel-header span,
:global(body.teacher-dark-mode) .timeline-item small,
:global(body.teacher-dark-mode) .lesson-row span,
:global(body.teacher-dark-mode) .activity-item small,
:global(body.teacher-dark-mode) .free-list strong,
:global(body.teacher-dark-mode) .empty-copy,
:global(body.teacher-dark-mode) .next-lesson span {
  color: #cbd5e1;
}
</style>
