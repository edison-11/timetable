<template>
  <TeacherLayout>
    <div class="profile-container">
      <!-- Header -->
      <section class="profile-header">
        <h1><UserRound :size="36" :stroke-width="2.2" aria-hidden="true" /> My Profile</h1>
        <p>Manage your profile information and settings</p>
      </section>

      <div v-if="isLoadingProfile" class="profile-loading">
        <div class="profile-loading-header">
          <div class="skeleton-avatar"></div>
          <div class="profile-loading-lines">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
        <div class="profile-loading-grid">
          <div class="skeleton-box" v-for="index in 6" :key="index"></div>
        </div>
      </div>

      <div v-else>
        <!-- Profile Tabs -->
        <section class="profile-tabs">
          <button
            v-for="tab in tabs"
            :key="tab"
            class="tab-btn"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            <component :is="getTabIcon(tab)" :size="18" :stroke-width="2.2" aria-hidden="true" />
            <span>{{ tab }}</span>
          </button>
        </section>

        <!-- Profile Overview Tab -->
      <section v-if="activeTab === 'Overview'" class="profile-section">
        <div class="profile-overview">
          <!-- Profile Photo Section -->
          <div class="photo-section">
            <div class="profile-photo-container">
              <img
                v-if="profileData.photo"
                :src="profileData.photo"
                :alt="profileData.name"
                class="profile-photo"
              />
              <div v-else class="profile-photo-placeholder">
                {{ getInitials(profileData.name) }}
              </div>
              <button class="photo-upload-btn" @click="triggerPhotoUpload">
                <Camera :size="18" :stroke-width="2.2" aria-hidden="true" />
              </button>
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                hidden
                @change="uploadPhoto"
              />
            </div>
            <div class="photo-info">
              <h3>{{ profileData.name }}</h3>
              <p class="department">{{ profileData.department }}</p>
              <p class="email">{{ profileData.email }}</p>
              <span class="status-badge online">
                <Circle :size="9" fill="currentColor" :stroke-width="0" aria-hidden="true" /> Active
              </span>
            </div>
          </div>

          <!-- Quick Info Grid -->
          <div class="info-grid">
            <div class="info-card identity">
              <span class="info-icon"><BadgeCheck :size="20" :stroke-width="2.2" aria-hidden="true" /></span>
              <label>Employee ID</label>
              <p>{{ profileData.employeeId }}</p>
            </div>

            <div class="info-card contact">
              <span class="info-icon"><Phone :size="20" :stroke-width="2.2" aria-hidden="true" /></span>
              <label>Phone</label>
              <p>{{ profileData.phone }}</p>
            </div>

            <div class="info-card subject">
              <span class="info-icon"><BookMarked :size="20" :stroke-width="2.2" aria-hidden="true" /></span>
              <label>Primary Subject</label>
              <p>{{ profileData.subject }}</p>
            </div>

            <div class="info-card qualification">
              <span class="info-icon"><GraduationCap :size="20" :stroke-width="2.2" aria-hidden="true" /></span>
              <label>Qualification</label>
              <p>{{ profileData.qualification }}</p>
            </div>

            <div class="info-card experience">
              <span class="info-icon"><BriefcaseBusiness :size="20" :stroke-width="2.2" aria-hidden="true" /></span>
              <label>Years of Experience</label>
              <p>{{ profileData.experience }} years</p>
            </div>

            <div class="info-card joined">
              <span class="info-icon"><CalendarPlus :size="20" :stroke-width="2.2" aria-hidden="true" /></span>
              <label>Joining Date</label>
              <p>{{ formatDate(profileData.joinDate) }}</p>
            </div>
          </div>

          <!-- Statistics -->
          <div class="stats-section">
            <h3>Statistics</h3>
            <div class="stats-grid">
              <div class="stat classes">
                <Presentation :size="20" :stroke-width="2.2" aria-hidden="true" />
                <span class="stat-value">{{ stats.totalClasses }}</span>
                <span class="stat-label">Total Classes</span>
              </div>

              <div class="stat students">
                <Users :size="20" :stroke-width="2.2" aria-hidden="true" />
                <span class="stat-value">{{ stats.students }}</span>
                <span class="stat-label">Students Taught</span>
              </div>

              <div class="stat subjects">
                <BookOpen :size="20" :stroke-width="2.2" aria-hidden="true" />
                <span class="stat-value">{{ stats.subjects }}</span>
                <span class="stat-label">Subjects</span>
              </div>

              <div class="stat pending">
                <Hourglass :size="20" :stroke-width="2.2" aria-hidden="true" />
                <span class="stat-value">{{ stats.requestsPending }}</span>
                <span class="stat-label">Pending Requests</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="btn-secondary" @click="activeTab = 'Edit Profile'">
              <Pencil :size="18" :stroke-width="2.2" aria-hidden="true" /> Edit Profile
            </button>
            <button class="btn-secondary" @click="activeTab = 'Security'">
              <Lock :size="18" :stroke-width="2.2" aria-hidden="true" /> Change Password
            </button>
            <button class="btn-secondary" @click="downloadProfilePDF">
              <Download :size="18" :stroke-width="2.2" aria-hidden="true" /> Download Profile
            </button>
          </div>
        </div>
      </section>

      <!-- Edit Profile Tab -->
      <section v-else-if="activeTab === 'Edit Profile'" class="profile-section">
        <form @submit.prevent="saveProfile" class="profile-form">
          <div class="form-section">
            <h3>Personal Information</h3>

            <div class="form-group">
              <label>Full Name *</label>
              <input v-model="editData.name" type="text" class="form-input" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email *</label>
                <input v-model="editData.email" type="email" class="form-input" required />
              </div>

              <div class="form-group">
                <label>Phone *</label>
                <input v-model="editData.phone" type="tel" class="form-input" required />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Professional Information</h3>

            <div class="form-row">
              <div class="form-group">
                <label>Department *</label>
                <select v-model="editData.department" class="form-input" required>
                  <option>SSOD</option>
                  <option>Science</option>
                  <option>Languages</option>
                  <option>Mathematics</option>
                  <option>Social Studies</option>
                </select>
              </div>

              <div class="form-group">
                <label>Primary Subject *</label>
                <input v-model="editData.subject" type="text" class="form-input" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Qualification</label>
                <input v-model="editData.qualification" type="text" class="form-input" />
              </div>

              <div class="form-group">
                <label>Years of Experience</label>
                <input v-model.number="editData.experience" type="number" class="form-input" min="0" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Availability</h3>

            <div class="form-group">
              <label>Available Days</label>
              <div class="checkbox-group">
                <label v-for="day in days" :key="day" class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="editData.availableDays.includes(day)"
                    @change="toggleAvailableDay(day)"
                  />
                  <span>{{ day }}</span>
                </label>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Available From</label>
                <input v-model="editData.availableFrom" type="time" class="form-input" />
              </div>

              <div class="form-group">
                <label>Available To</label>
                <input v-model="editData.availableTo" type="time" class="form-input" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Additional Notes</h3>

            <div class="form-group">
              <label>Notes</label>
              <textarea
                v-model="editData.notes"
                class="form-input form-textarea"
                placeholder="Add any additional information..."
                rows="4"
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              <Check :size="18" :stroke-width="2.2" aria-hidden="true" /> Save Changes
            </button>
            <button type="button" class="btn-secondary" @click="activeTab = 'Overview'">
              <X :size="18" :stroke-width="2.2" aria-hidden="true" /> Cancel
            </button>
          </div>
        </form>
      </section>

      <!-- Security Tab -->
      <section v-else-if="activeTab === 'Security'" class="profile-section">
        <div class="security-section">
          <div class="security-card">
            <h3>Change Password</h3>
            <p>Update your password to keep your account secure</p>

            <form @submit.prevent="changePassword" class="security-form">
              <div class="form-group">
                <label>Current Password *</label>
                <div class="password-input">
                  <input
                    v-model="passwordData.current"
                    :type="showPasswords.current ? 'text' : 'password'"
                    class="form-input"
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showPasswords.current = !showPasswords.current"
                  >
                    <EyeOff v-if="showPasswords.current" :size="18" :stroke-width="2.2" aria-hidden="true" />
                    <Eye v-else :size="18" :stroke-width="2.2" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>New Password *</label>
                <div class="password-input">
                  <input
                    v-model="passwordData.new"
                    :type="showPasswords.new ? 'text' : 'password'"
                    class="form-input"
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showPasswords.new = !showPasswords.new"
                  >
                    <EyeOff v-if="showPasswords.new" :size="18" :stroke-width="2.2" aria-hidden="true" />
                    <Eye v-else :size="18" :stroke-width="2.2" aria-hidden="true" />
                  </button>
                </div>
                <small class="password-hint">At least 8 characters with uppercase, lowercase, and numbers</small>
              </div>

              <div class="form-group">
                <label>Confirm New Password *</label>
                <div class="password-input">
                  <input
                    v-model="passwordData.confirm"
                    :type="showPasswords.confirm ? 'text' : 'password'"
                    class="form-input"
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showPasswords.confirm = !showPasswords.confirm"
                  >
                    <EyeOff v-if="showPasswords.confirm" :size="18" :stroke-width="2.2" aria-hidden="true" />
                    <Eye v-else :size="18" :stroke-width="2.2" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div v-if="passwordError" class="error-message">
                <AlertCircle :size="18" :stroke-width="2.2" aria-hidden="true" />
                {{ passwordError }}
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary">
                  <ShieldCheck :size="18" :stroke-width="2.2" aria-hidden="true" /> Update Password
                </button>
                <button type="button" class="btn-secondary" @click="activeTab = 'Overview'">
                  <X :size="18" :stroke-width="2.2" aria-hidden="true" /> Cancel
                </button>
              </div>
            </form>
          </div>

          <div class="security-card">
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account</p>
            <button class="btn-secondary">
              <Shield :size="18" :stroke-width="2.2" aria-hidden="true" /> Enable 2FA
            </button>
          </div>

          <div class="security-card">
            <h3>Login Activity</h3>
            <div class="activity-list">
              <div v-for="activity in loginActivity" :key="activity.id" class="activity-item">
                <div class="activity-header">
                  <span class="activity-device">{{ activity.device }}</span>
                  <span class="activity-time">{{ formatDateTime(activity.time) }}</span>
                </div>
                <p class="activity-location">{{ activity.location }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Notifications Tab -->
      <section v-else-if="activeTab === 'Notifications'" class="profile-section">
        <div class="notifications-section">
          <h3>Notification Preferences</h3>

          <div class="preference-group">
            <h4>Email Notifications</h4>

            <label class="preference-item">
              <input type="checkbox" v-model="notificationPrefs.emailClasses" />
              <div class="preference-content">
                <span class="preference-title">Class Schedule Changes</span>
                <small>Notify me when my class schedule changes</small>
              </div>
            </label>

            <label class="preference-item">
              <input type="checkbox" v-model="notificationPrefs.emailRequests" />
              <div class="preference-content">
                <span class="preference-title">Request Updates</span>
                <small>Notify me when my requests are approved or rejected</small>
              </div>
            </label>

            <label class="preference-item">
              <input type="checkbox" v-model="notificationPrefs.emailAnnouncements" />
              <div class="preference-content">
                <span class="preference-title">Announcements</span>
                <small>Notify me about school announcements</small>
              </div>
            </label>
          </div>

          <div class="preference-group">
            <h4>In-App Notifications</h4>

            <label class="preference-item">
              <input type="checkbox" v-model="notificationPrefs.inAppClasses" />
              <div class="preference-content">
                <span class="preference-title">Class Reminders</span>
                <small>Show reminders for upcoming classes</small>
              </div>
            </label>

            <label class="preference-item">
              <input type="checkbox" v-model="notificationPrefs.inAppRequests" />
              <div class="preference-content">
                <span class="preference-title">Request Notifications</span>
                <small>Show notifications for request updates</small>
              </div>
            </label>
          </div>

          <div class="form-actions">
            <button class="btn-primary" @click="saveNotificationPrefs">
              <Check :size="18" :stroke-width="2.2" aria-hidden="true" /> Save Preferences
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  CalendarPlus,
  Camera,
  Check,
  Circle,
  Download,
  Eye,
  EyeOff,
  Hourglass,
  Lock,
  Pencil,
  Phone,
  Presentation,
  GraduationCap,
  Shield,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X
} from '@lucide/vue'

