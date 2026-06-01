<template>
  <div class="dashboard-frame">
    <AdminSidebar />

    <main class="dashboard-main">
      <header class="dashboard-topbar" aria-hidden="true">
        <label class="dashboard-search" for="dashboardSearch">
          <input id="dashboardSearch" v-model="searchQuery" type="search" placeholder="Search anything...">
          <span>Search</span>
        </label>

        <div class="topbar-actions">
          <button class="notification-button" type="button" aria-label="Notifications">
            <span class="bell-icon" aria-hidden="true" v-html="icons.bell"></span>
            <span class="notification-count">{{ notificationCount }}</span>
          </button>

          <div class="topbar-user" aria-label="Current admin user">
            <div class="user-avatar">A</div>
            <div class="user-copy">
              <strong>Admin</strong>
              <small>Super Administrator</small>
            </div>
          </div>
        </div>
      </header>

      <div class="dashboard-content">
        <section class="dashboard-workspace">
          <div class="dashboard-title-row">
            <div>
              <h1>Timetable Dashboard</h1>
              <p>Overview of timetable statistics and management</p>
            </div>
            <div class="week-picker">
              <span class="calendar-mark"></span>
              <span>{{ weekRange }}</span>
              <span class="chevron">v</span>
            </div>
          </div>

          <div class="metric-grid">
            <article v-for="metric in metricCards" :key="metric.label" class="metric-card">
              <div class="metric-icon" :class="metric.tone" aria-hidden="true">
                <svg v-if="metric.icon === 'calendar'" viewBox="0 0 24 24">
                  <path d="M7 3v4M17 3v4M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>
                </svg>
                <svg v-else-if="metric.icon === 'book'" viewBox="0 0 24 24">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z"/>
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H7v16"/>
                </svg>
                <svg v-else-if="metric.icon === 'users'" viewBox="0 0 24 24">
                  <path d="M16 19a4 4 0 0 0-8 0"/>
                  <circle cx="12" cy="9" r="3"/>
                  <path d="M22 19a3.5 3.5 0 0 0-4-3.5M18 6.5a2.5 2.5 0 0 1 0 5M2 19a3.5 3.5 0 0 1 4-3.5M6 6.5a2.5 2.5 0 0 0 0 5"/>
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M5 4h11v16H5z"/>
                  <path d="M16 7h3v10h-3M13 12h.01"/>
                </svg>
              </div>
              <div class="metric-copy">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
                <small :class="metric.tone">{{ metric.hint }}</small>
              </div>
            </article>
          </div>

          <section class="panel timetable-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="section-icon" v-html="icons.calendar"></span>
                <h2>Weekly Timetable Overview</h2>
              </div>
              <div class="panel-actions">
                <select v-model="selectedClass" class="class-select" aria-label="Filter timetable by class">
                  <option value="">All Classes</option>
                  <option v-for="classItem in classOptions" :key="classItem" :value="classItem">
                    {{ classItem }}
                  </option>
                </select>
                <router-link class="primary-link" to="/timetable">View Full Timetable</router-link>
              </div>
            </div>

            <div class="timetable-wrap">
              <table class="overview-table">
                <thead>
                  <tr>
                    <th>Time / Day</th>
                    <th v-for="day in visibleDays" :key="day">{{ day }}</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(slot, index) in timetableRows" :key="slot.key">
                    <tr v-if="index === lunchBreakIndex" class="break-row">
                      <td colspan="7">LUNCH BREAK</td>
                    </tr>
                    <tr>
                      <th>{{ slot.label }}</th>
                      <td v-for="day in visibleDays" :key="`${slot.key}-${day}`">
                        <div
                          v-if="slot.entries[day]"
                          class="class-block"
                          :class="slot.entries[day].tone"
                        >
                          <strong>{{ slot.entries[day].module_name }}</strong>
                          <span>{{ slot.entries[day].roomLabel }}</span>
                        </div>
                        <div v-else class="empty-block">-</div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </section>

          <div class="insight-grid">
            <section class="panel distribution-panel">
              <div class="panel-title">
                <span class="section-icon" v-html="icons.chart"></span>
                <h2>Timetable Distribution</h2>
              </div>
              <div class="distribution-body">
                <div class="donut" :style="{ background: distributionGradient }">
                  <span></span>
                </div>
                <div class="legend-list">
                  <div v-for="item in distribution" :key="item.label" class="legend-item">
                    <span :style="{ background: item.color }"></span>
                    <strong>{{ item.label }}</strong>
                    <em>{{ item.percent }}% ({{ item.count }})</em>
                  </div>
                </div>
              </div>
            </section>

            <section class="panel room-panel">
              <div class="panel-title">
                <span class="section-icon" v-html="icons.room"></span>
                <h2>Room Utilization</h2>
              </div>
              <div class="utilization-meter">
                <span :style="{ width: `${roomUtilization}%` }"></span>
              </div>
              <div class="utilization-value">{{ roomUtilization }}%</div>
              <p>Average Utilization</p>
              <div class="room-stats">
                <div>
                  <strong>{{ usedRoomCount }}</strong>
                  <span>Used Rooms</span>
                </div>
                <div>
                  <strong>{{ availableRoomCount }}</strong>
                  <span>Available Rooms</span>
                </div>
              </div>
            </section>

            <section class="panel workload-panel">
              <div class="panel-title">
                <span class="section-icon" v-html="icons.teacher"></span>
                <h2>Teacher Workload</h2>
              </div>
              <div class="bar-chart">
                <div v-for="bucket in workloadBuckets" :key="bucket.label" class="bar-column">
                  <span :style="{ height: `${bucket.height}%`, background: bucket.color }"></span>
                  <small>{{ bucket.label }}</small>
                </div>
              </div>
            </section>
          </div>
        </section>

        <aside class="dashboard-side">
          <section class="panel side-panel">
            <div class="panel-title">
              <span class="section-icon" v-html="icons.plus"></span>
              <h2>Quick Actions</h2>
            </div>
            <router-link v-for="action in quickActions" :key="action.label" :to="action.path" class="quick-action-row">
              <span class="action-icon" :class="action.tone" v-html="icons[action.icon]"></span>
              <div>
                <strong>{{ action.label }}</strong>
                <small>{{ action.hint }}</small>
              </div>
            </router-link>
          </section>

          <section class="panel side-panel notifications-panel">
            <div class="panel-header compact">
              <div class="panel-title">
                <span class="section-icon" v-html="icons.bell"></span>
                <h2>Notifications</h2>
              </div>
              <button type="button">View All</button>
            </div>
            <div class="notification-list">
              <article v-for="item in dashboardNotifications" :key="item.title" class="notification-item">
                <span :class="item.tone"></span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.time }}</small>
                </div>
              </article>
            </div>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/stores/api'
