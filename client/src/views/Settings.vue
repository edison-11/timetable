<template>
  <AppLayout>
    <div class="admin-settings">
      <header class="page-head">
        <h1>Timetable Settings</h1>
        <p>Configure the school identity, timetable display, alerts, and admin access for your timetable management system.</p>
      </header>

      <nav class="settings-tabs" aria-label="Settings sections">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </nav>

      <div v-if="toast.message" class="toast-banner" :class="toast.type">
        <i :class="toast.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"></i>
        {{ toast.message }}
      </div>

      <section v-if="activeTab === 'general'" class="settings-grid">
        <form class="panel general-panel" @submit.prevent="saveGeneralSettings">
          <div class="panel-title">
            <h2>Timetable System Settings</h2>
            <p>Manage the school details and default formats used across timetables, exports, and notifications.</p>
          </div>

          <div class="form-grid two">
            <label class="field">
              <span>School Name</span>
              <input v-model.trim="settings.school_name" type="text" required />
            </label>
            <label class="field">
              <span>School Short Name</span>
              <input v-model.trim="settings.school_short_name" type="text" />
              <small>Displayed on timetable pages, printouts, and email alerts</small>
            </label>
          </div>

          <div class="form-grid two">
            <label class="field">
              <span>School Email</span>
              <input v-model.trim="settings.school_email" type="email" />
              <small>Used for timetable notices and official communication</small>
            </label>
            <label class="field">
              <span>School Phone</span>
              <input v-model.trim="settings.school_phone" type="tel" />
              <small>Primary contact number for timetable coordination</small>
            </label>
          </div>

          <label class="field">
            <span>School Address</span>
            <textarea v-model.trim="settings.school_address" rows="3"></textarea>
          </label>

          <div class="logo-section">
            <span class="field-label">School Logo</span>
            <div class="logo-row">
              <div class="logo-preview">
                <img v-if="visibleLogoSrc && !logoLoadFailed" :src="visibleLogoSrc" alt="School logo" @error="handleLogoError" />
                <i v-else class="bi bi-image"></i>
              </div>
              <label class="remove-logo" title="Upload school logo">
                <i class="bi bi-cloud-arrow-up"></i>
                <input type="file" accept="image/*" @change="uploadLogo" />
              </label>
              <button v-if="settings.school_logo_url" class="remove-logo danger" type="button" title="Remove logo" @click="settings.school_logo_url = ''">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <div class="form-grid two">
            <label class="field">
              <span>Timezone</span>
              <select v-model="settings.timezone">
                <option>(GMT+02:00) East Africa Time</option>
                <option>(GMT+00:00) Greenwich Mean Time</option>
                <option>(GMT+01:00) Central Africa Time</option>
                <option>(GMT+03:00) Eastern Africa Time</option>
              </select>
            </label>
            <label class="field">
              <span>Date Format</span>
              <select v-model="settings.date_format">
                <option>May 20, 2024 (MMM DD, YYYY)</option>
                <option>20 May 2024 (DD MMM YYYY)</option>
                <option>2024-05-20 (YYYY-MM-DD)</option>
                <option>20/05/2024 (DD/MM/YYYY)</option>
              </select>
            </label>
          </div>

          <div class="form-grid two">
            <label class="field">
              <span>Time Format</span>
              <select v-model="settings.time_format">
                <option>12 Hour (01:30 PM)</option>
                <option>24 Hour (13:30)</option>
              </select>
            </label>
            <label class="field">
              <span>Currency</span>
              <select v-model="settings.currency">
                <option>RWF - Rwanda Franc</option>
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
                <option>KES - Kenyan Shilling</option>
              </select>
            </label>
          </div>

          <label class="field">
            <span>System Language</span>
            <select v-model="settings.system_language">
              <option>English</option>
              <option>French</option>
              <option>Kinyarwanda</option>
            </select>
            <small>Choose the default language for timetable screens and exports</small>
          </label>

          <div class="form-actions">
            <button class="save-button" type="submit" :disabled="saving">
              <i class="bi bi-floppy"></i>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>

        <aside class="side-stack">
          <section class="panel info-panel">
            <h2>Timetable System Information</h2>
            <p>Important information about the timetable application.</p>
            <dl>
              <div>
                <dt><i class="bi bi-gear"></i> System Version</dt>
                <dd>{{ systemInfo.version }}</dd>
              </div>
              <div>
                <dt><i class="bi bi-hdd-network"></i> Environment</dt>
                <dd class="success">{{ systemInfo.environment }}</dd>
              </div>
              <div>
                <dt><i class="bi bi-database"></i> Database</dt>
                <dd>{{ systemInfo.database }}</dd>
              </div>
              <div>
                <dt><i class="bi bi-calendar-check"></i> Last Backup</dt>
                <dd>{{ formattedBackup }}</dd>
              </div>
            </dl>
            <button class="outline-button" type="button" @click="downloadBackup">
              <i class="bi bi-download"></i>
              Backup Now
            </button>
          </section>

          <section class="panel notifications-panel">
            <h2>Timetable Notifications</h2>
            <p>Configure alerts for timetable planning and schedule changes.</p>
            <label v-for="item in notificationOptions" :key="item.key" class="switch-line">
              <span>{{ item.label }}</span>
              <input v-model="settings.notifications[item.key]" type="checkbox" />
              <i></i>
            </label>
            <button class="link-button" type="button" @click="notify('Timetable email templates can be managed from the notification module.', 'success')">
              Manage Timetable Email Templates <i class="bi bi-arrow-right"></i>
            </button>
          </section>
        </aside>

        <main class="settings-content">
          <transition name="fade-slide" mode="out-in">
            <section v-if="activeSection === 'profile'" key="profile" class="section-grid">
              <div class="settings-card profile-card">
                <div class="card-heading">
                  <div>
                    <span class="eyebrow">Profile Settings</span>
                    <h2>Personal Details</h2>
                  </div>
                </div>
                <div class="profile-row">
                  <div class="avatar-preview">
                    <img v-if="profile.profile_photo" :src="profile.profile_photo" alt="Profile avatar" />
                    <span v-else>{{ initials }}</span>
                  </div>
                  <label class="upload-btn">
                    <i class="bi bi-cloud-arrow-up"></i>
                    Upload Avatar
                    <input type="file" accept="image/*" @change="handleAvatarUpload" />
                  </label>
                </div>
                <div class="form-grid two">
                  <label class="field">
                    <span>Full Name</span>
                    <input v-model.trim="profile.full_name" type="text" />
                  </label>
                  <label class="field">
                    <span>Email</span>
                    <input v-model.trim="profile.email" type="email" />
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
                  <div>
                    <span class="eyebrow">Security Settings</span>
                    <h2>Password & Access</h2>
                  </div>
                </div>
                <div class="form-grid two">
                  <label class="field">
                    <span>New Password</span>
                    <input v-model="security.password" type="password" placeholder="Minimum 6 characters" />
                  </label>
                  <label class="field">
                    <span>Confirm Password</span>
                    <input v-model="security.confirmPassword" type="password" />
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
              </div>
            </section>

            <section v-else-if="activeSection === 'adminTools'" key="adminTools" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <div>
                    <span class="eyebrow">Admin Tools</span>
                    <h2>Super Admin Bootstrap</h2>
                  </div>
                </div>
                <div class="form-grid two">
                  <label class="field">
                    <span>Email</span>
                    <input v-model.trim="superAdminForm.email" type="email" placeholder="admin@example.com" />
                  </label>
                  <label class="field">
                    <span>Display Name</span>
                    <input v-model.trim="superAdminForm.full_name" type="text" placeholder="Super Admin" />
                  </label>
                  <label class="field">
                    <span>Username</span>
                    <input v-model.trim="superAdminForm.username" type="text" placeholder="superadmin" />
                  </label>
                  <label class="field">
                    <span>Phone (optional)</span>
                    <input v-model.trim="superAdminForm.phone" type="tel" placeholder="+1234567890" />
                  </label>
                  <label class="field full-width">
                    <span>Password</span>
                    <div class="password-inline">
                      <input v-model.trim="superAdminForm.password" type="text" placeholder="Generate or enter a secure password" />
                      <button type="button" class="tool-btn secondary" @click="generateSuperAdminPassword">Generate</button>
                    </div>
                  </label>
                </div>

                <div class="d-flex gap-2 mt-3">
                  <button class="tool-btn primary" type="button" @click="createSuperAdmin" :disabled="creatingSuperAdmin">
                    <span v-if="creatingSuperAdmin">Creating...</span>
                    <span v-else>Create Super Admin</span>
                  </button>
                  <button class="tool-btn secondary" type="button" @click="resetSuperAdminForm">Reset</button>
                </div>

                <div v-if="createdSuperAdmin" class="credentials-card mt-4">
                  <h3>Credentials Created</h3>
                  <p>Use these details to sign in as Super Admin.</p>
                  <ul>
                    <li><strong>Email:</strong> {{ createdSuperAdmin.email }}</li>
                    <li><strong>Password:</strong> {{ createdSuperAdmin.password }}</li>
                  </ul>
                </div>

                <div v-if="adminToolMessage" class="toast-banner warning" :class="adminToolMessageType">
                  {{ adminToolMessage }}
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'notifications'" key="notifications" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
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
                      <option value="Timetable">Timetable</option>
                      <option value="Teachers">Teachers</option>
                      <option value="Reports">Reports</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section v-else-if="activeSection === 'appearance'" key="appearance" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <div>
                    <span class="eyebrow">Appearance Settings</span>
                    <h2>Theme & Density</h2>
                  </div>
                </div>
                <div class="appearance-grid">
                  <button type="button" class="theme-card" :class="{ active: appearance.mode === 'light' }" @click="appearance.mode = 'light'">
                    <i class="bi bi-brightness-high"></i>
                    Light Mode
                  </button>
                  <button type="button" class="theme-card" :class="{ active: appearance.mode === 'dark' }" @click="appearance.mode = 'dark'">
                    <i class="bi bi-moon"></i>
                    Dark Mode
                  </button>
                </div>
                <div class="accent-row">
                  <span>Theme accent preview</span>
                  <button v-for="accent in accents" :key="accent" type="button" class="accent-dot" :style="{ background: accent }" @click="appearance.accent = accent"></button>
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

            <section v-else-if="activeSection === 'activity'" key="activity" class="section-grid">
              <div class="settings-card">
                <div class="card-heading">
                  <div>
                    <span class="eyebrow">Activity & Logs</span>
                    <h2>Recent Activity</h2>
                  </div>
                </div>
                <div class="activity-table">
                  <div class="activity-row head"><span>Event</span><span>User</span><span>Time</span><span>Status</span></div>
                  <div v-for="log in activityLogs" :key="log.id" class="activity-row">
                    <span>{{ log.event }}</span>
                    <span>{{ log.user }}</span>
                    <span>{{ log.time }}</span>
                    <strong>{{ log.status }}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section v-else key="logout" class="section-grid">
              <div class="settings-card danger-zone">
                <div class="card-heading">
                  <div>
                    <span class="eyebrow">Logout Option</span>
                    <h2>End Current Session</h2>
                    <p>Sign out safely from this device.</p>
                  </div>
                </div>
                <button class="tool-btn danger" type="button" @click="showLogoutModal = true">
                  <i class="bi bi-box-arrow-right"></i>
                  Logout
                </button>
              </div>
            </section>
          </transition>
        </main>
      </section>

      <section v-else-if="activeTab === 'users'" class="panel placeholder-panel">
        <h2>Timetable Users</h2>
        <p>Manage the people who create, approve, teach from, or view the timetable.</p>
        <div class="summary-grid">
          <div><span>Signed in as</span><strong>{{ currentUserName }}</strong></div>
          <div><span>Email</span><strong>{{ currentUserEmail }}</strong></div>
          <div><span>Status</span><strong>Active</strong></div>
        </div>
      </section>

      <section v-else-if="activeTab === 'roles'" class="panel placeholder-panel">
        <h2>Timetable Roles</h2>
        <p>Role permissions control who can build schedules, assign teachers, update rooms, and view published timetables.</p>
        <div class="role-list">
          <span>Admin</span>
          <span>Teacher</span>
          <span>Student</span>
        </div>
      </section>

      <section v-else class="panel placeholder-panel">
        <h2>Timetable Security</h2>
        <p>Protect timetable editing, exports, and published schedule access from one admin-controlled area.</p>
        <button class="save-button" type="button" @click="logout">
          <i class="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { resolveAssetUrl } from '@/utils/assetUrl'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('general')
