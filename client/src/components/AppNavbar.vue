<template>
  <header class="app-navbar">
    <div class="navbar-left">
      <button
        class="menu-toggle"
        type="button"
        :class="{ active: sidebarOpen }"
        :aria-expanded="sidebarOpen"
        aria-label="Toggle navigation menu"
        @click="toggleSidebar"
      >
        <Menu :size="25" :stroke-width="2.25" aria-hidden="true" />
      </button>

      <router-link :to="dashboardPath" class="youtube-brand" :title="`${currentUserName} dashboard`">
        <img class="app-brand-logo" :src="logoUrl" alt="">
        <span class="youtube-name">{{ currentUserName }}</span>
      </router-link>
    </div>

    <div class="search-bar" role="combobox" aria-expanded="true" aria-label="Global command search">
      <input
        v-model="searchQuery"
        ref="searchInput"
        type="search"
        :placeholder="searchPlaceholder"
        autocomplete="off"
        @focus="searchOpen = true"
        @input="searchOpen = true"
        @keydown.down.prevent="moveSearch(1)"
        @keydown.up.prevent="moveSearch(-1)"
        @keydown.enter.prevent="runSearch"
        @keydown.esc="searchOpen = false"
      >
      <button class="search-submit" type="button" title="Search" aria-label="Search" @click="runSearch">
        <Search :size="25" :stroke-width="2.25" aria-hidden="true" />
      </button>
      <div v-if="searchOpen" class="search-dropdown">
        <strong>{{ searchQuery ? 'Instant Results' : 'Recent Searches' }}</strong>
        <button
          v-for="(item, index) in commandResults"
          :key="`${item.label}-${item.path}`"
          type="button"
          :class="{ active: activeSearchIndex === index }"
          @mousedown.prevent="selectCommand(item)"
        >
          <span>{{ item.type }}</span>
          <em>{{ item.label }}</em>
        </button>
      </div>
    </div>

    <div class="navbar-right">
      <div class="create-menu" ref="createMenu">
        <button
          class="create-button"
          type="button"
          title="Create"
          :aria-expanded="showCreateMenu"
          @click="toggleCreateMenu"
        >
          <Plus :size="23" :stroke-width="2.35" aria-hidden="true" />
          <span>Create</span>
        </button>

        <div v-if="showCreateMenu" class="create-dropdown">
          <strong>What do you want to add?</strong>
          <button
            v-for="item in createOptions"
            :key="`${item.path}-${item.action}`"
            type="button"
            @click="selectCreateOption(item)"
          >
            <component :is="item.icon" :size="18" :stroke-width="2.2" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>

      <button
        class="theme-toggle"
        type="button"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-pressed="isDarkMode"
        @click="toggleDarkMode"
      >
        <Sun v-if="isDarkMode" :size="21" :stroke-width="2.25" aria-hidden="true" />
        <Moon v-else :size="21" :stroke-width="2.25" aria-hidden="true" />
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
          <Bell :size="23" :stroke-width="2.25" aria-hidden="true" />
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

          <div class="notification-tabs" role="tablist" aria-label="Notification filters">
            <button
              v-for="tab in notificationTabs"
              :key="tab"
              type="button"
              :class="{ active: activeNotificationTab === tab }"
              @click="activeNotificationTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <div v-if="notificationsLoading" class="notification-loading" role="status">
            <strong>Loading notifications...</strong>
            <span v-for="item in 4" :key="item"></span>
          </div>

          <div v-else-if="!visibleNotifications.length" class="notification-empty">
            <span aria-hidden="true">!</span>
            <strong>No notifications found</strong>
            <small>There is nothing in {{ activeNotificationTab.toLowerCase() }} right now.</small>
            <button type="button" @click="activeNotificationTab = 'All'">View Notification History</button>
          </div>

          <template v-else>
            <div
              v-for="notification in visibleNotifications"
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
                  <button type="button" class="approve-action" @click="approvePendingItem(notification)">Approve</button>
                  <button type="button" class="reject-action" @click="rejectPendingItem(notification)">Reject</button>
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
                <X :size="17" :stroke-width="2.2" />
              </span>
            </div>
          </template>

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

          <nav class="account-links" aria-label="Account navigation">
            <router-link :to="isTeacherAccount ? '/teacher/profile' : '/settings?section=profile'" class="account-link" @click="showAccountMenu = false">
              <UserRound :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Profile</span>
            </router-link>
            <router-link :to="isTeacherAccount ? '/teacher/settings' : '/settings'" class="account-link" @click="showAccountMenu = false">
              <Settings :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Settings</span>
            </router-link>
            <button class="account-link" type="button" @click="goToDashboardNotifications">
              <Bell :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Notifications</span>
            </button>
            <router-link to="/settings?section=security" class="account-link" @click="showAccountMenu = false">
              <ShieldCheck :size="17" :stroke-width="2.2" aria-hidden="true" />
              <span>Security</span>
            </router-link>
            <button
              class="account-link danger"
              type="button"
              title="Logout"
              aria-label="Logout"
              @click="logout"
            >
              <LogOut :size="18" :stroke-width="2.2" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </header>

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

  <div v-if="navbarToast" class="navbar-toast" role="status">
    {{ navbarToast }}
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  DoorOpen,
  GraduationCap,
  Layers,
  LogOut,
  Menu,
  Moon,
  Plus,
  School,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  UserRoundPlus,
  Users,
  X
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const searchQuery = ref('')
const searchOpen = ref(false)
const searchInput = ref(null)
const activeSearchIndex = ref(0)
const recentSearches = ref(JSON.parse(localStorage.getItem('adminRecentSearches') || '[]'))
const showNotifications = ref(false)
const showAccountMenu = ref(false)
const showCreateMenu = ref(false)
const activeNotificationTab = ref('Unread')
const sidebarOpen = ref(false)
const isDarkMode = ref(false)
const notificationsMenu = ref(null)
const accountMenu = ref(null)
const createMenu = ref(null)
const notifications = ref([])
const notificationsLoading = ref(false)
const navbarToast = ref('')
const rejectDialog = ref({ open: false, notification: null, loading: false })
const readNotificationIds = ref(new Set(JSON.parse(localStorage.getItem('readNotificationIds') || '[]').map(String)))
const archivedNotificationIds = ref(new Set(JSON.parse(localStorage.getItem('archivedNotificationIds') || '[]').map(String)))

