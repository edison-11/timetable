<template>
  <TeacherLayout>
    <div class="teacher-settings-page">
      <div class="settings-wrap">
        <header class="settings-intro">
          <div>
            <span class="eyebrow">Teacher Workspace</span>
            <h1>Settings</h1>
            <p>Update your account, teaching availability, timetable view, alerts, and password from one organized place.</p>
          </div>
          <router-link to="/teacher/profile" class="profile-link">
            <i class="bi bi-person-circle"></i>
            My Profile
          </router-link>
        </header>

        <div v-if="loadingData" class="settings-skeleton">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-grid">
            <div class="skeleton-box" v-for="index in 4" :key="index"></div>
          </div>
        </div>

        <div v-else class="settings-shell">
          <aside class="settings-nav" aria-label="Teacher settings sections">
            <button
              v-for="item in settingsSections"
              :key="item.id"
              type="button"
              class="settings-nav-item"
              :class="{ active: activeTab === item.id }"
              @click="activeTab = item.id"
            >
              <i :class="item.icon"></i>
              <span>{{ item.label }}</span>
              <small>{{ item.caption }}</small>
            </button>
          </aside>

          <main class="settings-content">
            <div v-if="settingsError" class="alert alert-danger">
              {{ settingsError }}
            </div>

            <section v-if="activeTab === 'account'" class="settings-panel">
              <div class="panel-heading">
                <div>
                  <h2>Account Details</h2>
                  <p>Keep the information your DOS uses to identify you correct.</p>
                </div>
                <div class="profile-preview">
                  <img v-if="profileData.profile_photo" :src="profileData.profile_photo" alt="Teacher avatar" />
                  <span v-else>{{ profileInitial }}</span>
                </div>
              </div>

              <form @submit.prevent="saveProfile">
                <div class="form-grid">
                  <label>
                    <span>Full Name</span>
                    <input v-model.trim="profileData.name" type="text" class="form-control" required />
                  </label>
                  <label>
                    <span>Email</span>
                    <input v-model.trim="profileData.email" type="email" class="form-control" required />
                  </label>
                  <label>
                    <span>Department</span>
                    <input v-model.trim="profileData.department" type="text" class="form-control" required />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input v-model.trim="profileData.phone" type="tel" class="form-control" />
                  </label>
                  <label>
                    <span>Staff ID</span>
                    <input v-model.trim="profileData.employee_id" type="text" class="form-control" />
                  </label>
                  <label>
                    <span>Qualification</span>
                    <input v-model.trim="profileData.qualification" type="text" class="form-control" />
                  </label>
                  <label>
                    <span>Subject Specialization</span>
                    <input v-model.trim="profileData.module_name" type="text" class="form-control" />
                  </label>
                  <label>
                    <span>Years of Experience</span>
                    <input v-model.number="profileData.years_experience" type="number" min="0" class="form-control" />
                  </label>
                </div>

                <label class="upload-row">
                  <span>Profile Photo</span>
                  <input type="file" accept="image/*" class="form-control" @change="handleAvatarUpload" />
                </label>

                <div v-if="messages.profile" class="alert" :class="messagesClass.profile" role="alert">
                  {{ messages.profile }}
                </div>

                <div class="actions-row">
                  <button type="submit" class="btn btn-primary" :disabled="loadingProfile">
                    {{ loadingProfile ? 'Saving...' : 'Save Account' }}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetProfile">Reset</button>
                </div>
              </form>
            </section>

            <section v-if="activeTab === 'availability'" class="settings-panel">
              <div class="panel-heading">
                <div>
                  <h2>Availability</h2>
                  <p>Tell the DOS when you can be assigned lessons.</p>
                </div>
              </div>

              <form @submit.prevent="saveAvailability">
                <div class="days-grid">
                  <label v-for="day in availableDaysOptions" :key="day" class="day-chip">
                    <input type="checkbox" :value="day" v-model="availableDaysArray" />
                    <span>{{ day }}</span>
                  </label>
                </div>

                <div class="form-grid compact">
                  <label>
                    <span>Available From</span>
                    <input v-model="formData.available_from" type="time" class="form-control" />
                  </label>
                  <label>
                    <span>Available Until</span>
                    <input v-model="formData.available_to" type="time" class="form-control" />
                  </label>
                </div>

                <label>
                  <span>Planning Notes</span>
                  <textarea
                    v-model.trim="formData.notes"
                    rows="4"
                    class="form-control"
                    placeholder="Room preference, lab needs, duty limits, or other scheduling notes."
                  ></textarea>
                </label>

                <div v-if="messages.availability" class="alert" :class="messagesClass.availability" role="alert">
                  {{ messages.availability }}
                </div>

                <div class="actions-row">
                  <button type="submit" class="btn btn-primary" :disabled="loadingAvailability">
                    {{ loadingAvailability ? 'Saving...' : 'Save Availability' }}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetAvailability">Cancel</button>
                </div>
              </form>
            </section>

            <section v-if="activeTab === 'timetable'" class="settings-panel">
              <div class="panel-heading">
                <div>
                  <h2>Timetable View</h2>
                  <p>Choose how your timetable opens and what details appear.</p>
                </div>
                <router-link to="/teacher/timetable" class="quick-link">Open Timetable</router-link>
              </div>

              <div class="preference-grid">
                <label class="preference-card">
                  <span>Default View</span>
                  <select v-model="preferences.defaultTimetableView" class="form-select" @change="savePreferences">
                    <option value="week">Weekly grid</option>
                    <option value="day">Today view</option>
                  </select>
                </label>

                <label class="preference-card">
                  <span>Time Format</span>
                  <select v-model="preferences.timeFormat" class="form-select" @change="savePreferences">
                    <option value="24">24-hour</option>
                    <option value="12">12-hour</option>
                  </select>
                </label>

                <label class="toggle-card">
                  <input v-model="preferences.highlightToday" type="checkbox" @change="savePreferences" />
                  <span>
                    <strong>Highlight today</strong>
                    <small>Make the current day easier to scan.</small>
                  </span>
                </label>

                <label class="toggle-card">
                  <input v-model="preferences.showRoomCodes" type="checkbox" @change="savePreferences" />
                  <span>
                    <strong>Show room codes</strong>
                    <small>Keep classroom information visible in timetable cells.</small>
                  </span>
                </label>

                <label class="toggle-card">
                  <input v-model="preferences.compactTimetable" type="checkbox" @change="savePreferences" />
                  <span>
                    <strong>Compact timetable</strong>
                    <small>Use tighter rows when you have many lessons.</small>
                  </span>
                </label>
              </div>

              <p v-if="messages.preferences" class="save-note">{{ messages.preferences }}</p>
            </section>

            <section v-if="activeTab === 'notifications'" class="settings-panel">
              <div class="panel-heading">
                <div>
                  <h2>Notifications</h2>
                  <p>Control lesson reminders and update alerts on this device.</p>
                </div>
              </div>

              <div class="preference-grid">
                <label class="toggle-card">
                  <input v-model="profileData.receive_schedule_alerts" type="checkbox" @change="saveProfile" />
                  <span>
                    <strong>Timetable update alerts</strong>
                    <small>Notify me when my schedule changes.</small>
                  </span>
                </label>

                <label class="toggle-card">
                  <input v-model="preferences.lessonReminders" type="checkbox" @change="savePreferences" />
                  <span>
                    <strong>Lesson reminders</strong>
                    <small>Remind me before the next lesson begins.</small>
                  </span>
                </label>

                <label class="preference-card">
                  <span>Reminder Time</span>
                  <select v-model.number="preferences.reminderMinutes" class="form-select" @change="savePreferences">
                    <option :value="5">5 minutes before</option>
                    <option :value="10">10 minutes before</option>
                    <option :value="15">15 minutes before</option>
                    <option :value="30">30 minutes before</option>
                  </select>
                </label>

                <label class="toggle-card">
                  <input v-model="preferences.weekendQuietMode" type="checkbox" @change="savePreferences" />
                  <span>
                    <strong>Weekend quiet mode</strong>
                    <small>Reduce reminders from Friday 6:00 PM to Sunday 6:00 PM.</small>
                  </span>
                </label>
              </div>

              <p v-if="messages.preferences" class="save-note">{{ messages.preferences }}</p>
            </section>

            <section v-if="activeTab === 'security'" class="settings-panel">
              <div class="panel-heading">
                <div>
                  <h2>Security</h2>
                  <p>Change your password and keep your account protected.</p>
                </div>
              </div>

              <form @submit.prevent="savePassword">
                <div class="security-grid">
                  <label>
                    <span>New Password</span>
                    <div class="password-field">
                      <input
                        v-model="passwordForm.newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        class="form-control"
                        placeholder="Enter new password"
                        minlength="6"
                      />
                      <button type="button" class="password-toggle" @click="showNewPassword = !showNewPassword">
                        <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                  </label>

                  <label>
                    <span>Confirm Password</span>
                    <div class="password-field">
                      <input
                        v-model="passwordForm.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="form-control"
                        placeholder="Confirm new password"
                      />
                      <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                  </label>
                </div>

                <div v-if="messages.password" class="alert" :class="messagesClass.password" role="alert">
                  {{ messages.password }}
                </div>

                <div class="actions-row">
                  <button type="submit" class="btn btn-primary" :disabled="loadingPassword">
                    {{ loadingPassword ? 'Updating...' : 'Update Password' }}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetPassword">Cancel</button>
                </div>
              </form>

              <div class="security-tips">
                <h3>Account checklist</h3>
                <ul>
                  <li>Use a password that is not used on other systems.</li>
                  <li>Contact the DOS if your email or staff ID is wrong.</li>
                  <li>Sign out when using a shared computer.</li>
                </ul>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'
