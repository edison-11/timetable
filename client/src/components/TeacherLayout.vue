<template>
  <div :class="['teacher-layout', { 'dark-mode': isDarkMode }]">
    <!-- Sidebar Navigation -->
    <aside class="teacher-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">👨‍🏫</span>
          <span class="logo-text">TeacherHub</span>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: $route.path === item.to }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Profile Card in Sidebar -->
      <div class="sidebar-profile">
        <div class="profile-avatar">
          <img v-if="teacher?.profile_photo" :src="teacher.profile_photo" :alt="teacher.name" />
          <div v-else class="avatar-placeholder">{{ getInitials }}</div>
        </div>
        <div class="profile-info">
          <p class="profile-name">{{ teacher?.name }}</p>
          <p class="profile-dept">{{ teacher?.department }}</p>
        </div>
        <button class="profile-menu-btn" @click="showProfileMenu = !showProfileMenu">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <div v-if="showProfileMenu" class="profile-menu">
          <button @click="goToProfile" class="menu-item">
            <i class="bi bi-person"></i> Profile
          </button>
          <button @click="goToSettings" class="menu-item">
            <i class="bi bi-gear"></i> Settings
          </button>
          <button @click="logout" class="menu-item logout">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="teacher-main">
      <!-- Top Navigation Bar -->
      <header class="teacher-navbar">
        <div class="navbar-left">
          <button class="sidebar-hamburger" @click="toggleSidebar">
            <i class="bi bi-list"></i>
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>

        <div class="navbar-right">
          <!-- Search Bar -->
          <div class="search-container">
            <input type="text" placeholder="Search lessons, classes..." class="search-input" />
            <i class="bi bi-search"></i>
          </div>

          <!-- Notifications Dropdown -->
          <div class="notifications-container">
            <button class="notification-btn" @click="showNotifications = !showNotifications">
              <i class="bi bi-bell"></i>
              <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
            </button>
            <div v-if="showNotifications" class="notifications-dropdown">
              <div class="dropdown-header">Notifications</div>
              <div class="notifications-list">
                <div v-if="notifications.length === 0" class="empty-state">
                  No notifications yet
                </div>
                <div
                  v-for="notif in notifications.slice(0, 5)"
                  :key="notif.id"
                  class="notification-item"
                  :class="{ unread: !notif.read }"
                >
                  <div class="notif-content">
                    <strong>{{ notif.title }}</strong>
                    <p>{{ notif.message }}</p>
                    <small>{{ formatTime(notif.created_at) }}</small>
                  </div>
                </div>
              </div>
              <a href="#" class="dropdown-footer">View all notifications</a>
            </div>
          </div>

          <!-- Theme Toggle -->
          <button class="theme-toggle" @click="toggleTheme" :title="isDarkMode ? 'Light mode' : 'Dark mode'">
            <i :class="isDarkMode ? 'bi bi-brightness-high' : 'bi bi-moon'"></i>
          </button>

          <!-- Profile Dropdown -->
          <div class="profile-container">
            <button class="profile-btn" @click="showProfileDropdown = !showProfileDropdown">
              <img v-if="teacher?.profile_photo" :src="teacher.profile_photo" :alt="teacher.name" />
              <div v-else class="avatar-small">{{ getInitials }}</div>
            </button>
            <div v-if="showProfileDropdown" class="profile-dropdown">
              <div class="dropdown-item-group">
                <p class="dropdown-label">{{ teacher?.name }}</p>
              </div>
              <router-link to="/teacher/profile" class="dropdown-item">
                <i class="bi bi-person"></i> My Profile
              </router-link>
              <router-link to="/teacher/timetable" class="dropdown-item">
                <i class="bi bi-calendar"></i> My Timetable
              </router-link>
              <router-link to="/teacher/requests" class="dropdown-item">
                <i class="bi bi-chat-dots"></i> Requests
              </router-link>
              <router-link to="/teacher/announcements" class="dropdown-item">
                <i class="bi bi-megaphone"></i> Announcements
              </router-link>
              <hr class="dropdown-divider" />
              <button @click="logout" class="dropdown-item logout">
                <i class="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="teacher-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
