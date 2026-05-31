<template>
  <div class="teacher-shell" :class="{ 'dark-mode': isDarkMode }">
    <div class="teacher-sidebar-backdrop" :class="{ visible: sidebarOpen }" @click="closeMobileSidebar"></div>

    <aside class="teacher-sidebar" :class="{ 'mobile-open': sidebarOpen }">
      <router-link class="sidebar-brand" to="/teacher/dashboard" @click="closeMobileSidebar">
        <div class="brand-mark">
          <img class="brand-logo" :src="logoUrl" alt="Timetable logo">
        </div>
        <div class="brand-text">
          <strong>Timetable</strong>
          <span>Teacher Panel</span>
        </div>
      </router-link>

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
          <span class="nav-icon">
            <component :is="item.icon" aria-hidden="true" />
          </span>
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
            <PanelLeft />
          </button>
          <div>
            <h1 class="page-title">{{ pageTitle }}</h1>
            <p class="page-subtitle">{{ pageSubtitle }}</p>
          </div>
        </div>

        <div class="navbar-right">
          <div class="notifications-container" ref="notificationsMenu">
            <button
              class="icon-button"
              type="button"
              title="Notifications"
              :aria-expanded="showNotifications"
              @click="toggleNotifications"
            >
              <span class="bell-icon" aria-hidden="true">
                <Bell />
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
            <span class="theme-icon" :class="{ active: isDarkMode }" aria-hidden="true">
              <Sun v-if="isDarkMode" />
              <Moon v-else />
            </span>
          </button>

          <div class="profile-menu-container" ref="profileMenu">
            <button class="profile-btn" type="button" :aria-expanded="showProfileDropdown" @click="showProfileDropdown = !showProfileDropdown">
              <img v-if="profileImageUrl" :src="profileImageUrl" :alt="teacherName">
              <span v-else>{{ getInitials }}</span>
            </button>

            <div v-if="showProfileDropdown" class="profile-dropdown">
              <div class="profile-dropdown-header">
                <strong>{{ teacherName }}</strong>
                <span>{{ teacherEmail }}</span>
              </div>
              <router-link to="/teacher/profile" class="dropdown-item" @click="showProfileDropdown = false">Profile</router-link>
              <router-link to="/teacher/timetable" class="dropdown-item" @click="showProfileDropdown = false">Timetable</router-link>
              <button type="button" class="dropdown-item danger" @click="logout">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div class="teacher-breadcrumbs" aria-label="Breadcrumb">
        <router-link to="/teacher/dashboard">Dashboard</router-link>
        <span v-for="item in breadcrumbs" :key="item.label">
          <ChevronRight class="breadcrumb-icon" :size="14" :stroke-width="2.4" aria-hidden="true" />
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
import {
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Moon,
  PanelLeft,
  Settings,
  Sun,
  UserRound
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`

const sidebarOpen = ref(false)
const isDarkMode = ref(false)
const showNotifications = ref(false)
const showProfileDropdown = ref(false)
const notificationsMenu = ref(null)
const profileMenu = ref(null)
const notifications = ref([])
let notificationsTimer = null

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
    TeacherTimetable: 'Timetable',
    TeacherAttendance: 'Attendance',
    TeacherProfile: 'Profile',
    TeacherSettings: 'Settings'
  }
  return routeTitle[route.name] || 'Teacher Portal'
})

const pageSubtitle = computed(() => {
  const subtitles = {
    TeacherDashboard: 'Today, next lesson, and open slots.',
    TeacherTimetable: 'Weekly lessons, filters, and exports.',
    TeacherAttendance: 'Class attendance by period.',
    TeacherProfile: 'Your teacher details.',
    TeacherSettings: 'Availability and security.'
  }
  return subtitles[route.name] || 'Teacher workspace'
})

const breadcrumbs = computed(() => {
  const breadcrumbMap = {
    TeacherDashboard: [],
    TeacherTimetable: [{ label: 'Timetable', to: '/teacher/timetable' }],
    TeacherAttendance: [{ label: 'Attendance', to: '/teacher/attendance' }],
    TeacherProfile: [{ label: 'Profile', to: '/teacher/profile' }],
    TeacherSettings: [{ label: 'Settings', to: '/teacher/settings' }]
  }

  return breadcrumbMap[route.name] || []
})

const navItems = [
  { label: 'Dashboard', to: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Timetable', to: '/teacher/timetable', icon: CalendarDays },
  { label: 'Attendance', to: '/teacher/attendance', icon: ClipboardCheck },
  { label: 'Profile', to: '/teacher/profile', icon: UserRound },
  { label: 'Settings', to: '/teacher/settings', icon: Settings }
]

const isActive = (path) => String(path).includes('#') ? route.fullPath === path : route.path === path

const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
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

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showProfileDropdown.value = false
  if (showNotifications.value) loadNotifications()
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
  document.documentElement.classList.toggle('teacher-dark-mode', isDarkMode.value)
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
  notificationsTimer = window.setInterval(loadNotifications, 30000)

  document.addEventListener('click', closeMenusOnOutsideClick)
})

onBeforeUnmount(() => {
  if (notificationsTimer) window.clearInterval(notificationsTimer)
  document.removeEventListener('click', closeMenusOnOutsideClick)
  document.body.classList.remove('teacher-sidebar-open')
  document.body.classList.remove('teacher-dark-mode')
  document.documentElement.classList.remove('teacher-dark-mode')
})
</script>

<style scoped>
.teacher-shell {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
  color: #0f172a;
  font-family: var(--app-font);
  font-size: 0.92rem;
  line-height: 1.5;
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
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.sidebar-brand:hover,
.sidebar-brand:focus-visible {
  color: inherit;
  text-decoration: none;
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
  transition: border-color 0.2s ease, background-color 0.2s ease;
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
  background: transparent;
  color: #475569;
  border-color: transparent;
  transform: none;
}

.nav-item.active {
  background: transparent;
  color: #0f172a;
  border-color: #cbd5e1;
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
  background: #eff6ff;
  color: #2563eb;
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.nav-icon.blue { color: #1d4ed8; background: #dbeafe; }
.nav-icon.teal { color: #0f766e; background: #ccfbf1; }
.nav-icon.green { color: #15803d; background: #dcfce7; }
.nav-icon.violet { color: #6d28d9; background: #ede9fe; }
.nav-icon.amber { color: #b45309; background: #fef3c7; }

.nav-icon :deep(svg) {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  background: #2563eb;
  color: #ffffff;
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
  color: #1d4ed8 !important;
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
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
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
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 18px;
  cursor: pointer;
  color: #2563eb;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
  transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.menu-toggle:hover,
.icon-button:hover,
.theme-toggle:hover {
  background: #f8fafc;
  border-color: #dbe5f3;
  color: inherit;
  outline: none;
}

.menu-toggle:focus-visible,
.icon-button:focus-visible,
.theme-toggle:focus-visible {
  background: #f8fafc;
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
.profile-menu-container {
  position: relative;
}

.bell-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  color: #2563eb;
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
  background: #2563eb;
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
  width: 36px;
  height: 36px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #dbe5f3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 6px rgba(15, 23, 42, 0.08);
  transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, color 0.22s ease;
}

.theme-icon.active {
  background: #f8fbff;
  border-color: #dbe5f3;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 6px rgba(15, 23, 42, 0.08);
}

.theme-icon svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
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
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
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

.teacher-shell.dark-mode .nav-icon.blue { color: #93c5fd; background: rgba(37, 99, 235, 0.22); }
.teacher-shell.dark-mode .nav-icon.teal { color: #5eead4; background: rgba(20, 184, 166, 0.18); }
.teacher-shell.dark-mode .nav-icon.green { color: #86efac; background: rgba(34, 197, 94, 0.18); }
.teacher-shell.dark-mode .nav-icon.violet { color: #c4b5fd; background: rgba(124, 58, 237, 0.2); }
.teacher-shell.dark-mode .nav-icon.amber { color: #fde68a; background: rgba(245, 158, 11, 0.18); }

.teacher-shell.dark-mode .nav-item.active .nav-icon,
.teacher-shell.dark-mode .nav-item:hover .nav-icon {
  box-shadow: none;
}

.teacher-shell.dark-mode .bell-icon,
.teacher-shell.dark-mode .breadcrumb-icon {
  color: #93c5fd;
}

.teacher-shell.dark-mode .theme-toggle {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
}

.teacher-shell.dark-mode .theme-toggle:hover,
.teacher-shell.dark-mode .theme-toggle:focus-visible {
  border-color: #60a5fa;
  color: #2563eb;
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.26);
}

.teacher-shell.dark-mode .theme-icon {
  background: #f8fbff;
  border-color: #dbe5f3;
}

.teacher-sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 210;
  background: rgba(15, 23, 42, 0.45);
  display: none;
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
  .teacher-sidebar-backdrop {
    display: block;
  }

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
  background: transparent;
  color: inherit;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item.active {
  background: transparent;
  border-color: #cbd5e1;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-item.active .nav-icon,
body.teacher-sidebar-collapsed .teacher-sidebar .nav-item:hover .nav-icon,
body.teacher-sidebar-collapsed .teacher-sidebar .nav-item:focus-visible .nav-icon {
  color: inherit;
  background: transparent;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.22);
}

body.teacher-dark-mode.teacher-sidebar-collapsed .teacher-sidebar .nav-item.active,
body.teacher-dark-mode.teacher-sidebar-collapsed .teacher-sidebar .nav-item:hover,
body.teacher-dark-mode.teacher-sidebar-collapsed .teacher-sidebar .nav-item:focus-visible {
  background: transparent;
  border-color: #60a5fa;
}

body.teacher-sidebar-collapsed .teacher-sidebar .nav-icon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
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

body:not(.teacher-dark-mode) .teacher-shell,
body:not(.teacher-dark-mode) .teacher-content,
body:not(.teacher-dark-mode) .teacher-dashboard-page,
body:not(.teacher-dark-mode) .timetable-container,
body:not(.teacher-dark-mode) .attendance-page,
body:not(.teacher-dark-mode) .teacher-settings-page,
body:not(.teacher-dark-mode) .profile-container {
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%) !important;
  color: #0f172a;
}

body:not(.teacher-dark-mode) .attendance-header,
body:not(.teacher-dark-mode) .controls-panel,
body:not(.teacher-dark-mode) .class-strip,
body:not(.teacher-dark-mode) .attendance-table,
body:not(.teacher-dark-mode) .settings-intro,
body:not(.teacher-dark-mode) .teacher-settings-page .card,
body:not(.teacher-dark-mode) .profile-header,
body:not(.teacher-dark-mode) .profile-tabs,
body:not(.teacher-dark-mode) .profile-section,
body:not(.teacher-dark-mode) .profile-overview,
body:not(.teacher-dark-mode) .profile-card,
body:not(.teacher-dark-mode) .info-card,
body:not(.teacher-dark-mode) .timeline-card,
body:not(.teacher-dark-mode) .document-card {
  border: 1px solid #dbe3ef !important;
  border-radius: 8px !important;
  background: #ffffff !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06) !important;
}

body:not(.teacher-dark-mode) .settings-intro,
body:not(.teacher-dark-mode) .profile-header,
body:not(.teacher-dark-mode) .attendance-header {
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1) !important;
}

body:not(.teacher-dark-mode) .teacher-settings-page h1,
body:not(.teacher-dark-mode) .profile-header h1,
body:not(.teacher-dark-mode) .attendance-header h1,
body:not(.teacher-dark-mode) .profile-section h2,
body:not(.teacher-dark-mode) .teacher-settings-page .card-title {
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-settings-page p,
body:not(.teacher-dark-mode) .profile-header p,
body:not(.teacher-dark-mode) .attendance-header p,
body:not(.teacher-dark-mode) .text-muted {
  color: #52627a !important;
}

body:not(.teacher-dark-mode) .primary-btn,
body:not(.teacher-dark-mode) .btn-primary,
body:not(.teacher-dark-mode) .save-btn,
body:not(.teacher-dark-mode) .profile-link,
body:not(.teacher-dark-mode) .photo-upload-btn {
  border: 0 !important;
  border-radius: 8px !important;
  background: #2563eb !important;
  color: #ffffff !important;
  font-weight: 800 !important;
}

body:not(.teacher-dark-mode) .secondary-btn,
body:not(.teacher-dark-mode) .btn-secondary,
body:not(.teacher-dark-mode) .tab-btn,
body:not(.teacher-dark-mode) .class-strip button {
  border: 0 !important;
  border-radius: 8px !important;
  background: #e0f2fe !important;
  color: #075985 !important;
  font-weight: 800 !important;
}

body:not(.teacher-dark-mode) .tab-btn.active,
body:not(.teacher-dark-mode) .class-strip button.active,
body:not(.teacher-dark-mode) .nav-tabs .nav-link.active {
  background: transparent !important;
  color: #0f172a !important;
  border-color: #2563eb !important;
  box-shadow: inset 0 -2px 0 #2563eb !important;
}

body:not(.teacher-dark-mode) .teacher-settings-page .card-header,
body:not(.teacher-dark-mode) .attendance-table th {
  background: #f8fafc !important;
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) input,
body:not(.teacher-dark-mode) select,
body:not(.teacher-dark-mode) textarea,
body:not(.teacher-dark-mode) .form-control,
body:not(.teacher-dark-mode) .form-select {
  border-color: #cbd5e1 !important;
  border-radius: 8px !important;
}

/* Final light-mode cleanup: prevent dark-mode surfaces from lingering after the
   teacher theme is switched off. */
body:not(.teacher-dark-mode) .teacher-main,
body:not(.teacher-dark-mode) .teacher-content {
  filter: none !important;
  opacity: 1 !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%) !important;
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-navbar,
body:not(.teacher-dark-mode) .teacher-sidebar,
body:not(.teacher-dark-mode) .profile-dropdown,
body:not(.teacher-dark-mode) .notifications-dropdown {
  background: #ffffff !important;
  border-color: #dbe5f3 !important;
  color: #172033 !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(.dashboard-hero, .studio-header, .settings-intro, .profile-header, .attendance-header) {
  border-color: #dbe3ef !important;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1) !important;
  color: #0f172a !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06) !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(.card, .panel, .metric-card, .dashboard-card, .stat-card, .settings-card, .profile-card, .profile-section, .profile-overview, .info-card, .timeline-card, .document-card, .attendance-table, .controls-panel, .filters-panel, .panel-card, .timetable-output-card, .day-view-section, .compact-view-section, .lesson-card, .day-lesson-card, .compact-lesson-item, .timeline-item, .lesson-row, .activity-item, .next-lesson, .free-list button, .tag-list span, .settings-panel, .settings-nav, .security-tips, .toggle-card, .preference-card, .day-chip, .class-strip) {
  border-color: #dbe3ef !important;
  background: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06) !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(.timeline-item, .lesson-row, .activity-item, .next-lesson, .free-list button, .day-chip, .toggle-card, .preference-card, .tag-list span, .module-cell, .day-lesson-content, .lesson-cell, .compact-day-time, .room-badge) {
  background: #f8fafc !important;
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(h1, h2, h3, h4, h5, h6, strong, b, th, label, legend, .page-title, .card-title, .panel-title, .section-title, .metric-value, .lesson-subject, .subject-name, .profile-name, .table-title) {
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(p, span, small, em, td, li, dd, dt, .text-muted, .subtitle, .page-subtitle, .empty-copy, .empty-text, .description, .meta, .caption, .lesson-class, .lesson-room, .room-info, .class-info, .period-time) {
  color: #52627a !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(a, .link, .router-link-active, .profile-link, .quick-link) {
  color: #2563eb !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(input, select, textarea, .form-control, .form-select, .filter-input, .export-select) {
  border-color: #cbd5e1 !important;
  background: #ffffff !important;
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(table, .timetable-grid, .weekly-table) {
  background: #ffffff !important;
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(thead, th, .header-row th, .lesson-table-head) {
  background: #f8fafc !important;
  color: #334155 !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(td, .lesson-cell, .period-col, .time-col) {
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(button:not(.primary-action):not(.primary-btn):not(.btn-primary):not(.download-btn):not(.save-btn), .btn-secondary, .secondary-btn, .tab-btn, .view-btn, .day-selector-btn) {
  border-color: #bfdbfe !important;
  background: #eff6ff !important;
  color: #1d4ed8 !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(.primary-action, .primary-btn, .btn-primary, .download-btn, .save-btn) {
  border-color: #2563eb !important;
  background: #2563eb !important;
  color: #ffffff !important;
}

body:not(.teacher-dark-mode) .teacher-content :where(.primary-action *, .primary-btn *, .btn-primary *, .download-btn *, .save-btn *) {
  color: #ffffff !important;
}

body:not(.teacher-dark-mode) .teacher-shell:not(.dark-mode) .teacher-dashboard-page .metric-card {
  border-color: #dbe3ef !important;
  background: #ffffff !important;
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-shell:not(.dark-mode) .teacher-dashboard-page .metric-card strong {
  color: #0f172a !important;
}

body:not(.teacher-dark-mode) .teacher-shell:not(.dark-mode) .teacher-dashboard-page .metric-card span {
  color: #334155 !important;
}

body:not(.teacher-dark-mode) .teacher-shell:not(.dark-mode) .teacher-dashboard-page .metric-card small {
  color: #52627a !important;
}

body:not(.teacher-dark-mode) .teacher-shell:not(.dark-mode) .teacher-dashboard-page .panel-header span,
body:not(.teacher-dark-mode) .teacher-shell:not(.dark-mode) .teacher-dashboard-page .lesson-table-head span {
  color: #475569 !important;
}

body.teacher-dark-mode .teacher-shell.dark-mode .teacher-dashboard-page .metric-card,
body .teacher-shell.dark-mode .teacher-dashboard-page .metric-card {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
}

body.teacher-dark-mode .teacher-shell.dark-mode .teacher-dashboard-page .metric-card strong,
body .teacher-shell.dark-mode .teacher-dashboard-page .metric-card strong {
  color: #f8fafc !important;
}

body.teacher-dark-mode .teacher-shell.dark-mode .teacher-dashboard-page .metric-card span,
body.teacher-dark-mode .teacher-shell.dark-mode .teacher-dashboard-page .metric-card small,
body .teacher-shell.dark-mode .teacher-dashboard-page .metric-card span,
body .teacher-shell.dark-mode .teacher-dashboard-page .metric-card small {
  color: #cbd5e1 !important;
}

body .teacher-shell,
body .teacher-shell button,
body .teacher-shell input,
body .teacher-shell select,
body .teacher-shell textarea {
  font-family: var(--app-font) !important;
  font-size: 0.92rem;
  line-height: 1.5;
  letter-spacing: 0;
}

body .teacher-shell h1,
body .teacher-shell .studio-header h1,
body .teacher-shell .dashboard-hero h1,
body .teacher-shell .profile-header h1,
body .teacher-shell .attendance-header h1,
body .teacher-shell .settings-intro h1 {
  font-size: 1.8rem !important;
  line-height: 1.1 !important;
  font-weight: 900 !important;
  letter-spacing: 0 !important;
}

body .teacher-shell h2,
body .teacher-shell .output-toolbar h2,
body .teacher-shell .panel-header h2,
body .teacher-shell .panel-heading h2,
body .teacher-shell .profile-section h2,
body .teacher-shell .card-heading h2 {
  font-size: 1.25rem !important;
  line-height: 1.16 !important;
  font-weight: 850 !important;
  letter-spacing: 0 !important;
}

body .teacher-shell h3,
body .teacher-shell h4,
body .teacher-shell h5,
body .teacher-shell h6,
body .teacher-shell .card-title,
body .teacher-shell .security-tips h3 {
  font-size: 1rem !important;
  line-height: 1.2 !important;
  font-weight: 850 !important;
  letter-spacing: 0 !important;
}

body .teacher-shell p,
body .teacher-shell label,
body .teacher-shell .form-control,
body .teacher-shell .form-select,
body .teacher-shell .btn,
body .teacher-shell .nav-link,
body .teacher-shell .settings-nav-item,
body .teacher-shell .tab-btn,
body .teacher-shell .class-strip button {
  font-size: 0.92rem !important;
}

body .teacher-shell small,
body .teacher-shell .eyebrow,
body .teacher-shell .badge,
body .teacher-shell .page-subtitle,
body .teacher-shell .studio-subtitle,
body .teacher-shell .settings-nav-item small,
body .teacher-shell .module-cell small,
body .teacher-shell .lesson-room,
body .teacher-shell .lesson-time,
body .teacher-shell .room-badge,
body .teacher-shell .time-pill {
  font-size: 0.78rem !important;
  line-height: 1.35 !important;
}

body .teacher-shell .page-title {
  font-size: 1.25rem !important;
  line-height: 1.16 !important;
  font-weight: 850 !important;
}

body .teacher-shell .nav-item {
  font-size: 0.875rem !important;
  line-height: 1.2 !important;
}

body.teacher-dark-mode {
  --teacher-bg: #020617;
  --teacher-surface: #111827;
  --teacher-surface-soft: #0b1220;
  --teacher-border: #243244;
  --teacher-border-strong: #334155;
  --teacher-text: #f8fafc;
  --teacher-muted: #cbd5e1;
  --teacher-link: #93c5fd;
}

body.teacher-dark-mode,
body.teacher-dark-mode #app,
body.teacher-dark-mode .teacher-shell,
body.teacher-dark-mode .teacher-main,
body.teacher-dark-mode .teacher-content,
body.teacher-dark-mode .teacher-dashboard-page,
body.teacher-dark-mode .timetable-container,
body.teacher-dark-mode .attendance-page,
body.teacher-dark-mode .teacher-settings-page,
body.teacher-dark-mode .settings-wrap,
body.teacher-dark-mode .settings-shell,
body.teacher-dark-mode .settings-content,
body.teacher-dark-mode .profile-container {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%),
    linear-gradient(135deg, #020617 0%, #0f172a 100%) !important;
  color: var(--teacher-text) !important;
}

body.teacher-dark-mode .teacher-navbar,
body.teacher-dark-mode .teacher-sidebar,
body.teacher-dark-mode .profile-dropdown,
body.teacher-dark-mode .notifications-dropdown,
body.teacher-dark-mode .dashboard-hero,
body.teacher-dark-mode .metric-card,
body.teacher-dark-mode .panel,
body.teacher-dark-mode .timeline-item,
body.teacher-dark-mode .lesson-row,
body.teacher-dark-mode .activity-item,
body.teacher-dark-mode .free-list button,
body.teacher-dark-mode .next-lesson,
body.teacher-dark-mode .studio-header,
body.teacher-dark-mode .timetable-output-card,
body.teacher-dark-mode .filters-panel,
body.teacher-dark-mode .panel-card,
body.teacher-dark-mode .day-view-section,
body.teacher-dark-mode .day-lesson-card,
body.teacher-dark-mode .modal-content,
body.teacher-dark-mode .attendance-header,
body.teacher-dark-mode .controls-panel,
body.teacher-dark-mode .class-strip,
body.teacher-dark-mode .attendance-table,
body.teacher-dark-mode .settings-intro,
body.teacher-dark-mode .settings-nav,
body.teacher-dark-mode .settings-panel,
body.teacher-dark-mode .settings-skeleton,
body.teacher-dark-mode .day-chip,
body.teacher-dark-mode .toggle-card,
body.teacher-dark-mode .preference-card,
body.teacher-dark-mode .security-tips,
body.teacher-dark-mode .teacher-settings-page .card,
body.teacher-dark-mode .teacher-settings-page .card-header,
body.teacher-dark-mode .profile-header,
body.teacher-dark-mode .profile-tabs,
body.teacher-dark-mode .profile-section,
body.teacher-dark-mode .profile-overview,
body.teacher-dark-mode .profile-card,
body.teacher-dark-mode .info-card,
body.teacher-dark-mode .timeline-card,
body.teacher-dark-mode .document-card,
body.teacher-dark-mode .photo-section,
body.teacher-dark-mode .details-card,
body.teacher-dark-mode .app-state,
body.teacher-dark-mode .loading-state,
body.teacher-dark-mode .confirm-modal {
  border-color: var(--teacher-border) !important;
  background: rgba(17, 24, 39, 0.96) !important;
  color: var(--teacher-text) !important;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28) !important;
}

body.teacher-dark-mode .teacher-sidebar .nav-icon {
  background: #172554;
  color: #93c5fd;
}

body.teacher-dark-mode .teacher-sidebar .nav-item:hover .nav-icon,
body.teacher-dark-mode .teacher-sidebar .nav-item.active .nav-icon {
  background: #3b82f6;
  color: #ffffff;
}

body.teacher-dark-mode .studio-header,
body.teacher-dark-mode .dashboard-hero,
body.teacher-dark-mode .attendance-header,
body.teacher-dark-mode .settings-intro,
body.teacher-dark-mode .profile-header {
  background: linear-gradient(135deg, #0f172a 0%, #111827 58%, #082f49 100%) !important;
}

body.teacher-dark-mode .module-cell,
body.teacher-dark-mode .day-lesson-content,
body.teacher-dark-mode .class-strip button,
body.teacher-dark-mode .tab-btn,
body.teacher-dark-mode .nav-tabs,
body.teacher-dark-mode .nav-tabs .nav-link,
body.teacher-dark-mode .dropdown-item,
body.teacher-dark-mode .notification-item,
body.teacher-dark-mode .account-link,
body.teacher-dark-mode input,
body.teacher-dark-mode select,
body.teacher-dark-mode textarea,
body.teacher-dark-mode .form-control,
body.teacher-dark-mode .form-select,
body.teacher-dark-mode table td,
body.teacher-dark-mode .lesson-cell,
body.teacher-dark-mode .period-col,
body.teacher-dark-mode .time-col,
body.teacher-dark-mode .skeleton-row {
  border-color: var(--teacher-border-strong) !important;
  background: var(--teacher-surface-soft) !important;
  color: #e5edf7 !important;
}

body.teacher-dark-mode h1,
body.teacher-dark-mode h2,
body.teacher-dark-mode h3,
body.teacher-dark-mode h4,
body.teacher-dark-mode h5,
body.teacher-dark-mode h6,
body.teacher-dark-mode strong,
body.teacher-dark-mode .page-title,
body.teacher-dark-mode .brand-text strong,
body.teacher-dark-mode .panel-header h2,
body.teacher-dark-mode .metric-card strong,
body.teacher-dark-mode .lesson-row strong,
body.teacher-dark-mode .timeline-item strong,
body.teacher-dark-mode .activity-item strong,
body.teacher-dark-mode .profile-header h1,
body.teacher-dark-mode .profile-section h2,
body.teacher-dark-mode .teacher-settings-page .card-title,
body.teacher-dark-mode .attendance-header h1,
body.teacher-dark-mode .lesson-details-modal h2,
body.teacher-dark-mode .module-cell strong,
body.teacher-dark-mode .table-empty strong,
body.teacher-dark-mode .notifications-header h3,
body.teacher-dark-mode .profile-dropdown-header strong {
  color: var(--teacher-text) !important;
}

body.teacher-dark-mode p,
body.teacher-dark-mode small,
body.teacher-dark-mode label,
body.teacher-dark-mode .page-subtitle,
body.teacher-dark-mode .studio-subtitle,
body.teacher-dark-mode .profile-header p,
body.teacher-dark-mode .attendance-header p,
body.teacher-dark-mode .teacher-settings-page p,
body.teacher-dark-mode .text-muted,
body.teacher-dark-mode .empty-copy,
body.teacher-dark-mode .metric-card span,
body.teacher-dark-mode .metric-card small,
body.teacher-dark-mode .panel-header span,
body.teacher-dark-mode .timeline-item small,
body.teacher-dark-mode .lesson-row span,
body.teacher-dark-mode .activity-item small,
body.teacher-dark-mode .free-list strong,
body.teacher-dark-mode .next-lesson span,
body.teacher-dark-mode .module-cell small,
body.teacher-dark-mode .room-badge,
body.teacher-dark-mode .day-date,
body.teacher-dark-mode .time-pill,
body.teacher-dark-mode .notification-item em,
body.teacher-dark-mode .notification-item small,
body.teacher-dark-mode .notification-empty,
body.teacher-dark-mode .profile-dropdown-header small {
  color: var(--teacher-muted) !important;
}

body.teacher-dark-mode .period-timer,
body.teacher-dark-mode .period-timer * {
  color: inherit;
}

body.teacher-dark-mode .period-timer .watch-face {
  border-color: #334155 !important;
  background: linear-gradient(180deg, #1f2937 0%, #030712 100%) !important;
  box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.08), 0 16px 34px rgba(0, 0, 0, 0.5) !important;
}

body.teacher-dark-mode .period-timer .screen {
  border-color: #020617 !important;
  background: linear-gradient(180deg, #dcebcf 0%, #adc69a 100%) !important;
  color: #111827 !important;
}

body.teacher-dark-mode .period-timer .screen span,
body.teacher-dark-mode .period-timer .screen strong,
body.teacher-dark-mode .period-timer .period-summary span,
body.teacher-dark-mode .period-timer .period-summary strong,
body.teacher-dark-mode .period-timer .gmt-chip,
body.teacher-dark-mode .period-timer .timer-zone,
body.teacher-dark-mode .period-timer .timer-local-time,
body.teacher-dark-mode .period-timer .timer-caption,
body.teacher-dark-mode .period-timer .watch-metrics span,
body.teacher-dark-mode .period-timer .watch-metrics strong {
  color: #111827 !important;
}

body.teacher-dark-mode .period-timer .alarm-toggle {
  border-color: rgba(17, 24, 39, 0.55) !important;
  background: #f8fafc !important;
  color: #111827 !important;
}

body.teacher-dark-mode .period-timer .alarm-toggle.enabled {
  background: #dcfce7 !important;
  color: #14532d !important;
}

body.teacher-dark-mode .period-timer .tone-menu {
  border-color: #334155 !important;
  background: #111827 !important;
}

body.teacher-dark-mode .period-timer .tone-menu button {
  border-color: #334155 !important;
  background: #0b1220 !important;
  color: #e5edf7 !important;
}

body.teacher-dark-mode .period-timer .tone-menu button:hover,
body.teacher-dark-mode .period-timer .tone-menu button:focus-visible,
body.teacher-dark-mode .period-timer .tone-menu button.active {
  border-color: #60a5fa !important;
  background: #2563eb !important;
  color: #ffffff !important;
}

body.teacher-dark-mode .period-timer .timer-error {
  color: #bfdbfe !important;
}

body.teacher-dark-mode a,
body.teacher-dark-mode .teacher-breadcrumbs a,
body.teacher-dark-mode .profile-link {
  color: var(--teacher-link) !important;
}

body.teacher-dark-mode input::placeholder,
body.teacher-dark-mode textarea::placeholder {
  color: #94a3b8 !important;
}

body.teacher-dark-mode .primary-action,
body.teacher-dark-mode .primary-btn,
body.teacher-dark-mode .btn-primary,
body.teacher-dark-mode .save-btn,
body.teacher-dark-mode .download-btn,
body.teacher-dark-mode .photo-upload-btn,
body.teacher-dark-mode .profile-link {
  border-color: #2563eb !important;
  background: #2563eb !important;
  color: #ffffff !important;
}

body.teacher-dark-mode .secondary-action,
body.teacher-dark-mode .secondary-btn,
body.teacher-dark-mode .btn-secondary,
body.teacher-dark-mode .tab-btn,
body.teacher-dark-mode .class-strip button,
body.teacher-dark-mode .cancel-btn {
  border-color: #1d4ed8 !important;
  background: #172554 !important;
  color: #bfdbfe !important;
}

body.teacher-dark-mode .tab-btn.active,
body.teacher-dark-mode .class-strip button.active,
body.teacher-dark-mode .nav-tabs .nav-link.active,
body.teacher-dark-mode .sidebar-nav .nav-item.active {
  border-color: #60a5fa !important;
  background: transparent !important;
  color: #f8fafc !important;
  box-shadow: inset 0 -2px 0 #60a5fa !important;
}

body.teacher-dark-mode table,
body.teacher-dark-mode .weekly-table,
body.teacher-dark-mode .attendance-table table {
  background: var(--teacher-surface) !important;
  color: var(--teacher-text) !important;
}

body.teacher-dark-mode table th,
body.teacher-dark-mode .weekly-table th,
body.teacher-dark-mode .attendance-table th,
body.teacher-dark-mode .header-row th {
  border-color: var(--teacher-border-strong) !important;
  background: #172554 !important;
  color: #ffffff !important;
}

body.teacher-dark-mode table td,
body.teacher-dark-mode .weekly-table td,
body.teacher-dark-mode .attendance-table td {
  border-color: var(--teacher-border) !important;
}

body.teacher-dark-mode .break-cell,
body.teacher-dark-mode .break-fill {
  border-color: #713f12 !important;
  background: rgba(113, 63, 18, 0.28) !important;
  color: #fde68a !important;
}

body.teacher-dark-mode .modal-overlay {
  background: rgba(2, 6, 23, 0.78) !important;
}

body.teacher-dark-mode .dropdown-item:hover,
body.teacher-dark-mode .dropdown-item:focus-visible,
body.teacher-dark-mode .notification-item:hover,
body.teacher-dark-mode .notification-item:focus-visible,
body.teacher-dark-mode .notification-item.unread,
body.teacher-dark-mode .account-link:hover,
body.teacher-dark-mode .account-link:focus-visible {
  background: rgba(37, 99, 235, 0.18) !important;
  color: #dbeafe !important;
}

body.teacher-dark-mode .badge,
body.teacher-dark-mode .status-badge,
body.teacher-dark-mode .lesson-type,
body.teacher-dark-mode .day-badge {
  color: inherit;
}

/* Last-resort teacher readability layer. Keep the page content visible in dark mode
   even when a routed view has scoped light-theme colors. */
body.teacher-dark-mode .teacher-main,
body.teacher-dark-mode .teacher-content {
  position: relative !important;
  z-index: 1 !important;
  filter: none !important;
  opacity: 1 !important;
  visibility: visible !important;
}

body.teacher-dark-mode .teacher-sidebar-backdrop {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

@media (max-width: 768px) {
  body.teacher-dark-mode.teacher-sidebar-open .teacher-sidebar-backdrop {
    display: block !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }
}

body.teacher-dark-mode .teacher-content *,
body.teacher-dark-mode .teacher-navbar *,
body.teacher-dark-mode .teacher-breadcrumbs * {
  filter: none !important;
  opacity: 1 !important;
  visibility: visible !important;
}

body.teacher-dark-mode .teacher-content :where(h1, h2, h3, h4, h5, h6, strong, b, th, label, legend, .page-title, .card-title, .panel-title, .section-title, .metric-value, .lesson-subject, .subject-name, .profile-name, .table-title) {
  color: #f8fafc !important;
}

body.teacher-dark-mode .teacher-content :where(p, span, small, em, td, li, dd, dt, .text-muted, .subtitle, .page-subtitle, .empty-copy, .empty-text, .description, .meta, .caption, .lesson-class, .lesson-room, .room-info, .class-info, .period-time) {
  color: #cbd5e1 !important;
}

body.teacher-dark-mode .teacher-content :where(a, .link, .router-link-active, .profile-link, .quick-link) {
  color: #93c5fd !important;
}

body.teacher-dark-mode .teacher-content :where(.card, .panel, .metric-card, .dashboard-card, .stat-card, .settings-card, .profile-card, .profile-section, .info-card, .timeline-card, .document-card, .attendance-table, .controls-panel, .filters-panel, .panel-card, .timetable-output-card, .day-view-section, .compact-view-section, .lesson-card, .day-lesson-card, .compact-lesson-item, .timeline-item, .lesson-row, .activity-item, .next-lesson, .free-list button, .tag-list span, .settings-panel, .settings-nav, .settings-intro, .security-tips, .toggle-card, .preference-card, .day-chip) {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
}

body.teacher-dark-mode .teacher-content :where(input, select, textarea, .form-control, .form-select, .filter-input, .export-select) {
  border-color: #334155 !important;
  background: #0b1220 !important;
  color: #e5edf7 !important;
}

body.teacher-dark-mode .teacher-content :where(button:not(.primary-action):not(.primary-btn):not(.btn-primary):not(.download-btn):not(.save-btn), .btn-secondary, .secondary-btn, .tab-btn, .view-btn, .day-selector-btn) {
  border-color: #334155 !important;
  background: #111827 !important;
  color: #dbeafe !important;
}

body.teacher-dark-mode .teacher-content :where(.primary-action, .primary-btn, .btn-primary, .download-btn, .save-btn) {
  border-color: #2563eb !important;
  background: #2563eb !important;
  color: #ffffff !important;
}

body.teacher-dark-mode .teacher-content :where(.primary-action *, .primary-btn *, .btn-primary *, .download-btn *, .save-btn *) {
  color: #ffffff !important;
}

body.teacher-dark-mode .teacher-content :where(table, .timetable-grid, .weekly-table) {
  background: #0b1220 !important;
  color: #e5edf7 !important;
}

body.teacher-dark-mode .teacher-content :where(thead, th, .header-row th) {
  background: #111827 !important;
  color: #f8fafc !important;
}

body.teacher-dark-mode .teacher-content :where(td, .lesson-cell, .period-col, .time-col) {
  border-color: #243244 !important;
  color: #e5edf7 !important;
}

body .teacher-shell.dark-mode .teacher-content .teacher-metrics article,
body.teacher-dark-mode .teacher-shell.dark-mode .teacher-content .teacher-metrics article {
  border-color: #243244 !important;
  background: rgba(15, 23, 42, 0.96) !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34) !important;
}

body .teacher-shell.dark-mode .teacher-content .teacher-metrics strong,
body.teacher-dark-mode .teacher-shell.dark-mode .teacher-content .teacher-metrics strong {
  color: #f8fafc !important;
}

body .teacher-shell.dark-mode .teacher-content .teacher-metrics span,
body .teacher-shell.dark-mode .teacher-content .teacher-metrics small,
body.teacher-dark-mode .teacher-shell.dark-mode .teacher-content .teacher-metrics span,
body.teacher-dark-mode .teacher-shell.dark-mode .teacher-content .teacher-metrics small {
  color: #cbd5e1 !important;
}
</style>
