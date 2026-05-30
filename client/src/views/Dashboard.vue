<template>
  <AppLayout>
    <div class="dashboard-layout">
      <div class="dashboard-container">
    
      <!-- Title -->
      <div class="dashboard-title-row">
        <div>
          <h1>Timetable Dashboard</h1>
          <p>Overview of timetable statistics and management</p>
          <small class="school-context">{{ schoolContextLabel }}</small>
        </div>
        <div class="week-picker">
          <span class="calendar-mark"></span>
          <span>{{ weekRange }}</span>
          <span class="chevron">v</span>
        </div>
        <button class="refresh-dashboard" type="button" :disabled="dashboardLoading" @click="reloadDashboard">
          {{ dashboardLoading ? 'Refreshing...' : 'Refresh Data' }}
        </button>
      </div>

      <div v-if="dashboardLoadError" class="dashboard-error">
        {{ dashboardLoadError }}
      </div>

      <!-- 4 Metric Cards -->
      <div class="metric-grid">
        <router-link to="/timetable" class="metric-card">
          <div class="metric-icon blue" v-html="icons.calendar"></div>
          <div class="metric-copy">
            <span>Total Timetables</span>
            <strong>{{ dashboardStats.timetables }}</strong>
            <small>All departments</small>
          </div>
        </router-link>
        <router-link to="/modules" class="metric-card">
          <div class="metric-icon green" v-html="icons.book"></div>
          <div class="metric-copy">
            <span>Total Subjects</span>
            <strong>{{ dashboardStats.modules }}</strong>
            <small>Across all classes</small>
          </div>
        </router-link>
        <router-link to="/teachers" class="metric-card">
          <div class="metric-icon violet" v-html="icons.teacher"></div>
          <div class="metric-copy">
            <span>Total Teachers</span>
            <strong>{{ dashboardStats.teachers }}</strong>
            <small>Active teachers</small>
          </div>
        </router-link>
        <router-link to="/rooms" class="metric-card">
          <div class="metric-icon amber" v-html="icons.room"></div>
          <div class="metric-copy">
            <span>Total Rooms</span>
            <strong>{{ dashboardStats.rooms }}</strong>
            <small>Available rooms</small>
          </div>
        </router-link>
      </div>

      <!-- Weekly Timetable Overview - PANEL IMWE GUSA -->
      <div class="panel">
        <div class="panel-header">
          <h2>Weekly Timetable Overview</h2>
          <div>
            <select v-model="selectedTimetableClassId" class="class-select">
              <option value="">All Classes</option>
              <option v-for="classItem in classOptions" :key="classItem.class_id" :value="classItem.class_id">
                {{ classItem.class_name }}
              </option>
            </select>
            <router-link to="/timetable" class="primary-link">View Full Timetable</router-link>
          </div>
        </div>

        <div class="timetable-wrap">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Time</th>
                <th v-for="day in days" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in timetableRows" :key="row.key" :class="row.type === 'break' ? `break-row ${row.breakType}` : ''">
                <td class="period-cell" :class="row.breakType">
                  <span v-if="row.type === 'break'" class="break-label">{{ row.label }}</span>
                  <span v-else>{{ row.period }}</span>
                </td>
                <td class="time-cell" :class="row.breakType">{{ formatTimeRange(row.start_time, row.end_time) }}</td>
                <td v-if="row.type === 'break'" :colspan="days.length" class="break-fill" :class="row.breakType"></td>
                <td v-for="day in days" v-else :key="day">
                  <div
                    v-if="row.entriesByDay[day]"
                    class="class-block"
                    :class="{ 'activity-cell': row.entriesByDay[day].entry_type === 'activity' }"
                  >
                    <strong>{{ row.entriesByDay[day].module_name }}</strong>
                    <small>{{ row.entriesByDay[day].teacher_name || (row.entriesByDay[day].entry_type === 'activity' ? 'Shared activity' : '') }}</small>
                    <span v-if="row.entriesByDay[day].entry_type !== 'activity'" class="room-badge">
                      {{ row.entriesByDay[day].room_name || row.entriesByDay[day].room || 'TBA' }}
                    </span>
                  </div>
                  <div v-else class="empty-block">-</div>
                </td>
              </tr>
              <tr v-if="!timetableRows.length">
                <td colspan="7" class="empty-state">No timetable entries found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3 Bottom Cards -->
      <div class="three-cards">
        <div class="panel">
          <div class="panel-title"><span v-html="icons.chart"></span><h3>Timetable Distribution</h3></div>
          <div class="distribution-content">
            <div class="donut" :style="{ background: distributionGradient }">
              <strong>{{ distributionTotal }}</strong>
              <span>entries</span>
            </div>
            <div class="legend">
              <div v-for="item in dashboardStatsCards.distribution" :key="item.module_name">
                <span :style="{ background: getDistributionColor(item.module_name) }"></span>
                <strong>{{ item.module_name }}</strong>
                <em>{{ item.percent }}% · {{ item.count }}</em>
              </div>
              <div v-if="!dashboardStatsCards.distribution.length" class="empty-state">No data yet</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><span v-html="icons.room"></span><h3>Room Utilization</h3></div>
          <div class="room-utilization-head">
            <strong>{{ dashboardStatsCards.roomUtilization }}%</strong>
            <span>{{ dashboardStatsCards.usedRooms }} of {{ dashboardStatsCards.usedRooms + dashboardStatsCards.availableRooms }} rooms used</span>
          </div>
          <div class="utilization-bar"><span :style="{ width: `${dashboardStatsCards.roomUtilization}%` }"></span></div>
          <div class="room-stats">
            <div><strong>{{ dashboardStatsCards.usedRooms }}</strong> Used</div>
            <div><strong>{{ dashboardStatsCards.availableRooms }}</strong> Available</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title"><span v-html="icons.teacher"></span><h3>Teacher Workload</h3></div>
          <div class="workload-bars">
            <div v-for="bucket in workloadBuckets" :key="bucket.label">
              <strong>{{ bucket.count }}</strong>
              <span :style="{ height: `${bucket.percent}%` }"></span>
              <small>{{ bucket.label }}</small>
            </div>
          </div>
          <p class="workload-note">Teachers grouped by number of timetable entries.</p>
        </div>
      </div>
      </div>

      <!-- Right Sidebar - Quick Actions & Notifications -->
      <div class="dashboard-sidebar">
        <!-- Quick Actions -->
        <div class="panel">
          <div class="panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="actions-list">
            <router-link :to="{ path: '/timetable', query: { action: 'generate' } }" class="action-item">
              <span class="action-icon blue" v-html="icons.plus"></span>
              <div>
                <strong>Create Timetable</strong>
                <small>Generate new timetable</small>
              </div>
            </router-link>
            <router-link :to="{ path: '/classes', query: { action: 'add' } }" class="action-item">
              <span class="action-icon green" v-html="icons.book"></span>
              <div>
                <strong>Add Class</strong>
                <small>Create new class</small>
              </div>
            </router-link>
            <router-link :to="{ path: '/modules', query: { action: 'add' } }" class="action-item">
              <span class="action-icon violet" v-html="icons.bookOpen"></span>
              <div>
                <strong>Add Subject</strong>
                <small>Create new subject</small>
              </div>
            </router-link>
            <router-link :to="{ path: '/teachers', query: { action: 'add' } }" class="action-item">
              <span class="action-icon amber" v-html="icons.teacher"></span>
              <div>
                <strong>Add Teacher</strong>
                <small>Register new teacher</small>
              </div>
            </router-link>
            <router-link :to="{ path: '/rooms', query: { action: 'add' } }" class="action-item">
              <span class="action-icon rose" v-html="icons.room"></span>
              <div>
                <strong>Add Room</strong>
                <small>Add new classroom</small>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Notifications -->
        <div id="notifications" class="panel">
          <div class="panel-header">
            <h3>Notifications</h3>
            <div class="notification-tools">
              <button class="view-all" type="button" @click="loadNotifications">Refresh</button>
              <button class="view-all danger" type="button" :disabled="!notifications.length" @click="clearNotifications">Clear</button>
            </div>
          </div>
          <div class="notifications-list">
            <div v-if="!notifications.length" class="notification empty">
              <div class="notification-content">
                <strong>No notifications yet</strong>
                <small>System updates will appear here.</small>
              </div>
            </div>
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification notification-button"
              role="button"
              tabindex="0"
              @click="openNotification(notification)"
              @keyup.enter="openNotification(notification)"
            >
              <span class="dot" :class="notification.tone"></span>
              <div class="notification-content">
                <strong>{{ notification.title }}</strong>
                <span v-if="notification.message">{{ notification.message }}</span>
                <small>{{ notification.time }}</small>
                <div v-if="notification.action_required" class="notification-actions" @click.stop>
                  <button type="button" class="approve-action" @click="approvePendingItem(notification)">Approve</button>
                  <button type="button" class="reject-action" @click="rejectPendingItem(notification)">Reject</button>
                </div>
              </div>
              <span class="notification-remove" @click.stop="deleteNotification(notification)">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6l12 12M18 6 6 18"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        <!-- Academic Year -->
        <div class="academic-card">
          <span>Academic Year</span>
          <strong>{{ currentAcademicYear }}</strong>
        </div>
      </div>
      <ConfirmModal
        v-model="rejectDialog.open"
        title="Reject Registration"
        :description="`Reject ${rejectDialog.notification?.title || 'this registration request'}?`"
        confirm-label="Reject"
        cancel-label="Cancel"
        loading-label="Rejecting..."
        :loading="rejectDialog.loading"
        danger
        @confirm="confirmRejectPendingItem"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { FIXED_DAYS, buildFixedTimetableRows } from '@/utils/fixedTimetableStructure'

