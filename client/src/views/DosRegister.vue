<template>
  <div class="dos-register-page">
    <section class="register-panel">
      <div class="panel-heading">
        <img :src="logoUrl" alt="Timetable logo">
        <div>
          <h1>Director of Studies Registration</h1>
          <p>Submit your school for platform verification.</p>
        </div>
      </div>

      <form v-if="!submitted" class="dos-form" @submit.prevent="submitRegistration">
        <div class="form-grid">
          <label>
            <span>Full Name</span>
            <input v-model.trim="form.full_name" required type="text">
          </label>
          <label>
            <span>School Name</span>
            <input v-model.trim="form.school_name" required type="text">
          </label>
          <label>
            <span>School Code</span>
            <input v-model.trim="form.school_code" type="text">
          </label>
          <label>
            <span>School Email</span>
            <input v-model.trim="form.school_email" required type="email">
          </label>
          <label>
            <span>Phone Number</span>
            <input v-model.trim="form.phone" required type="tel">
          </label>
          <label>
            <span>National ID</span>
            <input v-model.trim="form.national_id" required type="text">
          </label>
          <label>
            <span>School Registration Number</span>
            <input v-model.trim="form.registration_number" required type="text">
          </label>
          <label>
            <span>School Type</span>
            <select v-model="form.school_type">
              <option value="">Select type</option>
              <option>Public</option>
              <option>Private</option>
              <option>Government Aided</option>
              <option>International</option>
            </select>
          </label>
          <label>
            <span>Province</span>
            <input v-model.trim="form.province" type="text">
          </label>
          <label>
            <span>District</span>
            <input v-model.trim="form.district" type="text">
          </label>
          <label>
            <span>Sector</span>
            <input v-model.trim="form.sector" type="text">
          </label>
          <label class="wide">
            <span>School Address</span>
            <textarea v-model.trim="form.school_address" required rows="3"></textarea>
          </label>
          <label>
            <span>Password</span>
            <input v-model="form.password" required type="password">
          </label>
          <label>
            <span>Confirm Password</span>
            <input v-model="form.confirmPassword" required type="password">
          </label>
          <label class="wide">
            <span>Profile Photo</span>
            <input required type="file" accept="image/*" @change="handlePhotoChange">
          </label>
        </div>

        <p v-if="message" class="form-message" :class="{ error: hasError }">{{ message }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Submit Registration' }}
        </button>
      </form>

      <div v-else class="success-panel">
        <strong>Registration Submitted</strong>
        <p>Your registration has been submitted successfully and is waiting for system administrator approval.</p>
        <router-link to="/login">Return to Login</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/stores/api'

const logoUrl = `${import.meta.env.BASE_URL}timetable-logo.png`
const loading = ref(false)
const submitted = ref(false)
const message = ref('')
const hasError = ref(false)
const selectedPhoto = ref(null)

const form = ref({
  full_name: '',
  school_name: '',
  school_code: '',
  school_email: '',
  phone: '',
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

const handlePhotoChange = (event) => {
  selectedPhoto.value = event.target.files?.[0] || null
  form.value.profile_photo = ''
}

const validate = () => {
  if (form.value.password !== form.value.confirmPassword) return 'Passwords do not match.'
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.value.password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
  }
  if (!selectedPhoto.value && !form.value.profile_photo) return 'Profile photo is required.'
  return ''
}

const uploadPhoto = async () => {
  if (!selectedPhoto.value) return form.value.profile_photo
  const payload = new FormData()
  payload.append('photo', selectedPhoto.value)
  const response = await api.post('/upload/registration-photo', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data.photo?.path || ''
}

const submitRegistration = async () => {
  message.value = validate()
  hasError.value = Boolean(message.value)
  if (hasError.value) return

  loading.value = true
  try {
    form.value.profile_photo = await uploadPhoto()
    const response = await api.post('/schools/dos-register', form.value)
    message.value = response.data.message
    hasError.value = false
    submitted.value = true
  } catch (error) {
    message.value = error.response?.data?.message || 'Registration failed.'
    hasError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dos-register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #eef6ff, #f8fafc);
}

.register-panel {
  width: min(920px, 100%);
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.14);
  padding: 1.5rem;
}

.panel-heading {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.panel-heading img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.panel-heading h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.panel-heading p {
  margin: 0.2rem 0 0;
  color: #64748b;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-weight: 750;
}

.wide {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  font: inherit;
}

button,
.success-panel a {
  display: inline-flex;
  justify-content: center;
  margin-top: 1.25rem;
  border: 0;
  border-radius: 8px;
  padding: 0.8rem 1.1rem;
  background: #2563eb;
  color: #fff;
  font-weight: 850;
  text-decoration: none;
}

button:disabled {
  opacity: 0.65;
}

.form-message {
  margin: 1rem 0 0;
  color: #15803d;
  font-weight: 750;
}

.form-message.error {
  color: #dc2626;
}

.success-panel {
  padding: 2rem 1rem;
  text-align: center;
}

.success-panel strong {
  display: block;
  color: #15803d;
  font-size: 1.5rem;
}

.success-panel p {
  margin: 0.75rem auto 0;
  max-width: 560px;
  color: #475569;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
