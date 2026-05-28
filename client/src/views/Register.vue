<template>
  <main class="register-page">
    <section class="register-card" :class="{ 'is-loading': loading }">
      <header class="register-card-header">
        <img :src="logoUrl" alt="School logo">
        <div>
          <h1>Timetable Management System</h1>
          <p>Create a school administrator or teacher account.</p>
        </div>
      </header>

      <form v-if="step !== 'success'" class="register-form" @submit.prevent="handleSubmit">
        <section class="role-section" aria-label="Choose account type">
          <button
            v-for="option in accountTypes"
            :key="option.value"
            type="button"
            class="role-card"
            :class="{ selected: accountType === option.value }"
            @click="selectAccountType(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <span>{{ option.description }}</span>
          </button>
        </section>

        <template v-if="step === 'details'">
          <div v-if="accountType === 'dos'" class="form-section">
            <div class="section-title">
              <h2>School Information</h2>
              <span>Pending approval by Super Admin</span>
            </div>

            <div class="form-grid">
              <label>
                <span>School Name</span>
                <input v-model.trim="dosForm.school_name" required type="text" placeholder="Kigali Modern School">
              </label>
              <label>
                <span>School Code</span>
                <input v-model.trim="dosForm.school_code" type="text" placeholder="KMS001">
              </label>
              <label>
                <span>School Email</span>
                <input v-model.trim="dosForm.school_email" required type="email" placeholder="school@example.com">
              </label>
              <label>
                <span>School Phone</span>
                <input v-model.trim="dosForm.phone" required type="tel" placeholder="0780000000">
              </label>
              <label>
                <span>School Type</span>
                <select v-model="dosForm.school_type" required>
                  <option value="">Select type</option>
                  <option>Public</option>
                  <option>Private</option>
                  <option>Government Aided</option>
                  <option>International</option>
                </select>
              </label>
              <label>
                <span>School Registration Number</span>
                <input v-model.trim="dosForm.registration_number" required type="text" placeholder="REG-001">
              </label>
              <label>
                <span>Province</span>
                <input v-model.trim="dosForm.province" type="text" placeholder="Kigali">
              </label>
              <label>
                <span>District</span>
                <input v-model.trim="dosForm.district" type="text" placeholder="Gasabo">
              </label>
              <label>
                <span>Sector</span>
                <input v-model.trim="dosForm.sector" type="text" placeholder="Remera">
              </label>
              <label>
                <span>School Logo</span>
                <input required type="file" accept="image/*" @change="handleDosPhotoChange">
              </label>
              <label class="wide">
                <span>School Address</span>
                <textarea v-model.trim="dosForm.school_address" required rows="3" placeholder="Full school address"></textarea>
              </label>
            </div>

            <div class="section-title">
              <h2>DOS Information</h2>
              <span>Main school administrator</span>
            </div>

            <div class="form-grid">
              <label>
                <span>Full Name</span>
                <input v-model.trim="dosForm.full_name" required type="text" placeholder="Director full name">
              </label>
              <label>
                <span>DOS Email</span>
                <input v-model.trim="dosForm.dos_email" required type="email" placeholder="dos@example.com">
              </label>
              <label>
                <span>DOS Phone Number</span>
                <input v-model.trim="dosForm.dos_phone" required type="tel" placeholder="0780000000">
              </label>
              <label>
                <span>National ID</span>
                <input v-model.trim="dosForm.national_id" required type="text">
              </label>
            </div>
          </div>

          <div v-else class="form-section">
            <div class="section-title">
              <h2>Teacher Information</h2>
              <span>Choose an approved active school</span>
            </div>

            <div class="form-grid">
              <label>
                <span>Full Name</span>
                <input v-model.trim="teacherForm.full_name" required type="text">
              </label>
              <label>
                <span>Email</span>
                <input v-model.trim="teacherForm.email" required type="email">
              </label>
              <label>
                <span>Phone Number</span>
                <input v-model.trim="teacherForm.phone" required type="tel">
              </label>
              <label>
                <span>Gender</span>
                <select v-model="teacherForm.gender" required>
                  <option value="">Select gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Qualification</span>
                <input v-model.trim="teacherForm.qualification" required type="text">
              </label>
              <label>
                <span>Subject Specialization</span>
                <input v-model.trim="teacherForm.module_name" required type="text">
              </label>
              <label>
                <span>Staff ID</span>
                <input v-model.trim="teacherForm.employeeId" required type="text">
              </label>
              <label>
                <span>National ID</span>
                <input v-model.trim="teacherForm.national_id" required type="text">
              </label>
              <label>
                <span>Department</span>
                <input v-model.trim="teacherForm.department" required type="text">
              </label>
              <label>
                <span>Select Your School</span>
                <select v-model="teacherForm.school_id" required>
                  <option value="">Choose approved school</option>
                  <option v-for="school in activeSchools" :key="school.school_id" :value="school.school_id">
                    {{ school.school_name }}{{ school.school_code ? ` (${school.school_code})` : '' }}
                  </option>
                </select>
              </label>
              <label class="wide">
                <span>Profile Photo</span>
                <input required type="file" accept="image/*" @change="handleTeacherPhotoChange">
              </label>
            </div>
          </div>

          <div class="form-grid">
            <label>
              <span>Password</span>
              <input v-model="activeForm.password" required type="password" autocomplete="new-password">
            </label>
            <label>
              <span>Confirm Password</span>
              <input v-model="activeForm.confirmPassword" required type="password" autocomplete="new-password">
            </label>
          </div>

          <label class="terms-row">
            <input v-model="acceptedTerms" type="checkbox">
            <span>I agree to the Terms of Service and Privacy Policy.</span>
          </label>
        </template>

        <template v-else-if="step === 'otp'">
          <div class="verification-note">
            <strong>Code sent to {{ pendingEmail }}</strong>
            <span>Expires in {{ formattedCountdown }}</span>
          </div>
          <label class="otp-label">
            <span>Enter 6-Digit OTP</span>
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
              >
            </div>
          </label>
          <button type="button" class="link-button" :disabled="resendCooldown > 0 || loading" @click="requestTeacherOtp">
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
          </button>
        </template>

        <p v-if="error" class="form-alert error">{{ error }}</p>
        <p v-if="success" class="form-alert success">{{ success }}</p>

        <button class="submit-button" type="submit" :disabled="loading">
          {{ submitLabel }}
        </button>

        <div class="login-row">
          <span>Already have an account?</span>
          <router-link to="/login">Log In</router-link>
        </div>
      </form>

      <div v-else class="success-panel">
        <div class="success-mark"></div>
        <h2>{{ successTitle }}</h2>
        <p>{{ successDetail }}</p>
        <router-link to="/login">Return to Login</router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import api from '@/stores/api'