const notificationTabs = ['Unread', 'Read', 'Archived', 'System', 'Billing', 'Security', 'Announcements', 'All']
const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`
const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)
const visibleNotifications = computed(() => notifications.value.filter((notification) => {
  const id = String(notification.id)
  const type = String(notification.category || notification.type || notification.tone || '').toLowerCase()
  if (activeNotificationTab.value === 'Unread') return !notification.read && !archivedNotificationIds.value.has(id)
  if (activeNotificationTab.value === 'Read') return notification.read && !archivedNotificationIds.value.has(id)
  if (activeNotificationTab.value === 'Archived') return archivedNotificationIds.value.has(id)
  if (activeNotificationTab.value === 'All') return true
  return type.includes(activeNotificationTab.value.toLowerCase())
}))
const currentUser = computed(() => authStore.currentUser || {})
const isTeacherAccount = computed(() => authStore.currentUserType === 'teacher')
const isSuperAdminAccount = computed(() => authStore.currentUserType === 'super_admin' || currentUser.value?.role === 'super_admin')
const currentUserName = computed(() => currentUser.value.name || currentUser.value.username || 'Admin')
const currentUserEmail = computed(() => currentUser.value.email || 'No email set')
const dashboardPath = computed(() => (isSuperAdminAccount.value ? '/super-admin/dashboard' : '/dashboard'))
const searchPlaceholder = computed(() => {
  if (isSuperAdminAccount.value) return 'Search schools, DOS, billing, reports...'
  return 'Search teachers, classes, subjects, timetable...'
})
const profileInitials = computed(() => {
  const name = currentUserName.value.trim()
  return name ? name.slice(0, 1).toUpperCase() : 'A'
})
const profileImageUrl = computed(() => resolveAssetUrl(currentUser.value.profile_photo))
const commandItems = computed(() => {
  const superAdminItems = [
    { type: 'Dashboard', label: 'Platform Overview', path: '/super-admin/dashboard', terms: ['dashboard', 'platform', 'overview', 'analytics'] },
    { type: 'Schools', label: 'Schools Section', path: '/super-admin/schools', terms: ['schools', 'school', 'approvals', 'subscriptions'] },
    { type: 'DOS', label: 'Directors of Studies', path: '/super-admin/dos', terms: ['dos', 'director', 'directors', 'studies', 'accounts'] },
    { type: 'Databases', label: 'Database Monitoring', path: '/super-admin/databases', terms: ['database', 'databases', 'storage', 'provisioning'] },
    { type: 'Billing', label: 'Billing Center', path: '/super-admin/billing', terms: ['billing', 'subscriptions', 'revenue', 'plans', 'payments'] },
    { type: 'Activity', label: 'Activity and Audit Logs', path: '/super-admin/activity', terms: ['audit', 'logs', 'security', 'activity', 'timeline'] },
    { type: 'Reports', label: 'Reports', path: '/super-admin/reports', terms: ['reports', 'exports', 'csv', 'pdf'] },
    { type: 'Administration', label: 'Administration Tools', path: '/super-admin/administration', terms: ['administration', 'announcement', 'maintenance', 'backup', 'roles', 'permissions'] },
    { type: 'Announcements', label: 'Announcements', path: '/announcements', terms: ['announcements', 'broadcasts', 'messages'] },
    { type: 'Notifications', label: 'Notifications', path: '/notifications', terms: ['notifications', 'alerts', 'requests', 'approvals'] },
    { type: 'Settings', label: 'Settings', path: '/settings', terms: ['settings', 'profile', 'security', 'preferences'] }
  ]
  const dosItems = [
    { type: 'Dashboard', label: 'DOS Dashboard', path: '/dashboard', terms: ['dashboard', 'home'] },
    { type: 'Timetable', label: 'Timetable', path: '/timetable', terms: ['timetable', 'schedule'] },
    { type: 'Teachers', label: 'Teachers', path: '/teachers', terms: ['teacher', 'teachers'] },
    { type: 'Classes', label: 'Classes', path: '/classes', terms: ['class', 'classes'] },
    { type: 'Announcements', label: 'Announcements', path: '/announcements', terms: ['announcements', 'broadcasts', 'messages'] },
    { type: 'Notifications', label: 'Notifications', path: '/notifications', terms: ['notifications', 'alerts', 'requests', 'approvals'] },
    { type: 'Settings', label: 'Settings', path: '/settings', terms: ['settings'] }
  ]
  return isSuperAdminAccount.value ? superAdminItems : dosItems
})
const commandResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const source = query
    ? commandItems.value.filter((item) => [item.label, item.type, ...item.terms].join(' ').toLowerCase().includes(query))
    : recentSearches.value.length ? recentSearches.value : commandItems.value.slice(0, 5)
  return source.slice(0, 8)
})
const superAdminCreateOptions = [
  { label: 'Add School', path: '/super-admin/schools', action: 'add', type: 'school', icon: School },
  { label: 'Add DOS', path: '/super-admin/dos', action: 'add', type: 'dos', icon: UserRoundPlus }
]
const dosCreateOptionsByPath = {
  '/teachers': [{ label: 'Add Teacher', path: '/teachers', action: 'add', type: 'teacher', icon: GraduationCap }],
  '/students': [{ label: 'Add Student', path: '/students', action: 'add', type: 'student', icon: Users }],
  '/classes': [{ label: 'Add Class', path: '/classes', action: 'add', type: 'class', icon: Building2 }],
  '/modules': [{ label: 'Add Subject', path: '/modules', action: 'add', type: 'module', icon: BookOpen }],
  '/sections': [{ label: 'Add Section', path: '/sections', action: 'add', type: 'section', icon: Layers }],
  '/rooms': [{ label: 'Add Room', path: '/rooms', action: 'add', type: 'room', icon: DoorOpen }],
  '/shifts': [{ label: 'Add Shift', path: '/shifts', action: 'add', type: 'shift', icon: Clock3 }],
  '/assignments': [{ label: 'Add Assignment', path: '/assignments', action: 'add', type: 'assignment', icon: ClipboardList }],
  '/timetable': [
    { label: 'Generate Timetable', path: '/timetable', action: 'generate', type: 'timetable', icon: CalendarDays },
    { label: 'Add Assignment', path: '/timetable', action: 'assignment', type: 'assignment', icon: ClipboardList }
  ]
}
const defaultDosCreateOptions = [
  { label: 'Add Teacher', path: '/teachers', action: 'add', type: 'teacher', icon: GraduationCap },
  { label: 'Add Class', path: '/classes', action: 'add', type: 'class', icon: Building2 },
  { label: 'Add Subject', path: '/modules', action: 'add', type: 'module', icon: BookOpen },
  { label: 'Add Student', path: '/students', action: 'add', type: 'student', icon: Users },
  { label: 'Create Timetable', path: '/timetable', action: 'generate', type: 'timetable', icon: CalendarDays }
]
const createOptions = computed(() => {
  if (isSuperAdminAccount.value) return superAdminCreateOptions
  return dosCreateOptionsByPath[route.path] || defaultDosCreateOptions
})
const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path

  const apiRoot = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`
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
  const item = commandResults.value[activeSearchIndex.value] || commandResults.value[0]
  if (item) selectCommand(item)
}