const days = FIXED_DAYS
const today = new Date()
const authStore = useAuthStore()

const weekRange = computed(() => {
  const start = new Date(today)
  const dayOfWeek = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dayOfWeek)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const formatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`
})

const currentAcademicYear = computed(() => {
  const year = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
  return `${year} - ${year + 1}`
})
const selectedTimetableClassId = ref('')
const timetableEntries = ref([])
const timetableSettings = ref(null)
const notifications = ref([])
const rejectDialog = ref({ open: false, notification: null, loading: false })
const classes = ref([])
const teachers = ref([])
const modules = ref([])
const rooms = ref([])
const dashboardLoadError = ref('')
const dashboardLoading = ref(false)

const schoolContextLabel = computed(() => {
  const user = authStore.currentUser || {}
  const cachedUser = localStorage.getItem('user')
  let cachedSchoolId = ''

  if (cachedUser) {
    try {
      cachedSchoolId = JSON.parse(cachedUser)?.school_id || ''
    } catch (error) {
      cachedSchoolId = ''
    }
  }

  const schoolId = user.school_id || cachedSchoolId || localStorage.getItem('selectedSchoolId') || ''
  const role = authStore.currentUserType || localStorage.getItem('userType') || user.role || ''
  return schoolId ? `School ID: ${schoolId} • Role: ${role || 'admin'}` : 'No school selected for this account'
})

const icons = {
  calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Zm4-12h6M8 11h6"/></svg>',
  bookOpen: '<svg viewBox="0 0 24 24"><path d="M2 5.5A3.5 3.5 0 0 1 5.5 2H12v18H5.5A3.5 3.5 0 0 0 2 23V5.5ZM12 2h6.5A3.5 3.5 0 0 1 22 5.5V23a3.5 3.5 0 0 0-3.5-3H12"/></svg>',
  teacher: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-1 2 2 3-4"/></svg>',
  room: '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 16V9M12 16V6M16 16v-4"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
}
const normalizeTime = (value) => String(value || '').slice(0, 5)

const classOptions = computed(() => {
  return groupedTimetables.value
    .map((group) => ({
      class_id: group.class_id,
      class_name: group.class_name || `Class ${group.class_id}`
    }))
    .sort((a, b) => String(a.class_name).localeCompare(String(b.class_name)))
})

const visibleEntries = computed(() => {
  const selectedGroup = selectedTimetableGroup.value
  return selectedGroup ? selectedGroup.entries : []
})

const groupedTimetables = computed(() => {
  const groups = new Map()
  timetableEntries.value.forEach((entry) => {
    if (entry.module_name === 'continue') return
    if (!days.includes(entry.day_of_week)) return

    const classId = entry.class_id || 'unknown'
    if (!groups.has(classId)) {
      groups.set(classId, {
        class_id: classId,
        class_name: entry.class_name,
        entries: []
      })
    }
    groups.get(classId).entries.push(entry)
  })
  return [...groups.values()]
})

const selectedTimetableGroup = computed(() => {
  if (!groupedTimetables.value.length) return null
  if (selectedTimetableClassId.value) {
    return groupedTimetables.value.find((group) => String(group.class_id) === String(selectedTimetableClassId.value)) || null
  }
  return groupedTimetables.value[0]
})

const timetableRows = computed(() => buildTimetableGridWithBreaks(visibleEntries.value))

const dashboardStats = computed(() => ({
  timetables: timetableEntries.value.length,
  modules: modules.value.length,
  teachers: teachers.value.length,
  rooms: rooms.value.length
}))

const dashboardStatsCards = ref({
  distribution: [],
  roomUtilization: 0,
  usedRooms: 0,
  availableRooms: 0,
  workloadBars: [0, 0, 0, 0, 0],
  workloadBuckets: []
})

const getDistributionColor = (moduleName) => {
  const palette = ['#2563eb', '#16a34a', '#f97316', '#7c3aed', '#dc2626']
  const idx = Math.abs(String(moduleName || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % palette.length
  return palette[idx]
}

const distributionTotal = computed(() => {
  return dashboardStatsCards.value.distribution.reduce((sum, item) => sum + Number(item.count || 0), 0)
})

const distributionGradient = computed(() => {
  if (!dashboardStatsCards.value.distribution.length) {
    return 'conic-gradient(#e2e8f0 0% 100%)'
  }

  let cursor = 0
  const parts = dashboardStatsCards.value.distribution.map((item) => {
    const start = cursor
    const end = Math.min(cursor + Number(item.percent || 0), 100)
    cursor = end
    return `${getDistributionColor(item.module_name)} ${start}% ${end}%`
  })

  if (cursor < 100) parts.push(`#e2e8f0 ${cursor}% 100%`)
  return `conic-gradient(${parts.join(', ')})`
})

