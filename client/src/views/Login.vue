<template>
  <div
    class="min-vh-100 d-flex align-items-center justify-content-center p-3"
    style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"
  >
    <div class="bg-white rounded-3 shadow-lg w-100" style="max-width: 450px;">
      <!-- Header -->
      <div class="text-center mb-4 p-4 pb-3">
        <div
          class="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-2 brand-login-mark"
          style="width: 64px; height: 64px; background: #eef5ff; border: 1px solid rgba(37, 99, 235, .15);"
        >
          <img class="brand-login-logo" src="/timetable-logo.png" alt="School logo" />
        </div>

        <h1 class="h3 fw-bold text-dark mb-1">Timetable Management System</h1>

        <div class="mt-3 d-flex align-items-center justify-content-center gap-2 secure-row">
          <span class="secure-lock" aria-hidden="true">🔒</span>
          <span class="text-muted small fw-semibold">Secure Login</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="px-4 pb-4">
        <div class="mb-3">
          <label for="email" class="form-label fw-medium">Email Address</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            required
            class="form-control form-control-lg"
            placeholder="admin@example.com"
            :class="{ 'is-invalid': emailError }"
            autocomplete="username"
          />
          <div v-if="emailError" class="invalid-feedback d-block">
            {{ emailError }}
          </div>
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
              :class="{ 'is-invalid': passwordError }"
              autocomplete="current-password"
            />

            <!-- Make the icon button match input borders/background -->
            <button
              type="button"
              class="btn btn-outline-secondary password-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              <span v-if="showPassword" aria-hidden="true">🙈</span>
              <span v-else aria-hidden="true">👁</span>
            </button>
          </div>

          <div v-if="passwordError" class="invalid-feedback d-block">
            {{ passwordError }}
          </div>
        </div>

        <!-- Forgot + remember -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <label class="d-flex align-items-center gap-2 mb-0 remember-row">
            <input type="checkbox" v-model="rememberMe" />
            <span class="small text-muted fw-semibold">Remember me</span>
          </label>

          <router-link to="/forgot-password" class="small text-primary fw-semibold text-decoration-none">
            Forgot Password?
          </router-link>
        </div>

        <!-- Error -->
        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom btn-lg w-100 fw-semibold"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Signing in...
          </span>
          <span v-else>Sign In</span>
        </button>

        <!-- Success micro feedback (kept minimal) -->
        <div v-if="success" class="text-success small fw-semibold mt-2 text-center">
          {{ success }}
        </div>
      </form>

      <div class="text-center px-4 pb-4">
        <p class="small text-muted mb-0">
          Don't have an account?
          <router-link to="/teacher/register" class="text-primary fw-semibold text-decoration-none">
            Register as a teacher
          </router-link>
        </p>
      </div>

      <div class="text-center pb-3">
        <p class="small text-muted mb-0">
          © 2026 Timetable Management System · All rights reserved
        </p>
        <p class="small text-muted mb-0">Version 1.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const rememberMe = ref(true)

const form = ref({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

const emailError = computed(() => {
  const value = form.value.email.trim()
  if (!value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address.'
  return ''
})

const passwordError = computed(() => {
  const value = form.value.password
  if (!value) return ''
  if (value.length < 6) return 'Password must be at least 6 characters.'
  return ''
})

const validate = () => {
  error.value = ''
  success.value = ''

  if (emailError.value) {
    error.value = emailError.value
    return false
  }
  if (passwordError.value) {
    error.value = passwordError.value
    return false
  }
  if (!form.value.email.trim()) {
    error.value = 'Email is required.'
    return false
  }
  if (!form.value.password) {
    error.value = 'Password is required.'
    return false
  }
  return true
}

const handleLogin = async () => {
  if (!validate()) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // Send only email and password - backend determines role
    const payload = { ...form.value, rememberMe: rememberMe.value }

    const result = await authStore.login(payload)

    if (result?.success) {
      success.value = 'Login successful. Redirecting...'

      // Route based on actual role from backend
      const userType = result.userType || result.user?.role
      if (userType === 'teacher') {
        await router.push('/teacher/dashboard')
      } else {
        await router.push('/dashboard')
      }
      return
    }

    error.value = result?.error || 'Incorrect credentials. Please try again.'
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Keep the logo area consistent and prevent "generic icon" look */
.brand-login-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 6px;
}

/* Password toggle alignment fix */
.password-toggle {
  border-top-right-radius: 0.75rem !important;
  border-bottom-right-radius: 0.75rem !important;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  background: #f8fafc;
}

/* Match focus style across inputs */
input.form-control:focus,
input.form-control:focus-visible {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .2);
  outline: none;
}

/* Make buttons feel clickable */
.btn-primary-custom {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
  transition: transform .08s ease, box-shadow .2s ease;
}

.btn-primary-custom:hover {
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.24);
  transform: translateY(-1px);
}

.role-toggle .btn {
  transition: transform .08s ease, box-shadow .2s ease;
}

.role-toggle .btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .18);
}

.secure-row {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(37, 99, 235, .12);
  border-radius: 999px;
  padding: 6px 12px;
}

.secure-lock {
  font-size: 14px;
}

.remember-row {
  user-select: none;
}

@media (max-width: 576px) {
  .brand-login-mark {
    width: 58px !important;
    height: 58px !important;
  }
  h1 {
    font-size: 1.35rem;
  }
}
</style>