import TeacherLayout from '@/components/TeacherLayout.vue'

const authStore = useAuthStore()
const teacherPreferencesKey = 'teacherSettingsPreferences'

const settingsSections = [
  { id: 'account', label: 'Account', caption: 'Profile basics', icon: 'bi bi-person-badge' },
  { id: 'availability', label: 'Availability', caption: 'Teaching hours', icon: 'bi bi-calendar-check' },
  { id: 'timetable', label: 'Timetable', caption: 'View options', icon: 'bi bi-table' },
  { id: 'notifications', label: 'Notifications', caption: 'Reminders', icon: 'bi bi-bell' },
  { id: 'security', label: 'Security', caption: 'Password', icon: 'bi bi-shield-lock' }
]

const defaultPreferences = {
  defaultTimetableView: 'week',
  timeFormat: '24',
  highlightToday: true,
  showRoomCodes: true,
  compactTimetable: false,
  lessonReminders: true,
  reminderMinutes: 10,
  weekendQuietMode: true
}

const activeTab = ref('account')
const loadingProfile = ref(false)
const loadingAvailability = ref(false)
const loadingPassword = ref(false)
const loadingData = ref(true)
const settingsError = ref('')

const availableDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const profileData = ref({
  name: '',
  email: '',
  department: '',
  phone: '',
  employee_id: '',
  module_name: '',
  qualification: '',
  years_experience: 0,
  profile_photo: '',
  receive_schedule_alerts: true
})

