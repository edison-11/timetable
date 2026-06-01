<template>
  <div class="register-page min-vh-100 d-flex align-items-center justify-content-center p-3">
    <div class="register-card w-100" :class="{ 'is-loading': loading }">
      <div class="register-card-header">
        <div class="brand-login-mark">
          <img class="brand-login-logo" :src="logoUrl" alt="School logo" />
        </div>
        <h1 class="brand-title mb-0">Timetable Management System</h1>
      </div>

      <form @submit.prevent="step === 'details' ? requestOtp() : verifyOtp()" class="register-form">
        <template v-if="step === 'details'">
          <h2 class="form-title">Register</h2>

          <div class="register-context">
            <div>
              <strong>Teacher Account</strong>
              <span>Join an approved school and wait for DOS approval.</span>
            </div>
            <router-link to="/dos/register">Register a School</router-link>
          </div>

          <div class="title-rule"></div>

          <div class="register-field">
            <label for="fullName" class="form-label">Full Name</label>
            <div class="register-input-wrap">
              <UserRound class="register-input-icon" :size="20" :stroke-width="2.25" aria-hidden="true" />
              <input
                id="fullName"
                v-model.trim="form.full_name"
                type="text"
                placeholder="Enter your full name"
                required
                class="form-control"
              />
            </div>
          </div>

          <div class="register-field">
            <label for="email" class="form-label">Email</label>
            <div class="register-input-wrap">
              <Mail class="register-input-icon" :size="20" :stroke-width="2.25" aria-hidden="true" />
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                placeholder="Enter your email address"
                required
                class="form-control"
              />
            </div>
          </div>

          <div class="register-grid">
            <div class="register-field">
              <label for="phone" class="form-label">Phone Number</label>
              <div class="register-input-wrap plain-input">
                <input
                  id="phone"
                  v-model.trim="form.phone"
                  type="tel"
                  placeholder="Enter phone number"
                  required
                  class="form-control"
                />
              </div>
            </div>

            <div class="register-field">
              <label for="department" class="form-label">Department</label>
              <div class="register-input-wrap plain-input">
                <input
                  id="department"
                  v-model.trim="form.department"
                  type="text"
                  placeholder="Department"
                  required
                  class="form-control"
                />
              </div>
            </div>
          </div>

          <div class="register-grid">
            <div class="register-field">
              <label for="qualification" class="form-label">Qualification</label>
              <div class="register-input-wrap plain-input">
                <input
                  id="qualification"
                  v-model.trim="form.qualification"
                  type="text"
                  placeholder="Highest qualification"
                  required
                  class="form-control"
                />
              </div>
            </div>

            <div class="register-field">
              <label for="employeeId" class="form-label">Staff ID</label>
              <div class="register-input-wrap plain-input">
                <input
                  id="employeeId"
                  v-model.trim="form.employeeId"
                  type="text"
                  placeholder="ID number"
                  required
                  class="form-control"
                />
              </div>
            </div>
          </div>

          <div class="register-grid">
            <div class="register-field">
              <label for="nationalId" class="form-label">National ID</label>
              <div class="register-input-wrap plain-input">
                <input
                  id="nationalId"
                  v-model.trim="form.national_id"
                  type="text"
                  placeholder="National ID number"
                  required
                  class="form-control"
                />
              </div>
            </div>

            <div class="register-field">
              <label for="schoolId" class="form-label">Select Your School</label>
              <div class="register-input-wrap plain-input">
                <select
                  id="schoolId"
                  v-model="form.school_id"
                  required
                  class="form-control"
                >
                  <option value="">Choose an approved school</option>
                  <option v-for="school in activeSchools" :key="school.school_id" :value="school.school_id">
                    {{ school.school_name }}{{ school.school_code ? ` (${school.school_code})` : '' }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="register-grid">
            <div class="register-field">
              <label for="gender" class="form-label">Gender</label>
              <div class="register-input-wrap plain-input">
                <select id="gender" v-model="form.gender" required class="form-control">
                  <option value="">Select gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div class="register-field">
              <label for="specialization" class="form-label">Subject Specialization</label>
              <div class="register-input-wrap plain-input">
                <input
                  id="specialization"
                  v-model.trim="form.module_name"
                  type="text"
                  placeholder="Subject specialization"
                  required
                  class="form-control"
                />
              </div>
            </div>
          </div>

          <div class="register-field">
            <label for="profilePhoto" class="form-label">Profile Photo</label>
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              required
              class="form-control file-control"
              @change="handlePhotoChange"
            />
          </div>

          <div class="register-field">
            <label for="password" class="form-label">Password</label>
            <div class="register-input-wrap">
              <LockKeyhole class="register-input-icon" :size="20" :stroke-width="2.25" aria-hidden="true" />
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password..."
                required
                class="form-control"
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
          </div>

          <div class="register-field">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <div class="register-input-wrap">
              <LockKeyhole class="register-input-icon" :size="20" :stroke-width="2.25" aria-hidden="true" />
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                required
                class="form-control"
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
          </div>

          <label class="terms-row">
            <input type="checkbox" v-model="acceptedTerms" class="terms-check" />
            <span>
              I agree to the
              <a href="#" @click.prevent>Terms of Service</a>
              and
              <a href="#" @click.prevent>Privacy Policy</a>
            </span>
          </label>
        </template>

        <template v-else-if="step === 'otp'">
          <h2 class="form-title">Verify Email</h2>
          <div class="title-rule"></div>

          <div class="verification-note">
            <strong>Code sent to {{ pendingEmail }}</strong>
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
              @input="handleOtpInput(index)"
              @keydown.backspace="handleOtpBackspace(index, $event)"
            />
          </div>

          <button
            type="button"
            class="resend-btn"
            :disabled="resendCooldown > 0 || loading"
            @click="resendOtp"
          >
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
          </button>
        </template>

        <template v-else>
          <div class="success-panel">
            <div class="success-mark" aria-hidden="true"></div>
            <h2>{{ successTitle }}</h2>
            <p>{{ successDetail }}</p>
          </div>
        </template>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success" role="alert">
          {{ success }}
        </div>

        <button
          v-if="step !== 'success'"
          type="submit"
          :disabled="loading"
          class="btn register-submit w-100"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ step === 'details' ? 'Sending OTP...' : 'Verifying...' }}
          </span>
          <span v-else>
            {{ step === 'details' ? 'Sign Up' : 'Verify & Create Account' }}
          </span>
        </button>

        <div class="login-row">
          <span>Already have an account?</span>
          <router-link to="/login">Log In</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-vue-next'
