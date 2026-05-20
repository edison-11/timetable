<template>
  <header class="app-navbar">
    <button
      class="menu-toggle"
      type="button"
      :class="{ active: sidebarOpen }"
      :aria-expanded="sidebarOpen"
      aria-label="Toggle navigation menu"
      @click="toggleSidebar"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path class="hamburger-line top" d="M4 7h16" />
        <path class="hamburger-line middle" d="M4 12h16" />
        <path class="hamburger-line bottom" d="M4 17h16" />
      </svg>
    </button>

    <div class="search-bar">
      <input v-model="searchQuery" type="search" placeholder="Search anything..." @keyup.enter="runSearch">
      <span class="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/></svg>
      </span>
    </div>

    <div class="navbar-right">
      <button
        class="dark-mode-toggle"
        type="button"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-pressed="isDarkMode"
        @click="toggleDarkMode"
      >
        <span class="theme-icon" :class="{ sun: isDarkMode }"></span>
      </button>

      <div class="notifications-menu" ref="notificationsMenu">
        <button
          class="notifications-btn"
          type="button"
          title="Notifications"
          aria-label="Notifications"
          :aria-expanded="showNotifications"
          @click="toggleNotifications"
        >
          <span class="bell-icon" aria-hidden="true"></span>
          <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
      </button>

        <div v-if="showNotifications" class="notifications-dropdown">
          <div class="notifications-header">
            <strong>Notifications</strong>
            <div class="notification-header-actions">
              <button type="button" @click="markAllRead">Mark all read</button>
              <button type="button" @click="clearNotifications" :disabled="!notifications.length">Clear</button>
            </div>
          </div>

          <div v-if="!notifications.length" class="notification-empty">
            No notifications yet.
          </div>

          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            role="button"
            tabindex="0"
            @click="openNotification(notification)"
            @keyup.enter="openNotification(notification)"
          >
            <span class="notification-dot" :class="notification.tone"></span>
            <span>
              <strong>{{ notification.title }}</strong>
              <em v-if="notification.message">{{ notification.message }}</em>
              <small>{{ notification.time }}</small>
              <span v-if="notification.action_required" class="notification-actions" @click.stop>
                <button type="button" class="approve-action" @click="approvePendingTeacher(notification)">Approve</button>
                <button type="button" class="reject-action" @click="rejectPendingTeacher(notification)">Reject</button>
              </span>
            </span>
            <span
              class="notification-delete"
              role="button"
              tabindex="0"
              title="Delete notification"
              @click.stop="deleteNotification(notification)"
              @keyup.enter.stop="deleteNotification(notification)"
            >
              x
            </span>
          </div>

          <button class="view-all-notifications" type="button" @click="goToDashboardNotifications">
            View all notifications
          </button>
        </div>
      </div>

      <div class="account-menu" ref="accountMenu">
        <button
          class="user-menu"
          type="button"
          title="Account"
          aria-label="Account menu"
          :aria-expanded="showAccountMenu"
          @click="toggleAccountMenu"
        >
          <img v-if="profileImageUrl" :src="profileImageUrl" alt="">
          <span v-else>{{ profileInitials }}</span>
        </button>

        <div v-if="showAccountMenu" class="account-dropdown">
          <div class="account-header">
            <div class="account-avatar-large">
              <img v-if="profileImageUrl" :src="profileImageUrl" alt="">
              <span v-else>{{ profileInitials }}</span>
            </div>
            <div>
              <strong>{{ currentUserName }}</strong>
              <small>{{ currentUserEmail }}</small>
            </div>
          </div>

          <form class="profile-form" @submit.prevent="saveProfile">
            <label>
              Profile Image
              <input type="file" accept="image/*" @change="handleProfilePhotoChange">
            </label>

            <label>
              {{ isTeacherAccount ? 'Teacher Name' : 'Admin Name' }}
              <input v-model.trim="profileForm.name" type="text" minlength="3" required>
            </label>

            <label>
              Email
              <input v-model.trim="profileForm.email" type="email" required>
            </label>

            <label v-if="isTeacherAccount">
              Department
              <input v-model.trim="profileForm.department" type="text" required>
            </label>

            <label>
              New Password
              <input v-model="profileForm.password" type="password" minlength="6" placeholder="Leave blank to keep current">
            </label>

            <p v-if="profileMessage" class="profile-message" :class="{ error: profileError }">
              {{ profileMessage }}
            </p>

            <div class="account-actions">
              <button class="save-profile-btn" type="submit" :disabled="savingProfile">
                {{ savingProfile ? 'Saving...' : 'Save Profile' }}
              </button>
              <button class="logout-btn" type="button" @click="logout">
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')
const showNotifications = ref(false)
const showAccountMenu = ref(false)
const sidebarOpen = ref(false)
const isDarkMode = ref(false)
const notificationsMenu = ref(null)
const accountMenu = ref(null)
const selectedProfilePhoto = ref(null)
const profilePreviewUrl = ref('')
const savingProfile = ref(false)
const profileMessage = ref('')
const profileError = ref(false)
const profileForm = ref({
  name: '',
  email: '',
  department: '',
  password: '',
  profile_photo: ''
})
const notifications = ref([])
const readNotificationIds = ref(new Set(JSON.parse(localStorage.getItem('readNotificationIds') || '[]').map(String)))