const workloadBuckets = computed(() => {
  const fallbackLabels = ['0-10', '10-20', '20-30', '30-40', '40+']
  if (dashboardStatsCards.value.workloadBuckets.length) {
    return dashboardStatsCards.value.workloadBuckets
  }
  return dashboardStatsCards.value.workloadBars.map((percent, index) => ({
    label: fallbackLabels[index],
    count: 0,
    percent
  }))
})

const loadDashboardStatsCards = async () => {
  try {
    const response = await api.get('/dashboard/stats')
    dashboardStatsCards.value = {
      distribution: response.data.distribution || [],
      roomUtilization: response.data.roomUtilization || 0,
      usedRooms: response.data.usedRooms || 0,
      availableRooms: response.data.availableRooms || 0,
      workloadBars: (response.data.workload?.bars || [0, 0, 0, 0, 0]).slice(0, 5),
      workloadBuckets: response.data.workload?.buckets || []
    }
  } catch (error) {
    dashboardLoadError.value =
      error.response?.data?.message ||
      error.response?.data?.error ||
      dashboardLoadError.value ||
      'Dashboard statistics could not load for this school account.'
    dashboardStatsCards.value = {
      distribution: [],
      roomUtilization: 0,
      usedRooms: 0,
      availableRooms: 0,
      workloadBars: [0, 0, 0, 0, 0],
      workloadBuckets: []
    }
  }
}

