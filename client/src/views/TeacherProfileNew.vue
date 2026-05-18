<template>
  <TeacherLayout>
    <div class="profile-container">
      <!-- Header -->
      <div class="profile-header">
        <div class="profile-header-bg"></div>
        <div class="profile-header-content">
          <div class="profile-avatar-large">
            <img v-if="teacher?.profile_photo" :src="teacher.profile_photo" :alt="teacher?.name" />
            <div v-else class="avatar-placeholder">{{ getInitials }}</div>
            <label class="avatar-upload" @click="triggerFileInput">
              <i class="bi bi-camera"></i>
            </label>
            <input type="file" ref="fileInput" accept="image/*" @change="handlePhotoChange" style="display: none" />
          </div>
          <div class="profile-basic">
            <h1>{{ teacher?.name }}</h1>
            <p class="role">{{ teacher?.department }}</p>
            <p class="employee-id">ID: {{ teacher?.employee_id }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="profile-tabs">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          <i :class="getTabIcon(tab)"></i>
          {{ tab }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="profile-content">
        <!-- Personal Information Tab -->
        <section v-if="activeTab === 'Information'" class="tab-section">
          <div class="section-card">
            <h2>Personal Information</h2>
            <form @submit.prevent="saveProfile" class="form-layout">
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name</label>
                  <input v-model="formData.name" type="text" placeholder="Enter your full name" />
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input v-model="formData.email" type="email" placeholder="your.email@school.com" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Phone Number</label>
                  <input v-model="formData.phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div class="form-group">
                  <label>Department</label>
                  <input v-model="formData.department" type="text" placeholder="Mathematics, Science, etc." />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Employee ID</label>
                  <input v-model="formData.employee_id" type="text" placeholder="EMP001" />
                </div>
                <div class="form-group">
                  <label>Date Joined</label>
                  <input v-model="formData.date_joined" type="date" />
                </div>
              </div>

              <div v-if="messages.profile" class="alert" :class="alertClass.profile">
                {{ messages.profile }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" class="btn btn-secondary" @click="resetProfile">Cancel</button>
              </div>
            </form>
          </div>
        </section>

        <!-- Teaching Information Tab -->
        <section v-if="activeTab === 'Teaching'" class="tab-section">
          <div class="section-card">
            <h2>Teaching Information</h2>
            <form @submit.prevent="saveTeaching" class="form-layout">
              <div class="form-row">
                <div class="form-group">
                  <label>Subject/Module</label>
                  <input v-model="formData.module_name" type="text" placeholder="Mathematics" />
                </div>
                <div class="form-group">
                  <label>Qualification</label>
                  <input v-model="formData.qualification" type="text" placeholder="B.Ed, M.Sc, etc." />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Years of Experience</label>
                  <input v-model.number="formData.years_experience" type="number" min="0" placeholder="0" />
                </div>
                <div class="form-group">
                  <label>Specialization</label>
                  <input v-model="formData.specialization" type="text" placeholder="Advanced Mathematics, etc." />
                </div>
              </div>

              <div class="form-group full-width">
                <label>Professional Summary</label>
                <textarea
                  v-model="formData.bio"
                  placeholder="Brief professional background and teaching philosophy"
                  rows="4"
                ></textarea>
              </div>

              <div v-if="messages.teaching" class="alert" :class="alertClass.teaching">
                {{ messages.teaching }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" class="btn btn-secondary" @click="resetTeaching">Cancel</button>
              </div>
            </form>
          </div>
        </section>

        <!-- Availability Tab -->
        <section v-if="activeTab === 'Availability'" class="tab-section">
          <div class="section-card">
            <h2>Availability Settings</h2>
            <form @submit.prevent="saveAvailability" class="form-layout">
              <div class="form-group full-width">
                <label>Working Days</label>
                <div class="days-checkbox-group">
                  <label v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']" :key="day" class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="day"
                      v-model="formData.available_days"
                    />
                    {{ day }}
                  </label>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Available From</label>
                  <input v-model="formData.available_from" type="time" />
                </div>
                <div class="form-group">
                  <label>Available Until</label>
                  <input v-model="formData.available_to" type="time" />
                </div>
              </div>

              <div class="form-group full-width">
                <label>Preferred Teaching Blocks</label>
                <div class="days-checkbox-group">
                  <label v-for="block in ['Morning (08:00-12:00)', 'Afternoon (12:00-16:00)', 'Evening (16:00-20:00)']" :key="block" class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="block"
                      v-model="formData.preferred_blocks"
                    />
                    {{ block }}
                  </label>
                </div>
              </div>

              <div class="form-group full-width">
                <label>Additional Notes</label>
                <textarea
                  v-model="formData.notes"
                  placeholder="Special requirements, preferred classrooms, etc."
                  rows="4"
                ></textarea>
              </div>

              <div v-if="messages.availability" class="alert" :class="alertClass.availability">
                {{ messages.availability }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" class="btn btn-secondary" @click="resetAvailability">Cancel</button>
              </div>
            </form>
          </div>
        </section>

        <!-- Security Tab -->
        <section v-if="activeTab === 'Security'" class="tab-section">
          <div class="section-card">
            <h2>Change Password</h2>
            <form @submit.prevent="changePassword" class="form-layout">
              <div class="form-group">
                <label>Current Password</label>
                <div class="password-input">
                  <input
                    :type="showCurrentPass ? 'text' : 'password'"
                    v-model="passwordData.current"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    @click="showCurrentPass = !showCurrentPass"
                  >
                    <i :class="showCurrentPass ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>New Password</label>
                <div class="password-input">
                  <input
                    :type="showNewPass ? 'text' : 'password'"
                    v-model="passwordData.new"
                    placeholder="Enter new password (min 8 characters)"
                    minlength="8"
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    @click="showNewPass = !showNewPass"
                  >
                    <i :class="showNewPass ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
                <small class="password-hint">Use a mix of letters, numbers, and symbols for better security</small>
              </div>

              <div class="form-group">
                <label>Confirm Password</label>
                <div class="password-input">
                  <input
                    :type="showConfirmPass ? 'text' : 'password'"
                    v-model="passwordData.confirm"
                    placeholder="Confirm new password"
                    minlength="8"
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    @click="showConfirmPass = !showConfirmPass"
                  >
                    <i :class="showConfirmPass ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div v-if="messages.password" class="alert" :class="alertClass.password">
                {{ messages.password }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>

          <div class="section-card">
            <h2>Account Sessions</h2>
            <div class="sessions-list">
              <div class="session-item">
                <div class="session-info">
                  <i class="bi bi-laptop"></i>
                  <div>
                    <p class="session-device">Chrome on Windows</p>
                    <small>Last active: Today at 2:30 PM</small>
                  </div>
                </div>
                <button type="button" class="btn btn-danger-outline">Sign Out</button>
              </div>
              <div class="session-item">
                <div class="session-info">
                  <i class="bi bi-phone"></i>
                  <div>
                    <p class="session-device">Safari on iOS</p>
                    <small>Last active: 2 days ago</small>
                  </div>
                </div>
                <button type="button" class="btn btn-danger-outline">Sign Out</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Notifications Tab -->
        <section v-if="activeTab === 'Notifications'" class="tab-section">
          <div class="section-card">
            <h2>Notification Preferences</h2>
            <form @submit.prevent="saveNotifications" class="form-layout">
              <div class="notification-group">
                <h3>Email Notifications</h3>
                <label class="checkbox-label">
                  <input v-model="notificationSettings.emailTimetableChanges" type="checkbox" />
                  <span>
                    <strong>Timetable Changes</strong>
                    <small>Get notified when your schedule is updated</small>
                  </span>
                </label>
                <label class="checkbox-label">
                  <input v-model="notificationSettings.emailRequestUpdates" type="checkbox" />
                  <span>
                    <strong>Request Updates</strong>
                    <small>Notify when change requests are approved/rejected</small>
                  </span>
                </label>
                <label class="checkbox-label">
                  <input v-model="notificationSettings.emailAnnouncements" type="checkbox" />
                  <span>
                    <strong>Announcements</strong>
                    <small>Receive important school announcements</small>
                  </span>
                </label>
                <label class="checkbox-label">
                  <input v-model="notificationSettings.emailMessages" type="checkbox" />
                  <span>
                    <strong>Messages</strong>
                    <small>Get notified when admins send you messages</small>
                  </span>
                </label>
              </div>

              <div class="notification-group">
                <h3>Push Notifications</h3>
                <label class="checkbox-label">
                  <input v-model="notificationSettings.pushEnabled" type="checkbox" />
                  <span>
                    <strong>Enable Push Notifications</strong>
                    <small>Receive real-time notifications on your device</small>
                  </span>
                </label>
              </div>

              <div class="notification-group">
                <h3>Notification Frequency</h3>
                <div class="form-group">
                  <label>Digest Email</label>
                  <select v-model="notificationSettings.digestFrequency">
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>

              <div v-if="messages.notifications" class="alert" :class="alertClass.notifications">
                {{ messages.notifications }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Preferences</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const activeTab = ref('Information')
const fileInput = ref(null)

const tabs = ['Information', 'Teaching', 'Availability', 'Security', 'Notifications']

const teacher = ref(null)
const formData = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  employee_id: '',
  date_joined: '',
  module_name: '',
  qualification: '',
  years_experience: 0,
  specialization: '',
  bio: '',
  available_days: [],
  available_from: '08:00',
  available_to: '17:00',
  preferred_blocks: [],
  notes: ''
})

const passwordData = ref({
  current: '',
  new: '',
  confirm: ''
})

const notificationSettings = ref({
  emailTimetableChanges: true,
  emailRequestUpdates: true,
  emailAnnouncements: true,
  emailMessages: true,
  pushEnabled: true,
  digestFrequency: 'immediate'
})

const messages = ref({
  profile: '',
  teaching: '',
  availability: '',
  password: '',
  notifications: ''
})

const alertClass = ref({
  profile: 'alert-success',
  teaching: 'alert-success',
  availability: 'alert-success',
  password: 'alert-success',
  notifications: 'alert-success'
})

const showCurrentPass = ref(false)
const showNewPass = ref(false)
const showConfirmPass = ref(false)

const getInitials = computed(() => {
  if (!teacher.value?.name) return 'T'
  const parts = teacher.value.name.split(' ')
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
})

const getTabIcon = (tab) => {
  const icons = {
    'Information': 'bi bi-person',
    'Teaching': 'bi bi-book',
    'Availability': 'bi bi-calendar-check',
    'Security': 'bi bi-shield-lock',
    'Notifications': 'bi bi-bell'
  }
  return icons[tab] || 'bi bi-star'
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handlePhotoChange = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('Photo updated:', e.target?.result)
      messages.value.profile = 'Profile photo updated successfully!'
      alertClass.value.profile = 'alert-success'
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = () => {
  messages.value.profile = 'Personal information saved successfully!'
  alertClass.value.profile = 'alert-success'
  setTimeout(() => {
    messages.value.profile = ''
  }, 3000)
}

const resetProfile = () => {
  Object.assign(formData.value, {
    name: teacher.value?.name || '',
    email: teacher.value?.email || '',
    phone: teacher.value?.phone || '',
    department: teacher.value?.department || '',
    employee_id: teacher.value?.employee_id || ''
  })
}

const saveTeaching = () => {
  messages.value.teaching = 'Teaching information saved successfully!'
  alertClass.value.teaching = 'alert-success'
  setTimeout(() => {
    messages.value.teaching = ''
  }, 3000)
}

const resetTeaching = () => {
  formData.value.module_name = ''
  formData.value.qualification = ''
  formData.value.years_experience = 0
}

const saveAvailability = () => {
  messages.value.availability = 'Availability settings saved successfully!'
  alertClass.value.availability = 'alert-success'
  setTimeout(() => {
    messages.value.availability = ''
  }, 3000)
}

const resetAvailability = () => {
  formData.value.available_days = []
  formData.value.available_from = '08:00'
  formData.value.available_to = '17:00'
  formData.value.preferred_blocks = []
  formData.value.notes = ''
}

const changePassword = () => {
  if (passwordData.value.new !== passwordData.value.confirm) {
    messages.value.password = 'Passwords do not match!'
    alertClass.value.password = 'alert-danger'
    return
  }

  if (passwordData.value.new.length < 8) {
    messages.value.password = 'Password must be at least 8 characters!'
    alertClass.value.password = 'alert-danger'
    return
  }

  messages.value.password = 'Password changed successfully!'
  alertClass.value.password = 'alert-success'
  passwordData.value = { current: '', new: '', confirm: '' }
  setTimeout(() => {
    messages.value.password = ''
  }, 3000)
}

const saveNotifications = () => {
  messages.value.notifications = 'Notification preferences saved successfully!'
  alertClass.value.notifications = 'alert-success'
  setTimeout(() => {
    messages.value.notifications = ''
  }, 3000)
}

onMounted(() => {
  const storedTeacher = localStorage.getItem('teacher')
  if (storedTeacher) {
    teacher.value = JSON.parse(storedTeacher)
    Object.assign(formData.value, teacher.value)
  }
})
</script>

<style scoped>
:root {
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg: #f9fafb;
  --surface: #ffffff;
  --text: #111827;
  --text-light: #6b7280;
  --border: #e5e7eb;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.profile-header {
  position: relative;
  background: var(--surface);
  border-radius: 1rem;
  border: 1px solid var(--border);
  overflow: hidden;
}

.profile-header-bg {
  height: 150px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
}

.profile-header-content {
  display: flex;
  gap: 2rem;
  padding: 0 2rem 2rem;
  margin-top: -80px;
  position: relative;
}

.profile-avatar-large {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 4px solid var(--surface);
  overflow: hidden;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-avatar-large img {
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
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  font-weight: 700;
  font-size: 2rem;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 3px solid var(--surface);
}

.avatar-upload:hover {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.profile-basic {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.5rem;
}

.profile-basic h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text);
}

.role {
  margin: 0;
  color: var(--text-light);
  font-size: 1.1rem;
}

.employee-id {
  margin: 0;
  color: var(--text-light);
  font-size: 0.95rem;
}

/* Tabs */
.profile-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: var(--text-light);
  cursor: pointer;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  color: var(--text);
  border-bottom-color: var(--border);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Content */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tab-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
}

.section-card h2 {
  margin: 0 0 1.5rem;
  color: var(--text);
  font-size: 1.25rem;
}

.section-card h3 {
  margin: 0 0 1rem;
  color: var(--text);
  font-size: 1rem;
}

/* Forms */
.form-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  color: var(--text);
  background: var(--bg);
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-group textarea {
  resize: vertical;
}

.password-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--bg);
  transition: all 0.2s;
}

.password-input input {
  flex: 1;
  border: none;
  background: none;
  padding: 0.75rem;
}

.password-input input:focus {
  outline: none;
}

.password-input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.toggle-password {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 0.75rem 1rem;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: var(--primary);
}

.password-hint {
  color: var(--text-light);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.days-checkbox-group,
.notification-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  width: 20px;
  height: 20px;
  margin-top: 0.2rem;
  cursor: pointer;
  accent-color: var(--primary);
}

.checkbox-label span {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-label strong {
  color: var(--text);
}

.checkbox-label small {
  color: var(--text-light);
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border-left-color: var(--success);
  color: #047857;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: var(--danger);
  color: #991b1b;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger-outline {
  background: none;
  border: 1px solid var(--danger);
  color: var(--danger);
}

.btn-danger-outline:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Sessions */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg);
  border-radius: 0.5rem;
  border: 1px solid var(--border);
}

.session-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.session-info i {
  font-size: 1.5rem;
  color: var(--primary);
}

.session-device {
  margin: 0;
  font-weight: 600;
  color: var(--text);
}

.session-item small {
  color: var(--text-light);
}

/* Responsive */
@media (max-width: 768px) {
  .profile-header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .profile-basic {
    justify-content: center;
  }

  .profile-basic h1 {
    font-size: 1.5rem;
  }

  .section-card {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .profile-tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .session-item {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .profile-header-bg {
    height: 100px;
  }

  .profile-avatar-large {
    width: 120px;
    height: 120px;
  }

  .profile-header-content {
    margin-top: -60px;
    padding: 0 1rem 1rem;
  }

  .profile-basic h1 {
    font-size: 1.25rem;
  }

  .section-card {
    padding: 1rem;
  }

  .avatar-upload {
    width: 35px;
    height: 35px;
  }

  .form-row {
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
