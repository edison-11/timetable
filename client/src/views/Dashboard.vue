<template>
  <AppLayout>
    <div class="dashboard-layout">
      <div class="dashboard-container">
    
      <!-- Title -->
      <div class="dashboard-title-row">
        <div>
          <h1>Timetable Dashboard</h1>
          <p>Overview of timetable statistics and management</p>
        </div>
        <div class="week-picker">
          <span class="calendar-mark"></span>
          <span>{{ weekRange }}</span>
          <span class="chevron">▼</span>
        </div>
      </div>

      <!-- 4 Metric Cards -->
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-icon blue">📅</div>
          <div class="metric-copy">
            <span>Total Timetables</span>
            <strong>12</strong>
            <small>All departments</small>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon green">📚</div>
          <div class="metric-copy">
            <span>Total Subjects</span>
            <strong>48</strong>
            <small>Across all classes</small>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon violet">👨‍🏫</div>
          <div class="metric-copy">
            <span>Total Teachers</span>
            <strong>32</strong>
            <small>Active teachers</small>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon amber">🏢</div>
          <div class="metric-copy">
            <span>Total Rooms</span>
            <strong>18</strong>
            <small>Available rooms</small>
          </div>
        </div>
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
                <th>Period</th>
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
                  <div v-else class="empty-block">—</div>
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
          <div class="panel-title">📊<h3>Timetable Distribution</h3></div>
          <div class="distribution-content">
            <div class="donut"></div>
            <div class="legend">
              <div><span style="background:#3b82f6"></span>Science <em>45% (5)</em></div>
              <div><span style="background:#22c55e"></span>Engineering <em>30% (3)</em></div>
              <div><span style="background:#f97316"></span>Commerce <em>15% (2)</em></div>
              <div><span style="background:#8b5cf6"></span>Arts <em>10% (2)</em></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">🏢<h3>Room Utilization</h3></div>
          <div class="utilization-bar"><span style="width:72%"></span></div>
          <div class="utilization-value">72%</div>
          <p>Average Utilization</p>
          <div class="room-stats"><div><strong>13</strong> Used</div><div><strong>5</strong> Available</div></div>
        </div>
        <div class="panel">
          <div class="panel-title">👩‍🏫<h3>Teacher Workload</h3></div>
          <div class="workload-bars">
            <div><span style="height:45%"></span><small>0-10</small></div>
            <div><span style="height:72%"></span><small>10-20</small></div>
            <div><span style="height:88%"></span><small>20-30</small></div>
            <div><span style="height:64%"></span><small>30-40</small></div>
            <div><span style="height:28%"></span><small>40+</small></div>
          </div>
        </div>
      </div>
      </div>

      <!-- Right Sidebar - Quick Actions & Notifications -->
      <div class="dashboard-sidebar">
        <!-- Quick Actions -->
        <div class="panel">
          <div class="panel-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div class="actions-list">
            <router-link to="/timetable" class="action-item">
              <span class="action-icon blue">➕</span>
              <div>
                <strong>Create Timetable</strong>
                <small>Generate new timetable</small>
              </div>
            </router-link>
            <router-link to="/classes" class="action-item">
              <span class="action-icon green">📚</span>
              <div>
                <strong>Add Class</strong>
                <small>Create new class</small>
              </div>
            </router-link>
            <router-link to="/modules" class="action-item">
              <span class="action-icon violet">📖</span>
              <div>
                <strong>Add Subject</strong>
                <small>Create new subject</small>
              </div>
            </router-link>
            <router-link to="/teachers" class="action-item">
              <span class="action-icon amber">👨‍🏫</span>
              <div>
                <strong>Add Teacher</strong>
                <small>Register new teacher</small>
              </div>
            </router-link>
            <router-link to="/rooms" class="action-item">
              <span class="action-icon rose">🏠</span>
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
            <h3>🔔 Notifications</h3>
            <button class="view-all" type="button" @click="loadNotifications">Refresh</button>
          </div>
          <div class="notifications-list">
            <div v-if="!notifications.length" class="notification empty">
              <div class="notification-content">
                <strong>No notifications yet</strong>
                <small>System updates will appear here.</small>
              </div>
            </div>
            <button
              v-for="notification in notifications"
              :key="notification.id"
              class="notification notification-button"
              type="button"
              @click="openNotification(notification)"
            >
              <span class="dot" :class="notification.tone"></span>
              <div class="notification-content">
                <strong>{{ notification.title }}</strong>
                <small>{{ notification.time }}</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Academic Year -->
        <div class="academic-card">
          <span>Academic Year</span>
          <strong>2023 - 2024</strong>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'