import AdminSidebar from '@/components/AdminSidebar.vue'

const teachers = ref([])
const modules = ref([])
const classes = ref([])
const rooms = ref([])
const timetableEntries = ref([])
const fileLogs = ref([])
const selectedClass = ref('')
const searchQuery = ref('')

const visibleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const fallbackSlots = [
  { start_time: '08:00', end_time: '09:00' },
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' },
  { start_time: '11:00', end_time: '12:00' },
  { start_time: '13:00', end_time: '14:00' },
  { start_time: '14:00', end_time: '15:00' },
  { start_time: '15:00', end_time: '16:00' }
]
const tones = ['blue', 'green', 'violet', 'amber', 'rose', 'slate']
const distributionColors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#14b8a6', '#ef4444']

const filteredTimetable = computed(() => {
  return timetableEntries.value.filter((entry) => {
    if (entry.module_name === 'continue') return false
    if (selectedClass.value && entry.class_name !== selectedClass.value) return false

    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return true

    return [
      entry.module_name,
      entry.class_name,
      entry.teacher_name,
      entry.room_name,
      entry.room,
      entry.day_of_week
    ].some((value) => String(value || '').toLowerCase().includes(query))
  })
})

const metricCards = computed(() => [
  {
    label: 'Total Timetables',
    value: timetableEntries.value.length,
    hint: classOptions.value.length ? 'All departments' : 'No schedules yet',
    icon: 'calendar',
    tone: 'blue'
  },
  {
    label: 'Total Subjects',
    value: modules.value.length,
    hint: 'Across all classes',
    icon: 'book',
    tone: 'green'
  },
  {
    label: 'Total Teachers',
    value: teachers.value.length,
    hint: `${activeTeachers.value} active teachers`,
    icon: 'users',
    tone: 'violet'
  },
  {
    label: 'Total Rooms',
    value: totalRoomCount.value,
    hint: `${availableRoomCount.value} available rooms`,
    icon: 'door',
    tone: 'amber'
  }
])

