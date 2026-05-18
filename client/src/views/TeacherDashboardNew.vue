<template>
  <TeacherLayout>
    <div class="dashboard-container">
      <!-- Quick Stats Cards -->
      <section class="stats-section">
        <div class="stat-card today">
          <div class="stat-header">
            <i class="bi bi-calendar-check"></i>
            <span class="stat-badge">Today</span>
          </div>
          <div class="stat-content">
            <p class="stat-label">Today's Classes</p>
            <p class="stat-value">{{ todayClasses }}</p>
            <small class="stat-time">{{ formatToday }}</small>
          </div>
        </div>

        <div class="stat-card weekly">
          <div class="stat-header">
            <i class="bi bi-book"></i>
            <span class="stat-badge">Weekly</span>
          </div>
          <div class="stat-content">
            <p class="stat-label">Lessons This Week</p>
            <p class="stat-value">{{ weeklyLessons }}</p>
            <small class="stat-time">Mon - Fri</small>
          </div>
        </div>

        <div class="stat-card free">
          <div class="stat-header">
            <i class="bi bi-hourglass-split"></i>
            <span class="stat-badge">Free</span>
          </div>
          <div class="stat-content">
            <p class="stat-label">Free Periods</p>
            <p class="stat-value">{{ freePeriods }}</p>
            <small class="stat-time">This week</small>
          </div>
        </div>

        <div class="stat-card pending">
          <div class="stat-header">
            <i class="bi bi-clock"></i>
            <span class="stat-badge">Pending</span>
          </div>
          <div class="stat-content">
            <p class="stat-label">Pending Requests</p>
            <p class="stat-value">{{ pendingRequests }}</p>
            <small class="stat-time">Awaiting approval</small>
          </div>
        </div>
      </section>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Today's Schedule -->
        <section class="dashboard-card large">
          <div class="card-header">
            <h2>Today's Schedule</h2>
            <span class="date-label">{{ formattedDate }}</span>
          </div>

          <div class="today-schedule">
            <div v-if="todaySchedule.length === 0" class="empty-schedule">
              <i class="bi bi-calendar-check"></i>
              <p>No classes scheduled today</p>
              <small>Enjoy your free day!</small>
            </div>

            <div v-for="lesson in todaySchedule" :key="lesson.id" class="schedule-item" :class="lesson.type">
              <div class="schedule-time">
                <span class="time">{{ formatTime(lesson.start_time) }}</span>
                <span class="duration">{{ formatDuration(lesson.start_time, lesson.end_time) }}</span>
              </div>
              <div class="schedule-details">
                <strong class="subject">{{ lesson.subject }}</strong>
                <p class="class-info">
                  <i class="bi bi-people"></i> {{ lesson.class_name || 'General' }}
                </p>
                <p class="room-info">
                  <i class="bi bi-door-closed"></i> Room {{ lesson.room || 'TBD' }}
                </p>
              </div>
              <div class="schedule-actions">
                <button class="action-btn" title="View details">
                  <i class="bi bi-info-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Upcoming Classes -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2>Upcoming</h2>
            <a href="#" class="view-all">View All</a>
          </div>

          <div class="upcoming-list">
            <div v-for="item in upcomingClasses" :key="item.id" class="upcoming-item">
              <div class="day-badge" :class="item.dayClass">{{ item.day }}</div>
              <div class="upcoming-content">
                <p class="subject">{{ item.subject }}</p>
                <small>{{ item.time }} • {{ item.room }}</small>
              </div>
              <span class="next-label">NEXT</span>
            </div>

            <div v-if="upcomingClasses.length === 0" class="empty-list">
              <i class="bi bi-check-circle"></i>
              <p>All caught up!</p>
            </div>
          </div>
        </section>

        <!-- Pending Requests -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2>Requests</h2>
            <a href="/teacher/requests" class="view-all">Manage</a>
          </div>

          <div class="requests-list">
            <div
              v-for="req in pendingRequestsList"
              :key="req.id"
              class="request-item"
              :class="{ [req.status]: true }"
            >
              <div class="request-icon" :class="req.type">
                <i :class="getRequestIcon(req.type)"></i>
              </div>
              <div class="request-info">
                <p class="request-type">{{ req.type }}</p>
                <small>{{ req.date }}</small>
              </div>
              <span class="request-status">{{ req.status }}</span>
            </div>

            <div v-if="pendingRequestsList.length === 0" class="empty-list">
              <i class="bi bi-check2"></i>
              <p>No pending requests</p>
            </div>
          </div>
        </section>

        <!-- Notifications -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2>Notifications</h2>
            <a href="#" class="view-all">All</a>
          </div>

          <div class="notifications-widget">
            <div v-for="notif in recentNotifications" :key="notif.id" class="notif-badge" :class="notif.type">
              <div class="notif-icon">
                <i :class="getNotifIcon(notif.type)"></i>
              </div>
              <div class="notif-text">
                <strong>{{ notif.title }}</strong>
                <p>{{ notif.message }}</p>
              </div>
            </div>

            <div v-if="recentNotifications.length === 0" class="empty-list">
              <i class="bi bi-inbox"></i>
              <p>No notifications</p>
            </div>
          </div>
        </section>

        <!-- Announcements -->
        <section class="dashboard-card large">
          <div class="card-header">
            <h2>Announcements</h2>
            <a href="/teacher/announcements" class="view-all">View All</a>
          </div>

          <div class="announcements-list">
            <div v-for="announcement in announcements" :key="announcement.id" class="announcement-item">
              <div class="announcement-header">
                <strong class="announcement-title">{{ announcement.title }}</strong>
                <span class="announcement-date">{{ formatDate(announcement.date) }}</span>
              </div>
              <p class="announcement-text">{{ announcement.text }}</p>
              <button class="read-btn" v-if="!announcement.read">Mark as read</button>
            </div>

            <div v-if="announcements.length === 0" class="empty-list">
              <i class="bi bi-megaphone"></i>
              <p>No announcements</p>
            </div>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="dashboard-card">
          <div class="card-header">
            <h2>Quick Actions</h2>
          </div>

          <div class="quick-actions">
            <router-link to="/teacher/timetable" class="action-link">
              <i class="bi bi-calendar3"></i>
              <span>View Full Timetable</span>
            </router-link>

            <button class="action-link" @click="openRequestForm = true">
              <i class="bi bi-chat-dots"></i>
              <span>Request Change</span>
            </button>

            <router-link to="/teacher/profile" class="action-link">
              <i class="bi bi-person-circle"></i>
              <span>Edit Profile</span>
            </router-link>

            <button class="action-link" @click="downloadTimetable">
              <i class="bi bi-download"></i>
              <span>Download Timetable</span>
            </button>
          </div>
        </section>
      </div>

      <!-- Request Form Modal -->
      <div v-if="openRequestForm" class="modal-overlay" @click.self="openRequestForm = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>New Change Request</h3>
            <button class="modal-close" @click="openRequestForm = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form @submit.prevent="submitRequest" class="request-form">
            <div class="form-group">
              <label>Request Type</label>
              <select v-model="requestForm.type">
                <option value="">Select type</option>
                <option value="swap">Lesson Swap</option>
                <option value="change">Schedule Change</option>
                <option value="adjustment">Time Adjustment</option>
              </select>
            </div>

            <div class="form-group">
              <label>Current Lesson</label>
              <input type="text" v-model="requestForm.currentLesson" placeholder="E.g., Mathematics - 10-A" />
            </div>

            <div class="form-group">
              <label>Requested Change</label>
              <textarea v-model="requestForm.requestedChange" placeholder="Describe what you want to change"></textarea>
            </div>

            <div class="form-group">
              <label>Reason</label>
              <textarea v-model="requestForm.reason" placeholder="Why do you need this change?"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">Submit Request</button>
              <button type="button" class="btn-secondary" @click="openRequestForm = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const openRequestForm = ref(false)