const usedRooms = computed(() => new Set(timetableEntries.value.filter(entry => entry.room_id).map(entry => entry.room_id)).size)
const availableRooms = computed(() => Math.max(rooms.value.length - usedRooms.value, 0))
const roomUtilization = computed(() => {
  if (!rooms.value.length) return 0
  return Math.round((usedRooms.value / rooms.value.length) * 100)
})

const formatTimeRange = (start, end) => {
  if (!start && !end) return '-'
  return `${normalizeTime(start)} - ${normalizeTime(end)}`
}

const buildTimetableGridWithBreaks = (entries) => {
  return buildFixedTimetableRows(entries, days, timetableSettings.value)
}

const loadTimetable = async () => {
  try {
    const response = await api.get('/timetable')
    timetableEntries.value = response.data.timetables || []
    selectedTimetableClassId.value = classOptions.value[0]?.class_id || ''
  } catch (error) {
    dashboardLoadError.value =
      error.response?.data?.message ||
      error.response?.data?.error ||
      dashboardLoadError.value ||
      'Timetable data could not load for this school account.'
    timetableEntries.value = []
  }
}

const loadTimetableSettings = async () => {
  try {
    const response = await api.get('/settings/timetable')
    timetableSettings.value = response.data.settings || null
  } catch (error) {
    timetableSettings.value = null
  }
}