const activeTeachers = computed(() => teachers.value.filter((teacher) => teacher.status === 'active').length)
const pendingTeachers = computed(() => teachers.value.filter((teacher) => teacher.status === 'pending'))
const classOptions = computed(() => [...new Set(classes.value.map((item) => item.class_name).filter(Boolean))])

const totalRoomCount = computed(() => {
  if (rooms.value.length) return rooms.value.length
  return [...new Set(timetableEntries.value.map((entry) => entry.room_name || entry.room).filter(Boolean))].length
})

const usedRoomCount = computed(() => {
  return [...new Set(filteredTimetable.value.map((entry) => entry.room_name || entry.room).filter(Boolean))].length
})

const availableRoomCount = computed(() => Math.max(totalRoomCount.value - usedRoomCount.value, 0))

const roomUtilization = computed(() => {
  if (!totalRoomCount.value) return 0
  return Math.min(100, Math.round((usedRoomCount.value / totalRoomCount.value) * 100))
})

const notificationCount = computed(() => Math.min(dashboardNotifications.value.length, 9))

const weekRange = computed(() => {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)

  return `${formatMonthDay(monday)} - ${formatMonthDay(saturday)}, ${saturday.getFullYear()}`
})

const timetableRows = computed(() => {
  const sourceSlots = filteredTimetable.value.length
    ? uniqueSlots(filteredTimetable.value).slice(0, 7)
    : fallbackSlots

  return sourceSlots.map((slot) => {
    const entries = {}
    visibleDays.forEach((day, dayIndex) => {
      const entry = filteredTimetable.value.find((item) => {
        return item.day_of_week === day &&
          normalizeTime(item.start_time) === normalizeTime(slot.start_time)
      })

      if (entry) {
        entries[day] = {
          ...entry,
          tone: tones[(dayIndex + slot.start_time.charCodeAt(1)) % tones.length],
          roomLabel: entry.room_name || entry.room || entry.class_name || 'TBA'
        }
      }
    })

    return {
      key: `${slot.start_time}-${slot.end_time}`,
      label: `${normalizeTime(slot.start_time)} - ${normalizeTime(slot.end_time)}`,
      entries
    }
  })
})

const lunchBreakIndex = computed(() => Math.min(4, Math.max(2, Math.floor(timetableRows.value.length / 2))))