const saving = ref(false)
const logoPreviewUrl = ref('')
const logoLoadFailed = ref(false)
const toast = reactive({ message: '', type: 'success' })

const navItems = [
  { id: 'profile', label: 'Profile Settings', icon: 'bi bi-person-circle' },
  { id: 'security', label: 'Security Settings', icon: 'bi bi-shield-lock' },
  { id: 'account', label: 'Account Settings', icon: 'bi bi-person-badge' },
  { id: 'adminTools', label: 'Admin Tools', icon: 'bi bi-tools' },
  { id: 'notifications', label: 'Notification Settings', icon: 'bi bi-bell' },
  { id: 'preferences', label: 'System Preferences', icon: 'bi bi-globe2' },
  { id: 'appearance', label: 'Appearance Settings', icon: 'bi bi-palette' },
  { id: 'activity', label: 'Activity & Logs', icon: 'bi bi-activity' },
  { id: 'logout', label: 'Logout Option', icon: 'bi bi-box-arrow-right' }
]

const notificationOptions = [
  { key: 'new_student_registration', label: 'New student added to timetable' },
  { key: 'new_admission_application', label: 'Teacher assignment changes' },
  { key: 'news_announcement', label: 'Published timetable announcements' },
  { key: 'system_updates', label: 'Timetable system updates' },
  { key: 'weekly_reports', label: 'Weekly timetable reports' },
  { key: 'marketing_emails', label: 'Timetable email summaries' }
]