const moveSearch = (direction) => {
  if (!searchOpen.value) searchOpen.value = true
  const max = Math.max(commandResults.value.length - 1, 0)
  activeSearchIndex.value = Math.min(max, Math.max(0, activeSearchIndex.value + direction))
}

const selectCommand = (item) => {
  recentSearches.value = [item, ...recentSearches.value.filter((recent) => recent.path !== item.path)].slice(0, 6)
  localStorage.setItem('adminRecentSearches', JSON.stringify(recentSearches.value))
  searchQuery.value = ''
  searchOpen.value = false
  activeSearchIndex.value = 0
  router.push(item.path)
}

const toggleCreateMenu = () => {
  showCreateMenu.value = !showCreateMenu.value
  showNotifications.value = false
  showAccountMenu.value = false
}

const selectCreateOption = (item) => {
  showCreateMenu.value = false
  window.dispatchEvent(new CustomEvent('admin:create', { detail: { type: item.type, action: item.action } }))
  router.push({ path: item.path, query: { action: item.action, create: String(Date.now()) } })
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
  notificationsLoading.value = true
  try {
    const response = await api.get('/notifications?limit=8', { showGlobalLoader: false, showGlobalNotification: false })
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
  } finally {
    notificationsLoading.value = false
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

const handleGlobalKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchOpen.value = true
    searchInput.value?.focus()
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
  try {
    await api.put(endpoint)
    await fetchNotifications()
    // Success is indicated by notification refresh
  } catch (error) {
    console.error('Failed to approve registration:', error)
    showNavbarToast('Failed to approve registration. Please try again.')
  }
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
    await fetchNotifications()
  } catch (error) {
    console.error('Failed to reject registration:', error)
    showNavbarToast('Failed to reject registration. Please try again.')
    rejectDialog.value.loading = false
  }
}

