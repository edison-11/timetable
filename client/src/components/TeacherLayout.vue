<template>
  <div class="teacher-shell" :class="{ 'dark-mode': isDarkMode }">
    <div class="teacher-sidebar-backdrop" :class="{ visible: sidebarOpen }" @click="closeMobileSidebar"></div>

    <aside class="teacher-sidebar" :class="{ 'mobile-open': sidebarOpen }">
      <div class="sidebar-brand">
        <div class="brand-mark">
          <img class="brand-logo" :src="logoUrl" alt="Timetable logo">
        </div>
        <div class="brand-text">
          <strong>Timetable</strong>
          <span>Teacher Panel</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Teacher navigation">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
          :data-label="item.label"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :title="item.label"
          @click="closeMobileSidebar"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-watch-wrapper">
        <TeacherPeriodTimer class="sidebar-timer-widget" />
      </div>

    </aside>

    <div class="teacher-main">
      <header class="teacher-navbar">
        <div class="navbar-left">
          <button
            class="menu-toggle"
            type="button"
            :class="{ active: sidebarOpen }"
            :aria-expanded="sidebarOpen"
            aria-label="Toggle teacher navigation"
            @click="toggleSidebar"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
          <div>
            <h1 class="page-title">{{ pageTitle }}</h1>
            <p class="page-subtitle">{{ pageSubtitle }}</p>
          </div>
        </div>

        <div class="navbar-right">
          <div class="search-container">
            <input v-model="searchQuery" type="search" placeholder="Search teacher tools..." @keyup.enter="runSearch">
            <span class="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/></svg>
            </span>
          </div>

          <div class="notifications-container" ref="notificationsMenu">
            <button
              class="icon-button"
              type="button"
              title="Notifications"
              :aria-expanded="showNotifications"
              @click="toggleNotifications"
            >
              <span class="bell-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m4 0a3 3 0 1 1-6 0h6Z"/>
                </svg>
              </span>
              <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
            </button>

            <div v-if="showNotifications" class="notifications-dropdown">
              <div class="dropdown-header">
                <strong>Notifications</strong>
                <button type="button" @click="markAllRead">Mark read</button>
              </div>
              <div v-if="!notifications.length" class="empty-state">No notifications yet.</div>
              <button
                v-for="notif in notifications.slice(0, 5)"
                :key="notif.id"
                type="button"
                class="notification-item"
                :class="{ unread: !notif.read }"
                @click="openNotification(notif)"
              >
                <strong>{{ notif.title }}</strong>
                <span>{{ notif.message }}</span>
                <small>{{ formatTime(notif.created_at) }}</small>
              </button>
            </div>
          </div>

          <button class="theme-toggle" type="button" :title="isDarkMode ? 'Light mode' : 'Dark mode'" @click="toggleTheme">
            <span class="theme-icon" :class="{ sun: isDarkMode }"></span>
          </button>

          <div class="profile-container" ref="profileMenu">
            <button class="profile-btn" type="button" :aria-expanded="showProfileDropdown" @click="showProfileDropdown = !showProfileDropdown">
              <img v-if="profileImageUrl" :src="profileImageUrl" :alt="teacherName">
              <span v-else>{{ getInitials }}</span>
            </button>

            <div v-if="showProfileDropdown" class="profile-dropdown">
              <div class="profile-dropdown-header">
                <strong>{{ teacherName }}</strong>
                <span>{{ teacherEmail }}</span>
              </div>
              <router-link to="/teacher/profile" class="dropdown-item" @click="showProfileDropdown = false">My Profile</router-link>
              <router-link to="/teacher/timetable" class="dropdown-item" @click="showProfileDropdown = false">My Timetable</router-link>
              <router-link to="/teacher/requests" class="dropdown-item" @click="showProfileDropdown = false">Requests</router-link>
              <router-link to="/teacher/announcements" class="dropdown-item" @click="showProfileDropdown = false">Announcements</router-link>
              <button type="button" class="dropdown-item danger" @click="logout">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div class="teacher-breadcrumbs" aria-label="Breadcrumb">
        <router-link to="/teacher/dashboard">Dashboard</router-link>
        <span v-for="item in breadcrumbs" :key="item.label">
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
          <router-link v-if="item.to" :to="item.to">{{ item.label }}</router-link>
          <span v-else>{{ item.label }}</span>
        </span>
      </div>

      <main class="teacher-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'
import TeacherPeriodTimer from '@/components/TeacherPeriodTimer.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`

const sidebarOpen = ref(false)
const isDarkMode = ref(false)
const searchQuery = ref('')
const showNotifications = ref(false)
const showProfileDropdown = ref(false)
const notificationsMenu = ref(null)
const profileMenu = ref(null)
const notifications = ref([])