const isDarkMode = ref(false)
const showNotifications = ref(false)
const showProfileMenu = ref(false)
const showProfileDropdown = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

const teacher = computed(() => {
  const storedTeacher = localStorage.getItem('teacher')
  return storedTeacher ? JSON.parse(storedTeacher) : null
})

const getInitials = computed(() => {
  if (!teacher.value?.name) return 'T'
  const parts = teacher.value.name.split(' ')
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
})

const pageTitle = computed(() => {
  const routeTitle = {
    'teacher-dashboard': 'Dashboard',
    'teacher-timetable': 'My Timetable',
    'teacher-profile': 'My Profile',
    'teacher-requests': 'Change Requests',
    'teacher-announcements': 'Announcements',
    'teacher-settings': 'Settings'
  }
  return routeTitle[router.currentRoute.value.name] || 'Teacher Portal'
})

const navItems = [
  {
    label: 'Dashboard',
    to: '/teacher/dashboard',
    icon: '<i class="bi bi-speedometer2"></i>'
  },
  {
    label: 'My Timetable',
    to: '/teacher/timetable',
    icon: '<i class="bi bi-calendar3"></i>'
  },
  {
    label: 'My Profile',
    to: '/teacher/profile',
    icon: '<i class="bi bi-person-circle"></i>'
  },
  {
    label: 'Change Requests',
    to: '/teacher/requests',
    icon: '<i class="bi bi-chat-dots"></i>'
  },
  {
    label: 'Announcements',
    to: '/teacher/announcements',
    icon: '<i class="bi bi-megaphone"></i>'
  },
  {
    label: 'Settings',
    to: '/teacher/settings',
    icon: '<i class="bi bi-gear"></i>'
  }
]

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('teacherDarkMode', isDarkMode.value)
}

const goToProfile = () => {
  router.push('/teacher/profile')
  showProfileMenu.value = false
}

const goToSettings = () => {
  router.push('/teacher/settings')
  showProfileMenu.value = false
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}

const logout = async () => {
  authStore.logout()
  router.push('/teacher/login')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('teacherDarkMode')
  if (savedTheme) isDarkMode.value = JSON.parse(savedTheme)

  // Load notifications (can be expanded with API call)
  notifications.value = [
    {
      id: 1,
      title: 'Timetable Updated',
      message: 'Your schedule has been updated for next week',
      created_at: new Date(),
      read: false
    },
    {
      id: 2,
      title: 'Room Change',
      message: 'Class 10-A moved to Room 105',
      created_at: new Date(Date.now() - 3600000),
      read: false
    }
  ]
  unreadCount.value = notifications.value.filter(n => !n.read).length
})
</script>

<style scoped>
:root {
  --teacher-primary: #3498db;
  --teacher-primary-dark: #2980b9;
  --teacher-primary-light: #dbeafe;
  --teacher-accent: #10b981;
  --teacher-warning: #f39c12;
  --teacher-danger: #e74c3c;
  --teacher-bg: #f8f9fa;
  --teacher-bg-dark: #1f2937;
  --teacher-text: #2c3e50;
  --teacher-text-light: #7f8c8d;
  --teacher-border: #e9ecef;
  --teacher-surface: #ffffff;
}

.teacher-layout.dark-mode {
  --teacher-bg: #0f172a;
  --teacher-text: #f3f4f6;
  --teacher-text-light: #d1d5db;
  --teacher-border: #374151;
  --teacher-surface: #1e293b;
}

.teacher-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--teacher-bg);
  color: var(--teacher-text);
  transition: background-color 0.3s, color 0.3s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Sidebar */
.teacher-sidebar {
  width: 260px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  color: #2c3e50;
  font-weight: 800;
}

.sidebar-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #2c3e50;
  font-size: 1.25rem;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  margin: 0.25rem 0.75rem;
  border-radius: 8px;
  border-left: 4px solid transparent;
  color: #495057;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  position: relative;
}

.nav-item:hover {
  background: #e9ecef;
  color: #3498db;
  border-left-color: #3498db;
  transform: translateX(3px);
}

