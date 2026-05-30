<template>
  <AppLayout>
    <div class="settings-control" :class="{ 'is-compact': preferences.uiDensity === 'compact' }">
      <header class="settings-hero">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and platform preferences.</p>
        </div>
      </header>

      <div v-if="toast.message" class="toast-banner" :class="toast.type">
        <i :class="toast.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"></i>
        {{ toast.message }}
      </div>

      <section class="settings-shell">
        <aside class="settings-nav" :class="{ open: navOpen }">
          <button class="mobile-nav-toggle" type="button" @click="navOpen = !navOpen">
            <i class="bi bi-sliders"></i>
            Settings Menu
          </button>
          <div class="nav-list">
            <div v-for="group in navGroups" :key="group.label" class="nav-group">
              <strong>{{ group.label }}</strong>
              <button
                v-for="item in group.items"
                :key="item.id"
                type="button"
                class="nav-item"
                :class="{ active: activeSection === item.id }"
                :aria-label="item.label"
                :title="item.label"
                @click="selectSection(item.id)"
              >
                <component :is="item.icon" class="settings-svg" :size="18" :stroke-width="2.2" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>

        <main class="settings-content">
          <transition name="fade-slide" mode="out-in">
            <section v-if="activeSection === 'profile'" key="profile" class="section-grid">
              <div class="settings-card profile-card">
                <div class="card-heading">
                  <span class="heading-icon"><UserCircle :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">Profile Settings</span>
                    <h2>Personal Details</h2>
                  </div>
                </div>
                <div class="profile-row">
                  <div class="avatar-preview">
                    <img v-if="profilePhotoPreview" :src="profilePhotoPreview" alt="Profile avatar" />
                    <span v-else>{{ initials }}</span>
                  </div>
                  <div class="avatar-actions">
                    <label class="upload-btn">
                      <i class="bi bi-cloud-arrow-up"></i>
                      {{ avatarUploading ? 'Uploading...' : 'Upload' }}
                      <input type="file" accept="image/*" :disabled="avatarUploading" @change="handleAvatarUpload" />
                    </label>
                    <button class="tool-btn secondary" type="button" @click="removeAvatar">Remove</button>
                    <button class="tool-btn ghost" type="button" @click="notify('Crop preview is ready for an image-cropper integration.', 'success')">Crop</button>
                  </div>
                </div>
                <div class="form-grid two">
                  <label class="field">
                    <span>Full Name</span>
                    <input v-model.trim="profile.full_name" type="text" />
                  </label>
                  <label class="field">
                    <span>Email</span>
                    <input v-model.trim="profile.email" type="email" />
                    <em :class="emailValidation.valid ? 'valid-hint' : 'invalid-hint'">{{ emailValidation.message }}</em>
                  </label>
                  <label class="field">
                    <span>Phone Number</span>
                    <input v-model.trim="profile.phone" type="tel" />
                  </label>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'security'" key="security" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <span class="heading-icon"><ShieldCheck :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">Security Settings</span>
                    <h2>Password & Access</h2>
                  </div>
                </div>
                <div class="form-grid two">
                  <label class="field">
                    <span>New Password</span>
                    <input v-model="security.password" type="password" placeholder="Minimum 6 characters" />
                    <em :class="passwordStrength.tone">{{ passwordStrength.label }}</em>
                  </label>
                  <label class="field">
                    <span>Confirm Password</span>
                    <input v-model="security.confirmPassword" type="password" />
                    <em v-if="security.confirmPassword" :class="passwordsMatch ? 'valid-hint' : 'invalid-hint'">{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}</em>
                  </label>
                </div>
                <div class="security-actions">
                  <label class="toggle-row">
                    <input v-model="security.twoFactorEnabled" type="checkbox" />
                    <span></span>
                    <div>
                      <strong>Two-factor authentication</strong>
                      <small>Future-ready protection placeholder.</small>
                    </div>
                  </label>
                  <button class="tool-btn ghost" type="button" @click="notify('Session revocation is ready for backend token tracking.', 'success')">
                    <i class="bi bi-box-arrow-right"></i>
                    Logout from all devices
                  </button>
                </div>
              </div>
              <div class="settings-card">
                <div class="card-heading">
                  <span class="heading-icon"><Monitor :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">Login Sessions</span>
                    <h2>Recent Sessions</h2>
                  </div>
                </div>
                <div class="session-list">
                  <div v-for="session in sessions" :key="session.id" class="session-item">
                    <i :class="session.icon"></i>
                    <div>
                      <strong>{{ session.device }}</strong>
                      <span>{{ session.location }} · {{ session.time }}</span>
                    </div>
                    <em>{{ session.status }}</em>
                  </div>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'account'" key="account" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <span class="heading-icon"><UserCog :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">Account Settings</span>
                    <h2>Role & Workspace</h2>
                  </div>
                </div>
                <div class="account-summary">
                  <div><span>Role</span><strong>{{ account.role }}</strong></div>
                  <div><span>Status</span><strong>{{ account.status }}</strong></div>
                  <div><span>Default Dashboard</span><strong>{{ preferences.defaultView }}</strong></div>
                </div>
                <div class="quick-tools">
                  <button class="tool-btn secondary" type="button" @click="goToDefaultDashboard">
                    <i class="bi bi-speedometer2"></i>
                    Open Default Dashboard
                  </button>
                  <button class="tool-btn secondary" type="button" @click="router.push('/super-admin/schools')">
                    <i class="bi bi-building-check"></i>
                    Manage Schools
                  </button>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'notifications'" key="notifications" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <span class="heading-icon"><Bell :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">Notification Settings</span>
                    <h2>Alert Channels</h2>
                  </div>
                </div>
                <div class="toggle-list">
                  <label v-for="item in notificationOptions" :key="item.key" class="switch-card">
                    <input v-model="notifications[item.key]" type="checkbox" />
                    <span></span>
                    <div>
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.description }}</small>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'preferences'" key="preferences" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <span class="heading-icon"><SlidersHorizontal :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">System Preferences</span>
                    <h2>Default Behavior</h2>
                  </div>
                </div>
                <div class="form-grid two">
                  <label class="field">
                    <span>Language</span>
                    <select v-model="preferences.language">
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </label>
                  <label class="field">
                    <span>Time Format</span>
                    <select v-model="preferences.timeFormat">
                      <option value="24h">24 hour</option>
                      <option value="12h">12 hour</option>
                    </select>
                  </label>
                  <label class="field">
                    <span>Default Dashboard View</span>
                    <select v-model="preferences.defaultView">
                      <option value="Overview">Overview</option>
                      <option value="Schools">Schools</option>
                      <option value="DOS">DOS</option>
                      <option value="Reports">Reports</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'appearance'" key="appearance" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <span class="heading-icon"><Palette :size="19" :stroke-width="2.2" aria-hidden="true" /></span>
                  <div>
                    <span class="eyebrow">Appearance Settings</span>
                    <h2>Theme & Density</h2>
                  </div>
                </div>
                <div class="appearance-grid">
                  <button type="button" class="theme-card" :class="{ active: appearance.mode === 'light' }" @click="setThemeMode('light')">
                    <i class="bi bi-brightness-high"></i>
                    Light Mode
                  </button>
                  <button type="button" class="theme-card" :class="{ active: appearance.mode === 'dark' }" @click="setThemeMode('dark')">
                    <i class="bi bi-moon"></i>
                    Dark Mode
                  </button>
                </div>
                <div class="accent-row">
                  <span>Theme accent preview</span>
                  <button
                    v-for="accent in accents"
                    :key="accent"
                    type="button"
                    class="accent-dot"
                    :class="{ active: appearance.accent === accent }"
                    :style="{ background: accent }"
                    :title="`Use ${accent}`"
                    @click="setAccent(accent)"
                  ></button>
                </div>
                <label class="field">
                  <span>UI Density</span>
                  <select v-model="preferences.uiDensity">
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
              </div>
            </section>

          </transition>
        </main>
      </section>

      <div v-if="hasUnsavedChanges" class="sticky-save-bar">
        <strong>You have unsaved changes</strong>
        <div>
          <button class="tool-btn secondary" type="button" @click="discardChanges">Discard Changes</button>
          <button class="tool-btn primary" type="button" @click="saveActiveSection">Save Changes</button>
        </div>
      </div>

      <div v-if="unsavedModalOpen" class="modal-backdrop" @click.self="unsavedModalOpen = false">
        <section class="confirm-modal">
          <i class="bi bi-exclamation-triangle"></i>
          <h2>You have unsaved changes</h2>
          <p>Do you want to save before leaving this section?</p>
          <div class="modal-actions">
            <button class="tool-btn primary" type="button" @click="saveAndContinue">Save</button>
            <button class="tool-btn secondary" type="button" @click="discardAndContinue">Discard</button>
            <button class="tool-btn ghost" type="button" @click="unsavedModalOpen = false">Cancel</button>
          </div>
        </section>
      </div>

      <div v-if="showLogoutModal" class="modal-backdrop" @click.self="showLogoutModal = false">
        <section class="confirm-modal">
          <i class="bi bi-exclamation-triangle"></i>
          <h2>Confirm logout</h2>
          <p>You will be returned to the unified login page.</p>
          <div class="modal-actions">
            <button class="tool-btn secondary" type="button" @click="showLogoutModal = false">Cancel</button>
            <button class="tool-btn danger" type="button" @click="logout">Logout</button>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Monitor, Palette, ShieldCheck, SlidersHorizontal, UserCircle, UserCog } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'

