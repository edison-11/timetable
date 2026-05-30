<template>
  <div class="email-verification-container">
    <div class="verification-card">
      <h2 class="verification-title">Email Verification</h2>

      <!-- Step 1: Email Input -->
      <div v-if="!otpSent" class="verification-step">
        <p class="step-description">Enter your email address to receive a verification code</p>

        <form @submit.prevent="sendOTP">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="your@email.com"
              required
              :disabled="isLoading"
            />
          </div>

          <div v-if="purpose" class="form-group">
            <label for="purpose" class="form-label">Purpose</label>
            <select
              id="purpose"
              v-model="purpose"
              class="form-input"
              :disabled="isLoading"
            >
              <option value="registration">Registration</option>
              <option value="password_reset">Password Reset</option>
              <option value="email_verification">Email Verification</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            {{ isLoading ? 'Sending...' : 'Send Verification Code' }}
          </button>
        </form>

        <p v-if="errorMessage" class="error-message">
          <strong>Error:</strong> {{ errorMessage }}
        </p>
      </div>

      <!-- Step 2: OTP Verification -->
      <div v-else class="verification-step">
        <div class="step-header">
          <h3 class="step-title">Enter Verification Code</h3>
          <button class="btn-text" @click="goBack" :disabled="isLoading">
            ← Change Email
          </button>
        </div>

        <p class="step-description">
          A 6-digit code has been sent to <strong>{{ email }}</strong>
        </p>

        <form @submit.prevent="verifyOTP">
          <div class="form-group">
            <label for="otp" class="form-label">Verification Code</label>
            <input
              id="otp"
              v-model="otpCode"
              type="text"
              class="form-input otp-input"
              placeholder="000000"
              maxlength="6"
              inputmode="numeric"
              required
              :disabled="isLoading"
              @input="formatOTPInput"
            />
            <p class="otp-hint">Enter the 6-digit code from your email</p>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            {{ isLoading ? 'Verifying...' : 'Verify Code' }}
          </button>
        </form>

        <!-- Countdown Timer -->
        <div class="otp-timer">
          <p v-if="countdown > 0" class="timer-text">
            Code expires in <strong>{{ formatTime(countdown) }}</strong>
          </p>
          <p v-else class="timer-expired">Code has expired</p>
        </div>

        <!-- Resend OTP -->
        <div class="otp-resend">
          <p v-if="countdown > 30" class="resend-wait">
            Resend code in {{ formatTime(countdown - 30) }}
          </p>
          <button
            v-else
            type="button"
            class="btn btn-secondary"
            @click="resendOTP"
            :disabled="isLoading"
          >
            {{ countdown > 0 ? 'Resend Code' : 'Request New Code' }}
          </button>
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" class="error-message">
          <strong>Error:</strong> {{ errorMessage }}
        </p>

        <!-- Remaining Attempts -->
        <p v-if="showAttemptWarning" class="warning-message">
          ⚠️ {{ attemptsRemaining }} attempts remaining
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="isVerified" class="success-message">
        <p class="success-icon">✓</p>
        <p class="success-text">Email verified successfully!</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/stores/api'
import { notifySuccess, notifyWarning } from '@/utils/notify'