const distribution = computed(() => {
  const counts = modules.value.reduce((acc, moduleItem) => {
    const label = moduleItem.department || 'General'
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  const entries = Object.entries(counts).slice(0, 5)
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1

  if (!entries.length) {
    return [{ label: 'No subjects', count: 0, percent: 0, color: distributionColors[0] }]
  }

  return entries.map(([label, count], index) => ({
    label,
    count,
    percent: Math.round((count / total) * 100),
    color: distributionColors[index % distributionColors.length]
  }))
})

const distributionGradient = computed(() => {
  let cursor = 0
  const segments = distribution.value.map((item) => {
    const start = cursor
    cursor += item.percent
    return `${item.color} ${start}% ${cursor}%`
  })
  return `conic-gradient(${segments.join(', ')})`
})

const workloadBuckets = computed(() => {
  const workload = teachers.value.map((teacher) => {
    return filteredTimetable.value.filter((entry) => entry.teacher_id === teacher.teacher_id || entry.teacher_name === teacher.name).length
  })

  const buckets = [
    { label: '0-10', min: 0, max: 10, color: '#4ade80' },
    { label: '10-20', min: 10, max: 20, color: '#3b82f6' },
    { label: '20-30', min: 20, max: 30, color: '#8b5cf6' },
    { label: '30-40', min: 30, max: 40, color: '#f59e0b' },
    { label: '40+', min: 40, max: Infinity, color: '#ef4444' }
  ]

  const counts = buckets.map((bucket) => ({
    ...bucket,
    count: workload.filter((hours) => hours >= bucket.min && hours < bucket.max).length
  }))
  const max = Math.max(...counts.map((bucket) => bucket.count), 1)

  return counts.map((bucket) => ({
    ...bucket,
    height: Math.max(12, Math.round((bucket.count / max) * 88))
  }))
})

const dashboardNotifications = computed(() => {
  const items = []

  if (filteredTimetable.value.length) {
    items.push({
      title: `Timetable published for ${classOptions.value[0] || 'all classes'}`,
      time: 'Updated today',
      tone: 'blue'
    })
  }

  if (pendingTeachers.value.length) {
    items.push({
      title: `${pendingTeachers.value.length} teacher approval${pendingTeachers.value.length > 1 ? 's' : ''} pending`,
      time: 'Needs review',
      tone: 'amber'
    })
  }

  if (fileLogs.value.length) {
    items.push({
      title: `${fileLogs.value[0].filename || 'New file'} uploaded`,
      time: formatRelative(fileLogs.value[0].upload_date),
      tone: 'green'
    })
  }

  if (!items.length) {
    items.push({
      title: 'No new dashboard alerts',
      time: 'All caught up',
      tone: 'violet'
    })
  }

  return items.slice(0, 4)
})

const icons = {
  bell: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m4 0a3 3 0 1 1-6 0h6Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5M9 19V10M14 19V14M19 19V7M4 19h16"/></svg>',
  room: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 1-2-2Z"/><path d="M8 9h8M8 13h8"/></svg>',
  teacher: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM6 20a6 6 0 0 1 12 0"/></svg>',
  plus: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14"/></svg>',
  class: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 5h16v14H4z"/><path d="M4 9h16"/></svg>',
  book: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v16H4z"/><path d="M8 7h8M8 11h8"/></svg>'
}

const quickActions = [
  { label: 'Create Timetable', path: '/timetable', icon: 'plus', tone: 'blue', hint: 'Generate new timetable' },
  { label: 'Add Class', path: '/classes', icon: 'class', tone: 'green', hint: 'Create new class' },
  { label: 'Add Subject', path: '/modules', icon: 'book', tone: 'violet', hint: 'Create new subject' },
  { label: 'Add Teacher', path: '/teachers', icon: 'teacher', tone: 'amber', hint: 'Register new teacher' },
  { label: 'Assign Workload', path: '/assignments', icon: 'chart', tone: 'rose', hint: 'Assign classes to teachers' }
]

const uniqueSlots = (entries) => {
  const slotMap = new Map()
  entries.forEach((entry) => {
    const start = normalizeTime(entry.start_time)
    const end = normalizeTime(entry.end_time)
    if (start && end) {
      slotMap.set(`${start}-${end}`, { start_time: start, end_time: end })
    }
  })
  return [...slotMap.values()].sort((a, b) => a.start_time.localeCompare(b.start_time))
}

const normalizeTime = (value) => String(value || '').slice(0, 5)

const formatMonthDay = (date) => {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const formatRelative = (dateString) => {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()
  const hours = Math.max(1, Math.round(diff / 36e5))
  if (hours < 24) return `${hours} hours ago`
  return `${Math.round(hours / 24)} days ago`
}

const loadDashboardData = async () => {
  const requests = [
    api.get('/teachers').catch(() => ({ data: { teachers: [] } })),
    api.get('/modules').catch(() => ({ data: { modules: [] } })),
    api.get('/classes').catch(() => ({ data: { classes: [] } })),
    api.get('/timetable').catch(() => ({ data: { timetables: [] } })),
    api.get('/uploads').catch(() => ({ data: { logs: [] } })),
    api.get('/rooms').catch(() => ({ data: { rooms: [] } }))
  ]

  const [teacherResponse, moduleResponse, classResponse, timetableResponse, uploadResponse, roomResponse] = await Promise.all(requests)

  teachers.value = teacherResponse.data.teachers || []
  modules.value = moduleResponse.data.modules || []
  classes.value = classResponse.data.classes || []
  timetableEntries.value = timetableResponse.data.timetables || []
  fileLogs.value = uploadResponse.data.logs || []
  rooms.value = roomResponse.data.rooms || []
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-frame {
  --admin-header-height: 76px;
  --admin-sidebar-width: 184px;
  min-height: 100vh;
  background: #f8fbff;
  color: #101a33;
}

.dashboard-main {
  min-height: 100vh;
  margin-left: var(--admin-sidebar-width);
}

.dashboard-topbar {
  display: none;
}

.topbar-icon {
  display: inline-grid;
  gap: 4px;
  width: 28px;
  padding: 0;
  background: transparent;
  border: 0;
}

.topbar-icon span {
  display: block;
  height: 2px;
  border-radius: 999px;
  background: #617293;
}

.dashboard-search {
  position: relative;
  width: min(420px, 38vw);
}

.dashboard-search input {
  width: 100%;
  height: 48px;
  padding: 0 3.15rem 0 1.25rem;
  border: 1px solid #dfe7f3;
  border-radius: 8px;
  background: #f9fbff;
  color: #17213a;
  outline: none;
}

.dashboard-search span {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7585a3;
  font-size: 0.75rem;
}

.topbar-spacer {
  flex: 1;
}

.notification-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-width: 56px;
  height: 44px;
  border: 0;
  border-radius: 50px;
  background: #eef5ff;
  padding: 0 0.65rem;
  cursor: pointer;
}

.notification-button:hover,
.notification-button:focus-visible {
  background: #dbe9ff;
  outline: none;
}

.bell-icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
}

.bell-icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.notification-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #2377f3;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.action-icon,
.section-icon svg {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.action-icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dashboard-content {
  display: grid;
  grid-template-columns: minmax(900px, 1fr) 260px;
  gap: 1rem;
  padding: 1.7rem 1.5rem 2.75rem 2rem;
}

.dashboard-title-row,
.panel-header,
.panel-actions,
.panel-title {
  display: flex;
  align-items: center;
}

.dashboard-title-row,
.panel-header {
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-title-row {
  margin-bottom: 1.45rem;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #101a33;
  font-size: clamp(1.9rem, 2.35vw, 2.45rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.1;
}

.dashboard-title-row p {
  max-width: 520px;
  margin-top: 0.45rem;
  color: #677796;
  font-size: 1rem;
  line-height: 1.5;
}

.week-picker,
.class-select,
.primary-link {
  height: 44px;
  border: 1px solid #dfe7f3;
  border-radius: 8px;
  background: #fff;
}

.week-picker {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 250px;
  height: 48px;
  padding: 0 1.05rem;
  color: #17213a;
  font-size: 0.9rem;
  font-weight: 700;
}

.calendar-mark {
  width: 16px;
  height: 16px;
  border: 2px solid #8190ad;
  border-radius: 4px;
  box-shadow: inset 0 4px 0 #dbe7fb;
}

.chevron {
  margin-left: auto;
  color: #7585a3;
  font-size: 0.82rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.metric-card,
.panel {
  background: #fff;
  border: 1px solid #dfe7f3;
  border-radius: 8px;
  box-shadow: 0 16px 45px rgba(27, 43, 74, 0.05);
}

.metric-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  min-width: 0;
  min-height: 106px;
  padding: 1.25rem 1.1rem;
  overflow: hidden;
}

.metric-icon,
.section-icon,
.quick-action-row span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.metric-icon {
  width: 58px;
  height: 58px;
  border-radius: 8px;
}

.metric-icon svg {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.metric-copy {
  min-width: 0;
}

.metric-card span {
  display: block;
  color: #17213a;
  max-width: 100%;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: normal;
}

.metric-card strong {
  display: block;
  margin-top: 0.4rem;
  color: #101a33;
  font-size: clamp(1.6rem, 2.2vw, 1.95rem);
  line-height: 1;
}

.metric-card small {
  display: block;
  margin-top: 0.5rem;
  max-width: 100%;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: normal;
}

.blue {
  color: #2377f3;
  background: #eaf2ff;
}

.green {
  color: #20a657;
  background: #eaf9ef;
}

.violet {
  color: #8b5cf6;
  background: #f2ecff;
}

.amber {
  color: #f97316;
  background: #fff1e3;
}

.rose {
  color: #e65b6b;
  background: #ffecef;
}

.slate {
  color: #596985;
  background: #edf2f8;
}

.panel {
  padding: 1.25rem;
}

.panel-title {
  gap: 0.7rem;
}

.panel-title h2 {
  color: #101a33;
  font-size: 1rem;
  font-weight: 800;
}

.section-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #eaf2ff;
  color: #2377f3;
  font-size: 0.72rem;
  font-weight: 800;
}

.panel-actions {
  gap: 1rem;
}

.class-select {
  min-width: 210px;
  padding: 0 1rem;
  color: #17213a;
  font-weight: 700;
}

.primary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 190px;
  padding: 0 1.25rem;
  background: #2f80ed;
  border-color: #2f80ed;
  color: #fff;
  font-weight: 800;
  text-decoration: none;
}

.timetable-wrap {
  margin-top: 1rem;
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  min-width: 900px;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #dfe7f3;
  border-radius: 8px;
  overflow: hidden;
}

.overview-table th,
.overview-table td {
  width: 14.25%;
  padding: 0.45rem;
  border-right: 1px solid #e5edf8;
  border-bottom: 1px solid #e5edf8;
  text-align: center;
  vertical-align: middle;
}

.overview-table th:first-child,
.overview-table td:first-child {
  width: 120px;
}

.overview-table thead th {
  height: 42px;
  background: #fbfdff;
  color: #17213a;
  font-size: 0.82rem;
  font-weight: 800;
}

.overview-table tbody th {
  color: #17213a;
  font-size: 0.8rem;
  white-space: nowrap;
}

.class-block,
.empty-block {
  min-height: 48px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.35rem;
}

.class-block {
  border: 1px solid currentColor;
}

.class-block strong {
  color: #12366d;
  font-size: 0.74rem;
  line-height: 1.15;
}

.class-block span {
  color: #34435e;
  font-size: 0.68rem;
}

.empty-block {
  color: #9aa8bd;
  background: #f8fbff;
}

.break-row td {
  height: 34px;
  padding: 0;
  background: #f8fbff;
  color: #17213a;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
}

.insight-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr 1.1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.distribution-body {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  margin-top: 1.25rem;
}

.donut {
  position: relative;
  width: 112px;
  height: 112px;
  border-radius: 50%;
}

.donut span {
  position: absolute;
  inset: 30px;
  border-radius: 50%;
  background: #fff;
}

.legend-list {
  display: grid;
  gap: 0.75rem;
  flex: 1;
}

.legend-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  color: #17213a;
  font-size: 0.84rem;
}

.legend-item span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-item em {
  color: #33425f;
  font-style: normal;
}

.utilization-meter {
  height: 8px;
  margin-top: 2.1rem;
  border-radius: 999px;
  background: #e8eef7;
  overflow: hidden;
}

.utilization-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #1877f2;
}

.utilization-value {
  margin-top: -1.45rem;
  text-align: right;
  color: #101a33;
  font-size: 1.3rem;
  font-weight: 800;
}

.room-panel p {
  margin: 1.1rem 0 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e5edf8;
  color: #7585a3;
  font-size: 0.84rem;
}

.room-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.room-stats strong,
.room-stats span {
  display: block;
}

.room-stats strong {
  color: #101a33;
  font-size: 1.25rem;
}

.room-stats span {
  color: #7585a3;
  font-size: 0.82rem;
}

.bar-chart {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  gap: 0.8rem;
  height: 150px;
  margin-top: 1.1rem;
  padding-top: 1rem;
  background: repeating-linear-gradient(to top, transparent, transparent 28px, #e9eff8 29px);
}

.bar-column {
  display: grid;
  align-items: end;
  gap: 0.45rem;
  height: 100%;
  text-align: center;
}

.bar-column span {
  width: 32px;
  max-height: 112px;
  margin: 0 auto;
  border-radius: 5px 5px 0 0;
}

.bar-column small {
  color: #647490;
  font-size: 0.68rem;
}

.dashboard-side {
  display: grid;
  align-content: start;
  gap: 1.5rem;
}

.side-panel {
  padding: 1.55rem 1.45rem;
}

.quick-action-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 62px;
  color: #17213a;
  text-decoration: none;
}

.quick-action-row:first-of-type {
  margin-top: 1rem;
}

.quick-action-row span {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  font-size: 0.86rem;
  font-weight: 800;
}

.quick-action-row strong {
  font-size: 1rem;
}

.compact button {
  background: transparent;
  border: 0;
  color: #2377f3;
  font-weight: 700;
  font-size: 0.82rem;
}

.notification-list {
  display: grid;
  gap: 1.45rem;
  margin-top: 1.35rem;
}

.notification-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 0.85rem;
}

.notification-item > span {
  width: 10px;
  height: 10px;
  margin-top: 0.35rem;
  border-radius: 50%;
}

.notification-item strong,
.notification-item small {
  display: block;
}

.notification-item strong {
  color: #17213a;
  font-size: 0.92rem;
  line-height: 1.35;
}

.notification-item small {
  margin-top: 0.35rem;
  color: #7585a3;
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .dashboard-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-grid,
  .insight-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1360px) and (min-width: 1201px) {
  .dashboard-content {
    grid-template-columns: minmax(820px, 1fr) 248px;
    gap: 1rem;
    padding-inline: 1.5rem;
  }

  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .metric-card {
    grid-template-columns: 52px minmax(0, 1fr);
    min-height: 102px;
    padding: 1.05rem 0.9rem;
    gap: 0.75rem;
  }

  .metric-icon {
    width: 52px;
    height: 52px;
  }

  .metric-icon svg {
    width: 27px;
    height: 27px;
  }

  .metric-card span,
  .metric-card small {
    font-size: 0.7rem;
  }

  .metric-card strong {
    font-size: 1.55rem;
  }

  .week-picker {
    min-width: 280px;
  }

  .side-panel {
    padding: 1.35rem 1.2rem;
  }

  .quick-action-row {
    min-height: 58px;
  }
}

@media (max-width: 900px) {
  .dashboard-main {
    margin-left: 0;
  }

  .dashboard-content {
    padding: 1.25rem;
  }

  .dashboard-topbar {
    padding: 0 1.25rem;
  }

  .dashboard-search {
    width: 100%;
  }

  .dashboard-title-row,
  .panel-header {
    align-items: stretch;
    flex-direction: column;
  }

  .week-picker,
  .panel-actions,
  .class-select,
  .primary-link {
    width: 100%;
  }

  .panel-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dashboard-side,
  .metric-grid,
  .insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