const router = useRouter()
const authStore = useAuthStore()

const activeSection = ref('profile')
const navOpen = ref(false)
const showLogoutModal = ref(false)
const unsavedModalOpen = ref(false)
const pendingSection = ref('')
const hasUnsavedChanges = ref(false)
const baselineSnapshot = ref('')
const suppressDirty = ref(false)
const avatarUploading = ref(false)
const toast = reactive({ message: '', type: 'success' })
const settingsStorageKeys = {
  notifications: 'adminNotifications',
  preferences: 'adminPreferences',
  appearanceMode: 'adminAppearanceMode',
  darkMode: 'adminDarkMode',
  accent: 'adminAccent',
  twoFactor: 'adminTwoFactorEnabled',
  activity: 'adminActivityLogs'
}

const navGroups = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: UserCircle },
      { id: 'security', label: 'Security', icon: ShieldCheck },
      { id: 'account', label: 'Account', icon: UserCog }
    ]
  },
  {
    label: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal }
    ]
  }
]

const profile = reactive({
  full_name: '',
  email: '',
  phone: '',
  profile_photo: ''
})

const security = reactive({
  password: '',
  confirmPassword: '',
  twoFactorEnabled: false
})

const account = reactive({
  role: 'admin',
  status: 'Active'
})

const notifications = reactive({
  email: true,
  system: true,
  security: true
})

