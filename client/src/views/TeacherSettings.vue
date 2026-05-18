<template>
  <div class="min-vh-100 bg-light">
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" @click="goBack" style="cursor: pointer;">
          <i class="bi bi-arrow-left me-2"></i>
          Teacher Settings
        </a>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <!-- Tabs Navigation -->
          <ul class="nav nav-tabs mb-4" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'profile' }"
                @click="activeTab = 'profile'"
                type="button"
              >
                <i class="bi bi-person me-2"></i>Profile
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'teaching' }"
                @click="activeTab = 'teaching'"
                type="button"
              >
                <i class="bi bi-book me-2"></i>Teaching Info
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
              <h5 class="card-title mb-0">Personal Information</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveProfile">
                <div class="row mb-4">
                  <div class="col-md-4 text-center">
                    <div class="profile-photo-container mb-3">
                      <img v-if="profilePhotoUrl" :src="profilePhotoUrl" alt="Profile" class="profile-photo">
                      <div v-else class="profile-photo-placeholder">
                        {{ profileInitials }}
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      @change="handlePhotoChange"
                      class="form-control form-control-sm"
                    >
                  </div>

                  <div class="col-md-8">
                    <div class="mb-3">
                      <label class="form-label">Full Name</label>
                      <input v-model.trim="formData.name" type="text" class="form-control" required>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Email Address</label>
                      <input v-model.trim="formData.email" type="email" class="form-control" required>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Department</label>
                      <input v-model.trim="formData.department" type="text" class="form-control" required>
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Employee ID</label>
                      <input v-model.trim="formData.employee_id" type="text" class="form-control">
                    </div>

                    <div class="mb-3">
                      <label class="form-label">Phone Number</label>
                      <input v-model.trim="formData.phone" type="tel" class="form-control">
                    </div>
                  </div>
                </div>

                <div v-if="messages.profile" class="alert" :class="messagesClass.profile" role="alert">
                  {{ messages.profile }}
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loadingProfile">
                    <span v-if="loadingProfile">Saving...</span>
                    <span v-else>Save Changes</span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetProfile">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Teaching Info Tab -->
          <div v-if="activeTab === 'teaching'" class="card shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">Teaching Information</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveTeachingInfo">
                <div class="mb-3">
                  <label class="form-label">Module / Subject</label>
                  <input v-model.trim="formData.module_name" type="text" class="form-control" placeholder="Mathematics, Physics, etc.">
                </div>

                <div class="mb-3">
                  <label class="form-label">Qualification</label>
                  <input v-model.trim="formData.qualification" type="text" class="form-control" placeholder="MSc, BEd, PhD">
                </div>

                <div class="mb-3">
                  <label class="form-label">Years of Experience</label>
                  <input v-model.number="formData.years_experience" type="number" min="0" class="form-control" placeholder="0">
                </div>

                <div v-if="messages.teaching" class="alert" :class="messagesClass.teaching" role="alert">
                  {{ messages.teaching }}
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loadingTeaching">
                    <span v-if="loadingTeaching">Saving...</span>
                    <span v-else>Save Changes</span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetTeachingInfo">
                    Cancel
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
                  <div class="input-group">
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Enter new password"
                      minlength="6"
                    >
                    <button type="button" class="btn btn-outline-secondary" @click="showNewPassword = !showNewPassword">
                      <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                    </button>
                  </div>
                  <div class="form-text">At least 6 characters for security.</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Confirm Password</label>
                  <div class="input-group">
                    <input
                      v-model="passwordForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Confirm new password"
                    >
                    <button type="button" class="btn btn-outline-secondary" @click="showConfirmPassword = !showConfirmPassword">
                      <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/stores/api'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('profile')
const loadingProfile = ref(false)
const loadingTeaching = ref(false)
const loadingAvailability = ref(false)
const loadingPassword = ref(false)

const availableDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const formData = ref({
  name: '',
  email: '',
  department: '',
  employee_id: '',
  phone: '',
  module_name: '',
  qualification: '',
  years_experience: null,
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
  teaching: '',
  availability: '',
  password: ''
})

const messagesClass = computed(() => ({
  profile: messages.value.profile.includes('successfully') ? 'alert-success' : 'alert-danger',
  teaching: messages.value.teaching.includes('successfully') ? 'alert-success' : 'alert-danger',
  availability: messages.value.availability.includes('successfully') ? 'alert-success' : 'alert-danger',
  password: messages.value.password.includes('successfully') ? 'alert-success' : 'alert-danger'
}))

