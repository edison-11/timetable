<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center p-3" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
    <div class="bg-white rounded-3 shadow-lg w-100" style="max-width: 500px;">
      <div class="text-center mb-4 p-4">
        <div class="d-flex align-items-center justify-content-center mx-auto mb-3 bg-primary rounded-2" style="width: 64px; height: 64px; font-size: 32px;">
          👨‍🏫
        </div>
        <h1 class="h3 fw-bold text-dark">Teacher Registration</h1>
        <p class="text-muted mt-2">Create your teacher account</p>
      </div>

      <form @submit.prevent="handleRegister" class="px-4 pb-4">
        <div class="mb-3">
          <label for="name" class="form-label fw-medium">Full Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="form-control form-control-lg"
            placeholder="John Doe"
          />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label fw-medium">Email Address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="form-control form-control-lg"
            placeholder="teacher@example.com"
          />
        </div>

        <div class="mb-3">
          <label for="department" class="form-label fw-medium">Department</label>
          <select id="department" v-model="form.department" class="form-select form-select-lg" required>
            <option v-for="department in departmentOptions" :key="department" :value="department">
              {{ department }}
            </option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div v-if="form.department === 'Other'" class="mb-3">
          <label for="customDepartment" class="form-label fw-medium">Other Department</label>
          <input
            id="customDepartment"
            v-model="form.customDepartment"
            type="text"
            required
            class="form-control form-control-lg"
            placeholder="Enter department"
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label fw-medium">Password</label>
          <div class="input-group">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="form-control form-control-lg"
              placeholder="••••••••"
              minlength="6"
            />
            <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <small class="text-muted">Must be at least 6 characters</small>
        </div>

        <div class="mb-3">
          <label for="confirmPassword" class="form-label fw-medium">Confirm Password</label>
          <div class="input-group">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="form-control form-control-lg"
              placeholder="••••••••"
            />
            <button type="button" class="btn btn-outline-secondary" @click="showConfirmPassword = !showConfirmPassword">
              <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success" role="alert">
          {{ success }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom btn-lg w-100 fw-medium"
        >
          <span v-if="loading">Creating account...</span>
          <span v-else>Create Account</span>
        </button>

        <div class="text-center mt-3">
          <p class="text-muted mb-0">
            Already have an account?
            <router-link to="/teacher/login" class="text-primary fw-medium text-decoration-none">Sign in</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/stores/api'

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

const form = ref({
  name: '',
  email: '',
  department: 'Business',
  customDepartment: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    success.value = ''
    return
  }

  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    success.value = ''
    return
  }

  const selectedDepartment = form.value.department === 'Other'
    ? form.value.customDepartment.trim()
    : form.value.department

  if (!selectedDepartment) {
    error.value = 'Department is required'
    success.value = ''
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await api.post('/teacher-auth/register', {
      name: form.value.name,
      email: form.value.email,
      department: selectedDepartment,
      password: form.value.password
    })

    success.value = response.data.message || 'Registration successful. Awaiting admin approval.'
    form.value = {
      name: '',
      email: '',
      department: 'Business',
      customDepartment: '',
      password: '',
      confirmPassword: ''
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-control-lg,
.form-select-lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.btn-primary-custom {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-primary-custom:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-primary-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