import api from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const logoUrl = `${import.meta.env.BASE_URL}title-logo.png`

const form = ref({
  full_name: '',
  email: '',
  phone: '',
  role: 'teacher',
  department: '',
  module_name: '',
  gender: '',
  qualification: '',
  employeeId: '',
  national_id: '',
  school_id: '',
  school_registration_number: '',
  profile_photo: '',
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
const showConfirmPassword = ref(false)
const acceptedTerms = ref(false)
const selectedPhoto = ref(null)
const activeSchools = ref([])
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
  if (!form.value.phone) return 'Phone number is required.'
  if (!form.value.department) return 'Department is required.'
  if (!form.value.qualification) return 'Qualification is required.'
  if (!form.value.employeeId) return 'Staff ID is required.'
  if (!form.value.national_id) return 'National ID is required.'
  if (!form.value.school_id) return 'Select an approved active school.'
  if (!form.value.gender) return 'Gender is required.'
  if (!form.value.module_name) return 'Subject specialization is required.'
  if (!selectedPhoto.value && !form.value.profile_photo) return 'Profile photo is required.'
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.value.password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
  }
  if (form.value.password !== form.value.confirmPassword) return 'Passwords do not match.'
  if (!acceptedTerms.value) return 'Please agree to the terms before creating an account.'
  return ''
}

const handlePhotoChange = (event) => {
  const file = event.target.files?.[0]
  selectedPhoto.value = file || null
  form.value.profile_photo = ''
}

const uploadRegistrationPhoto = async () => {
  if (!selectedPhoto.value) return form.value.profile_photo

  const payload = new FormData()
  payload.append('photo', selectedPhoto.value)
  const response = await api.post('/upload/registration-photo', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  form.value.profile_photo = response.data.photo?.path || ''
  return form.value.profile_photo
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
    const profilePhoto = await uploadRegistrationPhoto()
    const payload = {
      ...form.value,
      username: form.value.full_name,
      phone: form.value.phone || '',
      profile_photo: profilePhoto,
      school_id: form.value.school_id,
      role: 'teacher'
    }
    const response = await api.post('/auth/register', payload)
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

onBeforeUnmount(() => {
  clearInterval(countdownTimer.value)
  clearInterval(cooldownTimer.value)
})

const loadActiveSchools = async () => {
  try {
    const response = await api.get('/schools/active')
    activeSchools.value = response.data.schools || []
  } catch (error) {
    activeSchools.value = []
  }
}

onMounted(loadActiveSchools)
</script>

<style scoped>
.register-page {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.56), rgba(248, 250, 252, 0.28) 42%, rgba(255, 255, 255, 0.78)),
    linear-gradient(180deg, rgba(226, 232, 240, 0.5), rgba(255, 255, 255, 0.36)),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23dfe6ee'/%3E%3Crect y='520' width='1200' height='380' fill='%23bd9a73'/%3E%3Cpath d='M0 710h1200v190H0z' fill='%23d7b58a'/%3E%3Cpath d='M0 548h1200' stroke='%23a57d58' stroke-width='8' opacity='.35'/%3E%3Crect x='70' y='58' width='250' height='430' rx='8' fill='%23eef3f8' opacity='.72'/%3E%3Crect x='360' y='58' width='250' height='430' rx='8' fill='%23f7f9fb' opacity='.72'/%3E%3Crect x='650' y='58' width='250' height='430' rx='8' fill='%23eef3f8' opacity='.76'/%3E%3Crect x='940' y='58' width='250' height='430' rx='8' fill='%23f7f9fb' opacity='.72'/%3E%3Cellipse cx='180' cy='742' rx='260' ry='58' fill='%23445563' opacity='.18'/%3E%3Crect x='-20' y='664' width='410' height='104' rx='10' fill='%23f0f5f9' transform='rotate(-10 -20 664)'/%3E%3Cpath d='M820 510c90-70 205-44 265 16v130H820z' fill='%2398b96f' opacity='.6'/%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
}

