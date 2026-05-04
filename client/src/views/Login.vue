<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center p-3" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
    <div class="bg-white rounded-3 shadow-lg w-100" style="max-width: 400px;">
      <div class="text-center mb-4 p-4">
        <div class="d-flex align-items-center justify-content-center mx-auto mb-3 bg-primary rounded-2" style="width: 64px; height: 64px; font-size: 32px;">
          📅
        </div>
        <h1 class="h3 fw-bold text-dark">Timetable Management</h1>
        <p class="text-muted mt-2">Sign in as admin or teacher</p>
      </div>

      <form @submit.prevent="handleLogin" class="px-4 pb-4">
        <div class="mb-3">
          <label for="email" class="form-label fw-medium">
            Email Address
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="form-control form-control-lg"
            placeholder="admin@example.com"
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label fw-medium">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="form-control form-control-lg"
            placeholder="••••••••"
          />
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
      </form>

      <div class="text-center px-4 pb-4">
        <p class="small text-muted">
          Don't have an account?
          <router-link to="/teacher/register" class="text-primary fw-medium text-decoration-none">
            Register as a teacher
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  const result = await authStore.login(form.value)
  
  if (result.success) {
    if (result.userType === 'teacher') {
      await router.push('/teacher/dashboard')
    } else {
      await router.push('/dashboard')
    }
  } else {
    error.value = result.error
  }

  loading.value = false
}
</script>
