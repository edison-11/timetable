<template>
  <header class="app-navbar">
    <button class="menu-toggle" type="button" @click="toggleSidebar">
      <span></span><span></span><span></span>
    </button>

    <div class="search-bar">
      <input v-model="searchQuery" type="search" placeholder="Search anything..." @keyup.enter="runSearch">
      <span class="search-icon">Search</span>
    </div>

    <div class="navbar-right">
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
            <button type="button" @click="markAllRead">Mark all read</button>
          </div>

          <div v-if="!notifications.length" class="notification-empty">
            No notifications yet.
          </div>

          <button
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            type="button"
            @click="openNotification(notification)"
          >
            <span class="notification-dot" :class="notification.tone"></span>
            <span>
              <strong>{{ notification.title }}</strong>
              <small>{{ notification.time }}</small>
            </span>
          </button>

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
              Name
              <input v-model="profileForm.name" type="text" required>
            </label>

            <label>
              Email
              <input v-model="profileForm.email" type="email" required>
            </label>

            <label v-if="isTeacherAccount">
              Department
              <input v-model="profileForm.department" type="text" required>
            </label>

            <label>
              New Password
              <input v-model="profileForm.password" type="password" placeholder="Leave blank to keep current">
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
const readNotificationIds = ref(new Set(JSON.parse(localStorage.getItem('readNotificationIds') || '[]')))

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

const hydrateProfileForm = () => {
  profileForm.value = {
    name: currentUser.value.name || currentUser.value.username || '',
    email: currentUser.value.email || '',
    department: currentUser.value.department || '',
    password: '',
    profile_photo: currentUser.value.profile_photo || ''
  }
  selectedProfilePhoto.value = null
  profilePreviewUrl.value = ''
  profileMessage.value = ''
  profileError.value = false
}

const toggleSidebar = () => {
  document.querySelector('.admin-sidebar')?.classList.toggle('mobile-open')
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
      read: readNotificationIds.value.has(Number(notification.id))
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
  notifications.value.forEach((item) => readNotificationIds.value.add(Number(item.id)))
  notifications.value = notifications.value.map(item => ({ ...item, read: true }))
  rememberReadNotifications()
}

const openNotification = (notification) => {
  notification.read = true
  readNotificationIds.value.add(Number(notification.id))
  rememberReadNotifications()
  showNotifications.value = false
  router.push(notification.path)
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
          name: profileForm.value.name,
          email: profileForm.value.email,
          department: profileForm.value.department,
          password: profileForm.value.password,
          profile_photo: profilePhotoPath
        }
      : {
          username: profileForm.value.name,
          email: profileForm.value.email,
          password: profileForm.value.password,
          profile_photo: profilePhotoPath
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
    hydrateProfileForm()
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

onMounted(() => {
  hydrateProfileForm()
  fetchNotifications()
  document.addEventListener('click', closeMenusOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenusOnOutsideClick)
})

watch(currentUser, hydrateProfileForm)

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
  left: 240px;
  height: 70px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 100;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.menu-toggle span {
  width: 20px;
  height: 2px;
  background: #64748b;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-bar input {
  width: 100%;
  height: 42px;
  padding: 0 4rem 0 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  outline: none;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.75rem;
  pointer-events: none;
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
  background: #f1f5f9;
  border: 1px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.notifications-btn:hover,
.notifications-btn:focus-visible {
  background: #e0f2fe;
  border-color: #7dd3fc;
  color: #0369a1;
  outline: none;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
  padding: 0.5rem;
  z-index: 200;
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
}

.notifications-header button,
.view-all-notifications {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}

.notification-item {
  width: 100%;
  display: grid;
  grid-template-columns: 10px 1fr;
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
  color: #64748b;
  font-size: 0.85rem;
  padding: 0.85rem 0.5rem;
  text-align: center;
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
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.35;
}

.notification-item small {
  display: block;
  color: #64748b;
  margin-top: 0.2rem;
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
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  overflow: hidden;
}

.user-menu span {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
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
  color: #0f172a;
  font-size: 0.95rem;
}

.account-header small {
  color: #64748b;
  margin-top: 0.15rem;
  word-break: break-word;
}

.account-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
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
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
}

.profile-form input {
  width: 100%;
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  color: #0f172a;
  font: inherit;
  font-weight: 500;
}

.profile-form input:focus {
  border-color: #3b82f6;
  outline: 3px solid rgba(59, 130, 246, 0.18);
}

.profile-message {
  margin: 0;
  color: #047857;
  font-size: 0.82rem;
  font-weight: 700;
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
}

.save-profile-btn {
  background: #2563eb;
  color: white;
}

.save-profile-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.logout-btn {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 768px) {
  .app-navbar {
    left: 0;
  }
  .menu-toggle {
    display: flex;
  }
}
</style>