const showNavbarToast = (message) => {
  navbarToast.value = message
  window.setTimeout(() => {
    if (navbarToast.value === message) navbarToast.value = ''
  }, 3200)
}

const goToDashboardNotifications = () => {
  showNotifications.value = false
  router.push('/notifications')
}

const toggleAccountMenu = () => {
  showAccountMenu.value = !showAccountMenu.value
  showNotifications.value = false
}

const closeMenusOnOutsideClick = (event) => {
  if (!event.target.closest?.('.search-bar')) {
    searchOpen.value = false
  }

  if (!notificationsMenu.value?.contains(event.target)) {
    showNotifications.value = false
  }

  if (!accountMenu.value?.contains(event.target)) {
    showAccountMenu.value = false
  }

  if (!createMenu.value?.contains(event.target)) {
    showCreateMenu.value = false
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
  fetchNotifications()
  syncSidebarState()
  document.addEventListener('click', closeMenusOnOutsideClick)
  document.addEventListener('sidebar:closed', syncSidebarState)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenusOnOutsideClick)
  document.removeEventListener('sidebar:closed', syncSidebarState)
  window.removeEventListener('keydown', handleGlobalKeydown)
})

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
  left: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.1rem;
  padding: 0 1.1rem;
  z-index: 500;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 245px;
}

.menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  background: #f1f5f9;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  color: #0f172a;
  transition: background 0.18s ease, color 0.18s ease;
}

.menu-toggle:hover,
.menu-toggle:focus-visible,
.menu-toggle.active {
  background: #e5e7eb;
  color: #000000;
  outline: none;
}

.menu-toggle svg {
  width: 25px;
  height: 25px;
}

.youtube-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  color: #0f172a;
  text-decoration: none;
}

.app-brand-logo {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 50%;
  object-fit: contain;
  background: #ffffff;
}

.youtube-name {
  min-width: 0;
  max-width: 175px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0f172a;
  font-size: 1.16rem;
  font-weight: 900;
}

.search-bar {
  position: relative;
  flex: 1 1 640px;
  max-width: 720px;
  display: flex;
  align-items: center;
}

.search-bar input {
  width: 100%;
  height: 48px;
  min-width: 0;
  padding: 0 1.15rem;
  border: 1px solid #cbd5e1;
  border-right: 0;
  border-radius: 24px 0 0 24px;
  background: #ffffff;
  color: #0f172a;
  font-size: 1rem;
  outline: none;
}