.nav-item.active {
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-left-color: #2980b9;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.2);
  font-weight: 700;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-profile {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  margin-top: auto;
  background: linear-gradient(135deg, #e8f4f8 0%, #dbeafe 100%);
  border-radius: 0.75rem;
  margin: auto 0.75rem 0;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.profile-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
}

.profile-info {
  margin-bottom: 0.75rem;
}

.profile-name {
  font-weight: 800;
  font-size: 0.9rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2c3e50;
}

.profile-dept {
  font-size: 0.75rem;
  color: #7f8c8d;
  margin: 0.25rem 0 0;
  font-weight: 700;
}

.profile-menu-btn {
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: none;
  color: #7f8c8d;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  position: relative;
}

.profile-menu-btn:hover {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.profile-menu {
  position: absolute;
  top: 100%;
  left: 1rem;
  right: 1rem;
  background: #ffffff;
  border: 1px solid var(--teacher-border);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  margin-top: 0.5rem;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: #2c3e50;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-weight: 600;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item.logout {
  color: #e74c3c;
  font-weight: 700;
}

/* Main Content Area */
.teacher-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Top Navigation Bar */
.teacher-navbar {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-bottom: 1px solid #34495e;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.sidebar-hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #ffffff;
  font-size: 1.5rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  width: 300px;
}

.search-input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  color: white;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-container i {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.notifications-container {
  position: relative;
}

.notification-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  color: white;
  font-size: 1.25rem;
  transition: all 0.2s ease;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.notification-btn:hover {
  color: var(--teacher-primary);
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--teacher-danger);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #ffffff;
  border: 1px solid var(--teacher-border);
  border-radius: 0.75rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 400px;
}

.dropdown-header {
  padding: 1rem;
  border-bottom: 1px solid var(--teacher-border);
  font-weight: 800;
  color: #1f2937;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 1rem;
  border-bottom: 1px solid var(--teacher-border);
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #e8f4f8;
}

.notif-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notif-content strong {
  color: #1f2937;
  font-weight: 800;
}

.notif-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.notif-content small {
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-weight: 600;
}

.dropdown-footer {
  display: block;
  width: 100%;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid var(--teacher-border);
  color: #3498db;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 800;
  transition: background 0.2s;
}

.dropdown-footer:hover {
  background: #f8f9fa;
}

.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.theme-toggle:hover {
  color: rgba(255, 255, 255, 0.8);
}

.profile-container {
  position: relative;
}

.profile-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.2s;
}

.profile-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.profile-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-weight: 900;
  font-size: 0.9rem;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #ffffff;
  border: 1px solid var(--teacher-border);
  border-radius: 0.75rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 200px;
}

.dropdown-item-group {
  padding: 1rem;
  border-bottom: 1px solid var(--teacher-border);
}

.dropdown-label {
  margin: 0;
  font-weight: 800;
  font-size: 0.9rem;
  color: #1f2937;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: #2c3e50;
  text-decoration: none;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
  width: 100%;
  text-align: left;
  font-weight: 600;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item.logout {
  color: #e74c3c;
  font-weight: 700;
}

.dropdown-divider {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px solid var(--teacher-border);
}

.teacher-content {
  flex: 1;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f3 100%);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .search-container {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .teacher-sidebar {
    position: fixed;
    left: -260px;
    transition: left 0.3s;
    z-index: 1002;
  }

  .teacher-sidebar.sidebar-open {
    left: 0;
  }

  .teacher-main {
    margin-left: 0;
  }

  .sidebar-hamburger {
    display: block;
  }

  .sidebar-toggle {
    display: block;
  }

  .navbar-left {
    gap: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .navbar-right {
    gap: 1rem;
  }

  .search-container {
    display: none;
  }

  .teacher-navbar {
    padding: 1rem;
  }

  .teacher-content {
    padding: 1rem;
  }

  .notifications-dropdown,
  .profile-dropdown {
    min-width: 300px;
    right: -1rem;
  }
}

@media (max-width: 480px) {
  .teacher-sidebar {
    width: 100%;
  }

  .logo-text {
    display: none;
  }

  .page-title {
    font-size: 1.1rem;
  }

  .notifications-dropdown {
    min-width: calc(100vw - 2rem);
  }
}
</style>