export default {
  name: 'EmailVerification',
  props: {
    purpose: {
      type: String,
      default: 'registration',
      validator: (value) => ['registration', 'password_reset', 'email_verification'].includes(value)
    },
    onVerificationSuccess: {
      type: Function,
      default: null
    }
  },
  emits: ['verified', 'error'],
  data() {
    return {
      email: '',
      otpCode: '',
      otpSent: false,
      isLoading: false,
      isVerified: false,
      errorMessage: '',
      countdown: 0,
      countdownInterval: null,
      attemptsRemaining: 5,
      showAttemptWarning: false,
      API_URL: this.getApiBaseUrl()
    }
  },
  watch: {
    countdown(newVal) {
      if (newVal === 0 && this.otpSent) {
        this.clearCountdown()
      }
    }
  },
  mounted() {
    console.log('📧 Email Verification Component Mounted')
  },
  beforeUnmount() {
    this.clearCountdown()
  },
  methods: {
    getApiBaseUrl() {
      const configuredUrl = import.meta.env?.VITE_API_URL
      if (configuredUrl) return configuredUrl

      const { hostname, port, protocol } = window.location
      if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '5000') {
        return `${protocol}//${hostname}:5000/api`
      }

      return '/api'
    },

    /**
     * Send OTP to user's email
     */
    async sendOTP() {
      if (!this.email) {
        this.errorMessage = 'Please enter your email address'
        notifyWarning(this.errorMessage)
        return
      }

      this.isLoading = true
      this.errorMessage = ''

      try {
        const response = await api.post('/email/send-otp', {
          to: this.email,
          purpose: this.purpose,
          expiresInMinutes: 5
        })

        if (response.data.success) {
          this.otpSent = true
          this.startCountdown(response.data.expiresIn || 300)
          notifySuccess(response.data.message || 'Verification code sent.')
          console.log('✅ OTP sent successfully')
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to send OTP. Please try again.'
        this.errorMessage = message
        console.error('❌ Error sending OTP:', error)
        this.$emit('error', { error, message })
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Verify OTP code
     */
    async verifyOTP() {
      if (!this.otpCode || this.otpCode.length !== 6) {
        this.errorMessage = 'Please enter a valid 6-digit code'
        notifyWarning(this.errorMessage)
        return
      }

      this.isLoading = true
      this.errorMessage = ''
      this.showAttemptWarning = false

      try {
        const response = await api.post('/email/verify-otp', {
          email: this.email,
          code: this.otpCode
        })

        if (response.data.success) {
          this.isVerified = true
          this.clearCountdown()
          notifySuccess(response.data.message || 'Email verified successfully.')
          console.log('✅ Email verified successfully')
          this.$emit('verified', { email: this.email, purpose: this.purpose })

          if (this.onVerificationSuccess) {
            this.onVerificationSuccess({ email: this.email })
          }
        }
      } catch (error) {
        const data = error.response?.data || {}
        const message = data.message || 'Failed to verify OTP. Please try again.'

        this.errorMessage = message
        this.attemptsRemaining = message.includes('attempts remaining')
          ? parseInt(message.match(/\d+/)?.[0]) || 5
          : 5

        if (this.attemptsRemaining <= 3 && this.attemptsRemaining > 0) {
          this.showAttemptWarning = true
        }

        console.error('❌ Error verifying OTP:', error)
        this.$emit('error', { error, message })
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Resend OTP
     */
    async resendOTP() {
      this.otpCode = ''
      this.errorMessage = ''
      await this.sendOTP()
    },

    /**
     * Go back to email input
     */
    goBack() {
      this.otpSent = false
      this.otpCode = ''
      this.errorMessage = ''
      this.isVerified = false
      this.clearCountdown()
      this.attemptsRemaining = 5
      this.showAttemptWarning = false
    },

    /**
     * Start countdown timer
     */
    startCountdown(seconds) {
      this.countdown = seconds
      this.clearCountdown()

      this.countdownInterval = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.clearCountdown()
        }
      }, 1000)
    },

    /**
     * Clear countdown timer
     */
    clearCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
      }
    },

    /**
     * Format seconds to MM:SS
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    /**
     * Format OTP input to only accept digits
     */
    formatOTPInput(event) {
      const value = event.target.value.replace(/\D/g, '')
      this.otpCode = value.slice(0, 6)
    }
  }
}
</script>

<style scoped>
.email-verification-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.verification-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  max-width: 500px;
  width: 100%;
}

.verification-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 30px;
  text-align: center;
}

.verification-step {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.step-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.step-description {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.otp-input {
  font-size: 32px;
  letter-spacing: 10px;
  text-align: center;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.otp-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 8px 0 0;
}

.btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #667eea;
  margin-top: 16px;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 0;
  transition: color 0.2s ease;
}

.btn-text:hover:not(:disabled) {
  color: #764ba2;
}

.btn-text:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #dc2626;
  font-size: 13px;
  margin: 16px 0 0;
  padding: 12px;
  background: #fee2e2;
  border-radius: 6px;
  border-left: 3px solid #dc2626;
}

.warning-message {
  color: #d97706;
  font-size: 13px;
  margin: 16px 0 0;
  padding: 12px;
  background: #fef3c7;
  border-radius: 6px;
  border-left: 3px solid #d97706;
}

.otp-timer {
  margin-top: 16px;
  text-align: center;
}

.timer-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.timer-expired {
  font-size: 13px;
  color: #dc2626;
  margin: 0;
  font-weight: 600;
}

.otp-resend {
  margin-top: 12px;
  text-align: center;
}

.resend-wait {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.success-message {
  text-align: center;
  padding: 20px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 2px solid #86efac;
}

.success-icon {
  font-size: 48px;
  margin: 0 0 12px;
}

.success-text {
  font-size: 16px;
  font-weight: 600;
  color: #16a34a;
  margin: 0;
}

@media (max-width: 480px) {
  .verification-card {
    padding: 24px;
  }

  .verification-title {
    font-size: 24px;
  }

  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .btn-text {
    width: 100%;
    text-align: left;
  }
}
</style>