const teacher = computed(() => {
  if (authStore.currentUserType === 'teacher' && authStore.currentUser) return authStore.currentUser

  const storedTeacher = localStorage.getItem('teacher')
  if (!storedTeacher) return null

  try {
    return JSON.parse(storedTeacher)
  } catch (error) {
    return null
  }
})

const teacherName = computed(() => teacher.value?.name || 'Teacher')
const teacherEmail = computed(() => teacher.value?.email || 'No email set')
const profileImageUrl = computed(() => resolveAssetUrl(teacher.value?.profile_photo))
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const getInitials = computed(() => {
  const parts = teacherName.value.trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts.map(part => part[0]).join('').toUpperCase().slice(0, 2) : 'T'
})

const pageTitle = computed(() => {
  const routeTitle = {
    TeacherDashboard: 'Dashboard',
    TeacherTimetable: 'My Timetable',
    TeacherAttendance: 'Student Attendance',
    TeacherProfile: 'My Profile',
    TeacherSettings: 'Settings'
  }
  return routeTitle[route.name] || 'Teacher Portal'
})

const pageSubtitle = computed(() => {
  const subtitles = {
    TeacherDashboard: 'Your teaching day, classes, and quick actions.',
    TeacherTimetable: 'Review your weekly lessons and export your schedule.',
    TeacherAttendance: 'View class lists and mark attendance by study period.',
    TeacherProfile: 'Manage your teacher information.',
    TeacherSettings: 'Update preferences, availability, and security.'
  }
  return subtitles[route.name] || 'Teacher workspace'
})

const breadcrumbs = computed(() => {
  const breadcrumbMap = {
    TeacherDashboard: [],
    TeacherTimetable: [{ label: 'My Timetable', to: '/teacher/timetable' }],
    TeacherAttendance: [{ label: 'Student Attendance', to: '/teacher/attendance' }],
    TeacherProfile: [{ label: 'My Profile', to: '/teacher/profile' }],
    TeacherSettings: [{ label: 'Settings', to: '/teacher/settings' }]
  }

  return breadcrumbMap[route.name] || []
})

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.5V5.5c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5h-4C4.7 15 4 14.3 4 13.5Zm9-4V5.5c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5Zm0 8.5v-4c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5ZM4 20.5v-2c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v2c0 .8-.7 1.5-1.5 1.5h-4C4.7 22 4 21.3 4 20.5Z"/></svg>',
  timetable: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v4M16 3v4"/><path d="M4 9h16"/><path d="M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M7 12h3M7 16h3M14 12h3M14 16h3"/></svg>',
  attendance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l2 2 4-5"/><path d="M5 4h14v16H5z"/><path d="M8 17h8"/></svg>',
  classes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 0 4 22v-3Z"/><path d="M8 8h8"/><path d="M8 12h6"/></svg>',
  marks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h8M8 12h8M8 17h5"/><path d="M5 3h14v18H5z"/></svg>',
  announcements: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11v2a2 2 0 0 0 2 2h2l5 4V5L8 9H6a2 2 0 0 0-2 2Z"/><path d="M17 9a3 3 0 0 1 0 6"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08a2 2 0 1 1-3.84 0L10 20a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1l-.08-.08a2 2 0 1 1 0-3.84L4 10a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08a2 2 0 1 1 3.84 0L14 4a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.33.72.6 1l.08.08a2 2 0 1 1 0 3.84L20 14a1.7 1.7 0 0 0-.6 1Z"/></svg>'
}

const navItems = [
  { label: 'Dashboard', to: '/teacher/dashboard', icon: icons.dashboard },
  { label: 'My Timetable', to: '/teacher/timetable', icon: icons.timetable },
  { label: 'My Classes', to: '/teacher/dashboard#classes', icon: icons.classes },
  { label: 'Attendance', to: '/teacher/attendance', icon: icons.attendance },
  { label: 'Marks', to: '/teacher/requests', icon: icons.marks },
  { label: 'Announcements', to: '/teacher/announcements', icon: icons.announcements },
  { label: 'My Profile', to: '/teacher/profile', icon: icons.profile },
  { label: 'Settings', to: '/teacher/settings', icon: icons.settings }
]

const isActive = (path) => String(path).includes('#') ? route.fullPath === path : route.path === path