const formatNotificationTime = (dateValue) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''

  const seconds = Math.max(Math.floor((Date.now() - date.getTime()) / 1000), 0)
  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const daysAgo = Math.floor(hours / 24)
  return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
}

const loadNotifications = async () => {
  try {
    const response = await api.get('/notifications?limit=6')
    notifications.value = (response.data.notifications || []).map((notification) => ({
      ...notification,
      tone: notification.tone || 'blue',
      path: notification.path || '/dashboard',
      time: formatNotificationTime(notification.created_at)
    }))
  } catch (error) {
    notifications.value = []
  }
}

const deleteNotification = async (notification) => {
  try {
    await api.delete(`/notifications/${notification.id}`)
    notifications.value = notifications.value.filter((item) => Number(item.id) !== Number(notification.id))
  } catch (error) {
    await loadNotifications()
  }
}

const clearNotifications = async () => {
  if (!notifications.value.length) return

  try {
    await api.delete('/notifications')
    notifications.value = []
  } catch (error) {
    await loadNotifications()
  }
}

const loadDashboardData = async () => {
  dashboardLoadError.value = ''
  const [classesResponse, teachersResponse, modulesResponse, roomsResponse] = await Promise.allSettled([
    api.get('/classes'),
    api.get('/teachers'),
    api.get('/modules'),
    api.get('/rooms')
  ])

  classes.value = classesResponse.status === 'fulfilled' ? classesResponse.value.data.classes || [] : []
  teachers.value = teachersResponse.status === 'fulfilled' ? teachersResponse.value.data.teachers || [] : []
  modules.value = modulesResponse.status === 'fulfilled' ? modulesResponse.value.data.modules || [] : []
  rooms.value = roomsResponse.status === 'fulfilled' ? roomsResponse.value.data.rooms || [] : []

  const failedResponse = [classesResponse, teachersResponse, modulesResponse, roomsResponse]
    .find((response) => response.status === 'rejected')

  if (failedResponse) {
    const error = failedResponse.reason
    dashboardLoadError.value =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Some dashboard data could not load for this school account.'
  }
}

const reloadDashboard = async () => {
  dashboardLoading.value = true
  dashboardLoadError.value = ''

  try {
    await authStore.checkAuth()
    await Promise.all([
      loadDashboardData(),
      loadTimetableSettings(),
      loadTimetable(),
      loadNotifications(),
      loadDashboardStatsCards()
    ])

    const noDataLoaded =
      !classes.value.length &&
      !teachers.value.length &&
      !modules.value.length &&
      !rooms.value.length &&
      !timetableEntries.value.length

    if (noDataLoaded && !dashboardLoadError.value) {
      if (authStore.currentUser?.role === 'super_admin') {
        dashboardLoadError.value = 'Super Admin view: No data found. Please ensure you have selected a school from the management panel.'
      } else {
        dashboardLoadError.value = 'No records found for your school. Please ensure your account is linked to an active school ID.'
      }
    }
  } finally {
    dashboardLoading.value = false
  }
}

const openNotification = (notification) => {
  if (notification.path) {
    window.location.href = notification.path
  }
}

const getPendingEndpoint = (notification, action) => {
  if (!notification?.entity_id) return ''
  if (notification.entity_type === 'school' || notification.type === 'school_pending') {
    return `/schools/${notification.entity_id}/${action}`
  }
  if (notification.entity_type === 'teacher' || notification.type === 'teacher_pending') {
    return action === 'approve'
      ? `/teachers/${notification.entity_id}/approve`
      : `/teachers/${notification.entity_id}/reject`
  }
  return ''
}