const defaultSettings = () => ({
  school_name: 'MUDUGA TSS',
  school_short_name: 'MUDUGA TSS',
  school_email: 'info@mudugatss.ac.rw',
  school_phone: '+250 788 123 456',
  school_address: 'Muduga Sector, Karongi District, Western Province, Rwanda\nP.O. Box 123, Kibuye',
  school_logo_url: '',
  timezone: '(GMT+02:00) East Africa Time',
  date_format: 'May 20, 2024 (MMM DD, YYYY)',
  time_format: '12 Hour (01:30 PM)',
  currency: 'RWF - Rwanda Franc',
  system_language: 'English',
  notifications: {
    new_student_registration: true,
    new_admission_application: true,
    news_announcement: true,
    system_updates: true,
    weekly_reports: false,
    marketing_emails: false
  }
})

const settings = reactive(defaultSettings())
const systemInfo = reactive({
  version: 'v1.0.0',
  environment: 'Production',
  database: 'SQLite 3',
  last_backup: new Date().toISOString()
})

const accents = ['#2563eb', '#0891b2', '#16a34a', '#7c3aed', '#e11d48']

const sessions = [
  { id: 1, icon: 'bi bi-laptop', device: 'Current browser', location: 'Local session', time: 'Now', status: 'Active' },
  { id: 2, icon: 'bi bi-phone', device: 'Mobile web', location: 'Recent login', time: 'Yesterday', status: 'Known' }
]