const requestForm = ref({
  type: '',
  currentLesson: '',
  requestedChange: '',
  reason: ''
})

const todayClasses = ref(4)
const weeklyLessons = ref(20)
const freePeriods = ref(5)
const pendingRequests = ref(1)

const todaySchedule = ref([
  {
    id: 1,
    type: 'lesson',
    subject: 'Mathematics',
    class_name: 'Class 10-A',
    room: '101',
    start_time: '08:00',
    end_time: '09:00'
  },
  {
    id: 2,
    type: 'lesson',
    subject: 'Physics',
    class_name: 'Class 11-B',
    room: '205',
    start_time: '09:15',
    end_time: '10:15'
  },
  {
    id: 3,
    type: 'break',
    subject: 'Break',
    room: '-',
    start_time: '10:15',
    end_time: '10:30'
  },
  {
    id: 4,
    type: 'lesson',
    subject: 'Chemistry',
    class_name: 'Class 12-C',
    room: '310',
    start_time: '10:30',
    end_time: '11:30'
  }
])

const upcomingClasses = ref([
  { id: 1, subject: 'Mathematics', time: '08:00 AM', room: 'Room 101', day: 'Today', dayClass: 'today' },
  { id: 2, subject: 'Physics', time: '10:00 AM', room: 'Room 205', day: 'Tomorrow', dayClass: 'tomorrow' },
  { id: 3, subject: 'Chemistry', time: '02:00 PM', room: 'Room 310', day: 'Wednesday', dayClass: 'wednesday' }
])

