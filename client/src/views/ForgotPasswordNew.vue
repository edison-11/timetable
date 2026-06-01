<template>
  <div class="forgot-password-page min-vh-100 d-flex align-items-center justify-content-center p-3">
    <div class="forgot-card w-100" :class="{ 'is-loading': loading }">
      <!-- Header -->
      <div class="forgot-card-header">
        <div class="brand-login-mark">
          <img class="brand-login-logo" :src="logoUrl" alt="School logo" />
        </div>
        <h1 class="auth-title mb-0">Password Recovery</h1>
        <p class="auth-subtitle">Reset your account password</p>
      </div>

      <!-- Step Indicator -->
      <div class="step-indicator-row">
        <div class="step-item" :class="{ active: step === 'email', completed: step !== 'email' }">
          <span class="step-number">1</span>
          <span class="step-label">Email</span>
        </div>
        <div class="step-connector" :class="{ active: step === 'otp' || step === 'reset' }"></div>
        <div class="step-item" :class="{ active: step === 'otp', completed: step === 'reset' }">
          <span class="step-number">2</span>
          <span class="step-label">Verify</span>
        </div>
        <div class="step-connector" :class="{ active: step === 'reset' }"></div>
        <div class="step-item" :class="{ active: step === 'reset' }">
          <span class="step-number"><Check :size="16" :stroke-width="2.5" aria-hidden="true" /></span>
          <span class="step-label">New Password</span>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="forgot-form">
        <!-- Step 1: Email -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="step === 'email'" key="email" class="form-step">
            <div class="forgot-field">
              <label for="email" class="form-label">Email Address</label>
              <div class="forgot-input-wrap">
                <Mail class="forgot-input-icon" :size="18" :stroke-width="2.2" aria-hidden="true" />
                <input
                  id="email"
                  v-model.trim="email"
                  type="email"
                  placeholder="Enter your registered email..."
                  required
                  class="form-control"
                  :class="{ 'is-invalid': emailError }"
                />
              </div>
              <div v-if="emailError" class="invalid-feedback d-block mt-1">
                {{ emailError }}
              </div>
              <small class="form-text text-muted mt-2">
                We'll send you a verification code to reset your password
              </small>
            </div>
          </div>

          <!-- Step 2: OTP -->
          <div v-else-if="step === 'otp'" key="otp" class="form-step">
            <div class="alert alert-info-custom mb-4" role="alert">
              <ShieldCheck class="alert-icon" :size="24" :stroke-width="2.2" aria-hidden="true" />
              <div>
                <strong>Verification code sent</strong>
                <p>Enter the 6-digit code we sent to <strong>{{ maskEmail(email) }}</strong></p>
              </div>
            </div>

            <div class="forgot-field">
              <label class="form-label">Verification Code</label>
              <div class="otp-grid-wrap">
                <input
                  v-for="(digit, index) in otpDigits"
                  :key="index"
                  :ref="el => otpRefs[index] = el"
                  v-model="otpDigits[index]"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="otp-input"
                  @input="handleOtpInput(index)"
                  @keydown.backspace="handleOtpBackspace(index, $event)"
                  @paste.prevent="handleOtpPaste"
                />
              </div>
            </div>

            <div class="otp-timer-row">
              <small class="text-muted">
                Code expires in <strong>{{ formattedCountdown }}</strong>
              </small>
            </div>

            <button
              type="button"
              class="btn btn-link-custom w-100 mt-2"
              :disabled="resendCooldown > 0 || loading"
              @click="requestCode"
            >
              {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code' }}
            </button>
          </div>

          <!-- Step 3: New Password -->
          <div v-else-if="step === 'reset'" key="reset" class="form-step">
            <div class="alert alert-success-custom mb-4" role="alert">
              <CheckCircle class="alert-icon" :size="24" :stroke-width="2.2" aria-hidden="true" />
              <div>
                <strong>Code verified!</strong>
                <p>Now set your new password</p>
              </div>
            </div>

            <div class="forgot-field">
              <label for="newPassword" class="form-label">New Password</label>
              <div class="forgot-input-wrap">
                <LockKeyhole class="forgot-input-icon" :size="18" :stroke-width="2.2" aria-hidden="true" />
                <input
                  id="newPassword"
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter new password..."
                  required
                  class="form-control"
                  :class="{ 'is-invalid': passwordError }"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :title="showPassword ? 'Hide password' : 'Show password'"
                >
                  <EyeOff v-if="showPassword" :size="18" :stroke-width="2.2" aria-hidden="true" />
                  <Eye v-else :size="18" :stroke-width="2.2" aria-hidden="true" />
                </button>
              </div>
              <div v-if="passwordError" class="invalid-feedback d-block mt-1">
                {{ passwordError }}
              </div>
              <small class="form-text text-muted mt-2">
                Password must be at least 8 characters
              </small>
            </div>

            <div class="forgot-field">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <div class="forgot-input-wrap">
                <LockKeyhole class="forgot-input-icon" :size="18" :stroke-width="2.2" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Re-enter your password..."
                  required
                  class="form-control"
                  :class="{ 'is-invalid': confirmPasswordError }"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  :title="showConfirmPassword ? 'Hide password' : 'Show password'"
                >
                  <EyeOff v-if="showConfirmPassword" :size="18" :stroke-width="2.2" aria-hidden="true" />
                  <Eye v-else :size="18" :stroke-width="2.2" aria-hidden="true" />
                </button>
              </div>
              <div v-if="confirmPasswordError" class="invalid-feedback d-block mt-1">
                {{ confirmPasswordError }}
              </div>
            </div>
          </div>
        </transition>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger" role="alert">
          <strong>Error:</strong> {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="alert alert-success" role="alert">
          <strong>Success!</strong> {{ success }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom forgot-submit w-100"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ step === 'email' ? 'Sending code...' : step === 'otp' ? 'Verifying...' : 'Resetting...' }}
          </span>
          <span v-else>
            {{ step === 'email' ? 'Send Code' : step === 'otp' ? 'Verify Code' : 'Reset Password' }}
          </span>
        </button>

        <!-- Back to Login -->
        <div class="forgot-footer">
          <span>Remember your password?</span>
          <router-link to="/login" class="forgot-link">
            Back to Login
          </router-link>
        </div>

        <!-- Create Account Link -->
        <div class="forgot-create-link">
          <span>Don't have an account?</span>
          <router-link to="/teacher/register" class="forgot-link">
            Register here
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CheckCircle, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-vue-next'
import api from '@/stores/api'

const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}title-logo.png`

const step = ref('email')
const email = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countdown = ref(0)
const resendCooldown = ref(0)
const countdownTimer = ref(null)
const cooldownTimer = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

const emailError = computed(() => {
  const value = email.value.trim()
  if (!value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address'
  return ''
})

const passwordError = computed(() => {
  if (!newPassword.value) return ''
  if (newPassword.value.length < 8) return 'Password must be at least 8 characters'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return ''
  if (confirmPassword.value !== newPassword.value) return 'Passwords do not match'
  return ''
})

const otpCode = computed(() => otpDigits.value.join(''))
const formattedCountdown = computed(() => {
  const minutes = String(Math.floor(countdown.value / 60)).padStart(2, '0')
  const seconds = String(countdown.value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

const maskEmail = (emailAddr) => {
  const [name, domain] = emailAddr.split('@')
  const visibleChars = Math.max(1, Math.floor(name.length / 2))
  const masked = name.substring(0, visibleChars) + '*'.repeat(name.length - visibleChars)
  return `${masked}@${domain}`
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

const handleOtpInput = (index) => {
  const value = otpDigits.value[index]
  if (!/^\d?$/.test(value)) otpDigits.value[index] = ''
  if (value && index < 5) otpRefs.value[index + 1]?.focus()
}

const handleOtpBackspace = (index, event) => {
  if (index > 0 && !otpDigits.value[index]) {
    otpRefs.value[index - 1]?.focus()
  }
}

const handleOtpPaste = (event) => {
  const data = (event.clipboardData || window.clipboardData).getData('text')
  if (/^\d{6}$/.test(data)) {
    otpDigits.value = data.split('')
  }
}

const requestCode = async () => {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const response = await api.post('/auth/forgot-password', { email: email.value })
    success.value = 'Verification code sent to your email'
    step.value = 'otp'
    otpDigits.value = ['', '', '', '', '', '']
    startTimers(response.data?.expires_in_seconds || 300, response.data?.resend_cooldown_seconds || 45)
    await nextTick()
    otpRefs.value[0]?.focus()
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to send verification code. Please try again.'
  } finally {
    loading.value = false
  }
}

const verifyCode = async () => {
  if (otpCode.value.length !== 6) {
    error.value = 'Please enter all 6 digits of the verification code'
    return
  }

  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await api.post('/auth/verify-otp', { email: email.value, otp_code: otpCode.value })
    success.value = 'Code verified! Now set your new password'
    step.value = 'reset'
    clearInterval(countdownTimer.value)
    clearInterval(cooldownTimer.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid verification code. Please try again.'
  } finally {
    loading.value = false
  }
}

const resetPassword = async () => {
  if (!newPassword.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }
  if (passwordError.value) {
    error.value = passwordError.value
    return
  }
  if (confirmPasswordError.value) {
    error.value = confirmPasswordError.value
    return
  }

  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const response = await api.post('/auth/reset-password', {
      email: email.value,
      otp_code: otpCode.value,
      new_password: newPassword.value
    })
    success.value = 'Password reset successfully! Redirecting to login...'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to reset password. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (step.value === 'email') {
    await requestCode()
  } else if (step.value === 'otp') {
    await verifyCode()
  } else if (step.value === 'reset') {
    await resetPassword()
  }
}

onBeforeUnmount(() => {
  clearInterval(countdownTimer.value)
  clearInterval(cooldownTimer.value)
})
</script>

<style scoped>
.forgot-password-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.forgot-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.forgot-card:hover {
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
}

.forgot-card.is-loading {
  opacity: 0.7;
}

.forgot-card-header {
  padding: 2.5rem 2rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.brand-login-mark {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
}

.brand-login-logo {
  width: 60%;
  height: 60%;
  object-fit: contain;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.step-indicator-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 0 0 auto;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.step-item.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.step-item.completed .step-number {
  background: #10b981;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

.step-item.active .step-label {
  color: #667eea;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 0.25rem;
  transition: background 0.3s ease;
}

.step-connector.active {
  background: #10b981;
}

.forgot-form {
  padding: 2rem;
}

.form-step {
  animation: slideIn 0.3s ease;
}

.forgot-field {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.6rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.forgot-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.forgot-input-icon {
  position: absolute;
  left: 12px;
  color: #999;
  pointer-events: none;
  z-index: 1;
  font-size: 1.1rem;
}

.form-control {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.form-control.is-invalid {
  border-color: #dc2626;
  background: #fef2f2;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  color: #6b7280;
  transition: color 0.2s ease;
  z-index: 2;
}

.password-toggle:hover {
  color: #667eea;
}

.invalid-feedback {
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-text {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.85rem;
}

.text-muted {
  color: #6b7280 !important;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: none;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.alert-danger {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

.alert-info-custom {
  background: #eff6ff;
  color: #1e40af;
  border-left: 4px solid #3b82f6;
}

.alert-success-custom {
  background: #f0fdf4;
  color: #15803d;
  border-left: 4px solid #22c55e;
}

.alert-success {
  background: #f0fdf4;
  color: #15803d;
  border-left: 4px solid #22c55e;
  border: none;
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.otp-grid-wrap {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.otp-input {
  width: 100%;
  padding: 0.8rem 0;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  background: white;
}

.otp-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.otp-timer-row {
  text-align: center;
  padding: 0.5rem 0;
}

.btn-link-custom {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  padding: 0.6rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-link-custom:hover:not(:disabled) {
  color: #764ba2;
  text-decoration: underline;
}

.btn-link-custom:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.forgot-submit {
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary-custom:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.forgot-footer span {
  display: block;
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
  display: inline-block;
}

.forgot-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.forgot-create-link {
  text-align: center;
  padding-top: 1rem;
}

.forgot-create-link span {
  display: block;
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.2em;
}

.d-flex {
  display: flex;
}

.align-items-center {
  align-items: center;
}

.justify-content-center {
  justify-content: center;
}

.gap-2 {
  gap: 0.5rem;
}

.w-100 {
  width: 100%;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mb-0 {
  margin-bottom: 0;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

@media (max-width: 576px) {
  .forgot-card {
    border-radius: 8px;
  }

  .forgot-card-header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .auth-title {
    font-size: 1.5rem;
  }

  .step-indicator-row {
    padding: 1rem 1rem;
    gap: 0.3rem;
  }

  .step-label {
    display: none;
  }

  .forgot-form {
    padding: 1.5rem;
  }

  .otp-grid-wrap {
    gap: 0.6rem;
  }

  .otp-input {
    font-size: 1rem;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