const logoUrl = `${import.meta.env.BASE_URL}title-logo.png`

const accountTypes = [
  { value: 'dos', label: 'Director of Studies', description: 'Register a school and request platform approval.' },
  { value: 'teacher', label: 'Teacher', description: 'Join an approved school and wait for DOS approval.' }
]

const accountType = ref('dos')
const step = ref('details')
const loading = ref(false)
const error = ref('')
const success = ref('')
const acceptedTerms = ref(false)
const selectedDosPhoto = ref(null)
const selectedTeacherPhoto = ref(null)
const activeSchools = ref([])
const pendingEmail = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])
const countdown = ref(0)
const resendCooldown = ref(0)
const countdownTimer = ref(null)
const cooldownTimer = ref(null)
const successTitle = ref('')
const successDetail = ref('')

const dosForm = ref({
  full_name: '',
  school_name: '',
  school_code: '',
  school_email: '',
  dos_email: '',
  phone: '',
  dos_phone: '',
  national_id: '',
  registration_number: '',
  school_type: '',
  province: '',
  district: '',
  sector: '',
  school_address: '',
  password: '',
  confirmPassword: '',
  profile_photo: ''
})

const teacherForm = ref({
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
  profile_photo: '',
  password: '',
  confirmPassword: ''
})

const activeForm = computed(() => accountType.value === 'dos' ? dosForm.value : teacherForm.value)
const otpCode = computed(() => otpDigits.value.join(''))
const formattedCountdown = computed(() => `${String(Math.floor(countdown.value / 60)).padStart(2, '0')}:${String(countdown.value % 60).padStart(2, '0')}`)
const submitLabel = computed(() => {
  if (loading.value) return step.value === 'otp' ? 'Verifying...' : 'Submitting...'
  if (step.value === 'otp') return 'Verify & Create Account'
  return accountType.value === 'dos' ? 'Submit for Approval' : 'Send Verification Code'
})

