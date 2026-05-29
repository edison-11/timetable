<template>
  <TeacherLayout>
  <div class="teacher-settings-page">
    <!-- Main Content -->
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="settings-intro mb-4">
            <h1>Settings</h1>
            <p>Manage application preferences, availability, and account security. Personal details now live in My Profile.</p>
            <router-link to="/teacher/profile" class="profile-link">Go to My Profile</router-link>
          </div>

          <div v-if="loadingData" class="settings-skeleton mb-4">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-grid">
              <div class="skeleton-box" v-for="index in 3" :key="index"></div>
            </div>
          </div>

          <div v-else>
            <div v-if="settingsError" class="alert alert-danger mb-4">
              {{ settingsError }}
            </div>
            <!-- Tabs Navigation -->
            <ul class="nav nav-tabs mb-4" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'profile' }"
                @click="activeTab = 'profile'"
                type="button"
              >
                <i class="bi bi-person-circle me-2"></i>Profile
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'availability' }"
                @click="activeTab = 'availability'"
                type="button"
              >
                <i class="bi bi-calendar-check me-2"></i>Availability
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'security' }"
                @click="activeTab = 'security'"
                type="button"
              >
                <i class="bi bi-shield-lock me-2"></i>Security
              </button>
            </li>
          </ul>

          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="card shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">Profile Settings</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveProfile">
                <div class="row gx-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Full Name</label>
                    <input v-model.trim="profileData.name" type="text" class="form-control" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input v-model.trim="profileData.email" type="email" class="form-control" required />
                  </div>
                </div>

                <div class="row gx-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Department</label>
                    <input v-model.trim="profileData.department" type="text" class="form-control" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input v-model.trim="profileData.phone" type="tel" class="form-control" />
                  </div>
                </div>

                <div class="row gx-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Staff ID</label>
                    <input v-model.trim="profileData.employee_id" type="text" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Qualification</label>
                    <input v-model.trim="profileData.qualification" type="text" class="form-control" />
                  </div>
                </div>

                <div class="row gx-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Subject Specialization</label>
                    <input v-model.trim="profileData.module_name" type="text" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Years of Experience</label>
                    <input v-model.number="profileData.years_experience" type="number" min="0" class="form-control" />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Profile Photo</label>
                  <div class="profile-photo-field d-flex gap-3 align-items-center">
                    <div class="profile-preview">
                      <img v-if="profileData.profile_photo" :src="profileData.profile_photo" alt="Teacher avatar" />
                      <span v-else class="profile-placeholder">T</span>
                    </div>
                    <input type="file" accept="image/*" class="form-control" @change="handleAvatarUpload" />
                  </div>
                </div>

                <div class="mb-3 form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="scheduleAlert" v-model="profileData.receive_schedule_alerts" />
                  <label class="form-check-label" for="scheduleAlert">Receive timetable update alerts</label>
                </div>

                <div v-if="messages.profile" class="alert" :class="messagesClass.profile" role="alert">
                  {{ messages.profile }}
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loadingProfile">
                    <span v-if="loadingProfile">Updating profile...</span>
                    <span v-else>Save Profile</span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetProfile">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Availability Tab -->
          <div v-if="activeTab === 'availability'" class="card shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">Availability Settings</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveAvailability">
                <div class="mb-4">
                  <label class="form-label fw-semibold">Working Days</label>
                  <div class="row gx-2 gy-2">
                    <div class="col-6" v-for="day in availableDaysOptions" :key="day">
                      <div class="form-check">
                        <input
                          type="checkbox"
                          class="form-check-input"
                          :id="day"
                          :value="day"
                          v-model="availableDaysArray"
                        >
                        <label class="form-check-label" :for="day">
                          {{ day }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row gx-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Available From</label>
                    <input v-model="formData.available_from" type="time" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Available Until</label>
                    <input v-model="formData.available_to" type="time" class="form-control">
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Additional Notes</label>
                  <textarea v-model.trim="formData.notes" rows="4" class="form-control" placeholder="Preferred classrooms, special needs, etc."></textarea>
                </div>

                <div v-if="messages.availability" class="alert" :class="messagesClass.availability" role="alert">
                  {{ messages.availability }}
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loadingAvailability">
                    <span v-if="loadingAvailability">Saving...</span>
                    <span v-else>Save Changes</span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetAvailability">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="card shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">Security Settings</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="savePassword">
                <div class="alert alert-info" role="alert">
                  <i class="bi bi-info-circle me-2"></i>
                  Leave the password field blank to keep your current password unchanged.
                </div>

                <div class="mb-3">
                  <label class="form-label">New Password</label>
                  <div class="password-field">
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Enter new password"
                      minlength="6"
                    >
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
                      :title="showNewPassword ? 'Hide password' : 'Show password'"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <svg v-if="showNewPassword" class="form-signifier-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.6 4.3 10 8a13.2 13.2 0 0 1-2.6 4.1" />
                        <path d="M6.6 6.6A13.1 13.1 0 0 0 2 12c1.4 3.7 4.8 8 10 8 1.8 0 3.4-.5 4.8-1.3" />
                      </svg>
                      <svg v-else class="form-signifier-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                      </svg>
                    </button>
                  </div>
                  <div class="form-text">At least 6 characters for security.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Confirm Password</label>
                  <div class="password-field">
                    <input
                      v-model="passwordForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Confirm new password"
                    >
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                      :title="showConfirmPassword ? 'Hide password' : 'Show password'"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <svg v-if="showConfirmPassword" class="form-signifier-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.6 4.3 10 8a13.2 13.2 0 0 1-2.6 4.1" />
                        <path d="M6.6 6.6A13.1 13.1 0 0 0 2 12c1.4 3.7 4.8 8 10 8 1.8 0 3.4-.5 4.8-1.3" />
                      </svg>
                      <svg v-else class="form-signifier-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div v-if="messages.password" class="alert" :class="messagesClass.password" role="alert">
                  {{ messages.password }}
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loadingPassword">
                    <span v-if="loadingPassword">Updating...</span>
                    <span v-else>Update Password</span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetPassword">
                    Cancel
                  </button>
                </div>
              </form>

              <hr class="my-4">

              <div>
                <h6 class="fw-semibold mb-3">Danger Zone</h6>
                <p class="text-muted">Once you delete your account, there is no going back. Please be certain.</p>
                <button type="button" class="btn btn-danger" @click="confirmDeleteAccount">
                  <i class="bi bi-trash me-2"></i>Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>

  <ConfirmModal
    v-model="deleteDialogOpen"
    title="Delete Account"
    description="Account deletion is not available yet. This action will be added after account recovery and audit protections are complete."
    confirm-label="Got it"
    cancel-label="Close"
    @confirm="deleteDialogOpen = false"
  />
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'
import TeacherLayout from '@/components/TeacherLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const authStore = useAuthStore()

const activeTab = ref('profile')
const loadingProfile = ref(false)
const loadingAvailability = ref(false)
const loadingPassword = ref(false)
const deleteDialogOpen = ref(false)
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

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

const messages = ref({
  profile: '',
  availability: '',
  password: ''
})

const messagesClass = computed(() => ({
  profile: messages.value.profile.includes('successfully') ? 'alert-success' : 'alert-danger',
  availability: messages.value.availability.includes('successfully') ? 'alert-success' : 'alert-danger',
  password: messages.value.password.includes('successfully') ? 'alert-success' : 'alert-danger'
}))

const originalFormData = ref({})

const availableDaysArray = computed({
  get: () => (formData.value.available_days ? formData.value.available_days.split(', ') : []),
  set: (val) => {
    formData.value.available_days = val.join(', ')
  }
})

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

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
      receive_schedule_alerts: true
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

const confirmDeleteAccount = () => {
  deleteDialogOpen.value = true
}

onMounted(() => {
  loadTeacherData()
})
</script>

<style scoped>
.teacher-settings-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 1.5rem;
}

