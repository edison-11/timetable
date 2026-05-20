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
          style="width: 112px; height: 112px; background: #eef5ff; border: 1px solid rgba(37, 99, 235, .15);"
        >
          <img class="brand-login-logo" src="/timetable-logo.png" alt="School logo" />
        </div>

        <h1 class="auth-title text-dark mb-1">Register Account</h1>

        <div class="mt-2 d-flex align-items-center justify-content-center gap-2 secure-row">
          <span class="secure-lock" aria-hidden="true">📝</span>
          <span class="text-muted small fw-semibold">Teacher Registration</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="step === 'details' ? requestOtp() : verifyOtp()" class="px-4 pb-4">
        <!-- Step Indicator -->
        <div class="step-indicator mb-4">
          <div class="step" :class="{ active: step === 'details' }">
            <span>1</span>
            <small>Details</small>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: step === 'otp' }">
            <span>2</span>
            <small>Verify</small>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: step === 'success' }">
            <span>✓</span>
            <small>Done</small>
          </div>
        </div>

        <!-- Details Step -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 'details'" key="details">
            <div class="mb-3">
              <label for="fullName" class="form-label fw-medium">Full Name</label>
              <input
                id="fullName"
                v-model.trim="form.full_name"
                type="text"
                placeholder="Full legal name"
                required
                class="form-control form-control-lg"
              />
            </div>

            <div class="mb-3">
              <label for="email" class="form-label fw-medium">Email Address</label>
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                placeholder="name@school.com"
                required
                class="form-control form-control-lg"
              />
            </div>

            <div class="mb-3">
              <label for="phone" class="form-label fw-medium">Phone Number</label>
              <input
                id="phone"
                v-model.trim="form.phone"
                type="tel"
                placeholder="+265..."
                required
                class="form-control form-control-lg"
              />
            </div>

            <div class="mb-3">
              <label for="role" class="form-label fw-medium">Role</label>
              <select v-model="form.role" id="role" required class="form-control form-control-lg">
                <option value="teacher">Teacher</option>
                <option value="admin">Admin (DOS)</option>
              </select>
            </div>

            <div v-if="form.role === 'teacher'" class="mb-3">
              <label for="department" class="form-label fw-medium">Department</label>
              <input
                id="department"
                v-model.trim="form.department"
                type="text"
                placeholder="Software Development"
                class="form-control form-control-lg"
              />
            </div>

            <div v-if="form.role === 'teacher'" class="mb-3">
              <label for="subject" class="form-label fw-medium">Primary Subject</label>
              <input
                id="subject"
                v-model.trim="form.module_name"
                type="text"
                placeholder="Mathematics"
                class="form-control form-control-lg"
              />
            </div>

            <div v-if="form.role === 'teacher'" class="mb-3">
              <label for="teacherId" class="form-label fw-medium">Teacher ID</label>
              <input
                id="teacherId"
                v-model.trim="form.employeeId"
                type="text"
                placeholder="TCH-001"
                class="form-control form-control-lg"
              />
            </div>

            <div class="mb-3">
              <label for="password" class="form-label fw-medium">Password</label>
              <div class="input-group">
                <input
                  id="password"
                  v-model="form.password"
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
                v-model="form.confirmPassword"
                type="password"
                placeholder="Repeat password"
                required
                class="form-control form-control-lg"
              />
            </div>
          </div>

          <!-- OTP Step -->
          <div v-else-if="step === 'otp'" key="otp">
            <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
              <span>📧</span>
              <div>
                <strong>Code sent to {{ pendingEmail }}</strong>
                <br />
                <small>Expires in {{ formattedCountdown }}</small>
              </div>
            </div>

            <label for="otp" class="form-label fw-medium">Enter 6-Digit OTP</label>
            <div class="otp-grid mb-3" @paste.prevent="handleOtpPaste">
              <input
                v-for="(_, index) in otpDigits"
                :key="index"
                :ref="el => otpRefs[index] = el"
                v-model="otpDigits[index]"
                inputmode="numeric"
                maxlength="1"
                @input="handleOtpInput(index)"
                @keydown.backspace="handleOtpBackspace(index, $event)"
              />
            </div>

            <button
              type="button"
              class="btn btn-link w-100 fw-semibold mb-3"
              :disabled="resendCooldown > 0 || loading"
              @click="resendOtp"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
            </button>
          </div>

          <!-- Success Step -->
          <div v-else key="success" class="text-center py-3">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <h4 class="fw-bold text-success">{{ successTitle }}</h4>
            <p class="text-muted small">{{ successDetail }}</p>
          </div>
        </transition>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="alert alert-success" role="alert">
          {{ success }}
        </div>

        <!-- Submit Button -->
        <button
          v-if="step !== 'success'"
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom btn-lg w-100 fw-semibold"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ step === 'details' ? 'Sending OTP...' : 'Verifying...' }}
          </span>
          <span v-else>
            {{ step === 'details' ? 'Send OTP' : 'Verify & Create Account' }}
          </span>
        </button>
      </form>

      <!-- Footer Links -->
      <div class="text-center px-4 pb-4">
        <p class="small text-muted mb-0">
          Already have an account?
          <router-link to="/login" class="text-primary fw-semibold text-decoration-none">
            Sign in here
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  full_name: '',
  email: '',
  phone: '',
  role: 'teacher',
  department: '',
  module_name: '',
  employeeId: '',
  password: '',
  confirmPassword: ''
})

const step = ref('details')
const pendingEmail = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])
const countdown = ref(0)
const resendCooldown = ref(0)
const countdownTimer = ref(null)
const cooldownTimer = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const successTitle = ref('Account Created!')
const successDetail = ref('Redirecting to your dashboard...')