const selectAccountType = (type) => {
  accountType.value = type
  step.value = 'details'
  error.value = ''
  success.value = ''
}

const validatePassword = (form) => {
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
  }
  if (form.password !== form.confirmPassword) return 'Passwords do not match.'
  if (!acceptedTerms.value) return 'Please agree to the terms before creating an account.'
  return ''
}

const validateDos = () => {
  const form = dosForm.value
  if (!form.school_name || !form.school_email || !form.phone || !form.registration_number || !form.school_address) return 'Complete all required school information.'
  if (!form.full_name || !form.dos_email || !form.dos_phone || !form.national_id) return 'Complete all required DOS information.'
  if (!selectedDosPhoto.value && !form.profile_photo) return 'School logo is required.'
  return validatePassword(form)
}

const validateTeacher = () => {
  const form = teacherForm.value
  if (!form.full_name || !form.email || !form.phone || !form.gender || !form.qualification || !form.module_name || !form.school_id) return 'Complete all required teacher information.'
  if (!selectedTeacherPhoto.value && !form.profile_photo) return 'Profile photo is required.'
  return validatePassword(form)
}

const handleDosPhotoChange = (event) => {
  selectedDosPhoto.value = event.target.files?.[0] || null
  dosForm.value.profile_photo = ''
}

const handleTeacherPhotoChange = (event) => {
  selectedTeacherPhoto.value = event.target.files?.[0] || null
  teacherForm.value.profile_photo = ''
}

