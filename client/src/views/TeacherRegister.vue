<template>
  <div class="teacher-register-page">
    <div class="register-shell">
      <div class="card register-card shadow-lg">
        <div class="card-header text-center bg-gradient-primary text-white pb-4 pt-5">
          <div class="register-badge mx-auto mb-3">👩‍🏫</div>
          <h1 class="h4 fw-bold mb-1">Teacher Registration</h1>
          <p class="text-white-75 mb-0">Complete your profile in three easy steps.</p>
        </div>

        <div class="card-body p-4">
          <div class="progress mb-4" style="height: 10px;">
            <div class="progress-bar bg-primary" role="progressbar" :style="{ width: `${progress}%` }"></div>
          </div>

          <div class="d-flex justify-content-between mb-4 register-steps">
            <span :class="stepClass(1)">1. Account</span>
            <span :class="stepClass(2)">2. Teaching</span>
            <span :class="stepClass(3)">3. Availability</span>
          </div>

          <form @submit.prevent="handleSubmit">
            <div v-if="currentStep === 1">
              <h2 class="h6 fw-semibold mb-4"><i class="bi bi-person-circle me-2"></i>Teacher Account Details</h2>
              <div class="step-description mb-4">Create your secure login credentials</div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Full Name <span class="text-danger">*</span></label>
                <input
                  v-model.trim="form.name"
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="Teacher full name"
                  required
                >
                <small class="form-text text-muted">Your full legal name as it appears in school records</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Email Address <span class="text-danger">*</span></label>
                <input
                  v-model.trim="form.email"
                  type="email"
                  class="form-control form-control-lg"
                  placeholder="teacher@school.com"
                  required
                >
                <small class="form-text text-muted">Must be unique and valid. Used for login.</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Department <span class="text-danger">*</span></label>
                <select v-model="form.department" class="form-select form-select-lg" required>
                  <option value="" disabled>Select your department</option>
                  <option v-for="department in departmentOptions" :key="department" :value="department">{{ department }}</option>
                  <option value="Other">Other (Specify Below)</option>
                </select>
              </div>

              <div v-if="form.department === 'Other'" class="mb-3">
                <label class="form-label fw-semibold">Specify Department <span class="text-danger">*</span></label>
                <input
                  v-model.trim="form.customDepartment"
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="e.g., Arts, Sciences"
                  required
                >
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Password <span class="text-danger">*</span></label>
                <div class="input-group input-group-lg">
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Enter secure password"
                    minlength="6"
                    required
                  >
                  <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                  </button>
                </div>
                <small class="form-text text-muted">Minimum 6 characters. Use mix of letters, numbers, and symbols.</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Confirm Password <span class="text-danger">*</span></label>
                <div class="input-group input-group-lg">
                  <input
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    class="form-control"
                    placeholder="Re-enter password"
                    required
                  >
                  <button type="button" class="btn btn-outline-secondary" @click="showConfirmPassword = !showConfirmPassword">
                    <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="currentStep === 2">
              <h2 class="h6 fw-semibold mb-4"><i class="bi bi-briefcase me-2"></i>Teaching Profile Information</h2>
              <div class="step-description mb-4">Tell us about your teaching qualifications and expertise</div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Teacher ID <span class="text-danger">*</span></label>
                <input
                  v-model.trim="form.employeeId"
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="e.g., TCH-2026-001"
                  required
                >
                <small class="form-text text-muted">Your unique employee identification number</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Phone Number <span class="text-danger">*</span></label>
                <input
                  v-model.trim="form.phone"
                  type="tel"
                  class="form-control form-control-lg"
                  placeholder="e.g., +265999123456"
                  required
                >
                <small class="form-text text-muted">International format preferred (with country code)</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Primary Module / Subject <span class="text-danger">*</span></label>
                <input
                  v-model.trim="form.module"
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                  required
                >
                <small class="form-text text-muted">The main subject or module you teach</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Highest Qualification</label>
                <input
                  v-model.trim="form.qualification"
                  type="text"
                  class="form-control form-control-lg"
                  placeholder="e.g., MSc, BEd, PhD, HND"
                >
                <small class="form-text text-muted">Academic degree or certification</small>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Years of Teaching Experience</label>
                <div class="input-group input-group-lg">
                  <input
                    v-model.number="form.yearsExperience"
                    type="number"
                    min="0"
                    max="70"
                    class="form-control"
                    placeholder="0"
                  >
                  <span class="input-group-text">years</span>
                </div>
              </div>
            </div>

            <div v-if="currentStep === 3">
              <h2 class="h6 fw-semibold mb-4"><i class="bi bi-calendar-check me-2"></i>Availability & Review</h2>
              <div class="step-description mb-4">Set your work schedule and review all information</div>

              <div class="mb-4">
                <label class="form-label fw-semibold">Available Teaching Days</label>
                <div class="days-grid">
                  <label v-for="day in availableDaysOptions" :key="day" class="day-option">
                    <input class="form-check-input" type="checkbox" :value="day" v-model="form.availableDays">
                    <span class="day-label">{{ day }}</span>
                  </label>
                </div>
                <small class="form-text text-muted d-block mt-2">Select days you are available to teach</small>
              </div>

              <div class="row gx-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Available From <span v-if="form.availableDays.length > 0" class="text-danger">*</span></label>
                  <input v-model="form.availableFrom" type="time" class="form-control form-control-lg">
                  <small class="form-text text-muted">Start of your working hours</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Available Until <span v-if="form.availableDays.length > 0" class="text-danger">*</span></label>
                  <input v-model="form.availableTo" type="time" class="form-control form-control-lg">
                  <small class="form-text text-muted">End of your working hours</small>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-semibold">Additional Notes / Preferences</label>
                <textarea
                  v-model.trim="form.notes"
                  rows="4"
                  class="form-control form-control-lg"
                  placeholder="E.g., Prefer classroom A1 or A2, Available for tutoring, Special room requirements..."
                ></textarea>
                <small class="form-text text-muted">Optional: Share any special preferences or availability details</small>
              </div>

              <div class="review-section">
                <h3 class="h5 fw-semibold mb-3"><i class="bi bi-clipboard-check me-2"></i>Summary of Your Registration</h3>
                <div class="review-grid">
                  <div class="review-item">
                    <span class="review-label">Full Name</span>
                    <span class="review-value">{{ form.name || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Email</span>
                    <span class="review-value">{{ form.email || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Department</span>
                    <span class="review-value">{{ selectedDepartment || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Teacher ID</span>
                    <span class="review-value">{{ form.employeeId || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Phone</span>
                    <span class="review-value">{{ form.phone || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Primary Module</span>
                    <span class="review-value">{{ form.module || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Qualification</span>
                    <span class="review-value">{{ form.qualification || '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Experience</span>
                    <span class="review-value">{{ form.yearsExperience || 0 }} years</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Available Days</span>
                    <span class="review-value">{{ form.availableDays.length > 0 ? form.availableDays.join(', ') : '—' }}</span>
                  </div>
                  <div class="review-item">
                    <span class="review-label">Working Hours</span>
                    <span class="review-value">{{ form.availableFrom && form.availableTo ? `${form.availableFrom} - ${form.availableTo}` : '—' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="error" class="alert alert-danger mt-4">{{ error }}</div>
            <div v-if="success" class="alert alert-success mt-4">{{ success }}</div>

            <div class="d-flex justify-content-between align-items-center mt-4">
              <button type="button" class="btn btn-outline-secondary" @click="prevStep" :disabled="currentStep === 1 || loading">
                Back
              </button>

              <div class="d-flex gap-2">
                <button v-if="currentStep < 3" type="button" class="btn btn-outline-primary" @click="nextStep" :disabled="loading">
                  Next
                </button>
                <button v-else type="submit" class="btn btn-primary" :disabled="loading">
                  <span v-if="loading">Registering...</span>
                  <span v-else>Register</span>
                </button>
              </div>
            </div>
          </form>

          <div class="text-center mt-4 text-muted">
            Already registered? <router-link to="/teacher/login" class="text-decoration-none">Sign in</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/stores/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const departmentOptions = [
  'Business',
  'Software Development',
  'Electrical',
  'Electronics',
  'Computer Science',
  'Information Technology',
  'Networking',
  'Accounting',
  'Finance',
  'Marketing',
  'Management',
  'Hospitality',
  'Tourism',
  'Construction',
  'Mechanical',
  'Automotive',
  'Agriculture',
  'General Studies'
]

const availableDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const form = ref({
  name: '',
  email: '',
  department: 'Business',
  customDepartment: '',
  employeeId: '',
  phone: '',
  module: '',
  qualification: '',
  yearsExperience: null,
  availableDays: [],
  availableFrom: '',
  availableTo: '',
  notes: '',
  password: '',
  confirmPassword: ''
})

const currentStep = ref(1)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

const selectedDepartment = computed(() => {
  return form.value.department === 'Other' ? form.value.customDepartment.trim() : form.value.department
})

const progress = computed(() => (currentStep.value / 3) * 100)

const stepClass = (step) => ({
  'text-primary': currentStep.value === step,
  'text-muted': currentStep.value !== step
})

const validateStep = () => {
  error.value = ''

  // Step 1: Account Information Validation
  if (currentStep.value === 1) {
    if (!form.value.name.trim()) {
      error.value = '⚠ Full Name is required'
      return false
    }
    if (form.value.name.trim().length < 3) {
      error.value = '⚠ Full Name must be at least 3 characters'
      return false
    }

    if (!form.value.email.trim()) {
      error.value = '⚠ Email Address is required'
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      error.value = '⚠ Please enter a valid email address'
      return false
    }

    if (!selectedDepartment.value) {
      error.value = '⚠ Department selection is required'
      return false
    }

    if (!form.value.password) {
      error.value = '⚠ Password is required'
      return false
    }
    if (form.value.password.length < 6) {
      error.value = '⚠ Password must be at least 6 characters'
      return false
    }
    if (!form.value.confirmPassword) {
      error.value = '⚠ Password confirmation is required'
      return false
    }
    if (form.value.password !== form.value.confirmPassword) {
      error.value = '⚠ Passwords do not match'
      return false
    }
  }

  // Step 2: Teaching Profile Validation
  if (currentStep.value === 2) {
    if (!form.value.employeeId.trim()) {
      error.value = '⚠ Teacher ID is required'
      return false
    }
    if (form.value.employeeId.trim().length < 3) {
      error.value = '⚠ Teacher ID must be at least 3 characters'
      return false
    }

    if (!form.value.phone.trim()) {
      error.value = '⚠ Phone number is required'
      return false
    }
    if (!/^[+]?[0-9\s-()]{9,}$/.test(form.value.phone.trim())) {
      error.value = '⚠ Please enter a valid phone number'
      return false
    }

    if (!form.value.module.trim()) {
      error.value = '⚠ Module or subject is required'
      return false
    }
    if (form.value.module.trim().length < 2) {
      error.value = '⚠ Module must be at least 2 characters'
      return false
    }
  }

  // Step 3: Availability Validation
  if (currentStep.value === 3) {
    if (form.value.availableDays.length > 0) {
      if (!form.value.availableFrom) {
        error.value = '⚠ Start time is required when specifying available days'
        return false
      }
      if (!form.value.availableTo) {
        error.value = '⚠ End time is required when specifying available days'
        return false
      }
      if (form.value.availableFrom >= form.value.availableTo) {
        error.value = '⚠ End time must be after start time'
        return false
      }
    }
  }

  return true
}

const nextStep = () => {
  if (!validateStep()) return
  currentStep.value = Math.min(3, currentStep.value + 1)
}

const prevStep = () => {
  error.value = ''
  success.value = ''
  currentStep.value = Math.max(1, currentStep.value - 1)
}

const handleSubmit = async () => {
  if (!validateStep()) return

  if (form.value.availableDays.length && (!form.value.availableFrom || !form.value.availableTo)) {
    error.value = 'Please select a full availability window if you selected available days.'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await api.post('/teacher-auth/register', {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      department: selectedDepartment.value,
      employeeId: form.value.employeeId.trim(),
      phone: form.value.phone.trim(),
      module_name: form.value.module.trim(),
      qualification: form.value.qualification.trim(),
      yearsExperience: form.value.yearsExperience || 0,
      availableDays: form.value.availableDays.join(', '),
      availableFrom: form.value.availableFrom,
      availableTo: form.value.availableTo,
      notes: form.value.notes.trim()
    })

    success.value = response.data.message || 'Registration successful. Awaiting approval from admin.'
    form.value = {
      name: '',
      email: '',
      department: 'Business',
      customDepartment: '',
      employeeId: '',
      phone: '',
      module: '',
      qualification: '',
      yearsExperience: null,
      availableDays: [],
      availableFrom: '',
      availableTo: '',
      notes: '',
      password: '',
      confirmPassword: ''
    }
    currentStep.value = 1
    setTimeout(() => router.push('/teacher/login'), 1200)
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.teacher-register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 2rem;
}

.register-shell {
  width: 100%;
  max-width: 680px;
}

.register-card {
  overflow: hidden;
  border: none;
  border-radius: 24px;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
}

.register-badge {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: rgba(255, 255, 255, 0.18);
}

.register-steps span {
  font-size: 0.9rem;
}

.register-steps .text-primary {
  font-weight: 700;
}

.review-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.btn-primary {
  min-width: 120px;
}

.step-description {
  font-size: 0.95rem;
  color: #6c757d;
  font-weight: 500;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.day-option {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.day-option:hover {
  border-color: #2563eb;
  background: #f0f9ff;
}

.day-option input[type="checkbox"]:checked + .day-label {
  color: #2563eb;
  font-weight: 600;
}

.day-option input[type="checkbox"]:checked {
  border-color: #2563eb;
  background-color: #2563eb;
}

.day-label {
  margin-left: 0.5rem;
  font-weight: 500;
}

.review-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%);
  border: 2px solid #dbeafe;
  border-radius: 16px;
  padding: 1.5rem;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.review-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border-left: 4px solid #2563eb;
}

.review-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.review-value {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.text-danger {
  color: #dc2626;
  font-weight: 700;
}

.form-control-lg,
.form-select-lg {
  font-size: 1rem;
  padding: 0.75rem 1rem;
  height: auto;
}

input:invalid,
select:invalid {
  border-color: #fca5a5 !important;
}

input:invalid:focus,
select:invalid:focus {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.25);
}
</style>