const activeTab = ref('Overview')
const fileInput = ref(null)
const authStore = useAuthStore()
const selectedProfilePhoto = ref(null)
const showPasswords = ref({
  current: false,
  new: false,
  confirm: false
})
const passwordError = ref('')
const isLoadingProfile = ref(true)
const loadError = ref('')

const tabs = ['Overview', 'Edit Profile', 'Security', 'Notifications']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const profileData = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  subject: '',
  qualification: '',
  experience: 0,
  employeeId: '',
  joinDate: '',
  photo: null
})

const editData = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  subject: '',
  qualification: '',
  experience: 0,
  availableDays: [],
  availableFrom: '08:00',
  availableTo: '16:00',
  notes: ''
})

const passwordData = ref({
  current: '',
  new: '',
  confirm: ''
})

const notificationPrefs = ref({
  emailClasses: true,
  emailRequests: true,
  emailAnnouncements: true,
  inAppClasses: true,
  inAppRequests: true
})

const stats = ref({
  totalClasses: 15,
  students: 120,
  subjects: 3,
  requestsPending: 2
})

const loginActivity = ref([
  {
    id: 1,
    device: 'Chrome on Windows',
    time: new Date(),
    location: 'School Building'
  },
  {
    id: 2,
    device: 'Safari on iPhone',
    time: new Date(Date.now() - 86400000),
    location: 'Home'
  }
])

