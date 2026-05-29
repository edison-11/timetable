<template>
  <div class="forgot-page min-vh-100 d-flex align-items-center justify-content-center p-3">
    <div class="forgot-card w-100" :class="{ 'is-loading': loading }">
      <div class="forgot-card-header">
        <div class="brand-login-mark">
          <img class="brand-login-logo" :src="logoUrl" alt="School logo" />
        </div>
        <h1 class="auth-title mb-0">Timetable Management System</h1>
      </div>

      <form @submit.prevent="step === 'email' ? requestCode() : verifyCode()" class="forgot-form">
        <h2 class="form-title">Forgot Password</h2>
        <div class="title-rule"></div>

        <div class="step-indicator">
          <div class="step" :class="{ active: step === 'email', complete: step === 'otp' }">
            <span>1</span>
            <small>Email</small>
          </div>
          <div class="step-line" :class="{ active: step === 'otp' }"></div>
          <div class="step" :class="{ active: step === 'otp' }">
            <span>2</span>
            <small>Verify</small>
          </div>
        </div>

        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 'email'" key="email">
            <div class="forgot-field">
              <label for="email" class="form-label">Email Address</label>
              <div class="forgot-input-wrap">
                <span class="forgot-input-icon mail-icon" aria-hidden="true"></span>
                <input
                  id="email"
                  v-model.trim="email"
                  type="email"
                  placeholder="Enter your registered email"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': emailError }"
                  autocomplete="email"
                />
              </div>
              <div v-if="emailError" class="invalid-feedback d-block mt-1">
                {{ emailError }}
              </div>
            </div>
          </div>

          <div v-else key="otp">
            <div class="verification-note">
              <strong>Code sent to {{ email }}</strong>
              <span>Expires in {{ formattedCountdown }}</span>
            </div>

            <label for="otp" class="form-label">Enter 6-Digit OTP</label>
            <div class="otp-grid" @paste.prevent="handleOtpPaste">
              <input
                v-for="(_, index) in otpDigits"
                :key="index"
                :ref="el => otpRefs[index] = el"
                v-model="otpDigits[index]"
                inputmode="numeric"
                maxlength="1"
                aria-label="OTP digit"
                @input="handleOtpInput(index)"
                @keydown.backspace="handleOtpBackspace(index, $event)"
              />
            </div>

            <button
              type="button"
              class="resend-btn"
              :disabled="resendCooldown > 0 || loading"
              @click="requestCode"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
            </button>
          </div>
        </transition>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success" role="alert">
          {{ success }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn forgot-submit w-100"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ step === 'email' ? 'Sending OTP...' : 'Verifying...' }}
          </span>
          <span v-else>
            {{ step === 'email' ? 'Send OTP' : 'Verify OTP' }}
          </span>
        </button>

        <div class="login-row">
          <span>Remember your password?</span>
          <router-link to="/login">Log In</router-link>
        </div>

        <div class="create-row">
          <span>New user?</span>
          <router-link to="/teacher/register">Create an Account</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/stores/api'

const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}title-logo.png`

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

const emailError = computed(() => {
  const value = email.value.trim()
  if (!value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address.'
  return ''
})

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

  if (emailError.value || !email.value.trim()) {
    error.value = emailError.value || 'Email is required.'
    return
  }

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
.forgot-page {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.56), rgba(248, 250, 252, 0.28) 42%, rgba(255, 255, 255, 0.78)),
    linear-gradient(180deg, rgba(226, 232, 240, 0.5), rgba(255, 255, 255, 0.36)),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23dfe6ee'/%3E%3Crect y='520' width='1200' height='380' fill='%23bd9a73'/%3E%3Cpath d='M0 710h1200v190H0z' fill='%23d7b58a'/%3E%3Cpath d='M0 548h1200' stroke='%23a57d58' stroke-width='8' opacity='.35'/%3E%3Crect x='70' y='58' width='250' height='430' rx='8' fill='%23eef3f8' opacity='.72'/%3E%3Crect x='360' y='58' width='250' height='430' rx='8' fill='%23f7f9fb' opacity='.72'/%3E%3Crect x='650' y='58' width='250' height='430' rx='8' fill='%23eef3f8' opacity='.76'/%3E%3Crect x='940' y='58' width='250' height='430' rx='8' fill='%23f7f9fb' opacity='.72'/%3E%3Cellipse cx='180' cy='742' rx='260' ry='58' fill='%23445563' opacity='.18'/%3E%3Crect x='-20' y='664' width='410' height='104' rx='10' fill='%23f0f5f9' transform='rotate(-10 -20 664)'/%3E%3Cpath d='M820 510c90-70 205-44 265 16v130H820z' fill='%2398b96f' opacity='.6'/%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
}

.forgot-page::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.forgot-card {
  position: relative;
  z-index: 1;
  max-width: 580px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.34);
}

.forgot-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 30px 46px;
  background: linear-gradient(180deg, #47617e 0%, #33475f 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.4);
  color: #fff;
}

.brand-login-mark {
  flex: 0 0 58px;
  width: 58px;
  height: 58px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
}

.brand-login-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 5px;
}

.auth-title {
  color: #fff;
  font-size: clamp(1.65rem, 4vw, 2.15rem);
  font-weight: 850;
  line-height: 1.12;
  letter-spacing: 0;
}

.forgot-form {
  padding: 24px 46px 32px;
}

.form-title {
  margin: 0;
  color: #3a4050;
  text-align: center;
  font-size: 1.85rem;
  font-weight: 800;
}

.title-rule {
  height: 1px;
  margin: 16px 0 18px;
  background: #d3dae2;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.step {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step span {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 850;
}

.step small {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 800;
}

.step.active span {
  background: #2f7cd8;
  color: #fff;
}

.step.active small {
  color: #1f72c9;
}

.step.complete span,
.step-line.active {
  background: #22a058;
  color: #fff;
}

.step-line {
  flex: 0.35;
  height: 2px;
  background: #d3dae2;
  margin: 0 -12px 20px;
}

.forgot-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #253246;
  font-size: 1.05rem;
  font-weight: 800;
}

.forgot-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.forgot-input-icon {
  position: absolute;
  left: 18px;
  z-index: 2;
  width: 28px;
  height: 30px;
  color: #505a66;
}

.mail-icon::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 7px;
  width: 25px;
  height: 17px;
  border-radius: 3px;
  background: currentColor;
}

.mail-icon::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  width: 19px;
  height: 14px;
  border-left: 3px solid #fff;
  border-bottom: 3px solid #fff;
  transform: rotate(-45deg);
}

.forgot-input-wrap .form-control {
  min-height: 52px;
  padding: 0.85rem 1rem 0.85rem 4.35rem;
  border: 1px solid #b9c2cd !important;
  border-radius: 5px !important;
  background: rgba(255, 255, 255, 0.88) !important;
  color: #263244;
  font-size: 1.05rem;
  box-shadow: inset 0 1px 1px rgba(15, 23, 42, 0.06), 0 2px 5px rgba(15, 23, 42, 0.08);
}

.forgot-input-wrap .form-control::placeholder {
  color: #677281;
}

.forgot-input-wrap .form-control:focus {
  border-color: #2f7cd8 !important;
  box-shadow: 0 0 0 4px rgba(47, 124, 216, 0.16), 0 2px 5px rgba(15, 23, 42, 0.08) !important;
}

.verification-note {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1e3a8a;
}

.verification-note span {
  color: #475569;
  font-weight: 700;
}

.otp-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin: 10px 0 16px;
}

.otp-grid input {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #253246;
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
}

.otp-grid input:focus {
  border-color: #2f7cd8;
  outline: none;
  box-shadow: 0 0 0 4px rgba(47, 124, 216, 0.14);
}

.resend-btn {
  width: 100%;
  margin: 0 0 18px;
  border: 0;
  background: transparent;
  color: #1f72c9;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.forgot-submit {
  min-height: 58px;
  margin: 0;
  border: 1px solid #0866c7;
  border-radius: 5px;
  background: linear-gradient(180deg, #42a8ff 0%, #0768cd 100%);
  color: #fff;
  font-size: 1.45rem;
  font-weight: 850;
  text-shadow: 0 2px 2px rgba(15, 23, 42, 0.32);
  box-shadow: 0 8px 14px rgba(3, 105, 214, 0.24);
  transition: transform .08s ease, box-shadow .2s ease;
}

.forgot-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(3, 105, 214, 0.28);
}

.login-row,
.create-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6c7582;
  font-size: 1.06rem;
  font-weight: 700;
}

.login-row {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid #d3dae2;
}

.create-row {
  margin-top: 10px;
}

.login-row a,
.create-row a {
  color: #1f72c9;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.alert {
  border-radius: 6px;
  font-size: 0.9rem;
}

.forgot-card.is-loading {
  pointer-events: none;
}

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
  .forgot-card-header {
    padding: 24px;
    gap: 12px;
  }

  .brand-login-mark {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
  }

  .forgot-form {
    padding: 22px 22px 26px;
  }

  .login-row,
  .create-row {
    flex-wrap: wrap;
  }
}
</style>