const formData = ref({
  available_days: '',
  available_from: '',
  available_to: '',
  notes: ''
})

const preferences = ref({ ...defaultPreferences })

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

const messages = ref({
  profile: '',
  availability: '',
  password: '',
  preferences: ''
})

const messagesClass = computed(() => ({
  profile: messages.value.profile.includes('successfully') ? 'alert-success' : 'alert-danger',
  availability: messages.value.availability.includes('successfully') ? 'alert-success' : 'alert-danger',
  password: messages.value.password.includes('successfully') ? 'alert-success' : 'alert-danger'
}))

const profileInitial = computed(() => profileData.value.name?.charAt(0)?.toUpperCase() || 'T')

const originalFormData = ref({})

const availableDaysArray = computed({
  get: () => (formData.value.available_days ? formData.value.available_days.split(', ') : []),
  set: (val) => {
    formData.value.available_days = val.join(', ')
  }
})

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const loadPreferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(teacherPreferencesKey) || '{}')
    preferences.value = { ...defaultPreferences, ...saved }
  } catch (error) {
    preferences.value = { ...defaultPreferences }
  }
}

const savePreferences = () => {
  localStorage.setItem(teacherPreferencesKey, JSON.stringify(preferences.value))
  messages.value.preferences = 'Preferences saved on this device.'
  window.setTimeout(() => {
    messages.value.preferences = ''
  }, 2200)
}