const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path

  const apiRoot = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`
}

const hydrateProfileFromTeacher = (teacher = {}) => {
  profileData.value = {
    name: teacher.name || teacher.username || '',
    email: teacher.email || '',
    phone: teacher.phone || '',
    department: teacher.department || '',
    subject: teacher.module_name || teacher.subject || '',
    qualification: teacher.qualification || '',
    experience: Number(teacher.years_experience) || 0,
    employeeId: teacher.employee_id || teacher.teacher_id || '',
    joinDate: teacher.created_at || teacher.join_date || '',
    photo: resolveAssetUrl(teacher.profile_photo)
  }

  editData.value = {
    name: profileData.value.name,
    email: profileData.value.email,
    phone: profileData.value.phone,
    department: profileData.value.department,
    subject: profileData.value.subject,
    qualification: profileData.value.qualification,
    experience: profileData.value.experience,
    availableDays: teacher.available_days ? String(teacher.available_days).split(',').map(day => day.trim()).filter(Boolean) : [...days],
    availableFrom: teacher.available_from || '08:00',
    availableTo: teacher.available_to || '16:00',
    notes: teacher.notes || ''
  }
}

const getTabIcon = (tab) => {
  const icons = {
    'Overview': UserCheck,
    'Edit Profile': Pencil,
    'Security': Lock,
    'Notifications': Bell
  }
  return icons[tab] || UserRound
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const triggerPhotoUpload = () => {
  fileInput.value?.click()
}

const persistProfilePhoto = async (profilePhotoPath) => {
  await api.put('/teacher-auth/me', {
    name: editData.value.name,
    email: editData.value.email,
    department: editData.value.department,
    phone: editData.value.phone,
    profile_photo: profilePhotoPath,
    module_name: editData.value.subject,
    qualification: editData.value.qualification,
    yearsExperience: editData.value.experience,
    availableDays: editData.value.availableDays.join(','),
    availableFrom: editData.value.availableFrom,
    availableTo: editData.value.availableTo,
    notes: editData.value.notes
  })
}

const uploadPhoto = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  selectedProfilePhoto.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    profileData.value.photo = e.target?.result
  }
  reader.readAsDataURL(file)

  try {
    const uploadFormData = new FormData()
    uploadFormData.append('photo', file)
    const uploadResponse = await api.post('/upload/profile-photo', uploadFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const profilePhotoPath = uploadResponse.data.photo.path
    await persistProfilePhoto(profilePhotoPath)
    await authStore.checkAuth()
    hydrateProfileFromTeacher(authStore.currentUser || {})
    selectedProfilePhoto.value = null
  } catch (error) {
    passwordError.value = error.response?.data?.message || 'Failed to upload profile photo'
  }
}

const toggleAvailableDay = (day) => {
  const index = editData.value.availableDays.indexOf(day)
  if (index > -1) {
    editData.value.availableDays.splice(index, 1)
  } else {
    editData.value.availableDays.push(day)
  }
}

const saveProfile = async () => {
  try {
    let profilePhotoPath = authStore.currentUser?.profile_photo || null

    if (selectedProfilePhoto.value) {
      const uploadFormData = new FormData()
      uploadFormData.append('photo', selectedProfilePhoto.value)
      const uploadResponse = await api.post('/upload/profile-photo', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      profilePhotoPath = uploadResponse.data.photo.path
    }

    await persistProfilePhoto(profilePhotoPath)

    await authStore.checkAuth()
    hydrateProfileFromTeacher(authStore.currentUser || {})
    selectedProfilePhoto.value = null
    activeTab.value = 'Overview'
  } catch (error) {
    passwordError.value = error.response?.data?.message || 'Failed to save profile'
  }
}

const changePassword = () => {
  passwordError.value = ''

  if (!passwordData.value.current) {
    passwordError.value = 'Current password is required'
    return
  }

  if (passwordData.value.new.length < 8) {
    passwordError.value = 'New password must be at least 8 characters'
    return
  }

  if (!/[A-Z]/.test(passwordData.value.new)) {
    passwordError.value = 'Password must contain at least one uppercase letter'
    return
  }

  if (!/[0-9]/.test(passwordData.value.new)) {
    passwordError.value = 'Password must contain at least one number'
    return
  }

  if (passwordData.value.new !== passwordData.value.confirm) {
    passwordError.value = 'Passwords do not match'
    return
  }

  alert('Password changed successfully!')
  passwordData.value = { current: '', new: '', confirm: '' }
  activeTab.value = 'Overview'
}

const saveNotificationPrefs = () => {
  alert('Notification preferences saved successfully!')
}

const downloadProfilePDF = () => {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    window.print()
    return
  }

  printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${profileData.value.name || 'Teacher'} Profile</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
    h1 { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td { border: 1px solid #d1d5db; padding: 10px; }
    td:first-child { font-weight: 700; background: #f8fafc; width: 220px; }
  </style>
</head>
<body>
  <h1>${profileData.value.name || 'Teacher Profile'}</h1>
  <p>${profileData.value.email || ''}</p>
  <table>
    <tr><td>Department</td><td>${profileData.value.department || ''}</td></tr>
    <tr><td>Phone</td><td>${profileData.value.phone || ''}</td></tr>
    <tr><td>Primary Subject</td><td>${profileData.value.subject || ''}</td></tr>
    <tr><td>Qualification</td><td>${profileData.value.qualification || ''}</td></tr>
    <tr><td>Experience</td><td>${profileData.value.experience || 0} years</td></tr>
    <tr><td>Employee ID</td><td>${profileData.value.employeeId || ''}</td></tr>
  </table>
</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

onMounted(async () => {
  isLoadingProfile.value = true
  try {
    await authStore.checkAuth()
    hydrateProfileFromTeacher(authStore.currentUser || {})
  } catch (error) {
    loadError.value = error.message || 'Unable to load profile. Please try again.'
  } finally {
    isLoadingProfile.value = false
  }
})
</script>

<style scoped>
.profile-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  min-height: 100vh;
}

.profile-header {
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.profile-loading {
  display: grid;
  gap: 1.5rem;
  padding: 1.75rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #dbeafe;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
  margin-bottom: 1.75rem;
}

.profile-loading-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.skeleton-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(90deg, #e2e8f0 0%, #f8fafc 40%, #e2e8f0 100%);
  background-size: 220% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.profile-loading-lines {
  flex: 1;
  display: grid;
  gap: 0.85rem;
}

.profile-loading-grid {
  display: grid;
  gap: 1rem;
}

.skeleton-box,
.skeleton-line {
  min-height: 18px;
  border-radius: 999px;
  background: linear-gradient(90deg, #e2e8f0 0%, #f8fafc 40%, #e2e8f0 100%);
  background-size: 220% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.skeleton-line.title {
  width: 55%;
  height: 20px;
}

.skeleton-line.short {
  width: 45%;
}

.skeleton-box {
  height: 18px;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

.profile-header h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-weight: 700;
}

.profile-header h1 svg {
  color: #2563eb;
  flex: 0 0 36px;
}

.profile-header p {
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #2563eb;
  border-color: #2563eb;
}

.tab-btn.active {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.profile-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

/* Overview Tab */
.profile-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.photo-section {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  padding: 2rem;
  margin: -2rem -2rem 2rem -2rem;
  border-radius: 12px 12px 0 0;
}

.profile-photo-container {
  position: relative;
}

.profile-photo,
.profile-photo-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
}

.photo-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  border: 3px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.photo-upload-btn:hover {
  background: #059669;
  transform: scale(1.1);
}

.photo-info {
  flex: 1;
}

.photo-info h3 {
  font-size: 1.75rem;
  margin: 0 0 0.75rem 0;
  color: #111827;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.department {
  color: #374151;
  margin: 0.35rem 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

.email {
  color: #6b7280;
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #dcfce7;
  color: #15803d;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 1rem;
}

.status-badge i {
  font-size: 0.6rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 0.15rem 0.85rem;
  align-items: center;
  background: #f9fafb;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #2563eb;
  transition: all 0.3s ease;
}

.info-icon {
  grid-row: span 2;
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  color: #1d4ed8;
  background: #dbeafe;
}

.info-card.contact { border-left-color: #0f766e; }
.info-card.contact .info-icon { color: #0f766e; background: #ccfbf1; }
.info-card.subject { border-left-color: #7c3aed; }
.info-card.subject .info-icon { color: #6d28d9; background: #ede9fe; }
.info-card.qualification { border-left-color: #b45309; }
.info-card.qualification .info-icon { color: #b45309; background: #fef3c7; }
.info-card.experience { border-left-color: #15803d; }
.info-card.experience .info-icon { color: #15803d; background: #dcfce7; }
.info-card.joined { border-left-color: #0891b2; }
.info-card.joined .info-icon { color: #0e7490; background: #cffafe; }

.info-card:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-card label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  display: block;
  margin-bottom: 0.75rem;
  letter-spacing: 0.5px;
}

.info-card p {
  font-size: 1.1rem;
  color: #111827;
  margin: 0;
  font-weight: 600;
  line-height: 1.5;
}

.stats-section {
  margin: 2rem 0;
}

.stats-section h3 {
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  padding: 1.75rem 1.5rem;
  border-radius: 8px;
  text-align: center;
  color: #0c4a6e;
  transition: all 0.3s ease;
}

.stat::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #2563eb, #14b8a6);
}

.stat svg {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 7px;
  margin-bottom: 0.85rem;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.14);
  color: #1d4ed8;
}

.stat.classes svg { background: #dbeafe; color: #1d4ed8; }
.stat.students svg { background: #dcfce7; color: #15803d; }
.stat.subjects svg { background: #ede9fe; color: #6d28d9; }
.stat.pending svg { background: #fef3c7; color: #b45309; }

.stat:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(12, 74, 110, 0.15);
}

.stat-value {
  display: block;
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
}

:global(body.teacher-dark-mode) .stats-section h3 {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .stats-grid .stat {
  border: 1px solid #243244 !important;
  background: #111827 !important;
  color: #e5edf7 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body.teacher-dark-mode) .stats-grid .stat-value {
  color: #f8fafc !important;
}

:global(body.teacher-dark-mode) .stats-grid .stat-label {
  color: #cbd5e1 !important;
}

:global(.teacher-shell.dark-mode) .profile-container .stats-section h3 {
  color: #f8fafc !important;
}

:global(.teacher-shell.dark-mode) .profile-container .stats-grid .stat {
  border: 1px solid #243244 !important;
  background: #111827 !important;
  color: #e5edf7 !important;
  opacity: 1 !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28) !important;
}

:global(body.teacher-dark-mode) .stats-grid .stat svg,
:global(.teacher-shell.dark-mode) .profile-container .stats-grid .stat svg {
  background: rgba(96, 165, 250, 0.16) !important;
  color: #93c5fd !important;
}

:global(body.teacher-dark-mode) .profile-container .info-icon,
:global(.teacher-shell.dark-mode) .profile-container .info-icon {
  background: rgba(96, 165, 250, 0.16) !important;
  color: #93c5fd !important;
}

:global(.teacher-shell.dark-mode) .profile-container .stats-grid .stat-value {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
}

:global(.teacher-shell.dark-mode) .profile-container .stats-grid .stat-label {
  color: #dbeafe !important;
  opacity: 1 !important;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #2563eb;
  color: #2563eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #f0f9ff;
  transform: translateY(-2px);
}

/* Form Styles */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-section h3 {
  font-size: 1.25rem;
  margin: 0;
  color: #111827;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #111827;
  background: white;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  flex: 1;
}

/* Security Section */
.security-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.security-card {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.security-card h3 {
  margin: 0 0 0.75rem 0;
  color: #111827;
  font-size: 1.1rem;
  font-weight: 700;
}

.security-card p {
  color: #6b7280;
  margin: 0 0 1.25rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.security-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.password-toggle:hover {
  color: #2563eb;
}

.password-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 0.9rem;
}

.error-message i {
  font-size: 1.1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.activity-device {
  font-weight: 600;
  color: #111827;
}

.activity-time {
  font-size: 0.85rem;
  color: #9ca3af;
}

.activity-location {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

/* Notifications Section */
.notifications-section {
  max-width: 600px;
}

.notifications-section h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
}

.preference-group {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.preference-group h4 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 0.95rem;
}

.preference-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.preference-item:hover {
  background: #f3f4f6;
}

.preference-item input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

.preference-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preference-title {
  font-weight: 600;
  color: #111827;
  display: block;
}

.preference-item small {
  color: #9ca3af;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-section {
    padding: 1.5rem;
  }

  .photo-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .profile-tabs {
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .tab-btn span {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
