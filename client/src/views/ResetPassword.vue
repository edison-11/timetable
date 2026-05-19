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

        <h1 class="h3 fw-bold text-dark mb-1">Reset Password</h1>

        <div class="mt-2 d-flex align-items-center justify-content-center gap-2 secure-row">
          <span class="secure-lock" aria-hidden="true">🔐</span>
          <span class="text-muted small fw-semibold">Secure Password Reset</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="resetPassword" class="px-4 pb-4">
        <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
          <span>✓</span>
          <div>
            <strong>Email verified</strong>
            <br />
            <small>{{ email || 'your account' }}</small>
          </div>
        </div>

        <div class="mb-3">
          <label for="password" class="form-label fw-medium">New Password</label>
          <div class="input-group">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Minimum 6 characters"
              required
              class="form-control form-control-lg"
            />
            <button
              type="button"
              class="btn btn-outline-secondary password-toggle"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword" aria-hidden="true">🙈</span>
              <span v-else aria-hidden="true">👁</span>
            </button>
          </div>
        </div>

        <div class="mb-3">
          <label for="confirmPassword" class="form-label fw-medium">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat password"
            required
            class="form-control form-control-lg"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="alert alert-success" role="alert">
          {{ success }}
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="loading || !email || !code" class="btn btn-primary-custom btn-lg w-100 fw-semibold">
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Updating...
          </span>
          <span v-else>Update Password</span>
        </button>
      </form>

      <!-- Footer Links -->
      <div class="text-center px-4 pb-4">
        <router-link to="/forgot-password" class="small text-primary fw-semibold text-decoration-none">
          Request a new OTP
        </router-link>
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/stores/api'

const router = useRouter()
const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)

const resetPassword = async () => {
  error.value = ''
  success.value = ''
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    const response = await api.post('/auth/reset-password', {
      email: email.value,
      code: code.value,
      password: password.value,
      confirmPassword: confirmPassword.value
    })
    sessionStorage.removeItem('resetEmail')
    sessionStorage.removeItem('resetCode')
    success.value = response.data.message || 'Password reset successful.'
    setTimeout(() => router.push('/login'), 900)
  } catch (err) {
    error.value = err.response?.data?.message || 'Password reset failed.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  email.value = sessionStorage.getItem('resetEmail') || ''
  code.value = sessionStorage.getItem('resetCode') || ''
  if (!email.value || !code.value) {
    error.value = 'Reset session not found. Please request a new OTP.'
  }
})
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

.secure-row {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(37, 99, 235, .12);
  border-radius: 999px;
  padding: 6px 12px;
}

.secure-lock {
  font-size: 14px;
}

/* Alert styling */
.alert {
  border-radius: 0.75rem;
  font-size: 0.9rem;
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