const activityLogs = [
  { id: 1, event: 'Profile settings opened', user: 'Admin', time: 'Now', status: 'Viewed' },
  { id: 2, event: 'Timetable module updated', user: 'System', time: 'Today', status: 'Complete' },
  { id: 3, event: 'Login session created', user: 'Admin', time: 'Recent', status: 'Success' }
]

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
  } catch (error) {
    const message = error.response?.data?.message || 'Unable to create Super Admin.'
    adminToolMessageType.value = 'danger'
    adminToolMessage.value = message
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
  }, 3000)
}

const applySettings = (data = {}) => {
  const mergedNotifications = {
    ...defaultSettings().notifications,
    ...(data.notifications || {})
  }
  Object.assign(settings, defaultSettings(), data, { notifications: mergedNotifications })
  logoLoadFailed.value = false
}

const clearLogoPreviewUrl = () => {
  if (logoPreviewUrl.value) {
    URL.revokeObjectURL(logoPreviewUrl.value)
    logoPreviewUrl.value = ''
  }
}

const handleLogoError = () => {
  logoLoadFailed.value = true
}

const loadGeneralSettings = async () => {
  try {
    const response = await api.get('/settings/general')
    applySettings(response.data.settings)
    Object.assign(systemInfo, response.data.system || {})
  } catch (error) {
    notify(error.response?.data?.message || 'Failed to load settings.', 'danger')
  }
}

const saveGeneralSettings = async () => {
  saving.value = true
  try {
    const response = await api.put('/settings/general', settings)
    applySettings(response.data.settings)
    notify('Timetable settings saved successfully.')
  } catch (error) {
    notify(error.response?.data?.message || 'Failed to save settings.', 'danger')
  } finally {
    saving.value = false
  }
}

const persistLogoSetting = async () => {
  const response = await api.put('/settings/general', settings)
  applySettings(response.data.settings)
}

const uploadLogo = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  clearLogoPreviewUrl()
  logoPreviewUrl.value = URL.createObjectURL(file)
  logoLoadFailed.value = false

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    settings.school_logo_url = response.data.file?.path || response.data.file?.url || ''
    await persistLogoSetting()
    clearLogoPreviewUrl()
    notify('Logo uploaded and saved.')
  } catch (error) {
    clearLogoPreviewUrl()
    notify(error.response?.data?.message || 'Failed to upload logo.', 'danger')
  }
}