const approvePendingItem = async (notification) => {
  if (!notification.entity_id) return
  const endpoint = getPendingEndpoint(notification, 'approve')
  if (!endpoint) return
  await api.put(endpoint)
  await loadNotifications()
}

const rejectPendingItem = async (notification) => {
  if (!notification.entity_id) return
  rejectDialog.value = { open: true, notification, loading: false }
}

const confirmRejectPendingItem = async () => {
  const notification = rejectDialog.value.notification
  if (!notification?.entity_id) return
  const endpoint = getPendingEndpoint(notification, 'reject')
  if (!endpoint) return

  rejectDialog.value.loading = true
  try {
    if (notification.entity_type === 'school' || notification.type === 'school_pending') {
      await api.put(endpoint)
    } else {
      await api.delete(endpoint)
    }
    rejectDialog.value = { open: false, notification: null, loading: false }
    await loadNotifications()
  } finally {
    rejectDialog.value.loading = false
  }
}

onMounted(reloadDashboard)
</script>

<style scoped>
/* Dashboard Layout */
.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 19rem);
  gap: 1.15rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Dashboard Right Sidebar */
.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  background: #f8fafc;
  border-radius: 8px;
  text-decoration: none;
  color: #0f172a;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.action-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
  border-color: #3b82f6;
}

.action-item strong {
  display: block;
  font-size: 0.8rem;
}

.action-item small {
  font-size: 0.6rem;
  color: #64748b;
}