const selectedProfilePhoto = ref(null)
const profilePhotoUrl = ref('')
const originalFormData = ref({})

const availableDaysArray = computed({
  get: () => (formData.value.available_days ? formData.value.available_days.split(', ') : []),
  set: (val) => {
    formData.value.available_days = val.join(', ')
  }
})

const profileInitials = computed(() => {
  const name = formData.value.name || authStore.currentUser?.name || ''
  return name ? name.slice(0, 1).toUpperCase() : 'T'
})

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const resolveAssetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  if (path.startsWith('/uploads/')) return path
  const apiRoot = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`
}

const loadTeacherData = async () => {
  try {
    const response = await api.get('/teacher-auth/me')
    const teacher = response.data.teacher

    formData.value = {
      name: teacher.name || '',
      email: teacher.email || '',
      department: teacher.department || '',
      employee_id: teacher.employee_id || '',
      phone: teacher.phone || '',
      module_name: teacher.module_name || '',
      qualification: teacher.qualification || '',
      years_experience: teacher.years_experience || null,
      available_days: teacher.available_days || '',
      available_from: teacher.available_from || '',
      available_to: teacher.available_to || '',
      notes: teacher.notes || ''
    }

    originalFormData.value = JSON.parse(JSON.stringify(formData.value))
    profilePhotoUrl.value = resolveAssetUrl(teacher.profile_photo)
  } catch (error) {
    console.error('Failed to load teacher data:', error)
    messages.value.profile = 'Failed to load profile data'
  }
}

const handlePhotoChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (profilePhotoUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(profilePhotoUrl.value)
  }

  selectedProfilePhoto.value = file
  profilePhotoUrl.value = URL.createObjectURL(file)
}

const saveProfile = async () => {
  loadingProfile.value = true
  messages.value.profile = ''

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

    await api.put('/teacher-auth/me', {
      name: formData.value.name,
      email: formData.value.email,
      department: formData.value.department,
      employee_id: formData.value.employee_id,
      phone: formData.value.phone,
      profile_photo: profilePhotoPath
    })

    messages.value.profile = 'Profile updated successfully!'
    selectedProfilePhoto.value = null
    if (profilePhotoUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(profilePhotoUrl.value)
      profilePhotoUrl.value = ''
    }
    await authStore.checkAuth()
  } catch (error) {
    messages.value.profile = error.response?.data?.message || 'Failed to update profile'
  } finally {
    loadingProfile.value = false
  }
}

const saveTeachingInfo = async () => {
  loadingTeaching.value = true
  messages.value.teaching = ''

  try {
    await api.put('/teacher-auth/me', {
      module_name: formData.value.module_name,
      qualification: formData.value.qualification,
      yearsExperience: formData.value.years_experience
    })

    messages.value.teaching = 'Teaching information updated successfully!'
    await authStore.checkAuth()
  } catch (error) {
    messages.value.teaching = error.response?.data?.message || 'Failed to update teaching info'
  } finally {
    loadingTeaching.value = false
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

const resetProfile = () => {
  formData.value = JSON.parse(JSON.stringify(originalFormData.value))
  messages.value.profile = ''
}

const resetTeachingInfo = () => {
  formData.value.module_name = originalFormData.value.module_name
  formData.value.qualification = originalFormData.value.qualification
  formData.value.years_experience = originalFormData.value.years_experience
  messages.value.teaching = ''
}

const resetAvailability = () => {
  formData.value.available_days = originalFormData.value.available_days
  formData.value.available_from = originalFormData.value.available_from
  formData.value.available_to = originalFormData.value.available_to
  formData.value.notes = originalFormData.value.notes
  messages.value.availability = ''
}

const resetPassword = () => {
  passwordForm.value = { newPassword: '', confirmPassword: '' }
  messages.value.password = ''
}

const goBack = () => {
  router.push('/teacher/dashboard')
}

const confirmDeleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    alert('Account deletion feature coming soon.')
  }
}

onMounted(() => {
  loadTeacherData()
})
</script>

<style scoped>
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

.nav-tabs .nav-link:hover {
  color: #0d6efd;
}

.card {
  border: 1px solid #dbeafe;
}

.alert {
  border-radius: 8px;
}
</style>
