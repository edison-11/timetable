<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center p-3" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
    <div class="bg-white rounded-3 shadow-lg w-100" style="max-width: 400px;">
      <div class="text-center mb-4 p-4">
        <div class="d-flex align-items-center justify-content-center mx-auto mb-3 bg-primary rounded-2" style="width: 64px; height: 64px; font-size: 32px;">
          👨‍🏫
        </div>
        <h1 class="h3 fw-bold text-dark">Teacher Portal</h1>
        <p class="text-muted mt-2">Sign in to view your timetable</p>
      </div>

      <form @submit.prevent="handleLogin" class="px-4 pb-4">
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
          <label for="password" class="form-label fw-medium">Password</label>
          <div class="input-group">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="form-control form-control-lg"
              placeholder="••••••••"
            />
            <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom btn-lg w-100 fw-medium"
        >
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>

        <div class="text-center mt-3">
          <p class="text-muted mb-0">
            Don't have an account?
            <router-link to="/teacher/register" class="text-primary fw-medium text-decoration-none">Create one</router-link>
          </p>
        </div>

        <hr class="my-3" />

        <div class="text-center">
          <router-link to="/login" class="text-muted text-decoration-none small">
            Admin Login →
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/stores/api'

const router = useRouter()

const form = ref({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/teacher-auth/login', {
      email: form.value.email,
      password: form.value.password
    })

    const { token, teacher } = response.data

    // Save token and teacher info to localStorage
    localStorage.setItem('token', token)
    localStorage.setItem('teacher', JSON.stringify(teacher))
    localStorage.setItem('userType', 'teacher')

    // Set auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // Redirect to teacher dashboard
    router.push('/teacher/dashboard')
  } catch (err) {
    if (!err.response) {
      error.value = 'Cannot connect to the server. Please make sure the backend is running on port 5000.'
    } else if (err.response.status === 403) {
      error.value = err.response.data?.message || 'Your account exists but is not approved yet. Ask the admin to approve it from the Teachers page.'
    } else if (err.response.status === 401) {
      error.value = 'Invalid teacher email or password. If you just registered, use the same password you entered during registration.'
    } else {
      error.value = err.response?.data?.message || 'Login failed'
    }
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-control-lg {
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