const uploadPhoto = async (file, currentPath = '') => {
  if (!file) return currentPath
  const payload = new FormData()
  payload.append('photo', file)
  const response = await api.post('/upload/registration-photo', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data.photo?.path || ''
}

const submitDosRegistration = async () => {
  error.value = validateDos()
  if (error.value) return

  loading.value = true
  try {
    dosForm.value.profile_photo = await uploadPhoto(selectedDosPhoto.value, dosForm.value.profile_photo)
    await api.post('/schools/dos-register', {
      ...dosForm.value,
      email: dosForm.value.dos_email,
      phone: dosForm.value.dos_phone,
      school_phone: dosForm.value.phone
    })
    successTitle.value = 'Registration Submitted'
    successDetail.value = 'Your school is waiting for Super Admin approval.'
    step.value = 'success'
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
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

const requestTeacherOtp = async () => {
  error.value = validateTeacher()
  success.value = ''
  if (error.value) return

  loading.value = true
  try {
    teacherForm.value.profile_photo = await uploadPhoto(selectedTeacherPhoto.value, teacherForm.value.profile_photo)
    const response = await api.post('/auth/register', {
      ...teacherForm.value,
      username: teacherForm.value.full_name,
      role: 'teacher'
    })
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

const verifyTeacherOtp = async () => {
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
    successTitle.value = 'Registration Sent'
    successDetail.value = response.data.message || 'Your teacher account is waiting for DOS approval.'
    step.value = 'success'
  } catch (err) {
    error.value = err.response?.data?.message || 'OTP verification failed.'
  } finally {
    loading.value = false
  }
}

const handleSubmit = () => {
  if (step.value === 'otp') return verifyTeacherOtp()
  return accountType.value === 'dos' ? submitDosRegistration() : requestTeacherOtp()
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

const loadActiveSchools = async () => {
  try {
    const response = await api.get('/schools/active')
    activeSchools.value = response.data.schools || []
  } catch (error) {
    activeSchools.value = []
  }
}

onMounted(loadActiveSchools)

onBeforeUnmount(() => {
  clearInterval(countdownTimer.value)
  clearInterval(cooldownTimer.value)
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 0.8rem 1.5rem;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.58), rgba(248, 250, 252, 0.34) 42%, rgba(255, 255, 255, 0.86)),
    linear-gradient(180deg, rgba(226, 232, 240, 0.52), rgba(255, 255, 255, 0.42));
}

.register-card {
  width: min(1100px, 100%);
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}

.register-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.45rem 2rem;
  background: linear-gradient(180deg, #172033 0%, #0f172a 100%);
  color: #fff;
}

.register-card-header img {
  width: 58px;
  height: 58px;
  border-radius: 8px;
  background: #fff;
  object-fit: contain;
  padding: 0.3rem;
}

.register-card-header h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 850;
}

.register-card-header p {
  margin: 0.25rem 0 0;
  color: #cbd5e1;
}

.register-form,
.success-panel {
  padding: 1.5rem 2rem 2rem;
}

.role-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.role-card {
  display: grid;
  gap: 0.25rem;
  min-height: 86px;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  background: #fff;
  color: #172033;
  padding: 1rem;
  text-align: left;
}

.role-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #2563eb;
}

.role-card strong {
  font-size: 1rem;
}

.role-card span,
.section-title span {
  color: #64748b;
  font-size: 0.82rem;
}

.form-section {
  display: grid;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.35rem;
  border-top: 1px solid #e2e8f0;
}

.section-title:first-child {
  border-top: 0;
}

.section-title h2 {
  margin: 0;
  color: #172033;
  font-size: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.4rem;
  color: #24324a;
  font-weight: 800;
}

.wide {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid #d8e2ef;
  border-radius: 8px;
  background: #fff;
  color: #102033;
  padding: 0.75rem 0.85rem;
  font: inherit;
  font-weight: 600;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16);
  outline: none;
}

.terms-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 1rem 0;
  color: #475569;
}

.terms-row input {
  width: 18px;
  height: 18px;
  min-height: 18px;
}

.verification-note,
.form-alert {
  border-radius: 8px;
  padding: 0.85rem 1rem;
  font-weight: 750;
}

.verification-note {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.otp-label {
  display: grid;
}

.otp-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.6rem;
}

.otp-grid input {
  aspect-ratio: 1;
  padding: 0;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 900;
}

.form-alert.error {
  background: #fee2e2;
  color: #991b1b;
}

.form-alert.success {
  background: #dcfce7;
  color: #166534;
}

.submit-button,
.success-panel a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-weight: 850;
  text-decoration: none;
}

.submit-button:disabled,
.link-button:disabled {
  opacity: 0.65;
}

.link-button {
  width: 100%;
  margin-bottom: 1rem;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-weight: 850;
  text-decoration: underline;
}

.login-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  color: #64748b;
}

.login-row a {
  color: #2563eb;
  font-weight: 850;
}

.success-panel {
  display: grid;
  justify-items: center;
  gap: 0.85rem;
  text-align: center;
}

.success-mark {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #22c55e;
}

.success-panel h2 {
  margin: 0;
  color: #166534;
}

.success-panel p {
  margin: 0;
  color: #475569;
}

.register-card.is-loading {
  pointer-events: none;
}

@media (max-width: 760px) {
  .register-page {
    padding: 0;
    place-items: stretch;
  }

  .register-card {
    min-height: 100vh;
    border-radius: 0;
  }

  .register-card-header,
  .register-form,
  .success-panel {
    padding-inline: 1rem;
  }

  .role-section,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>
