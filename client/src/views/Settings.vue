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

const tabs = [
  { id: 'general', label: 'Timetable Setup', icon: 'bi bi-calendar-week' },
  { id: 'users', label: 'Timetable Users', icon: 'bi bi-people' },
  { id: 'roles', label: 'Access Roles', icon: 'bi bi-person-lock' },
  { id: 'security', label: 'Security', icon: 'bi bi-shield-lock' }
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

const currentUserName = computed(() => authStore.currentUser?.full_name || authStore.currentUser?.username || 'Admin')
const currentUserEmail = computed(() => authStore.currentUser?.email || 'Not set')
const logoSrc = computed(() => {
  return resolveAssetUrl(settings.school_logo_url)
})
const visibleLogoSrc = computed(() => logoPreviewUrl.value || logoSrc.value)
const formattedBackup = computed(() => {
  const date = new Date(systemInfo.last_backup)
  return Number.isNaN(date.getTime()) ? systemInfo.last_backup : date.toLocaleString()
})

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

.general-panel {
  padding: 1.1rem 1.25rem;
}

.side-stack {
  display: grid;
  gap: 0.85rem;
}

.info-panel,
.notifications-panel,
.placeholder-panel {
  padding: 1rem;
}

.panel-title {
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