const notificationOptions = [
  { key: 'email', title: 'Email notifications', description: 'Receive important account and platform messages by email.' },
  { key: 'system', title: 'System alerts', description: 'Show operational alerts inside the dashboard.' },
  { key: 'security', title: 'Security alerts', description: 'Notify when account access or sensitive settings change.' }
]

const preferences = reactive({
  language: 'en',
  timeFormat: '24h',
  defaultView: 'Overview',
  uiDensity: 'comfortable'
})

const appearance = reactive({
  mode: localStorage.getItem('adminAppearanceMode') || 'light',
  accent: '#2563eb'
})

const accents = ['#2563eb', '#0891b2', '#16a34a', '#7c3aed', '#e11d48']

const sessions = [
  { id: 1, icon: 'bi bi-laptop', device: 'Current browser', location: 'Local session', time: 'Now', status: 'Active' },
  { id: 2, icon: 'bi bi-phone', device: 'Mobile web', location: 'Recent login', time: 'Yesterday', status: 'Known' }
]

const activityLogs = ref([
  { id: 1, event: 'Profile settings opened', user: 'Admin', time: 'Now', status: 'Viewed' },
  { id: 2, event: 'Settings preferences updated', user: 'System', time: 'Today', status: 'Complete' },
  { id: 3, event: 'Login session created', user: 'Admin', time: 'Recent', status: 'Success' }
])

const superAdminForm = reactive({
  email: '',
  full_name: '',
  username: '',
  phone: '',
  password: ''
})

const createdSuperAdmin = ref(null)
const creatingSuperAdmin = ref(false)
const adminToolMessage = ref('')
const adminToolMessageType = ref('success')

const initials = computed(() => {
  const name = profile.full_name || profile.email || 'A'
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
})