.action-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.metric-icon :deep(svg),
.action-icon :deep(svg),
.panel-title :deep(svg) {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.notification-tools {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
}

.notification {
  display: flex;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.notification-button {
  width: 100%;
  align-items: flex-start;
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  cursor: pointer;
  text-align: left;
}

.notification-button:hover {
  background: #f8fafc;
}

.notification.empty {
  color: #64748b;
}

.notification:last-child {
  border-bottom: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 0.3rem;
  flex-shrink: 0;
}

.dot.blue { background: #3b82f6; }
.dot.amber { background: #f59e0b; }
.dot.green { background: #22c55e; }
.dot.violet { background: #8b5cf6; }
.dot.rose { background: #f43f5e; }

.notification-content strong {
  display: block;
  font-size: 0.75rem;
}

.notification-content small {
  display: block;
  font-size: 0.6rem;
  color: #94a3b8;
}

.notification-content span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.68rem;
  line-height: 1.3;
  color: #475569;
}

.notification-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.45rem;
}

.notification-actions button {
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.3rem 0.55rem;
}

.approve-action { background: #16a34a; }
.reject-action { background: #dc2626; }

.notification-remove {
  margin-left: auto;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #94a3b8;
  font-weight: 900;
}

.notification-remove:hover {
  color: #991b1b;
  background: #fee2e2;
}

.view-all {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.7rem;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

.view-all.danger {
  color: #dc2626;
}

.view-all:disabled {
  color: #94a3b8;
  cursor: not-allowed;
  text-decoration: none;
}

.academic-card {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-radius: 8px;
  padding: 0.8rem;
  color: white;
  text-align: center;
}

.academic-card span {
  display: block;
  font-size: 0.65rem;
  opacity: 0.9;
}

.academic-card strong {
  display: block;
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.dashboard-container {
  min-width: 0;
}

.dashboard-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.dashboard-title-row h1 {
  font-size: 1.28rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.dashboard-title-row p {
  color: #64748b;
  font-size: 0.72rem;
}

.school-context {
  display: block;
  margin-top: 0.25rem;
  color: #93c5fd;
  font-size: 0.72rem;
  font-weight: 800;
}

.dashboard-error {
  margin-bottom: 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.82rem;
  font-weight: 800;
}

.week-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.refresh-dashboard {
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
}

.refresh-dashboard:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
  margin-bottom: 1.15rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: white;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.06);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.metric-card:hover,
.metric-card:focus-visible {
  border-color: #93c5fd;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.14);
  outline: none;
  transform: translateY(-2px);
}

.metric-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.metric-copy span {
  font-size: 0.58rem;
  text-transform: uppercase;
  color: #64748b;
}

.metric-copy strong {
  display: block;
  font-size: 1.08rem;
}

.blue { background: #dbeafe; color: #1d4ed8; }
.green { background: #dcfce7; color: #047857; }
.violet { background: #ede9fe; color: #6d28d9; }
.amber { background: #fef3c7; color: #b45309; }
.rose { background: #ffe4e6; color: #be123c; }

.panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.06);
  padding: 0.85rem;
  margin-bottom: 1.1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.panel-header h2 {
  font-size: 0.88rem;
  font-weight: 600;
}

.class-select, .primary-link {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.primary-link {
  background: #3b82f6;
  color: white;
  text-decoration: none;
  margin-left: 0.5rem;
}

.timetable-wrap {
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.64rem;
}

.overview-table th, .overview-table td {
  border: 1px solid #e2e8f0;
  padding: 0.4rem;
  text-align: left;
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
  padding: 0.2rem;
  border-radius: 4px;
  border-left: 3px solid #3b82f6;
}

.class-block strong {
  display: block;
  font-size: 0.7rem;
}

.class-block small,
.class-block span {
  display: block;
  font-size: 0.6rem;
  color: #64748b;
}

.room-badge {
  display: inline-block;
  width: fit-content;
  margin-top: 0.2rem;
  padding: 0.08rem 0.35rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
}

.activity-cell {
  background: #ecfdf5;
  border-left-color: #22c55e;
}

.empty-block {
  text-align: center;
  color: #cbd5e1;
}

.break-row td {
  height: 2.1rem;
  text-align: center;
  font-weight: 700;
}

.break-label {
  font-size: 0.64rem;
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

.three-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.three-cards .panel {
  min-height: 170px;
  margin-bottom: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
}

.panel-title h3 {
  font-size: 0.9rem;
  margin: 0;
}

.distribution-content {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.donut {
  width: 82px;
  height: 82px;
  flex: 0 0 82px;
  border-radius: 50%;
  display: grid;
  place-content: center;
  text-align: center;
  position: relative;
}

.donut::after {
  content: "";
  position: absolute;
  inset: 17px;
  background: #ffffff;
  border-radius: 50%;
}

.donut strong,
.donut span {
  position: relative;
  z-index: 1;
}

.donut strong {
  font-size: 1.05rem;
  line-height: 1;
}

.donut span {
  font-size: 0.58rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
}

.legend div {
  display: grid;
  grid-template-columns: 0.6rem 1fr auto;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  margin-bottom: 0.35rem;
}

.legend span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend em {
  color: #475569;
  font-style: normal;
  font-weight: 700;
}

.room-utilization-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.room-utilization-head strong {
  font-size: 1.55rem;
  line-height: 1;
  color: #1d4ed8;
}

.room-utilization-head span {
  color: #475569;
  font-size: 0.75rem;
  text-align: right;
}

.utilization-bar {
  height: 10px;
  background: #e2e8f0;
  border-radius: 999px;
  margin: 0.5rem 0 0.9rem;
  overflow: hidden;
}

.utilization-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  border-radius: inherit;
}

.room-stats {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.room-stats div {
  flex: 1;
  padding: 0.65rem;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
}

.room-stats strong {
  display: block;
  color: #0f172a;
  font-size: 1.05rem;
}

.workload-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 112px;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.workload-bars div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}

.workload-bars strong {
  font-size: 0.8rem;
  color: #0f172a;
}

.workload-bars span {
  width: 100%;
  max-width: 32px;
  min-height: 4px;
  background: linear-gradient(180deg, #60a5fa, #2563eb);
  border-radius: 5px 5px 0 0;
}

.workload-bars small {
  color: #475569;
  font-size: 0.64rem;
  white-space: nowrap;
}

.workload-note {
  margin: 0.65rem 0 0;
  color: #64748b;
  font-size: 0.72rem;
}

@media (max-width: 900px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .dashboard-sidebar {
    order: -1;
  }

  .metric-grid { grid-template-columns: repeat(2, 1fr); }
  .three-cards { grid-template-columns: 1fr; }
}
</style>