const downloadBackup = () => {
  const backup = {
    exported_at: new Date().toISOString(),
    settings: JSON.parse(JSON.stringify(settings)),
    system: JSON.parse(JSON.stringify(systemInfo))
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `timetable-settings-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  notify('Timetable settings backup downloaded.')
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await authStore.checkAuth()
  await loadGeneralSettings()
})

onBeforeUnmount(() => {
  clearLogoPreviewUrl()
})
</script>

<style scoped>
.admin-settings {
  min-height: calc(100vh - 80px);
  padding: 0.75rem 1.5rem 2.5rem;
  color: #172554;
}

.page-head {
  padding: 0.25rem 0 1.1rem;
}

.page-head h1 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
}

.page-head p,
.panel-title p,
.info-panel p,
.notifications-panel p,
.placeholder-panel p,
.field small {
  margin: 0.2rem 0 0;
  color: #52698f;
  font-size: 0.82rem;
}

.settings-tabs {
  display: flex;
  gap: 1.25rem;
  border-bottom: 1px solid #cfd8ea;
  margin-bottom: 1.25rem;
  overflow-x: auto;
}

.tab-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 42px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #52698f;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.tab-button.active {
  color: #3157f6;
  border-bottom-color: #3157f6;
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 1.25rem;
  align-items: start;
}

.panel {
  border: 1px solid #ccd8ec;
  border-radius: 8px;
  background: #ffffff;
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
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel h2 {
  margin: 0;
  color: #0f2554;
  font-size: 1rem;
  font-weight: 800;
}

.form-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field-label,
.field span {
  color: #0f2554;
  font-size: 0.78rem;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 38px;
  border: 1px solid #c8d4e5;
  border-radius: 6px;
  background: #fbfdff;
  color: #172554;
  font: inherit;
  padding: 0.55rem 0.65rem;
  outline: none;
}

.field textarea {
  min-height: 78px;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #4b69ff;
  box-shadow: 0 0 0 3px rgba(75, 105, 255, 0.12);
}

.logo-section {
  display: grid;
  gap: 0.45rem;
  margin: 0.25rem 0 1rem;
}

.logo-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.logo-preview {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  border: 1px solid #c8d4e5;
  border-radius: 6px;
  background: #f8fbff;
  overflow: hidden;
  color: #7890b8;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-logo,
.outline-button,
.save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 34px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.remove-logo {
  width: 26px;
  height: 26px;
  border: 0;
  background: #eef3ff;
  color: #3157f6;
}

.remove-logo.danger {
  background: #ff4d5e;
  color: #ffffff;
}

.remove-logo input {
  display: none;
}

.form-actions {
  border-top: 1px solid #d8e1ef;
  margin-top: 1rem;
  padding-top: 1rem;
}

.save-button {
  border: 0;
  background: #4b63f4;
  color: #ffffff;
  padding: 0.45rem 0.8rem;
}

.save-button:disabled {
  cursor: wait;
  opacity: 0.68;
}

.outline-button {
  width: 100%;
  border: 1px solid #c8d4e5;
  background: #ffffff;
  color: #172554;
  padding: 0.45rem 0.65rem;
}

.info-panel dl {
  display: grid;
  gap: 0.7rem;
  margin: 0.9rem 0;
}

.info-panel dl div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.info-panel dt {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #52698f;
  font-size: 0.76rem;
}

.info-panel dd {
  margin: 0;
  color: #172554;
  font-size: 0.76rem;
  font-weight: 700;
  text-align: right;
}

.info-panel dd.success {
  color: #18a058;
}

.switch-line {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.6rem;
  min-height: 32px;
  color: #263b64;
  font-size: 0.78rem;
}

.switch-line input {
  position: absolute;
  opacity: 0;
}

.switch-line i {
  width: 30px;
  height: 16px;
  border-radius: 999px;
  background: #172033;
  position: relative;
}

.switch-line i::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  top: 2px;
  left: 2px;
  border-radius: 999px;
  background: #ffffff;
  transition: transform 0.18s ease;
}

.switch-line input:checked + i {
  background: #4b63f4;
}

.switch-line input:checked + i::after {
  transform: translateX(14px);
}

.link-button {
  width: 100%;
  margin-top: 0.8rem;
  border: 0;
  background: transparent;
  color: #3157f6;
  font-weight: 700;
  cursor: pointer;
}

.toast-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.72rem 0.85rem;
  border-radius: 8px;
  font-weight: 700;
}

.toast-banner.success {
  background: #dcfce7;
  color: #166534;
}

.toast-banner.danger {
  background: #fee2e2;
  color: #991b1b;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.summary-grid div {
  display: grid;
  gap: 0.25rem;
  border: 1px solid #d8e1ef;
  border-radius: 8px;
  padding: 0.85rem;
}

.summary-grid span {
  color: #52698f;
  font-size: 0.75rem;
}

.role-list {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.role-list span {
  border: 1px solid #c8d4e5;
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  color: #172554;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .side-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 740px) {
  .admin-settings {
    padding: 0.75rem 0.5rem 1.5rem;
  }

  .form-grid.two,
  .side-stack,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