const pendingRequestsList = ref([
  { id: 1, type: 'Lesson Swap', date: '2 days ago', status: 'pending' },
  { id: 2, type: 'Room Change', date: '5 days ago', status: 'approved' }
])

const recentNotifications = ref([
  {
    id: 1,
    type: 'update',
    title: 'Timetable Updated',
    message: 'Your schedule for next week has been updated'
  },
  {
    id: 2,
    type: 'alert',
    title: 'Room Change',
    message: 'Class 10-A moved to Room 105'
  }
])

const announcements = ref([
  {
    id: 1,
    title: 'School Assembly Tomorrow',
    text: 'All staff to attend the annual school assembly tomorrow at 9:00 AM in the main hall.',
    date: new Date(),
    read: false
  },
  {
    id: 2,
    title: 'Professional Development Workshop',
    text: 'Mandatory workshop on new teaching methodologies next Friday. Details will be sent separately.',
    date: new Date(Date.now() - 86400000),
    read: true
  }
])

const formattedDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('en-US', options)
})

const formatToday = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const formatDuration = (start, end) => {
  if (!start || !end) return '1h'
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const minutes = endH * 60 + endM - (startH * 60 + startM)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

const formatDate = (date) => {
  const options = { month: 'short', day: 'numeric' }
  return new Date(date).toLocaleDateString('en-US', options)
}

const getRequestIcon = (type) => {
  const icons = {
    'Lesson Swap': 'bi bi-arrow-left-right',
    'Room Change': 'bi bi-door-closed',
    'Time Change': 'bi bi-clock-history'
  }
  return icons[type] || 'bi bi-chat-dots'
}

const getNotifIcon = (type) => {
  const icons = {
    update: 'bi bi-arrow-repeat',
    alert: 'bi bi-exclamation-circle',
    success: 'bi bi-check-circle',
    info: 'bi bi-info-circle'
  }
  return icons[type] || 'bi bi-bell'
}

const downloadTimetable = () => {
  alert('Timetable download feature coming soon!')
}

const submitRequest = () => {
  if (!requestForm.value.type || !requestForm.value.currentLesson) {
    alert('Please fill in all required fields')
    return
  }
  console.log('Request submitted:', requestForm.value)
  openRequestForm.value = false
  requestForm.value = { type: '', currentLesson: '', requestedChange: '', reason: '' }
  alert('Request submitted successfully!')
}

onMounted(() => {
  // Initialize with sample data
})
</script>

<style scoped>
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1e40af;
  --color-primary-light: #dbeafe;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #06b6d4;
  --bg-primary: #f9fafb;
  --bg-secondary: #ffffff;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
}

.stat-card.today::before {
  background: var(--color-info);
}

.stat-card.weekly::before {
  background: var(--color-primary);
}

.stat-card.free::before {
  background: var(--color-success);
}