.profile-photo-container {
  position: relative;
}

.profile-photo,
.profile-photo-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

.profile-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 48px;
  font-weight: bold;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 3px solid transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-color: #0d6efd;
}

.profile-photo-field {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-preview {
  width: 90px;
  height: 90px;
  border-radius: 16px;
  background: #eef2ff;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.profile-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-placeholder {
  font-size: 1.75rem;
  font-weight: 800;
  color: #334155;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
}

.card {
  border: 1px solid #dbeafe;
}

.alert {
  border-radius: 8px;
}

.settings-intro {
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
}

.settings-intro h1 {
  margin: 0 0 0.35rem;
  font-size: 1.45rem;
}

.settings-intro p {
  margin: 0 0 0.75rem;
  color: #64748b;
}

.profile-link {
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

.profile-link:hover {
  text-decoration: underline;
}

.settings-skeleton {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
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
  border-radius: 12px;
}

.settings-skeleton .short {
  width: 60%;
}

.settings-skeleton .skeleton-grid {
  display: grid;
  gap: 1rem;
}

@keyframes loadingShimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

.form-signifier-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

:global(body.teacher-dark-mode) .teacher-settings-page {
  background: #020617;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .settings-intro,
:global(body.teacher-dark-mode) .card {
  background: #111827;
  border-color: #243244;
  color: #e5edf7;
}

:global(body.teacher-dark-mode) .settings-intro p,
:global(body.teacher-dark-mode) .text-muted {
  color: #cbd5e1 !important;
}

:global(body.teacher-dark-mode) .card-header {
  background: #0b1220 !important;
  border-color: #243244 !important;
  color: #f8fafc;
}

:global(body.teacher-dark-mode) .nav-tabs {
  border-color: #243244;
}

:global(body.teacher-dark-mode) .nav-tabs .nav-link {
  color: #cbd5e1;
}

:global(body.teacher-dark-mode) .nav-tabs .nav-link.active {
  background: #172554;
  color: #dbeafe;
  border-color: #60a5fa;
}
</style>