.search-bar input::placeholder {
  color: #64748b;
}

.search-bar input:focus {
  border-color: #2d6cdf;
}

.search-submit {
  width: 78px;
  height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 0 24px 24px 0;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-submit:hover,
.search-submit:focus-visible,
.create-button:hover,
.create-button:focus-visible,
.theme-toggle:hover,
.theme-toggle:focus-visible,
.notifications-btn:hover,
.notifications-btn:focus-visible {
  background: #e5e7eb;
  outline: none;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 900;
  display: grid;
  gap: 0.25rem;
  padding: 0.65rem;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
}

.search-dropdown > strong {
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
}

.search-dropdown button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.6rem;
  align-items: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #0f172a;
  cursor: pointer;
  padding: 0.55rem;
  text-align: left;
}

.search-dropdown button.active,
.search-dropdown button:hover {
  background: #eff6ff;
}

.search-dropdown span {
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.18rem 0.45rem;
}

.search-dropdown em {
  font-style: normal;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 245px;
  justify-content: flex-end;
}

.theme-toggle,
.notifications-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease, color 0.18s ease;
}

.create-button {
  min-width: 118px;
  height: 46px;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1.05rem;
  font-size: 0.92rem;
  font-weight: 850;
  transition: background 0.18s ease, color 0.18s ease;
}

.create-menu {
  position: relative;
}

.create-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  z-index: 220;
  width: min(240px, calc(100vw - 2rem));
  padding: 0.55rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
}

.create-dropdown strong {
  display: block;
  padding: 0.4rem 0.55rem 0.55rem;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.create-dropdown button {
  width: 100%;
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 0.65rem;
  text-align: left;
  font-weight: 850;
}

.create-dropdown button:hover,
.create-dropdown button:focus-visible {
  background: #f1f5f9;
  outline: none;
}

.notifications-menu {
  position: relative;
}

.notifications-btn {
  flex: 0 0 48px;
}

.badge {
  position: absolute;
  top: 4px;
  right: 1px;
  min-width: 22px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ff0033;
  color: white;
  font-size: 0.7rem;
  padding: 0 4px;
  border-radius: 999px;
  border: 2px solid #0f0f0f;
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
  display: grid;
  gap: 0.45rem;
  justify-items: center;
  color: #6b7280;
  font-size: 0.85rem;
  padding: 1.3rem 0.85rem;
  text-align: center;
  font-weight: 600;
}

.notification-empty span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 950;
}

.notification-empty strong {
  color: #0f172a;
}

.notification-empty button {
  border: 1px solid #bfdbfe;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 850;
  padding: 0.45rem 0.65rem;
}

.notification-loading {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem 0.5rem;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 900;
}

.notification-loading span {
  height: 52px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: notification-shimmer 1.1s infinite;
}

.notification-tabs {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid #e2e8f0;
}

.notification-tabs button {
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.35rem 0.55rem;
  white-space: nowrap;
}