const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  if (path.startsWith('/uploads/')) return path
  const apiRoot = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`
}

const closeMobileSidebar = () => {
  sidebarOpen.value = false
  document.body.classList.remove('teacher-sidebar-open')
}

const toggleSidebar = () => {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (isMobile) {
    sidebarOpen.value = !sidebarOpen.value
    document.body.classList.toggle('teacher-sidebar-open', sidebarOpen.value)
    return
  }

  document.body.classList.toggle('teacher-sidebar-collapsed')
}

const runSearch = () => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return

  const destination = navItems.find(item => item.label.toLowerCase().includes(query))
  if (destination) router.push(destination.to)
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showProfileDropdown.value = false
}

const markAllRead = () => {
  notifications.value = notifications.value.map(notification => ({ ...notification, read: true }))
}

const openNotification = (notification) => {
  notification.read = true
  showNotifications.value = false
  if (notification.path) router.push(notification.path)
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (Number.isNaN(diff)) return ''
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}

const applyTheme = () => {
  document.body.classList.toggle('teacher-dark-mode', isDarkMode.value)
  localStorage.setItem('teacherDarkMode', JSON.stringify(isDarkMode.value))
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  applyTheme()
}

const loadNotifications = async () => {
  try {
    const response = await api.get('/notifications?limit=5')
    notifications.value = (response.data.notifications || []).map(notification => ({
      id: notification.notification_id || notification.id,
      title: notification.title,
      message: notification.message,
      created_at: notification.created_at,
      path: notification.path || '/teacher/dashboard',
      read: false
    }))
  } catch (error) {
    notifications.value = []
  }
}

const logout = () => {
  authStore.logout()
  localStorage.removeItem('token')
  localStorage.removeItem('userType')
  localStorage.removeItem('teacher')
  router.push('/login')
}

const closeMenusOnOutsideClick = (event) => {
  if (!notificationsMenu.value?.contains(event.target)) showNotifications.value = false
  if (!profileMenu.value?.contains(event.target)) showProfileDropdown.value = false
}

onMounted(async () => {
  const savedTheme = localStorage.getItem('teacherDarkMode')
  if (savedTheme) isDarkMode.value = JSON.parse(savedTheme)
  applyTheme()

  await authStore.checkAuth()
  await loadNotifications()

  document.addEventListener('click', closeMenusOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenusOnOutsideClick)
  document.body.classList.remove('teacher-sidebar-open')
  document.body.classList.remove('teacher-dark-mode')
})
</script>

<style scoped>
.teacher-shell {
  min-height: 100vh;
  background: #f5f9ff;
  color: #0f172a;
}

.teacher-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 248px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #dbe5f3;
  box-shadow: 16px 0 34px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 220;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.24s ease, transform 0.24s ease, box-shadow 0.24s ease;
}

.sidebar-watch-wrapper {
  padding: 0 0.75rem 1rem;
}

.sidebar-watch-wrapper :deep(.period-timer) {
  margin: 0;
  grid-template-columns: 1fr;
  padding: 0.9rem 0.9rem;
}

.sidebar-watch-wrapper :deep(.timer-count) {
  text-align: left;
}

.sidebar-watch-wrapper :deep(.alert-options) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.sidebar-watch-wrapper :deep(.vibration-toggle),
.sidebar-watch-wrapper :deep(.stop-alert-button) {
  width: 100%;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.35rem 0.95rem 1.15rem;
  border-bottom: 1px solid #e3ebf7;
  margin-bottom: 0.9rem;
  min-height: 126px;
}

.brand-mark {
  flex: 0 0 110px;
  width: 110px;
  height: 110px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef6ff;
  border: 1px solid #cfe2ff;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 0;
  transform: scale(1.25);
}

.brand-text strong {
  display: block;
  font-size: 0.95rem;
  color: #172033;
  font-weight: 800;
  line-height: 1.15;
}

.brand-text span {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.66rem;
  color: #64748b;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 0 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 40px;
  padding: 0.58rem 0.65rem 0.58rem 0.85rem;
  border-radius: 12px;
  color: #475569;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  font-size: 0.8rem;
  font-weight: 750;
  border: 1px solid transparent;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0.45rem;
  top: 50%;
  width: 3px;
  height: 1.45rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0;
  transform: translateY(-50%) scaleY(0.35);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-item:hover {
  background: #eef6ff;
  color: #1d4ed8;
  border-color: #d7e7ff;
  transform: translateX(3px);
}

.nav-item.active {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.nav-item.active::before {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: currentColor;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #2563eb;
  color: #fff;
  font-weight: 900;
}

.profile-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-dropdown,
.notifications-dropdown {
  position: absolute;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  z-index: 260;
}

.dropdown-item {
  display: block;
  width: 100%;
  border: 0;
  background: #fff;
  color: #334155;
  padding: 0.75rem 1rem;
  text-align: left;
  text-decoration: none;
  font-weight: 750;
  font-size: 0.86rem;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.danger {
  color: #dc2626 !important;
}

.teacher-main {
  min-height: 100vh;
  margin-left: 248px;
  transition: margin-left 0.24s ease;
}

.teacher-navbar {
  position: sticky;
  top: 0;
  z-index: 120;
  min-height: 62px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 1.45rem;
}

.teacher-content {
  background: #f5f9ff;
  min-height: calc(100vh - 62px);
  padding: 1.5rem 1.25rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle,
.icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  background: #f8fafc;
  border: 1px solid #dbe5f3;
  border-radius: 10px;
  cursor: pointer;
  color: #334155;
}

.theme-toggle {
  position: relative;
  width: 68px;
  height: 36px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  cursor: pointer;
  color: #2563eb;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  padding: 3px;
  box-shadow: inset 0 1px 1px rgba(15, 23, 42, 0.06);
  transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.theme-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 10px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
  transform: translateY(-50%);
}

.theme-toggle::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 11px;
  width: 9px;
  height: 9px;
  border: 2px solid currentColor;
  border-left-color: transparent;
  border-radius: 50%;
  opacity: 0.45;
  transform: translateY(-50%) rotate(-22deg);
}

.menu-toggle:hover,
.menu-toggle:focus-visible,
.icon-button:hover,
.icon-button:focus-visible,
.theme-toggle:hover,
.theme-toggle:focus-visible {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
  outline: none;
}

.menu-toggle svg,
.search-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.page-title {
  margin: 0;
  font-size: 1.15rem;
  color: #172033;
  font-weight: 850;
}

.page-subtitle {
  margin: 0.1rem 0 0;
  color: var(--text-secondary, #64748b);
  font-size: 0.78rem;
  font-weight: 400;
}

.search-container {
  position: relative;
  width: min(320px, 28vw);
}

.search-container input {
  width: 100%;
  height: 42px;
  padding: 0 2.7rem 0 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
}

.search-icon {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.notifications-container,
.profile-container {
  position: relative;
}

.bell-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
}

.bell-icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0 5px;
  border-radius: 999px;
}

.theme-icon {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    inset -7px -4px 0 0 currentColor,
    0 5px 14px rgba(37, 99, 235, 0.2);
  transform: translateX(0);
  transition: transform 0.24s ease, background 0.22s ease, box-shadow 0.22s ease;
}

.theme-icon.sun {
  background: #f8fafc;
  box-shadow:
    0 0 0 5px rgba(96, 165, 250, 0.12),
    0 5px 14px rgba(0, 0, 0, 0.24);
  transform: translateX(31px);
}

.profile-btn {
  width: 42px;
  height: 42px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  cursor: pointer;
}

.profile-btn span {
  color: white;
  font-size: 0.88rem;
}

.notifications-dropdown {
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(340px, calc(100vw - 2rem));
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.dropdown-header strong {
  color: #172033;
}

.dropdown-header button {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-weight: 800;
}

.notification-item {
  width: 100%;
  display: grid;
  gap: 0.15rem;
  border: 0;
  border-bottom: 1px solid #eef2f7;
  background: #fff;
  padding: 0.85rem 1rem;
  text-align: left;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-item strong {
  color: #172033;
  font-size: 0.85rem;
}

.notification-item span,
.notification-item small,
.empty-state {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 650;
}

.empty-state {
  padding: 1rem;
  text-align: center;
}

.profile-dropdown {
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(240px, calc(100vw - 2rem));
}

.profile-dropdown-header {
  display: grid;
  gap: 0.15rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.profile-dropdown-header strong {
  color: #172033;
  font-size: 0.9rem;
}

.profile-dropdown-header span {
  color: #64748b;
  font-size: 0.76rem;
  overflow-wrap: anywhere;
}

.teacher-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 1.45rem 0.25rem;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  flex-wrap: wrap;
}

.teacher-breadcrumbs a {
  color: #2563eb;
  text-decoration: none;
}

.teacher-breadcrumbs a:hover {
  text-decoration: underline;
}

.teacher-breadcrumbs span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.teacher-content {
  background: #f5f9ff;
  min-height: calc(100vh - 62px);
  padding: 0;
}

.teacher-shell.dark-mode {
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 30rem),
    linear-gradient(135deg, #020617 0%, #0b1120 48%, #0f172a 100%);
}

.teacher-shell.dark-mode .teacher-navbar,
.teacher-shell.dark-mode .teacher-sidebar,
.teacher-shell.dark-mode .profile-dropdown,
.teacher-shell.dark-mode .notifications-dropdown {
  background: #111827;
  border-color: #243244;
}

.teacher-shell.dark-mode .brand-text strong,
.teacher-shell.dark-mode .page-title,
.teacher-shell.dark-mode .profile-dropdown-header strong,
.teacher-shell.dark-mode .notification-item strong {
  color: #f8fafc;
}

.teacher-shell.dark-mode .teacher-content,
.teacher-shell.dark-mode .search-container input,
.teacher-shell.dark-mode .menu-toggle,
.teacher-shell.dark-mode .icon-button {
  background: #0f172a;
  color: #f8fafc;
}

.teacher-shell.dark-mode .theme-toggle {
  background: linear-gradient(135deg, #020617 0%, #111827 100%);
  border-color: #334155;
  color: #bfdbfe;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.05),
    0 8px 22px rgba(0, 0, 0, 0.2);
}

.teacher-shell.dark-mode .theme-toggle:hover,
.teacher-shell.dark-mode .theme-toggle:focus-visible {
  border-color: #60a5fa;
  color: #bfdbfe;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.05),
    0 8px 24px rgba(37, 99, 235, 0.24);
}

.teacher-shell.dark-mode .theme-toggle::before {
  color: #64748b;
}

.teacher-shell.dark-mode .theme-toggle::after {
  color: #bfdbfe;
  opacity: 1;
}

.teacher-sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 210;
  background: rgba(15, 23, 42, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.teacher-sidebar-backdrop.visible {
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 1024px) {
  .search-container {
    display: none;
  }
}

@media (max-width: 768px) {
  .teacher-sidebar {
    width: min(84vw, 280px);
    transform: translateX(-100%);
    z-index: 230;
  }

  .teacher-sidebar.mobile-open {
    transform: translateX(0);
  }

  .teacher-main {
    margin-left: 0;
  }

  .teacher-navbar {
    padding: 0.75rem 1rem;
  }

  .page-subtitle {
    display: none;
  }

  .navbar-right {
    gap: 0.55rem;
  }

  .icon-button,
  .menu-toggle,
  .profile-btn {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }
}
</style>

<style>
body.teacher-sidebar-collapsed .teacher-sidebar {
  width: 88px;
  overflow: visible;
}

.teacher-content {
  padding: 0 !important;
}

body.teacher-sidebar-collapsed .teacher-main {
  margin-left: 88px;
}

body.teacher-sidebar-collapsed .teacher-sidebar .sidebar-brand {
  justify-content: center;
  min-height: 0;
  margin-bottom: 0.25rem;
  padding: 0.75rem 0;
  gap: 0;
}

body.teacher-sidebar-collapsed .teacher-sidebar .brand-text,
body.teacher-sidebar-collapsed .teacher-sidebar .nav-label {
  opacity: 0;
  width: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
}

body.teacher-sidebar-collapsed .teacher-sidebar .brand-mark {
  flex-basis: 50px;
  width: 50px;
  height: 50px;
  border-radius: 12px;
}

body.teacher-sidebar-collapsed .teacher-sidebar .sidebar-watch-wrapper {
  display: none;
}

body.teacher-sidebar-collapsed .teacher-sidebar .sidebar-nav {
  padding-inline: 0.5rem;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item {
  justify-content: center;
  gap: 0;
  padding-inline: 0;
  border-radius: 16px;
  transform: none;
  background: transparent;
  border-color: transparent;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item::after {
  content: attr(data-label);
  position: absolute;
  left: calc(100% + 0.65rem);
  top: 50%;
  z-index: 500;
  min-width: max-content;
  padding: 0.45rem 0.65rem;
  border-radius: 7px;
  background: #172033;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 0;
  pointer-events: none;
  transform: translate(-4px, -50%);
  transition: opacity 0.12s ease, transform 0.12s ease;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item::before {
  z-index: 1;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item::after {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item:hover,
body.teacher-sidebar-collapsed .teacher-sidebar .nav-item:focus-visible {
  background: #f1f5ff;
  color: #1d4ed8;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item:hover::after,
body.teacher-sidebar-collapsed .teacher-sidebar .nav-item:focus-visible::after {
  opacity: 1;
  transform: translate(0, -50%);
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item::before {
  left: 50%;
  top: auto;
  bottom: 0.35rem;
  width: 22px;
  height: 3px;
  transform: translateX(-50%) scaleX(0.25);
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item.active::before {
  opacity: 1;
  transform: translateX(-50%) scaleX(1);
}

@media (max-width: 768px) {
  body.teacher-sidebar-collapsed .teacher-main {
    margin-left: 0;
  }
}
</style>