const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)
const currentUser = computed(() => authStore.currentUser || {})
const isTeacherAccount = computed(() => authStore.currentUserType === 'teacher')
const currentUserName = computed(() => currentUser.value.name || currentUser.value.username || 'Admin')
const currentUserEmail = computed(() => currentUser.value.email || 'No email set')
const profileInitials = computed(() => {
  const name = currentUserName.value.trim()
  return name ? name.slice(0, 1).toUpperCase() : 'A'
})
const profileImageUrl = computed(() => profilePreviewUrl.value || resolveAssetUrl(currentUser.value.profile_photo))

const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  if (path.startsWith('/uploads/')) return path

  const apiRoot = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`
}

const hydrateProfileForm = ({ clearStatus = true } = {}) => {
  profileForm.value = {
    name: currentUser.value.name || currentUser.value.username || '',
    email: currentUser.value.email || '',
    department: currentUser.value.department || '',
    password: '',
    profile_photo: currentUser.value.profile_photo || ''
  }
  selectedProfilePhoto.value = null
  profilePreviewUrl.value = ''
  if (clearStatus) {
    profileMessage.value = ''
    profileError.value = false
  }
}

const toggleSidebar = () => {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const nextState = !sidebarOpen.value
  sidebarOpen.value = nextState

  if (isMobile) {
    document.body.classList.remove('sidebar-collapsed')
    document.querySelector('.admin-sidebar')?.classList.toggle('mobile-open', nextState)
    document.querySelector('.sidebar-backdrop')?.classList.toggle('visible', nextState)
    document.body.classList.toggle('sidebar-open', nextState)
    return
  }

  document.querySelector('.admin-sidebar')?.classList.remove('mobile-open')
  document.querySelector('.sidebar-backdrop')?.classList.remove('visible')
  document.body.classList.remove('sidebar-open')
  document.body.classList.toggle('sidebar-collapsed', !nextState)
}

const applyDarkMode = () => {
  document.body.classList.toggle('admin-dark-mode', isDarkMode.value)
  localStorage.setItem('adminDarkMode', JSON.stringify(isDarkMode.value))
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  applyDarkMode()
}

const runSearch = () => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return

  const destinations = [
    { terms: ['dashboard', 'home', 'overview'], path: '/dashboard' },
    { terms: ['timetable', 'schedule'], path: '/timetable' },
    { terms: ['class', 'classes'], path: '/classes' },
    { terms: ['subject', 'module', 'modules'], path: '/modules' },
    { terms: ['room', 'rooms', 'classroom'], path: '/rooms' },
    { terms: ['teacher', 'teachers'], path: '/teachers' },
    { terms: ['section', 'sections'], path: '/sections' },
    { terms: ['assignment', 'assignments'], path: '/assignments' },
    { terms: ['shift', 'shifts'], path: '/shifts' },
    { terms: ['setting', 'settings'], path: '/settings' }
  ]
  const destination = destinations.find(item => item.terms.some(term => term.includes(query) || query.includes(term)))

  if (destination) router.push(destination.path)
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

const fetchNotifications = async () => {
  try {
    const response = await api.get('/notifications?limit=8')
    notifications.value = (response.data.notifications || []).map((notification) => ({
      ...notification,
      tone: notification.tone || 'blue',
      path: notification.path || '/dashboard',
      time: formatNotificationTime(notification.created_at),
      read: readNotificationIds.value.has(String(notification.id))
    }))
  } catch (error) {
    console.error('Failed to load notifications', error)
    notifications.value = []
  }
}

const rememberReadNotifications = () => {
  localStorage.setItem('readNotificationIds', JSON.stringify([...readNotificationIds.value]))
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showAccountMenu.value = false

  if (showNotifications.value) {
    fetchNotifications()
  }
}

const markAllRead = () => {
  notifications.value.forEach((item) => readNotificationIds.value.add(String(item.id)))
  notifications.value = notifications.value.map(item => ({ ...item, read: true }))
  rememberReadNotifications()
}

const deleteNotification = async (notification) => {
  try {
    await api.delete(`/notifications/${notification.id}`)
    readNotificationIds.value.delete(Number(notification.id))
    notifications.value = notifications.value.filter(item => Number(item.id) !== Number(notification.id))
    rememberReadNotifications()
  } catch (error) {
    console.error('Failed to delete notification', error)
  }
}

const clearNotifications = async () => {
  if (!notifications.value.length) return

  try {
    await api.delete('/notifications')
    notifications.value = []
    readNotificationIds.value = new Set()
    rememberReadNotifications()
  } catch (error) {
    console.error('Failed to clear notifications', error)
  }
}

const openNotification = (notification) => {
  notification.read = true
  readNotificationIds.value.add(String(notification.id))
  rememberReadNotifications()
  showNotifications.value = false
  router.push(notification.path)
}

const approvePendingTeacher = async (notification) => {
  if (!notification.entity_id) return
  await api.put(`/teachers/${notification.entity_id}/approve`)
  await fetchNotifications()
}

const rejectPendingTeacher = async (notification) => {
  if (!notification.entity_id) return
  if (!confirm('Reject this teacher registration request?')) return
  await api.delete(`/teachers/${notification.entity_id}/reject`)
  await fetchNotifications()
}

const goToDashboardNotifications = () => {
  showNotifications.value = false
  router.push({ path: '/dashboard', hash: '#notifications' })
}

const toggleAccountMenu = () => {
  if (!showAccountMenu.value) {
    hydrateProfileForm()
  }

  showAccountMenu.value = !showAccountMenu.value
  showNotifications.value = false
}

const handleProfilePhotoChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (profilePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(profilePreviewUrl.value)
  }

  selectedProfilePhoto.value = file
  profilePreviewUrl.value = URL.createObjectURL(file)
}

const saveProfile = async () => {
  savingProfile.value = true
  profileMessage.value = ''
  profileError.value = false

  try {
    const displayName = profileForm.value.name.trim()
    const email = profileForm.value.email.trim()
    const department = profileForm.value.department.trim()

    if (displayName.length < 3) {
      throw new Error(`${isTeacherAccount.value ? 'Teacher name' : 'Admin name'} must be at least 3 characters`)
    }

    if (!email) {
      throw new Error('Email is required')
    }

    if (isTeacherAccount.value && !department) {
      throw new Error('Department is required')
    }

    let profilePhotoPath = currentUser.value.profile_photo || null

    if (selectedProfilePhoto.value) {
      const formData = new FormData()
      formData.append('photo', selectedProfilePhoto.value)
      const uploadResponse = await api.post('/upload/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      profilePhotoPath = uploadResponse.data.photo.path
    } else if (!profileForm.value.profile_photo) {
      profilePhotoPath = null
    }

    const payload = isTeacherAccount.value
      ? {
          name: displayName,
          email,
          department,
          profile_photo: profilePhotoPath
        }
      : {
          username: displayName,
          email,
          profile_photo: profilePhotoPath
        }

    if (profileForm.value.password) {
      payload.password = profileForm.value.password
    }

    const result = await authStore.updateProfile(payload)

    if (!result.success) {
      throw new Error(result.error)
    }

    selectedProfilePhoto.value = null
    if (profilePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(profilePreviewUrl.value)
    }
    profilePreviewUrl.value = ''
    profileMessage.value = 'Profile updated successfully'
    await fetchNotifications()
  } catch (error) {
    profileError.value = true
    profileMessage.value = error.response?.data?.message || error.message || 'Profile update failed'
  } finally {
    savingProfile.value = false
  }
}

const closeMenusOnOutsideClick = (event) => {
  if (!notificationsMenu.value?.contains(event.target)) {
    showNotifications.value = false
  }

  if (!accountMenu.value?.contains(event.target)) {
    showAccountMenu.value = false
  }
}

const syncSidebarState = () => {
  const isMobileOpen = document.querySelector('.admin-sidebar')?.classList.contains('mobile-open') || false
  const isDesktopCollapsed = document.body.classList.contains('sidebar-collapsed')

  sidebarOpen.value = isMobileOpen || !isDesktopCollapsed
  document.body.classList.toggle('sidebar-open', isMobileOpen)
}

onMounted(() => {
  isDarkMode.value = JSON.parse(localStorage.getItem('adminDarkMode') || 'false')
  applyDarkMode()
  hydrateProfileForm()
  fetchNotifications()
  syncSidebarState()
  document.addEventListener('click', closeMenusOnOutsideClick)
  document.addEventListener('sidebar:closed', syncSidebarState)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenusOnOutsideClick)
  document.removeEventListener('sidebar:closed', syncSidebarState)
})

watch(currentUser, () => hydrateProfileForm({ clearStatus: false }))

const logout = () => {
  authStore.logout()
  localStorage.removeItem('token')
  localStorage.removeItem('userType')
  router.push('/login')
}
</script>

<style scoped>
.app-navbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 260px;
  height: 70px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  background: #f8fafc;
  border: 1px solid #dbe5f3;
  border-radius: 10px;
  cursor: pointer;
  color: #334155;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.menu-toggle:hover,
.menu-toggle:focus-visible,
.menu-toggle.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
  outline: none;
}

.menu-toggle svg {
  width: 24px;
  height: 24px;
}

.hamburger-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  transition: transform 0.22s ease, opacity 0.18s ease;
  transform-origin: center;
}

.menu-toggle.active .top {
  transform: none;
}

.menu-toggle.active .middle {
  opacity: 1;
}

.menu-toggle.active .bottom {
  transform: none;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-bar input {
  width: 100%;
  height: 42px;
  padding: 0 3rem 0 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
}

.search-bar input::placeholder {
  color: #64748b;
}

.search-icon {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.search-icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notifications-menu {
  position: relative;
}

.notifications-btn {
  position: relative;
  width: 42px;
  height: 42px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  cursor: pointer;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.notifications-btn:hover,
.notifications-btn:focus-visible {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
  outline: none;
}

.dark-mode-toggle {
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

.dark-mode-toggle::before {
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

.dark-mode-toggle::after {
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

.dark-mode-toggle:hover,
.dark-mode-toggle:focus-visible {
  border-color: #93c5fd;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.14);
  outline: none;
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

.bell-icon {
  position: relative;
  width: 16px;
  height: 18px;
  border: 2px solid currentColor;
  border-bottom: none;
  border-radius: 10px 10px 4px 4px;
}

.bell-icon::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  width: 6px;
  height: 5px;
  border-radius: 6px 6px 0 0;
  border: 2px solid currentColor;
  border-bottom: none;
  transform: translateX(-50%);
}

.bell-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  transform: translateX(-50%);
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

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(340px, calc(100vw - 2rem));
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 200;
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1f2937;
  font-weight: 800;
}

.notification-header-actions {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
}

.notifications-header button,
.view-all-notifications {
  border: none;
  background: transparent;
  color: #3498db;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.8rem;
}

.notifications-header button:hover,
.view-all-notifications:hover {
  color: #2980b9;
}

.notifications-header button:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.notification-item {
  width: 100%;
  display: grid;
  grid-template-columns: 10px 1fr 24px;
  gap: 0.75rem;
  align-items: start;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
}

.notification-item:hover,
.notification-item:focus-visible {
  background: #f8fafc;
  outline: none;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-empty {
  color: #6b7280;
  font-size: 0.85rem;
  padding: 0.85rem 0.5rem;
  text-align: center;
  font-weight: 600;
}

.notification-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 0.35rem;
}

.notification-dot.blue { background: #3b82f6; }
.notification-dot.amber { background: #f59e0b; }
.notification-dot.green { background: #22c55e; }
.notification-dot.violet { background: #8b5cf6; }
.notification-dot.rose { background: #f43f5e; }

.notification-item strong {
  display: block;
  color: #1f2937;
  font-size: 0.88rem;
  line-height: 1.35;
  font-weight: 800;
}

.notification-item em {
  display: block;
  margin-top: 0.15rem;
  color: #475569;
  font-size: 0.68rem;
  font-style: normal;
  line-height: 1.3;
}

.notification-item small {
  display: block;
  color: #6b7280;
  margin-top: 0.2rem;
  font-weight: 600;
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

.notification-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: #94a3b8;
  font-weight: 900;
}

.notification-delete:hover,
.notification-delete:focus-visible {
  color: #991b1b;
  background: #fee2e2;
  outline: none;
}

.view-all-notifications {
  width: 100%;
  padding: 0.75rem 0.5rem 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.account-menu {
  position: relative;
}

.user-menu {
  width: 42px;
  height: 42px;
  background: transparent;
  border: 2px solid #cbd5e1;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.user-menu:hover,
.user-menu:focus-visible {
  border-color: #93c5fd;
}

.user-menu span {
  width: 100%;
  height: 100%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.9rem;
}

.user-menu img,
.account-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(360px, calc(100vw - 2rem));
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  z-index: 200;
}

.account-header {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 0.75rem;
  align-items: center;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.account-header strong,
.account-header small {
  display: block;
}

.account-header strong {
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 800;
}

.account-header small {
  color: #6b7280;
  margin-top: 0.15rem;
  word-break: break-word;
  font-weight: 600;
}

.account-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.1rem;
  overflow: hidden;
}

.profile-form {
  display: grid;
  gap: 0.75rem;
  padding-top: 0.9rem;
}

.profile-form label {
  display: grid;
  gap: 0.35rem;
  color: #1f2937;
  font-size: 0.78rem;
  font-weight: 800;
}

.profile-form input {
  width: 100%;
  min-height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  color: #1f2937;
  font: inherit;
  font-weight: 600;
  background: #ffffff;
}

.profile-form input:focus {
  border-color: #3498db;
  outline: 3px solid rgba(52, 152, 219, 0.2);
}

.profile-message {
  margin: 0;
  color: #059669;
  font-size: 0.82rem;
  font-weight: 800;
}

.profile-message.error {
  color: #dc2626;
}

.account-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.save-profile-btn,
.logout-btn {
  min-height: 38px;
  border: none;
  border-radius: 8px;
  padding: 0 0.85rem;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.85rem;
}

.save-profile-btn {
  background: #3498db;
  color: white;
  transition: background 0.2s ease;
}

.save-profile-btn:hover:not(:disabled) {
  background: #2980b9;
}

.save-profile-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.logout-btn {
  background: #f1f5f9;
  color: #dc2626;
  font-weight: 800;
  transition: background 0.2s ease;
}

.logout-btn:hover {
  background: #fee2e2;
}

@media (max-width: 768px) {
  .app-navbar {
    left: 0;
    gap: 0.75rem;
    padding: 0 1rem;
  }
}

</style>

<style>
body.sidebar-collapsed .app-navbar {
  left: 80px;
}

body.admin-dark-mode .app-navbar {
  background: #111827;
  border-bottom-color: #263247;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

body.admin-dark-mode .menu-toggle,
body.admin-dark-mode .notifications-btn {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

body.admin-dark-mode .menu-toggle:hover,
body.admin-dark-mode .menu-toggle:focus-visible,
body.admin-dark-mode .menu-toggle.active,
body.admin-dark-mode .notifications-btn:hover,
body.admin-dark-mode .notifications-btn:focus-visible {
  background: #172554;
  border-color: #2563eb;
  color: #bfdbfe;
}

body.admin-dark-mode .dark-mode-toggle {
  background: linear-gradient(135deg, #020617 0%, #111827 100%);
  border-color: #334155;
  color: #bfdbfe;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.05),
    0 8px 22px rgba(0, 0, 0, 0.2);
}

body.admin-dark-mode .dark-mode-toggle:hover,
body.admin-dark-mode .dark-mode-toggle:focus-visible {
  border-color: #60a5fa;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.05),
    0 8px 24px rgba(37, 99, 235, 0.24);
}

body.admin-dark-mode .dark-mode-toggle::before {
  color: #64748b;
}

body.admin-dark-mode .dark-mode-toggle::after {
  color: #bfdbfe;
  opacity: 1;
}

body.admin-dark-mode .search-bar input,
body.admin-dark-mode .account-dropdown,
body.admin-dark-mode .notifications-dropdown {
  background: #0f172a !important;
  border-color: #334155;
  color: #e2e8f0;
}

body.admin-dark-mode .search-bar input::placeholder,
body.admin-dark-mode .search-icon,
body.admin-dark-mode .account-header small,
body.admin-dark-mode .notification-item em,
body.admin-dark-mode .notification-item small,
body.admin-dark-mode .notification-empty {
  color: #94a3b8;
}

body.admin-dark-mode .notifications-header,
body.admin-dark-mode .account-header {
  border-color: #263247;
  color: #f8fafc;
}

body.admin-dark-mode .account-header strong,
body.admin-dark-mode .notification-item strong,
body.admin-dark-mode .profile-form label {
  color: #f8fafc;
}

body.admin-dark-mode .notification-item,
body.admin-dark-mode .profile-form input,
body.admin-dark-mode .app-account-action {
  background: #0f172a;
  color: #e2e8f0;
  border-color: #334155;
}

body.admin-dark-mode .notification-item:hover,
body.admin-dark-mode .notification-item:focus-visible,
body.admin-dark-mode .notification-item.unread {
  background: #172554;
}

body.admin-dark-mode .logout-btn {
  background: #1f2937;
}
</style>