.register-page::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.register-card {
  position: relative;
  z-index: 1;
  max-width: 460px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.34);
}

.register-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: linear-gradient(180deg, #47617e 0%, #33475f 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.4);
  color: #fff;
}

.brand-login-mark {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
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

.brand-title {
  color: #fff;
  font-size: clamp(1rem, 2.6vw, 1.22rem);
  font-weight: 850;
  line-height: 1.12;
  letter-spacing: 0;
}

.register-form {
  padding: 14px 24px 18px;
}

.form-title {
  margin: 0;
  color: #3a4050;
  text-align: center;
  font-size: 1.18rem;
  font-weight: 800;
}

.register-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.75rem;
  padding: 0.55rem;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
}

.register-context div {
  display: grid;
  gap: 0.15rem;
}

.register-context strong {
  color: #1e3a8a;
  font-size: 0.82rem;
}

.register-context span {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 650;
}

.register-context a {
  flex: 0 0 auto;
  padding: 0.38rem 0.55rem;
  border-radius: 7px;
  background: #2563eb;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 850;
  text-decoration: none;
}

.title-rule {
  height: 1px;
  margin: 10px 0 11px;
  background: #d3dae2;
}

.register-field {
  margin-bottom: 9px;
}

.register-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.register-field .form-label,
.register-form > .form-label {
  display: block;
  margin-bottom: 5px;
  color: #253246;
  font-size: 0.76rem;
  font-weight: 800;
}

.register-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.register-input-icon {
  position: absolute;
  left: 12px;
  z-index: 2;
  color: #505a66;
}

.register-input-wrap .form-control {
  min-height: 38px;
  padding: 0.5rem 2.9rem 0.5rem 2.85rem;
  border: 1px solid #b9c2cd !important;
  border-radius: 5px !important;
  background: rgba(255, 255, 255, 0.88) !important;
  color: #263244;
  font-size: 0.82rem;
  box-shadow: inset 0 1px 1px rgba(15, 23, 42, 0.06), 0 2px 5px rgba(15, 23, 42, 0.08);
}

.register-input-wrap.plain-input .form-control {
  padding-left: 1rem;
  padding-right: 1rem;
}

.file-control {
  min-height: 38px;
  padding: 0.45rem 0.6rem;
  border: 1px solid #b9c2cd;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.88);
}

.register-input-wrap .form-control::placeholder {
  color: #677281;
}

.register-input-wrap .form-control:focus {
  border-color: #2f7cd8 !important;
  box-shadow: 0 0 0 4px rgba(47, 124, 216, 0.16), 0 2px 5px rgba(15, 23, 42, 0.08) !important;
}

.password-toggle {
  position: absolute;
  right: 10px;
  z-index: 3;
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #505a66;
}

.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 2px 0 12px;
  color: #4a5361;
  font-size: 0.82rem;
  font-weight: 650;
}

.terms-check {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  border-radius: 4px !important;
}

.terms-row a,
.login-row a {
  color: #2e6faa;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.register-submit {
  min-height: 40px;
  margin: 0;
  border: 1px solid #208742;
  border-radius: 5px;
  background: linear-gradient(180deg, #63c980 0%, #21924a 100%);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 850;
  text-shadow: 0 2px 2px rgba(15, 23, 42, 0.3);
  box-shadow: 0 8px 14px rgba(22, 101, 52, 0.24);
  transition: transform .08s ease, box-shadow .2s ease;
}

.register-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(22, 101, 52, 0.28);
}

.login-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #d3dae2;
  color: #6c7582;
  font-size: 0.86rem;
  font-weight: 700;
}

.verification-note {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  padding: 10px 12px;
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
  font-size: 1rem;
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
  margin: 0 0 14px;
  border: 0;
  background: transparent;
  color: #1f72c9;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.success-panel {
  padding: 18px 0 8px;
  text-align: center;
}

.success-mark {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #22c55e;
  position: relative;
}

.success-mark::after {
  content: '';
  position: absolute;
  left: 19px;
  top: 16px;
  width: 24px;
  height: 15px;
  border-left: 5px solid #fff;
  border-bottom: 5px solid #fff;
  transform: rotate(-45deg);
}

.success-panel h2 {
  color: #15803d;
  font-weight: 850;
}

.success-panel p {
  color: #64748b;
  font-weight: 650;
}

.alert {
  border-radius: 6px;
  font-size: 0.9rem;
}

.register-card.is-loading {
  pointer-events: none;
}

@media (max-width: 576px) {
  .register-card-header {
    padding: 24px;
    gap: 12px;
  }

  .brand-login-mark {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
  }

  .register-form {
    padding: 22px 22px 26px;
  }

  .login-row,
  .terms-row,
  .register-context {
    flex-wrap: wrap;
  }

  .register-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