const formattedCountdown = computed(() => {
  const minutes = String(Math.floor(countdown.value / 60)).padStart(2, '0')
  const seconds = String(countdown.value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

const otpCode = computed(() => otpDigits.value.join(''))

const validate = () => {
  if (form.value.full_name.length < 3) return 'Full name must be at least 3 characters.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) return 'Please enter a valid email.'
  if (!form.value.phone.trim()) return 'Phone number is required.'
  if (form.value.password.length < 6) return 'Password must be at least 6 characters.'
  if (form.value.password !== form.value.confirmPassword) return 'Passwords do not match.'
  return ''
}

const startTimers = (expires = 300, cooldown = 45) => {
  clearInterval(countdownTimer.value)
  clearInterval(cooldownTimer.value)
  countdown.value = expires
  resendCooldown.value = cooldown
  countdownTimer.value = setInterval(() => {
    countdown.value = Math.max(0, countdown.value - 1)
    if (countdown.value === 0) clearInterval(countdownTimer.value)
  }, 1000)
  cooldownTimer.value = setInterval(() => {
    resendCooldown.value = Math.max(0, resendCooldown.value - 1)
    if (resendCooldown.value === 0) clearInterval(cooldownTimer.value)
  }, 1000)
}

const requestOtp = async () => {
  error.value = validate()
  success.value = ''
  if (error.value) return

  loading.value = true
  try {
    const response = await api.post('/auth/register', { ...form.value })
    pendingEmail.value = response.data.email
    success.value = response.data.message || 'OTP sent.'
    otpDigits.value = ['', '', '', '', '', '']
    step.value = 'otp'
    startTimers(response.data.expires_in_seconds || 300, response.data.resend_cooldown_seconds || 45)
    await nextTick()
    otpRefs.value[0]?.focus()
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to send OTP.'
  } finally {
    loading.value = false
  }
}

const resendOtp = () => requestOtp()

const verifyOtp = async () => {
  error.value = ''
  success.value = ''
  if (otpCode.value.length !== 6) {
    error.value = 'Enter the complete 6 digit OTP.'
    return
  }

  loading.value = true
  try {
    const response = await api.post('/auth/verify-registration', {
      email: pendingEmail.value,
      code: otpCode.value
    })
    const { token, user, role, redirectTo, requiresApproval } = response.data

    if (requiresApproval) {
      successTitle.value = 'Registration Sent!'
      successDetail.value = 'Your teacher account is waiting for admin approval.'
      success.value = response.data.message || 'Teacher registered successfully. Awaiting admin approval.'
      step.value = 'success'
      setTimeout(() => router.push('/login'), 1600)
      return
    }

    authStore.token = token
    authStore.user = user
    authStore.userType = role
    localStorage.setItem('token', token)
    localStorage.setItem('userType', role)
    localStorage.setItem(role === 'teacher' ? 'teacher' : 'user', JSON.stringify(user))
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    step.value = 'success'
    setTimeout(() => router.push(redirectTo || (role === 'teacher' ? '/teacher/dashboard' : '/dashboard')), 900)
  } catch (err) {
    error.value = err.response?.data?.message || 'OTP verification failed.'
  } finally {
    loading.value = false
  }
}

const handleOtpInput = (index) => {
  otpDigits.value[index] = otpDigits.value[index].replace(/\D/g, '').slice(0, 1)
  if (otpDigits.value[index] && index < 5) otpRefs.value[index + 1]?.focus()
}

const handleOtpBackspace = (index, event) => {
  if (!otpDigits.value[index] && index > 0) {
    event.preventDefault()
    otpRefs.value[index - 1]?.focus()
  }
}

const handleOtpPaste = (event) => {
  const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
  digits.forEach((digit, index) => {
    otpDigits.value[index] = digit
  })
  otpRefs.value[Math.min(digits.length, 5)]?.focus()
}

onMounted(() => {
  // Optional: load saved preference
})

onBeforeUnmount(() => {
  clearInterval(countdownTimer.value)
  clearInterval(cooldownTimer.value)
})
</script>

<style scoped>
/* Keep the logo area consistent and prevent "generic icon" look */
.brand-login-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 2px;
  transform: scale(1.12);
}

.auth-title {
  font-size: clamp(1.45rem, 3.2vw, 1.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
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
input.form-control:focus-visible,
select.form-control:focus,
select.form-control:focus-visible {
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

/* Step indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.step span {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-weight: bold;
  font-size: 0.85rem;
}

.step.active span {
  background: #2563eb;
  color: #fff;
}

.step small {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.step.active small {
  color: #2563eb;
}

.step-line {
  flex: 0.2;
  height: 2px;
  background: #e2e8f0;
  margin: 0 -0.5rem;
}

.step.active ~ .step-line,
.step-line {
  background: #e2e8f0;
}

/* OTP Grid styling */
.otp-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.otp-grid input {
  width: 100%;
  aspect-ratio: 1;
  font-size: 1.3rem;
  font-weight: bold;
  text-align: center;
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.otp-grid input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .1);
}

/* Alert styling */
.alert {
  border-radius: 0.75rem;
  font-size: 0.9rem;
}

/* Link styling */
.btn-link {
  color: #2563eb;
  text-decoration: none;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 576px) {
  .brand-login-mark {
    width: 96px !important;
    height: 96px !important;
  }
  h1 {
    font-size: 1.45rem;
  }
  .step-indicator {
    margin-bottom: 1rem;
  }
}
</style>