.notification-tabs button.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.navbar-toast {
  position: fixed;
  top: 5rem;
  right: 1rem;
  z-index: 1400;
  max-width: min(360px, calc(100vw - 2rem));
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #991b1b;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
  font-weight: 850;
  padding: 0.85rem 1rem;
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

@keyframes notification-shimmer {
  to { background-position: -200% 0; }
}

.account-menu {
  position: relative;
}

.user-menu {
  width: 38px;
  height: 38px;
  background: transparent;
  border: 0;
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
  outline: 2px solid #3f3f3f;
  outline-offset: 2px;
}

.user-menu span {
  width: 100%;
  height: 100%;
  background: #0f4c81;
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
  width: min(280px, calc(100vw - 2rem));
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
  padding: 0.55rem;
  z-index: 200;
}

.account-header {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 0.65rem;
  align-items: center;
  padding: 0.45rem 0.5rem 0.7rem;
  border-bottom: 1px solid #e2e8f0;
}

.account-header strong,
.account-header small {
  display: block;
}

.account-header strong {
  color: #1f2937;
  font-size: 0.88rem;
  font-weight: 800;
}

.account-header small {
  color: #6b7280;
  margin-top: 0.08rem;
  word-break: break-word;
  font-weight: 600;
  font-size: 0.72rem;
}

.account-avatar-large {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.95rem;
  overflow: hidden;
}

.account-links {
  display: grid;
  gap: 0.18rem;
  padding-top: 0.45rem;
}

.account-link {
  display: flex;
  align-items: center;
  gap: 0.62rem;
  min-height: 38px;
  width: 100%;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #334155;
  padding: 0 0.65rem;
  text-align: left;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.account-link:hover,
.account-link:focus-visible {
  background: #f1f5f9;
  color: #2563eb;
  transform: translateX(3px);
  outline: none;
}

.account-link.danger {
  margin-top: 0.35rem;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 9px 9px;
  color: #dc2626;
  padding-top: 0.55rem;
}

.account-link.danger:hover,
.account-link.danger:focus-visible {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 768px) {
  .app-navbar {
    left: 0;
    gap: 0.55rem;
    padding: 0 0.75rem;
  }

  .navbar-left {
    min-width: 0;
    flex: 1;
  }

  .youtube-name {
    max-width: 128px;
  }

  .search-bar {
    display: none;
  }

  .navbar-right {
    min-width: 0;
    gap: 0.45rem;
  }

  .create-button {
    width: 44px;
    min-width: 44px;
    padding: 0;
  }

  .create-button span {
    display: none;
  }
}

</style>

<style>
body.sidebar-collapsed .app-navbar {
  left: 0;
}

body.admin-dark-mode .app-navbar {
  background: #0f0f0f;
  border-bottom-color: #242424;
  box-shadow: none;
}

body.admin-dark-mode .menu-toggle,
body.admin-dark-mode .notifications-btn,
body.admin-dark-mode .theme-toggle,
body.admin-dark-mode .create-button,
body.admin-dark-mode .search-submit {
  background: #222222;
  border-color: #3d3d3d;
  color: #f1f1f1;
}

body.admin-dark-mode .menu-toggle:hover,
body.admin-dark-mode .menu-toggle:focus-visible,
body.admin-dark-mode .menu-toggle.active,
body.admin-dark-mode .notifications-btn:hover,
body.admin-dark-mode .notifications-btn:focus-visible,
body.admin-dark-mode .theme-toggle:hover,
body.admin-dark-mode .theme-toggle:focus-visible,
body.admin-dark-mode .create-button:hover,
body.admin-dark-mode .create-button:focus-visible,
body.admin-dark-mode .search-submit:hover,
body.admin-dark-mode .search-submit:focus-visible {
  background: #303030;
  color: #ffffff;
}

body.admin-dark-mode .search-bar input,
body.admin-dark-mode .search-dropdown {
  background: #121212 !important;
  border-color: #3d3d3d;
  color: #f1f5f9;
}

body.admin-dark-mode .youtube-name {
  color: #ffffff;
}

body.admin-dark-mode .create-dropdown {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

body.admin-dark-mode .create-dropdown strong {
  color: #94a3b8;
}

body.admin-dark-mode .create-dropdown button {
  color: #f8fafc;
}

body.admin-dark-mode .create-button svg,
body.admin-dark-mode .create-button span,
body.admin-dark-mode .create-dropdown button svg,
body.admin-dark-mode .create-dropdown button span,
body.admin-dark-mode .account-link svg,
body.admin-dark-mode .account-link span,
body.admin-dark-mode .theme-toggle svg,
body.admin-dark-mode .notifications-btn svg,
body.admin-dark-mode .search-submit svg {
  color: currentColor !important;
}

body.admin-dark-mode .create-dropdown button:hover,
body.admin-dark-mode .create-dropdown button:focus-visible {
  background: #172554;
}

body.admin-dark-mode .account-dropdown,
body.admin-dark-mode .notifications-dropdown {
  background: #0f172a !important;
  border-color: #334155;
  color: #e2e8f0;
}

body.admin-dark-mode .search-dropdown button {
  color: #f8fafc;
}

body.admin-dark-mode .search-dropdown button.active,
body.admin-dark-mode .search-dropdown button:hover {
  background: #172554;
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
body.admin-dark-mode .notification-item strong {
  color: #f8fafc;
}

body.admin-dark-mode .notification-item,
body.admin-dark-mode .account-link,
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

body.admin-dark-mode .account-link:hover,
body.admin-dark-mode .account-link:focus-visible {
  background: #172554;
  color: #dbeafe;
}

body.admin-dark-mode .account-link.danger {
  color: #fecaca;
}

body.admin-dark-mode .account-link.danger {
  border-top-color: #263247;
}

body.admin-dark-mode .account-link.danger:hover,
body.admin-dark-mode .account-link.danger:focus-visible {
  background: rgba(127, 29, 29, 0.32);
  color: #fecaca;
}
</style>
