<template>
  <div class="login-page min-vh-100 d-flex align-items-center justify-content-center p-3">
    <div class="login-card w-100" :class="{ 'is-loading': loading }">
      <div class="login-card-header">
        <div class="brand-login-mark">
          <img class="brand-login-logo" :src="logoUrl" alt="School logo" />
        </div>
        <h1 class="auth-title mb-0">Timetable Management System</h1>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="login-field">
          <label for="email" class="form-label">Username or Email</label>
          <div class="login-input-wrap">
            <span class="login-input-icon user-icon" aria-hidden="true"></span>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              required
              class="form-control"
              placeholder="Enter your username or email..."
              :class="{ 'is-invalid': emailError }"
              autocomplete="username"
            />
          </div>
          <div v-if="emailError" class="invalid-feedback d-block mt-1">
            {{ emailError }}
          </div>
        </div>

        <div class="login-field">
          <label for="password" class="form-label">Password</label>

          <div class="login-input-wrap">
            <span class="login-input-icon lock-icon" aria-hidden="true"></span>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="form-control"
              placeholder="Enter your password..."
              :class="{ 'is-invalid': passwordError }"
              autocomplete="current-password"
            />

            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              <span class="eye-icon" :class="{ open: !showPassword }" aria-hidden="true"></span>
            </button>
          </div>

          <div v-if="passwordError" class="invalid-feedback d-block mt-1">
            {{ passwordError }}
          </div>
        </div>

        <div class="login-options">
          <label class="d-flex align-items-center gap-2 mb-0 remember-row">
            <input type="checkbox" v-model="rememberMe" class="remember-check" />
            <span>Remember Me</span>
          </label>

          <router-link to="/forgot-password" class="forgot-link">
            Forgot Password?
          </router-link>
        </div>

        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn btn-primary-custom login-submit w-100"
        >
          <span v-if="loading" class="d-flex align-items-center justify-content-center gap-2">
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Signing in...
          </span>
          <span v-else>Log In</span>
        </button>

        <div v-if="success" class="text-success small fw-semibold mt-2 text-center">
          {{ success }}
        </div>

        <div class="login-divider"><span>or</span></div>

        <div class="provider-row">
          <button type="button" class="provider-btn" disabled>
            <span class="google-mark" aria-hidden="true">G</span>
            Login with Google
          </button>
          <button type="button" class="provider-btn" disabled>
            <span class="microsoft-mark" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </span>
            Login with Microsoft
          </button>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const logoUrl = `${import.meta.env.BASE_URL}title-logo.png`

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
    const payload = { ...form.value, rememberMe: rememberMe.value }

    const result = await authStore.login(payload)

    if (result?.success) {
      success.value = 'Login successful. Redirecting...'

      const userType = result.userType || result.user?.role
      if (userType === 'teacher') {
        await router.push('/teacher/dashboard')
      } else if (userType === 'student') {
        await router.push('/student/dashboard')
      } else {
        await router.push(result.redirectTo || '/dashboard')
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
.login-page {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.56), rgba(248, 250, 252, 0.28) 42%, rgba(255, 255, 255, 0.78)),
    linear-gradient(180deg, rgba(226, 232, 240, 0.5), rgba(255, 255, 255, 0.36)),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23dfe6ee'/%3E%3Crect y='520' width='1200' height='380' fill='%23bd9a73'/%3E%3Cpath d='M0 710h1200v190H0z' fill='%23d7b58a'/%3E%3Cpath d='M0 548h1200' stroke='%23a57d58' stroke-width='8' opacity='.35'/%3E%3Crect x='70' y='58' width='250' height='430' rx='8' fill='%23eef3f8' opacity='.72'/%3E%3Crect x='360' y='58' width='250' height='430' rx='8' fill='%23f7f9fb' opacity='.72'/%3E%3Crect x='650' y='58' width='250' height='430' rx='8' fill='%23eef3f8' opacity='.76'/%3E%3Crect x='940' y='58' width='250' height='430' rx='8' fill='%23f7f9fb' opacity='.72'/%3E%3Cellipse cx='180' cy='742' rx='260' ry='58' fill='%23445563' opacity='.18'/%3E%3Crect x='-20' y='664' width='410' height='104' rx='10' fill='%23f0f5f9' transform='rotate(-10 -20 664)'/%3E%3Cpath d='M820 510c90-70 205-44 265 16v130H820z' fill='%2398b96f' opacity='.6'/%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.login-card {
  position: relative;
  z-index: 1;
  max-width: 580px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.34);
}