.stat-card.pending::before {
  background: var(--color-warning);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-header i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.stat-badge {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-label {
  margin: 0 0 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.stat-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-time {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  grid-auto-flow: dense;
}

.dashboard-card {
  background: var(--bg-secondary);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  transition: all 0.3s;
}

.dashboard-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.dashboard-card.large {
  grid-column: span 2;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.date-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.view-all {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.view-all:hover {
  color: var(--color-primary-dark);
}

/* Today's Schedule */
.today-schedule {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-schedule {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-schedule i {
  font-size: 2rem;
  color: var(--border-color);
  display: block;
  margin-bottom: 0.5rem;
}

.schedule-item {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.75rem;
  border-left: 4px solid var(--color-primary);
  transition: all 0.2s;
}

.schedule-item:hover {
  background: linear-gradient(to right, rgba(37, 99, 235, 0.05), var(--bg-primary));
}

.schedule-item.break {
  border-left-color: var(--color-warning);
  background: linear-gradient(to right, rgba(245, 158, 11, 0.05), var(--bg-primary));
}

.schedule-time {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 80px;
  font-weight: 600;
}

.schedule-time .time {
  color: var(--color-primary);
  font-size: 1rem;
}

.schedule-time .duration {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.schedule-details {
  flex: 1;
}

.schedule-details .subject {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.schedule-details p {
  margin: 0.25rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-primary-light);
}

/* Upcoming List */
.upcoming-list,
.requests-list,
.notifications-widget,
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upcoming-item,
.request-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.upcoming-item:hover,
.request-item:hover {
  background: linear-gradient(to right, rgba(37, 99, 235, 0.05), var(--bg-primary));
}

.day-badge {
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 65px;
  text-align: center;
}

.day-badge.tomorrow {
  background: var(--color-info);
}

.day-badge.wednesday {
  background: var(--color-success);
}

.upcoming-content {
  flex: 1;
}

.upcoming-content .subject {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary);
}

.upcoming-content small {
  color: var(--text-secondary);
}

.next-label {
  background: var(--color-success);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.request-item {
  position: relative;
}

.request-item.pending {
  border-left: 4px solid var(--color-warning);
}

.request-item.approved {
  border-left: 4px solid var(--color-success);
}

.request-item.rejected {
  border-left: 4px solid var(--color-danger);
}

.request-icon {
  width: 45px;
  height: 45px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
}

.request-icon.swap {
  background: var(--color-primary);
}

.request-icon.change {
  background: var(--color-info);
}

.request-info {
  flex: 1;
}

.request-info .request-type {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary);
}

.request-info small {
  color: var(--text-secondary);
}

.request-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.request-item.pending .request-status {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.request-item.approved .request-status {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.request-item.rejected .request-status {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

/* Notifications Widget */
.notif-badge {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.75rem;
  border-left: 4px solid var(--color-primary);
  transition: all 0.2s;
}

.notif-badge:hover {
  background: linear-gradient(to right, rgba(37, 99, 235, 0.05), var(--bg-primary));
}

.notif-badge.alert {
  border-left-color: var(--color-warning);
}

.notif-badge.success {
  border-left-color: var(--color-success);
}

.notif-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notif-badge.update .notif-icon {
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary);
}

.notif-badge.alert .notif-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.notif-text strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.notif-text p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Announcements */
.announcement-item {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.75rem;
  border-left: 4px solid var(--color-info);
  transition: all 0.2s;
}

.announcement-item:hover {
  background: linear-gradient(to right, rgba(6, 182, 212, 0.05), var(--bg-primary));
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.announcement-title {
  color: var(--text-primary);
  font-size: 1rem;
}

.announcement-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
  white-space: nowrap;
}

.announcement-text {
  margin: 0.5rem 0 1rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.read-btn {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.read-btn:hover {
  background: var(--color-primary);
  color: white;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: var(--bg-primary);
  border: none;
  border-radius: 0.75rem;
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.9rem;
}

.action-link:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
}

.action-link i {
  font-size: 1.5rem;
}

.empty-list {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-list i {
  font-size: 2rem;
  color: var(--border-color);
  display: block;
  margin-bottom: 0.5rem;
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
  z-index: 2000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.request-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .dashboard-card.large {
    grid-column: span 1;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-card.large {
    grid-column: span 1;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-content {
    width: 95%;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    gap: 1rem;
  }

  .stats-section {
    gap: 1rem;
  }

  .dashboard-grid {
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .dashboard-card {
    padding: 1rem;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .action-link {
    padding: 1rem;
    font-size: 0.8rem;
  }

  .action-link i {
    font-size: 1.25rem;
  }
}
</style>