const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  const apiRoot = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`
}

const profilePhotoPreview = computed(() => resolveAssetUrl(profile.profile_photo))
const emailValidation = computed(() => {
  if (!profile.email) return { valid: false, message: 'Email is required' }
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
  return { valid, message: valid ? 'Valid email' : 'Invalid email format' }
})
const passwordsMatch = computed(() => security.password === security.confirmPassword)
const passwordStrength = computed(() => {
  if (!security.password) return { label: 'Password strength appears here', tone: 'muted-hint' }
  let score = 0
  if (security.password.length >= 8) score += 1
  if (/[A-Z]/.test(security.password)) score += 1
  if (/[0-9]/.test(security.password)) score += 1
  if (/[^A-Za-z0-9]/.test(security.password)) score += 1
  if (score <= 1) return { label: 'Weak password', tone: 'invalid-hint' }
  if (score === 2) return { label: 'Medium password', tone: 'warning-hint' }
  if (score === 3) return { label: 'Strong password', tone: 'valid-hint' }
  return { label: 'Very strong password', tone: 'valid-hint' }
})
const settingsSnapshot = computed(() => JSON.stringify({
  profile: { ...profile },
  security: { twoFactorEnabled: security.twoFactorEnabled, password: security.password, confirmPassword: security.confirmPassword },
  notifications: { ...notifications },
  preferences: { ...preferences },
  appearance: { ...appearance }
}))

const addActivity = (event, status = 'Complete', user = profile.full_name || account.role || 'Admin') => {
  activityLogs.value = [
    {
      id: Date.now(),
      event,
      user,
      time: new Date().toLocaleString(),
      status
    },
    ...activityLogs.value
  ].slice(0, 20)
  localStorage.setItem(settingsStorageKeys.activity, JSON.stringify(activityLogs.value))
}

const applyAppearance = () => {
  const isDark = appearance.mode === 'dark'
  document.body.classList.toggle('admin-dark-mode', isDark)
  localStorage.setItem(settingsStorageKeys.appearanceMode, appearance.mode)
  localStorage.setItem(settingsStorageKeys.darkMode, JSON.stringify(isDark))
  localStorage.setItem(settingsStorageKeys.accent, appearance.accent)
  document.documentElement.style.setProperty('--admin-accent', appearance.accent)
  document.documentElement.style.setProperty('--app-accent', appearance.accent)
}

const setThemeMode = (mode) => {
  appearance.mode = mode
  applyAppearance()
  addActivity(`${mode === 'dark' ? 'Dark' : 'Light'} theme applied`)
  notify(`${mode === 'dark' ? 'Dark' : 'Light'} mode applied.`)
}

const setAccent = (accent) => {
  appearance.accent = accent
  applyAppearance()
  addActivity(`Theme accent changed to ${accent}`)
  notify('Theme accent applied.')
}

const generateSuperAdminPassword = () => {
  const random = Math.random().toString(36).slice(-10)
  superAdminForm.password = `SuperAdmin!${random.toUpperCase()}`
}

const createSuperAdmin = async () => {
  if (!superAdminForm.email || !superAdminForm.full_name) {
    adminToolMessageType.value = 'danger'
    adminToolMessage.value = 'Provide both email and display name.'
    return
  }

  if (!superAdminForm.password) {
    generateSuperAdminPassword()
  }

  creatingSuperAdmin.value = true
  adminToolMessage.value = ''

  try {
    const response = await api.post('/auth/create-admin', {
      username: superAdminForm.username || superAdminForm.full_name,
      full_name: superAdminForm.full_name,
      email: superAdminForm.email,
      phone: superAdminForm.phone,
      password: superAdminForm.password
    })

    createdSuperAdmin.value = {
      email: superAdminForm.email,
      password: superAdminForm.password
    }
    adminToolMessageType.value = 'success'
    adminToolMessage.value = 'Super Admin account created successfully.'
    addActivity(`Super Admin created: ${superAdminForm.email}`, 'Success')
  } catch (error) {
    const message = error.response?.data?.message || 'Unable to create Super Admin.'
    adminToolMessageType.value = 'danger'
    adminToolMessage.value = message
    addActivity('Super Admin creation failed', 'Failed')
  } finally {
    creatingSuperAdmin.value = false
  }
}

const resetSuperAdminForm = () => {
  superAdminForm.email = ''
  superAdminForm.full_name = ''
  superAdminForm.username = ''
  superAdminForm.phone = ''
  superAdminForm.password = ''
  adminToolMessage.value = ''
  createdSuperAdmin.value = null
}

const notify = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  setTimeout(() => {
    if (toast.message === message) toast.message = ''
  }, 2800)
}

const captureBaseline = () => {
  baselineSnapshot.value = settingsSnapshot.value
  hasUnsavedChanges.value = false
}

const selectSection = (id) => {
  if (hasUnsavedChanges.value) {
    pendingSection.value = id
    unsavedModalOpen.value = true
    return
  }
  activeSection.value = id
  navOpen.value = false
}

const loadProfile = async () => {
  await authStore.checkAuth()
  const user = authStore.currentUser || {}
  profile.full_name = user.full_name || user.username || user.name || ''
  profile.email = user.email || ''
  profile.phone = user.phone || ''
  profile.profile_photo = user.profile_photo || ''
  account.role = user.role || authStore.currentUserType || 'admin'
  account.status = user.is_verified === false ? 'Unverified' : 'Active'
  addActivity('Profile refreshed', 'Viewed')
  captureBaseline()
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  avatarUploading.value = true
  try {
    const payload = new FormData()
    payload.append('photo', file)
    const response = await api.post('/upload/profile-photo', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    profile.profile_photo = response.data.photo?.path || ''
    notify('Avatar uploaded. Save profile to apply it.')
    addActivity('Avatar uploaded', 'Pending save')
  } catch (error) {
    notify(error.response?.data?.message || 'Avatar upload failed.', 'danger')
    addActivity('Avatar upload failed', 'Failed')
  } finally {
    avatarUploading.value = false
    event.target.value = ''
  }
}

const removeAvatar = () => {
  profile.profile_photo = ''
  notify('Avatar removed. Save changes to apply.')
}

const saveProfile = async () => {
  if (!emailValidation.value.valid) {
    notify(emailValidation.value.message, 'danger')
    return
  }
  const result = await authStore.updateProfile({
    username: profile.full_name,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    profile_photo: profile.profile_photo
  })
  if (!result.success) {
    notify(result.error || 'Profile update failed.', 'danger')
    return
  }
  await authStore.checkAuth()
  profile.profile_photo = authStore.currentUser?.profile_photo || profile.profile_photo
  addActivity('Profile settings saved', 'Success')
  notify('Profile settings saved.')
  captureBaseline()
}

const saveSecurity = async () => {
  if (!security.password && !security.confirmPassword) {
    notify('Security preferences saved.')
    return
  }
  if (security.password.length < 6) {
    notify('Password must be at least 6 characters.', 'danger')
    return
  }
  if (security.password !== security.confirmPassword) {
    notify('Passwords do not match.', 'danger')
    return
  }
  const result = await authStore.updateProfile({
    username: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    password: security.password,
    profile_photo: profile.profile_photo
  })
  if (!result.success) {
    notify(result.error || 'Password update failed.', 'danger')
    return
  }
  security.password = ''
  security.confirmPassword = ''
  localStorage.setItem(settingsStorageKeys.twoFactor, JSON.stringify(security.twoFactorEnabled))
  addActivity('Security settings saved', 'Success')
  notify('Security settings saved.')
  captureBaseline()
}

const saveLocalPreferences = () => {
  localStorage.setItem(settingsStorageKeys.notifications, JSON.stringify(notifications))
  localStorage.setItem(settingsStorageKeys.preferences, JSON.stringify(preferences))
  localStorage.setItem(settingsStorageKeys.twoFactor, JSON.stringify(security.twoFactorEnabled))
  applyAppearance()
  addActivity(`${activeSection.value} settings saved`, 'Success')
  notify('Settings saved.')
  captureBaseline()
}

const saveActiveSection = async () => {
  if (activeSection.value === 'profile') return saveProfile()
  if (activeSection.value === 'security') return saveSecurity()
  return saveLocalPreferences()
}

const saveAndContinue = async () => {
  await saveActiveSection()
  if (pendingSection.value) {
    activeSection.value = pendingSection.value
    pendingSection.value = ''
  }
  unsavedModalOpen.value = false
}

const discardChanges = () => {
  suppressDirty.value = true
  const snapshot = baselineSnapshot.value ? JSON.parse(baselineSnapshot.value) : null
  if (snapshot) {
    Object.assign(profile, snapshot.profile)
    Object.assign(security, snapshot.security)
    Object.assign(notifications, snapshot.notifications)
    Object.assign(preferences, snapshot.preferences)
    Object.assign(appearance, snapshot.appearance)
  }
  hasUnsavedChanges.value = false
  setTimeout(() => { suppressDirty.value = false }, 0)
}

const discardAndContinue = () => {
  discardChanges()
  if (pendingSection.value) {
    activeSection.value = pendingSection.value
    pendingSection.value = ''
  }
  unsavedModalOpen.value = false
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const goToDefaultDashboard = () => {
  const paths = {
    Overview: '/super-admin/dashboard',
    Schools: '/super-admin/schools',
    DOS: '/super-admin/dos',
    Reports: '/super-admin/reports'
  }
  router.push(paths[preferences.defaultView] || '/super-admin/dashboard')
}

const runSystemHealthCheck = async () => {
  try {
    const authenticated = await authStore.checkAuth()
    if (!authenticated) {
      notify('Session check failed. Please login again.', 'danger')
      addActivity('System health check failed', 'Failed')
      return
    }
    await api.get('/auth/me', { showGlobalLoader: false })
    notify('System health check passed.')
    addActivity('System health check passed', 'Healthy')
  } catch (error) {
    notify(error.response?.data?.message || 'System health check failed.', 'danger')
    addActivity('System health check failed', 'Failed')
  }
}

const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const downloadSettingsBackup = () => {
  downloadJson('superadmin-settings-backup.json', {
    profile: {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone
    },
    notifications: { ...notifications },
    preferences: { ...preferences },
    appearance: { ...appearance },
    twoFactorEnabled: security.twoFactorEnabled,
    exportedAt: new Date().toISOString()
  })
  notify('Settings backup downloaded.')
  addActivity('Settings backup exported', 'Success')
}

const resetLocalSettings = () => {
  Object.assign(notifications, { email: true, system: true, security: true })
  Object.assign(preferences, {
    language: 'en',
    timeFormat: '24h',
    defaultView: 'Overview',
    uiDensity: 'comfortable'
  })
  security.twoFactorEnabled = false
  appearance.mode = 'light'
  appearance.accent = '#2563eb'
  saveLocalPreferences()
  notify('Local settings reset.')
  addActivity('Local settings reset', 'Success')
}

const exportActivityLogs = () => {
  downloadJson('superadmin-activity-logs.json', {
    logs: activityLogs.value,
    exportedAt: new Date().toISOString()
  })
  notify('Activity logs exported.')
}

const clearLocalActivity = () => {
  activityLogs.value = []
  localStorage.setItem(settingsStorageKeys.activity, JSON.stringify(activityLogs.value))
  notify('Local activity logs cleared.')
}

watch(
  () => [appearance.mode, appearance.accent],
  applyAppearance
)

watch(settingsSnapshot, () => {
  if (suppressDirty.value || !baselineSnapshot.value) return
  hasUnsavedChanges.value = settingsSnapshot.value !== baselineSnapshot.value
})

const handleBeforeUnload = (event) => {
  if (!hasUnsavedChanges.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  const savedNotifications = JSON.parse(localStorage.getItem(settingsStorageKeys.notifications) || '{}')
  Object.assign(notifications, savedNotifications)
  const savedPreferences = JSON.parse(localStorage.getItem(settingsStorageKeys.preferences) || '{}')
  Object.assign(preferences, savedPreferences)
  const savedDarkMode = JSON.parse(localStorage.getItem(settingsStorageKeys.darkMode) || 'false')
  appearance.mode = localStorage.getItem(settingsStorageKeys.appearanceMode) || (savedDarkMode ? 'dark' : appearance.mode)
  appearance.accent = localStorage.getItem(settingsStorageKeys.accent) || appearance.accent
  security.twoFactorEnabled = JSON.parse(localStorage.getItem(settingsStorageKeys.twoFactor) || 'false')
  try {
    const savedLogs = JSON.parse(localStorage.getItem(settingsStorageKeys.activity) || '[]')
    if (Array.isArray(savedLogs) && savedLogs.length) activityLogs.value = savedLogs
  } catch (error) {
    localStorage.removeItem(settingsStorageKeys.activity)
  }
  applyAppearance()
  window.addEventListener('beforeunload', handleBeforeUnload)
  loadProfile()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.settings-control {
  width: min(100%, 1320px);
  margin: 0 auto;
  color: #0f172a;
}

.settings-control.is-compact {
  font-size: 0.92rem;
}

.settings-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0 0.85rem;
  margin-bottom: 0.9rem;
  border-radius: 16px;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.eyebrow {
  display: block;
  color: var(--admin-accent, #2563eb);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-hero h1,
.card-heading h2,
.confirm-modal h2 {
  margin: 0;
  font-weight: 900;
}

.settings-hero h1 {
  font-size: 1.55rem;
}

.settings-hero p,
.card-heading p {
  max-width: 48rem;
  margin: 0.2rem 0 0;
  color: #64748b;
}

.hero-actions,
.modal-actions,
.security-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.tool-btn {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0.65rem 0.9rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tool-btn:hover {
  transform: translateY(-1px);
}

.tool-btn.primary {
  background: var(--admin-accent, #2563eb);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
}

.tool-btn.secondary,
.tool-btn.ghost {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
}

.tool-btn.danger {
  background: #dc2626;
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(220, 38, 38, 0.22);
}

.settings-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.settings-nav,
.settings-card {
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.settings-nav {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.mobile-nav-toggle {
  display: none;
}

.nav-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-group {
  display: contents;
}

.nav-group > strong {
  display: none;
}

.nav-item {
  width: 42px;
  height: 42px;
  display: inline-grid;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 0;
  background: #ffffff;
  color: #475569;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-item:hover {
  background: #f8fafc;
  color: #0f172a;
  transform: translateY(-1px);
}

.nav-item.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.16);
}

.settings-svg {
  width: 32px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
  font-size: 1rem;
}

.nav-item.active .settings-svg {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.settings-content,
.section-grid {
  min-width: 0;
}

.section-grid {
  display: grid;
  gap: 1rem;
}

.settings-card {
  padding: 0.95rem;
}

.quick-tools,
.admin-tool-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.admin-tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tool-action {
  display: grid;
  gap: 0.35rem;
  min-height: 132px;
  padding: 1rem;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #f8fbff;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
}

.tool-action i {
  color: var(--admin-accent, #2563eb);
  font-size: 1.35rem;
}

.tool-action strong {
  font-size: 0.95rem;
}

.tool-action small {
  color: #64748b;
  font-weight: 750;
}

.full-width {
  grid-column: 1 / -1;
}

.password-inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
}

.credentials-card {
  padding: 1rem;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #f8fbff;
}

.credentials-card ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.credentials-card li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.credentials-card li:last-child {
  border-bottom: none;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.heading-icon {
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 14px;
  background: #eff6ff;
  color: var(--admin-accent, #2563eb);
  font-size: 1.05rem;
}

.form-grid {
  display: grid;
  gap: 0.9rem;
}

.form-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.4rem;
  font-weight: 900;
}

.field span {
  color: #475569;
  font-size: 0.78rem;
}

.field input,
.field select {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.65rem 0.8rem;
  outline: none;
  background: #f8fafc;
  color: #0f172a;
}

.field input:focus,
.field select:focus {
  border-color: var(--admin-accent, #2563eb);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.13);
}

.field em {
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 850;
}

.valid-hint {
  color: #15803d;
}

.invalid-hint {
  color: #dc2626;
}

.warning-hint {
  color: #d97706;
}

.muted-hint {
  color: #64748b;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar-preview {
  width: 112px;
  height: 112px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, var(--admin-accent, #2563eb), #38bdf8);
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 900;
}

.avatar-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  align-items: center;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 42px;
  padding: 0.65rem 0.9rem;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: var(--admin-accent, #1d4ed8);
  font-weight: 900;
  cursor: pointer;
}

.upload-btn input {
  display: none;
}

.toggle-list,
.session-list {
  display: grid;
  gap: 0.75rem;
}

.switch-card,
.toggle-row,
.session-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.switch-card input,
.toggle-row input {
  position: absolute;
  opacity: 0;
}

.switch-card > span,
.toggle-row > span {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #cbd5e1;
  position: relative;
  flex: 0 0 auto;
}

.switch-card > span::after,
.toggle-row > span::after {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  top: 3px;
  left: 3px;
  border-radius: 999px;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.switch-card input:checked + span,
.toggle-row input:checked + span {
  background: var(--admin-accent, #2563eb);
}

.switch-card input:checked + span::after,
.toggle-row input:checked + span::after {
  transform: translateX(18px);
}

.switch-card div,
.toggle-row div,
.session-item div {
  display: grid;
  gap: 0.15rem;
}

.switch-card small,
.toggle-row small,
.session-item span {
  color: #64748b;
}

.session-item i {
  color: var(--admin-accent, #2563eb);
  font-size: 1.3rem;
}

.session-item em {
  margin-left: auto;
  color: #16a34a;
  font-style: normal;
  font-weight: 900;
}

.account-summary,
.appearance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.account-summary div,
.theme-card {
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.account-summary span {
  display: block;
  color: #64748b;
  font-weight: 800;
  font-size: 0.75rem;
}

.account-summary strong {
  display: block;
  margin-top: 0.3rem;
}

.theme-card {
  min-height: 96px;
  display: grid;
  place-items: center;
  gap: 0.4rem;
  color: #0f172a;
  font-weight: 900;
}

.theme-card.active {
  border-color: var(--admin-accent, #2563eb);
  background: #eff6ff;
  color: var(--admin-accent, #1d4ed8);
}

.accent-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin: 1rem 0;
  color: #475569;
  font-weight: 900;
}

.accent-dot {
  width: 28px;
  height: 28px;
  border: 3px solid #ffffff;
  border-radius: 999px;
  box-shadow: 0 0 0 1px #cbd5e1;
}

.accent-dot.active {
  box-shadow: 0 0 0 3px #0f172a, 0 0 0 6px rgba(37, 99, 235, 0.24);
}

.activity-table {
  display: grid;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

.activity-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr 0.7fr;
  gap: 0.75rem;
  padding: 0.85rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.activity-row:last-child {
  border-bottom: 0;
}

.activity-row.head {
  background: #f1f5f9;
  color: #475569;
  font-weight: 900;
}

.activity-row strong {
  color: #16a34a;
}

.danger-zone {
  border-color: #fecaca;
}

.toast-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  font-weight: 900;
}

.toast-banner.success {
  background: #dcfce7;
  color: #166534;
}

.toast-banner.danger {
  background: #fee2e2;
  color: #991b1b;
}

.toast-banner.warning {
  background: #fef3c7;
  color: #92400e;
}

.toast-banner.warning.success {
  background: #dcfce7;
  color: #166534;
}

.toast-banner.warning.danger {
  background: #fee2e2;
  color: #991b1b;
}

.sticky-save-bar {
  position: sticky;
  bottom: 1rem;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
}

.sticky-save-bar > div {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

:global(body.admin-dark-mode) .tool-action {
  border-color: #243244 !important;
  background: #111827 !important;
  color: #e5edf7 !important;
}

:global(body.admin-dark-mode) .tool-action strong,
:global(body.admin-dark-mode) .tool-action i {
  color: #f8fafc !important;
}

:global(body.admin-dark-mode) .tool-action small,
:global(body.admin-dark-mode) .quick-tools {
  color: #cbd5e1 !important;
}

:global(body.admin-dark-mode) .accent-dot.active {
  box-shadow: 0 0 0 3px #f8fafc, 0 0 0 6px rgba(96, 165, 250, 0.28);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1000;
}

.confirm-modal {
  width: min(420px, 100%);
  padding: 1.25rem;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
  text-align: center;
}

.confirm-modal > i {
  color: #dc2626;
  font-size: 2rem;
}

.confirm-modal p {
  color: #64748b;
}

.modal-actions {
  justify-content: center;
  margin-top: 1rem;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 980px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    position: static;
  }

  .mobile-nav-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 0;
    border-radius: 12px;
    padding: 0.8rem;
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 900;
  }

  .nav-list {
    display: none;
    margin-top: 0.6rem;
  }

  .settings-nav.open .nav-list {
    display: grid;
  }
}

@media (max-width: 720px) {
  .settings-hero,
  .profile-row {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid.two,
  .account-summary,
  .appearance-grid,
  .admin-tool-grid,
  .activity-row {
    grid-template-columns: 1fr;
  }

  .password-inline {
    grid-template-columns: 1fr;
  }
}
</style>