const loadTeacherData = async () => {
  loadingData.value = true
  settingsError.value = ''
  try {
    const response = await api.get('/teacher-auth/me')
    const teacher = response.data.teacher

    profileData.value = {
      name: teacher.name || '',
      email: teacher.email || '',
      department: teacher.department || '',
      phone: teacher.phone || '',
      employee_id: teacher.employee_id || '',
      module_name: teacher.module_name || '',
      qualification: teacher.qualification || '',
      years_experience: teacher.years_experience || 0,
      profile_photo: teacher.profile_photo || '',
      receive_schedule_alerts: teacher.receive_schedule_alerts ?? true
    }

    formData.value = {
      available_days: teacher.available_days || '',
      available_from: teacher.available_from || '',
      available_to: teacher.available_to || '',
      notes: teacher.notes || ''
    }

    originalFormData.value = JSON.parse(JSON.stringify(formData.value))
  } catch (error) {
    console.error('Failed to load teacher data:', error)
    settingsError.value = error.response?.data?.message || 'Failed to load settings data'
  } finally {
    loadingData.value = false
  }
}

const saveAvailability = async () => {
  loadingAvailability.value = true
  messages.value.availability = ''

  try {
    await api.put('/teacher-auth/me', {
      availableDays: formData.value.available_days,
      availableFrom: formData.value.available_from,
      availableTo: formData.value.available_to,
      notes: formData.value.notes
    })

    originalFormData.value = JSON.parse(JSON.stringify(formData.value))
    messages.value.availability = 'Availability updated successfully!'
    await authStore.checkAuth()
  } catch (error) {
    messages.value.availability = error.response?.data?.message || 'Failed to update availability'
  } finally {
    loadingAvailability.value = false
  }
}

const saveProfile = async () => {
  loadingProfile.value = true
  messages.value.profile = ''

  try {
    await api.put('/teacher-auth/me', {
      name: profileData.value.name,
      email: profileData.value.email,
      department: profileData.value.department,
      phone: profileData.value.phone,
      employee_id: profileData.value.employee_id,
      module_name: profileData.value.module_name,
      qualification: profileData.value.qualification,
      yearsExperience: profileData.value.years_experience,
      profile_photo: profileData.value.profile_photo,
      receive_schedule_alerts: profileData.value.receive_schedule_alerts,
      notes: formData.value.notes,
      availableDays: formData.value.available_days,
      availableFrom: formData.value.available_from,
      availableTo: formData.value.available_to
    })

    messages.value.profile = 'Profile updated successfully!'
    await authStore.checkAuth()
  } catch (error) {
    messages.value.profile = error.response?.data?.message || 'Failed to update profile'
  } finally {
    loadingProfile.value = false
  }
}

const handleAvatarUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    profileData.value.profile_photo = reader.result
  }
  reader.readAsDataURL(file)
}

const savePassword = async () => {
  if (!passwordForm.value.newPassword) {
    messages.value.password = 'Please enter a new password'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    messages.value.password = 'Password must be at least 6 characters'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    messages.value.password = 'Passwords do not match'
    return
  }

  loadingPassword.value = true
  messages.value.password = ''

  try {
    await api.put('/teacher-auth/me', {
      password: passwordForm.value.newPassword
    })

    messages.value.password = 'Password updated successfully!'
    passwordForm.value = { newPassword: '', confirmPassword: '' }
    await authStore.checkAuth()
  } catch (error) {
    messages.value.password = error.response?.data?.message || 'Failed to update password'
  } finally {
    loadingPassword.value = false
  }
}

