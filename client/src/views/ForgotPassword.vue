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

        <h1 class="auth-title text-dark mb-1">Forgot Password?</h1>

        <div class="mt-2 d-flex align-items-center justify-content-center gap-2 secure-row">
          <span class="secure-lock" aria-hidden="true">🔑</span>
          <span class="text-muted small fw-semibold">Account Recovery</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="step === 'email' ? requestCode() : verifyCode()" class="px-4 pb-4">
        <!-- Step Indicator -->
        <div class="step-indicator mb-4">
          <div class="step" :class="{ active: step === 'email' }">
            <span>1</span>
            <small>Email</small>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: step === 'otp' }">
            <span>2</span>
            <small>Verify</small>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: step === 'reset' }">
            <span>✓</span>
            <small>Reset</small>
          </div>
        </div>

        <!-- Email Step -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 'email'" key="email">
            <div class="mb-3">
              <label for="email" class="form-label fw-medium">Email Address</label>
              <input
                id="email"
                v-model.trim="email"
                type="email"
                placeholder="your@school.com"
                required
                class="form-control form-control-lg"
              />
              <small class="text-muted">Enter your registered email address</small>
            </div>
          </div>

          <!-- OTP Step -->
          <div v-else key="otp">
            <div class="alert alert-info d-flex align-items-center gap-2 mb-3">
              <span>🛡️</span>
              <div>
                <strong>Code sent to {{ email }}</strong>
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
              @click="requestCode"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
            </button>
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
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom btn-lg w-100 fw-semibold"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ step === 'email' ? 'Sending OTP...' : 'Verifying...' }}
          </span>
          <span v-else>
            {{ step === 'email' ? 'Send OTP' : 'Verify OTP' }}
          </span>
        </button>
      </form>

      <!-- Footer Links -->
      <div class="text-center px-4 pb-4">
        <p class="small text-muted mb-0">
          Remember your password?
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

const router = useRouter()
const step = ref('email')
const email = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])
const countdown = ref(0)
const resendCooldown = ref(0)
const countdownTimer = ref(null)
const cooldownTimer = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

const otpCode = computed(() => otpDigits.value.join(''))
const formattedCountdown = computed(() => {
  const minutes = String(Math.floor(countdown.value / 60)).padStart(2, '0')
  const seconds = String(countdown.value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

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

const requestCode = async () => {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const response = await api.post('/auth/forgot-password', { email: email.value })
    success.value = response.data.message || 'OTP sent.'
    step.value = 'otp'
    otpDigits.value = ['', '', '', '', '', '']
    startTimers(response.data.expires_in_seconds || 300, response.data.resend_cooldown_seconds || 45)
    await nextTick()
    otpRefs.value[0]?.focus()
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to send OTP.'
  } finally {
    loading.value = false
  }
}

const verifyCode = async () => {
  error.value = ''
  success.value = ''
  if (otpCode.value.length !== 6) {
    error.value = 'Enter the complete 6 digit OTP.'
    return
  }

  loading.value = true
  try {
    await api.post('/auth/verify-reset-code', { email: email.value, code: otpCode.value })
    sessionStorage.setItem('resetEmail', email.value)
    sessionStorage.setItem('resetCode', otpCode.value)
    await router.push('/reset-password')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid OTP.'
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