const weekRange = ref('May 8 - May 14, 2024')
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const selectedTimetableClassId = ref('')
const timetableEntries = ref([])
const notifications = ref([])
const breakPeriodRules = {
  enabled: true,
  periods_before_morning_break: 3,
  periods_before_lunch: 2,
  periods_before_afternoon_break: 3,
  periods_after_afternoon_break: 2
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
    if (!entry.module_name || entry.module_name === 'continue') return
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

  return [...timeSlots.values()]
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((row, index) => ({ ...row, period: index + 1 }))
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

const buildTimetableGridWithBreaks = (entries) => {
  const allRows = buildTimetableGridRows(entries)

  if (!breakPeriodRules.enabled) {
    let period = 0
    return [...allRows, ...buildBreakRows(entries)]
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((row) => {
        if (row.type === 'break') return row
        period += 1
        return { ...row, period }
      })
  }

  const morningAfter = Number(breakPeriodRules.periods_before_morning_break) || 3
  const lunchAfter = morningAfter + (Number(breakPeriodRules.periods_before_lunch) || 2)
  const eveningAfter = lunchAfter + (Number(breakPeriodRules.periods_before_afternoon_break) || 3)
  const totalRulePeriods = eveningAfter + (Number(breakPeriodRules.periods_after_afternoon_break) || 0)
  const rows = allRows.slice(0, totalRulePeriods)
  const breakPoints = [
    { after: morningAfter, breakType: 'morning-break', label: 'MORNING BREAK' },
    { after: lunchAfter, breakType: 'lunch-break', label: 'LUNCH BREAK' },
    { after: eveningAfter, breakType: 'evening-break', label: 'EVENING BREAK' }
  ]
  const resultRows = []

  rows.forEach((row, index) => {
    resultRows.push(row)
    breakPoints.forEach((breakPoint) => {
      const nextRow = rows[index + 1]
      if (index + 1 === breakPoint.after && nextRow) {
        resultRows.push({
          key: `${breakPoint.breakType}-${row.end_time}-${nextRow.start_time}`,
          type: 'break',
          breakType: breakPoint.breakType,
          label: breakPoint.label,
          start_time: row.end_time,
          end_time: nextRow.start_time,
          entriesByDay: {}
        })
      }
    })
  })

  return resultRows
}

const loadTimetable = async () => {
  try {
    const response = await api.get('/timetable')
    timetableEntries.value = response.data.timetables || []
    selectedTimetableClassId.value = classOptions.value[0]?.class_id || ''
  } catch (error) {
    timetableEntries.value = []
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

const openNotification = (notification) => {
  if (notification.path) {
    window.location.href = notification.path
  }
}

onMounted(() => {
  loadTimetable()
  loadNotifications()
})
</script>

<style scoped>
/* Dashboard Layout */
.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 20rem);
  gap: 1.5rem;
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
  font-size: 1.1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.notification {
  display: flex;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.notification-button {
  width: 100%;
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
  font-size: 0.6rem;
  color: #94a3b8;
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

.academic-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
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
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-title-row h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.dashboard-title-row p {
  color: #64748b;
  font-size: 0.8rem;
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.metric-icon {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.2rem;
}

.metric-copy span {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #64748b;
}

.metric-copy strong {
  display: block;
  font-size: 1.3rem;
}

.blue { background: #dbeafe; }
.green { background: #dcfce7; }
.violet { background: #e9d5ff; }
.amber { background: #fed7aa; }

.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.panel-header h2 {
  font-size: 1rem;
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
  font-size: 0.7rem;
}

.overview-table th, .overview-table td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
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

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.panel-title h3 {
  font-size: 0.9rem;
  margin: 0;
}

.distribution-content {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.donut {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: conic-gradient(#3b82f6 0% 45%, #22c55e 45% 75%, #f97316 75% 90%, #8b5cf6 90% 100%);
}

.legend div {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.65rem;
  margin-bottom: 0.2rem;
}

.legend span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.utilization-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  margin: 0.5rem 0;
}

.utilization-bar span {
  display: block;
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
}

.utilization-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.room-stats {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.workload-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 80px;
}

.workload-bars div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
}

.workload-bars span {
  width: 25px;
  background: #3b82f6;
  border-radius: 3px 3px 0 0;
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
