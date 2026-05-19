<template>
  <div class="email-example-container">
    <h1>Email Service Examples</h1>

    <!-- OTP Example -->
    <div class="example-section">
      <h2>1. Send OTP Email</h2>
      <div class="form-group">
        <label>Email Address</label>
        <input
          v-model="otpForm.email"
          type="email"
          placeholder="user@example.com"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label>OTP Code (6 digits)</label>
        <input
          v-model="otpForm.code"
          type="text"
          placeholder="123456"
          class="form-control"
          maxlength="6"
        />
      </div>
      <div class="form-group">
        <label>Purpose</label>
        <select v-model="otpForm.purpose" class="form-control">
          <option value="registration">Registration</option>
          <option value="reset">Password Reset</option>
        </select>
      </div>
      <button
        @click="sendOtpExample"
        :disabled="otpLoading"
        class="btn btn-primary"
      >
        {{ otpLoading ? 'Sending...' : 'Send OTP Email' }}
      </button>
      <div v-if="otpMessage" :class="['alert', otpMessage.success ? 'alert-success' : 'alert-danger']">
        {{ otpMessage.message }}
      </div>
    </div>

    <!-- Notification Example -->
    <div class="example-section">
      <h2>2. Send Notification Email</h2>
      <div class="form-group">
        <label>Email Address</label>
        <input
          v-model="notificationForm.email"
          type="email"
          placeholder="user@example.com"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label>Subject</label>
        <input
          v-model="notificationForm.title"
          type="text"
          placeholder="Email subject"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea
          v-model="notificationForm.message"
          placeholder="Email message"
          class="form-control"
          rows="4"
        ></textarea>
      </div>
      <div class="form-group">
        <label>Action URL (optional)</label>
        <input
          v-model="notificationForm.actionUrl"
          type="url"
          placeholder="https://example.com/action"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label>Button Text</label>
        <input
          v-model="notificationForm.actionText"
          type="text"
          placeholder="Click Here"
          class="form-control"
        />
      </div>
      <button
        @click="sendNotificationExample"
        :disabled="notificationLoading"
        class="btn btn-primary"
      >
        {{ notificationLoading ? 'Sending...' : 'Send Notification' }}
      </button>
      <div v-if="notificationMessage" :class="['alert', notificationMessage.success ? 'alert-success' : 'alert-danger']">
        {{ notificationMessage.message }}
      </div>
    </div>

    <!-- Service Health Check -->
    <div class="example-section">
      <h2>3. Check Email Service Status</h2>
      <button
        @click="checkServiceHealth"
        :disabled="healthLoading"
        class="btn btn-secondary"
      >
        {{ healthLoading ? 'Checking...' : 'Check Service Health' }}
      </button>
      <div v-if="healthStatus" class="status-box">
        <p><strong>Service:</strong> {{ healthStatus.service }}</p>
        <p><strong>Status:</strong> 
          <span :class="healthStatus.configured ? 'text-success' : 'text-danger'">
            {{ healthStatus.configured ? 'Configured ✓' : 'Not Configured ✗' }}
          </span>
        </p>
        <p><strong>Message:</strong> {{ healthStatus.message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { sendOtpEmail, sendNotificationEmail, checkEmailServiceHealth } from '@/utils/emailService';

export default {
  name: 'EmailExamples',
  data() {
    return {
      otpForm: {
        email: '',
        code: '',
        purpose: 'registration'
      },
      otpLoading: false,
      otpMessage: null,

      notificationForm: {
        email: '',
        title: '',
        message: '',
        actionUrl: '',
        actionText: 'View Details'
      },
      notificationLoading: false,
      notificationMessage: null,

      healthLoading: false,
      healthStatus: null
    };
  },
  methods: {
    async sendOtpExample() {
      if (!this.otpForm.email || !this.otpForm.code) {
        this.otpMessage = {
          success: false,
          message: 'Please fill in all required fields'
        };
        return;
      }

      this.otpLoading = true;
      const result = await sendOtpEmail(
        this.otpForm.email,
        this.otpForm.code,
        this.otpForm.purpose
      );
      this.otpMessage = result;
      this.otpLoading = false;

      if (result.success) {
        // Clear form on success
        this.otpForm = { email: '', code: '', purpose: 'registration' };
      }
    },

    async sendNotificationExample() {
      if (!this.notificationForm.email || !this.notificationForm.title || !this.notificationForm.message) {
        this.notificationMessage = {
          success: false,
          message: 'Please fill in all required fields'
        };
        return;
      }

      this.notificationLoading = true;
      const result = await sendNotificationEmail(
        this.notificationForm.email,
        this.notificationForm.title,
        this.notificationForm.message,
        this.notificationForm.actionUrl || null,
        this.notificationForm.actionText
      );
      this.notificationMessage = result;
      this.notificationLoading = false;

      if (result.success) {
        // Clear form on success
        this.notificationForm = {
          email: '',
          title: '',
          message: '',
          actionUrl: '',
          actionText: 'View Details'
        };
      }
    },

    async checkServiceHealth() {
      this.healthLoading = true;
      const status = await checkEmailServiceHealth();
      this.healthStatus = status;
      this.healthLoading = false;
    }
  },
  mounted() {
    // Check service health on component load
    this.checkServiceHealth();
  }
};
</script>

<style scoped>
.email-example-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  color: #1e293b;
  margin-bottom: 30px;
  border-bottom: 3px solid #667eea;
  padding-bottom: 10px;
}

h2 {
  color: #334155;
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 20px;
}

.example-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #334155;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #475569;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 14px;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alert-danger {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.status-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  margin-top: 12px;
  font-size: 14px;
}

.status-box p {
  margin: 8px 0;
}

.text-success {
  color: #10b981;
  font-weight: 600;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}
</style>