const resetAvailability = () => {
  formData.value.available_days = originalFormData.value.available_days
  formData.value.available_from = originalFormData.value.available_from
  formData.value.available_to = originalFormData.value.available_to
  formData.value.notes = originalFormData.value.notes
  messages.value.availability = ''
}

const resetProfile = () => {
  loadTeacherData()
  messages.value.profile = ''
}

const resetPassword = () => {
  passwordForm.value = { newPassword: '', confirmPassword: '' }
  messages.value.password = ''
}

onMounted(() => {
  loadPreferences()
  loadTeacherData()
})
</script>

<style scoped>
.teacher-settings-page {
  min-height: 100vh;
  padding: 1.5rem;
  background: #f8fafc;
  font-family: var(--app-font);
  font-size: 0.92rem;
  line-height: 1.5;
}

.settings-wrap {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.settings-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8fbff, #ffffff 55%, #eef7f1);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-intro h1 {
  margin: 0 0 0.35rem;
  color: #0f172a;
  font-size: 1.8rem;
  line-height: 1.1;
  font-weight: 900;
}

.settings-intro p {
  max-width: 720px;
  margin: 0;
  color: #52627a;
}

.profile-link,
.quick-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.settings-shell {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.settings-nav {
  display: grid;
  align-content: start;
  gap: 0.65rem;
  padding: 0.75rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.settings-nav-item {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 0 0.65rem;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  text-align: left;
}

.settings-nav-item i {
  grid-row: span 2;
  display: grid;
  place-items: center;
  color: #2563eb;
  font-size: 1rem;
}

.settings-nav-item span {
  color: #0f172a;
  font-weight: 900;
}

.settings-nav-item small {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.settings-nav-item.active,
.settings-nav-item:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.settings-content {
  min-width: 0;
}

.settings-panel,
.settings-skeleton {
  padding: 1.25rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-heading h2 {
  margin: 0 0 0.35rem;
  color: #0f172a;
  font-size: 1.25rem;
  line-height: 1.16;
  font-weight: 900;
}

.panel-heading p {
  margin: 0;
  color: #64748b;
}

.profile-preview {
  width: 76px;
  height: 76px;
  flex: 0 0 76px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #eef2ff;
  color: #334155;
  font-size: 1.25rem;
  font-weight: 900;
}

.profile-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-grid,
.preference-grid,
.security-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-grid.compact {
  margin: 1rem 0;
}

label {
  display: grid;
  gap: 0.45rem;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 800;
}

label span {
  overflow-wrap: anywhere;
}

.form-control,
.form-select {
  min-height: 42px;
  border-color: #cbd5e1;
  border-radius: 8px;
}

.upload-row {
  margin: 1rem 0;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
}

.day-chip,
.toggle-card,
.preference-card {
  min-height: 74px;
  padding: 0.85rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
}

.day-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
}

.day-chip:has(input:checked),
.toggle-card:has(input:checked) {
  border-color: #60a5fa;
  background: #eff6ff;
}

.toggle-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.toggle-card input {
  margin-top: 0.2rem;
}

.toggle-card strong {
  display: block;
  color: #0f172a;
}

.toggle-card small {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.password-field {
  position: relative;
}

.password-field .form-control {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #2563eb;
}

.security-tips {
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
}

.security-tips h3 {
  margin: 0 0 0.65rem;
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 900;
}

.security-tips ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #475569;
}

.save-note {
  margin: 1rem 0 0;
  color: #15803d;
  font-weight: 800;
}

.settings-skeleton {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.settings-skeleton .skeleton-line,
.settings-skeleton .skeleton-box {
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(90deg, #eef2ff 0%, #f8fafc 40%, #eef2ff 100%);
  background-size: 220% 100%;
  animation: loadingShimmer 1.2s ease-in-out infinite;
}

.settings-skeleton .title {
  width: 40%;
  height: 24px;
}

.settings-skeleton .skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.settings-skeleton .skeleton-box {
  height: 84px;
  border-radius: 8px;
}

@keyframes loadingShimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

:global(body.teacher-dark-mode) .teacher-settings-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 30rem),
    linear-gradient(135deg, #020617 0%, #0b1120 48%, #0f172a 100%) !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .settings-wrap,
:global(body.teacher-dark-mode) .settings-shell,
:global(body.teacher-dark-mode) .settings-content {
  background: transparent !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .settings-intro,
:global(body.teacher-dark-mode) .settings-nav,
:global(body.teacher-dark-mode) .settings-panel,
:global(body.teacher-dark-mode) .settings-skeleton,
:global(body.teacher-dark-mode) .day-chip,
:global(body.teacher-dark-mode) .toggle-card,
:global(body.teacher-dark-mode) .preference-card,
:global(body.teacher-dark-mode) .security-tips {
  background: #111827 !important;
  border-color: #243244 !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34) !important;
}

:global(body.teacher-dark-mode) .settings-skeleton .skeleton-line,
:global(body.teacher-dark-mode) .settings-skeleton .skeleton-box {
  background: linear-gradient(90deg, #111827 0%, #1e293b 42%, #111827 100%) !important;
  background-size: 220% 100% !important;
}

:global(body.teacher-dark-mode) .settings-intro h1,
:global(body.teacher-dark-mode) .panel-heading h2,
:global(body.teacher-dark-mode) .settings-nav-item span,
:global(body.teacher-dark-mode) .toggle-card strong,
:global(body.teacher-dark-mode) .preference-card span,
:global(body.teacher-dark-mode) label,
:global(body.teacher-dark-mode) .security-tips h3 {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .settings-intro p,
:global(body.teacher-dark-mode) .panel-heading p,
:global(body.teacher-dark-mode) .settings-nav-item small,
:global(body.teacher-dark-mode) .toggle-card small,
:global(body.teacher-dark-mode) .security-tips ul {
  color: #cbd5e1 !important;
}

:global(body.teacher-dark-mode) .panel-heading {
  border-bottom-color: #243244 !important;
}

:global(body.teacher-dark-mode) .settings-nav-item {
  color: #cbd5e1 !important;
}

:global(body.teacher-dark-mode) .settings-nav-item i,
:global(body.teacher-dark-mode) .eyebrow,
:global(body.teacher-dark-mode) .password-toggle {
  color: #93c5fd !important;
}

:global(body.teacher-dark-mode) .settings-nav-item.active,
:global(body.teacher-dark-mode) .settings-nav-item:hover,
:global(body.teacher-dark-mode) .day-chip:has(input:checked),
:global(body.teacher-dark-mode) .toggle-card:has(input:checked) {
  background: #172554 !important;
  border-color: #3b82f6 !important;
}

:global(body.teacher-dark-mode) .form-control,
:global(body.teacher-dark-mode) .form-select,
:global(body.teacher-dark-mode) textarea,
:global(body.teacher-dark-mode) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]) {
  background: #0b1220 !important;
  border-color: #334155 !important;
  color: #e5edf7 !important;
}

:global(body.teacher-dark-mode) .form-control::placeholder,
:global(body.teacher-dark-mode) textarea::placeholder,
:global(body.teacher-dark-mode) input::placeholder {
  color: #94a3b8 !important;
}

:global(body.teacher-dark-mode) .profile-preview {
  background: #0b1220 !important;
  border-color: #334155 !important;
  color: #dbeafe !important;
}

:global(body.teacher-dark-mode) .save-note {
  color: #86efac !important;
}

@media (max-width: 900px) {
  .settings-shell,
  .form-grid,
  .preference-grid,
  .security-grid {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .days-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .teacher-settings-page {
    padding: 1rem;
  }

  .settings-intro,
  .panel-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-nav,
  .days-grid {
    grid-template-columns: 1fr;
  }
}
</style>