.login-card-header {
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

.login-form {
  padding: 36px 46px 32px;
}

.login-field {
  margin-bottom: 22px;
}

.login-field .form-label {
  display: block;
  margin-bottom: 9px;
  color: #253246;
  font-size: 1.1rem;
  font-weight: 800;
}

.login-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login-input-icon {
  position: absolute;
  left: 18px;
  z-index: 2;
  width: 28px;
  height: 30px;
  color: #5e6875;
}

.user-icon::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: currentColor;
}

.user-icon::after {
  content: '';
  position: absolute;
  left: 3px;
  bottom: 1px;
  width: 23px;
  height: 14px;
  border-radius: 14px 14px 3px 3px;
  background: currentColor;
}

.lock-icon::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 1px;
  width: 14px;
  height: 15px;
  border: 4px solid currentColor;
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
}

.lock-icon::after {
  content: '';
  position: absolute;
  left: 3px;
  bottom: 1px;
  width: 23px;
  height: 18px;
  border-radius: 4px;
  background: currentColor;
}

.login-input-wrap .form-control {
  min-height: 52px;
  padding: 0.85rem 4.1rem 0.85rem 4.35rem;
  border: 1px solid #b9c2cd !important;
  border-radius: 5px !important;
  background: rgba(255, 255, 255, 0.88) !important;
  color: #263244;
  font-size: 1.05rem;
  box-shadow: inset 0 1px 1px rgba(15, 23, 42, 0.06), 0 2px 5px rgba(15, 23, 42, 0.08);
}

.login-input-wrap .form-control::placeholder {
  color: #677281;
}

.login-input-wrap .form-control:focus {
  border-color: #2f7cd8 !important;
  box-shadow: 0 0 0 4px rgba(47, 124, 216, 0.16), 0 2px 5px rgba(15, 23, 42, 0.08) !important;
}

.password-toggle {
  position: absolute;
  right: 10px;
  z-index: 3;
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.eye-icon {
  position: relative;
  width: 28px;
  height: 18px;
  border: 4px solid #3d4550;
  border-radius: 50%;
  transform: rotate(-6deg);
}

.eye-icon::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3d4550;
  transform: translate(-50%, -50%);
}

.eye-icon:not(.open)::after {
  content: '';
  position: absolute;
  left: -3px;
  right: -3px;
  top: 5px;
  height: 4px;
  background: #3d4550;
  transform: rotate(32deg);
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 8px 0 22px;
  color: #2f3a49;
  font-size: 1rem;
  font-weight: 750;
}

.remember-row {
  user-select: none;
}

.remember-check {
  width: 22px;
  height: 22px;
  margin: 0;
  border-radius: 4px !important;
}

.forgot-link,
.create-row a {
  color: #1f72c9;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.btn-primary-custom.login-submit {
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

.btn-primary-custom.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(3, 105, 214, 0.28);
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0 20px;
  color: #323b49;
  font-size: 1.2rem;
  font-weight: 850;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #c3cbd5;
}

.provider-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
}

.provider-btn {
  min-height: 54px;
  margin: 0;
  border: 1px solid #bdc6d1;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.82);
  color: #263244;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.09);
  opacity: 1;
}

.google-mark {
  color: #4285f4;
  font-size: 1.9rem;
  font-weight: 900;
  font-family: Arial, sans-serif;
  line-height: 1;
}

.microsoft-mark {
  display: grid;
  grid-template-columns: repeat(2, 12px);
  grid-template-rows: repeat(2, 12px);
  gap: 3px;
  flex: 0 0 auto;
}

.microsoft-mark span:nth-child(1) { background: #f1511b; }
.microsoft-mark span:nth-child(2) { background: #80cc28; }
.microsoft-mark span:nth-child(3) { background: #00adef; }
.microsoft-mark span:nth-child(4) { background: #fbbc09; }

.create-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 18px;
  border-top: 1px solid #d3dae2;
  color: #6c7582;
  font-size: 1.12rem;
  font-weight: 700;
}

.login-card.is-loading {
  pointer-events: none;
}

@media (max-width: 576px) {
  .login-card-header {
    padding: 24px;
    gap: 12px;
  }

  .brand-login-mark {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
  }

  .login-form {
    padding: 28px 22px 26px;
  }

  .login-options {
    align-items: flex-start;
    flex-direction: column;
  }

  .provider-row {
    grid-template-columns: 1fr;
  }

  .create-row {
    flex-wrap: wrap;
  }
}
</style>
