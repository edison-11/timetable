# 📧 Email Verification System - Complete Guide

## Overview

This is a complete email verification system using:
- **Backend**: Node.js Express + Resend email service
- **Frontend**: Vue.js component
- **OTP Storage**: In-memory with automatic expiration (5 minutes)

## 🚀 Quick Start (5 minutes)

### Prerequisites
```
✅ Backend running on port 5000
✅ Resend API key configured in .env
✅ Frontend Vue.js app
```

### Backend Files
```
server/
  ├── services/
  │   ├── otpService.js          ← OTP generation & verification
  │   └── resendEmailService.js   ← Email sending
  └── routes/
      └── email.js               ← API endpoints
```

### Frontend Files
```
client/src/
  └── components/
      └── EmailVerification.vue   ← Complete component
```

---

## 📡 API Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/email/send-otp`

**Request:**
```json
{
  "to": "user@example.com",
  "purpose": "registration",
  "expiresInMinutes": 5
}
```

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `to` | string | Yes | - | User's email address |
| `purpose` | string | No | `registration` | registration, password_reset, email_verification |
| `expiresInMinutes` | number | No | `5` | OTP validity in minutes (1-60) |

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "88ec93e8-64f2-42ee-a101-9eb9efd4e153",
  "expiresIn": 300
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**Response (Service Unavailable - 503):**
```json
{
  "success": false,
  "message": "Email service is not configured"
}
```

---

### 2. Verify OTP
**Endpoint:** `POST /api/email/verify-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Parameters:**
| Name | Type | Required | Format | Description |
|------|------|----------|--------|-------------|
| `email` | string | Yes | email | User's email address |
| `code` | string | Yes | 6 digits | The OTP code to verify |

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true
}
```

**Response (Invalid OTP - 429):**
```json
{
  "success": false,
  "message": "Invalid OTP. 3 attempts remaining.",
  "shouldRetry": false
}
```

**Response (Expired OTP - 400):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new code.",
  "shouldRetry": true
}
```

---

### 3. Check OTP Status
**Endpoint:** `GET /api/email/otp-status/:email`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `email` | string | Yes | User's email address (URL encoded) |

**Response:**
```json
{
  "hasPending": true,
  "remainingSeconds": 245
}
```

---

## 🎨 Frontend Usage

### Basic Implementation

```vue
<template>
  <div>
    <EmailVerification
      purpose="registration"
      @verified="handleVerificationSuccess"
      @error="handleVerificationError"
    />
  </div>
</template>

<script>
import EmailVerification from '@/components/EmailVerification.vue'

export default {
  components: {
    EmailVerification
  },
  methods: {
    handleVerificationSuccess(data) {
      console.log('Email verified:', data.email)
      // Redirect to next step or update user profile
    },
    handleVerificationError(error) {
      console.error('Verification failed:', error.message)
    }
  }
}
</script>
```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `purpose` | string | `registration` | registration, password_reset, email_verification |
| `onVerificationSuccess` | function | null | Callback function on successful verification |

### Component Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@verified` | `{ email, purpose }` | Emitted when OTP is successfully verified |
| `@error` | `{ error, message }` | Emitted when verification fails |

---

## 📝 Backend Implementation Details

### OTP Service (`otpService.js`)

The OTP service handles:
- **Generation**: Creates random 6-digit codes
- **Storage**: In-memory dictionary with expiration times
- **Verification**: Checks code validity with attempt limits (5 max)
- **Cleanup**: Automatically removes expired OTPs every 5 minutes

#### Key Functions

```javascript
// Generate a random 6-digit OTP
const code = generateOTP();
// Returns: "123456"

// Store OTP for email (expires in 5 minutes)
const code = storeOTP("user@example.com", 5);

// Verify OTP
const result = verifyOTP("user@example.com", "123456");
// Returns: { success: boolean, message: string, shouldRetry: boolean }

// Check if email has pending OTP
const hasPending = hasPendingOTP("user@example.com");
// Returns: true | false

// Get remaining time in seconds
const seconds = getRemainingTime("user@example.com");
// Returns: 240 (or null if no pending OTP)

// Clean up expired OTPs (runs automatically every 5 minutes)
cleanupExpiredOTPs();
```

---

## 🔄 Complete Flow Example

### Step 1: Frontend Requests OTP
```javascript
// EmailVerification.vue
const response = await axios.post('/api/email/send-otp', {
  to: 'user@example.com',
  purpose: 'registration'
})
```

**Backend:**
```javascript
// routes/email.js - POST /send-otp
const otpCode = storeOTP(email, expiresInMinutes)  // "123456"
await sendOtpEmail({ to: email, code: otpCode })  // Send via Resend
return { success: true, messageId: "...", expiresIn: 300 }
```

### Step 2: Backend Sends Email
```javascript
// services/resendEmailService.js
await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'user@example.com',
  subject: 'Your School Timetable Verification Code',
  html: `<h1>123456</h1>`  // 6-digit code
})
```

### Step 3: User Enters OTP
```javascript
// EmailVerification.vue
const response = await axios.post('/api/email/verify-otp', {
  email: 'user@example.com',
  code: '123456'  // From email
})
```

**Backend:**
```javascript
// routes/email.js - POST /verify-otp
const result = verifyOTP(email, code)
if (result.success) {
  // Delete OTP from storage
  return { success: true }
}
```

---

## 🛡️ Security Features

### 1. Attempt Limiting
- Max 5 failed attempts per OTP
- After 5 attempts, OTP is deleted

### 2. Time Expiration
- OTP expires after 5 minutes (configurable)
- Automatic cleanup every 5 minutes

### 3. Email Validation
- Email format validation on all endpoints
- OTP code must be exactly 6 digits

### 4. No API Key Exposure
- All logic on backend
- Frontend cannot directly send emails
- API keys in `.env` only

---

## 🧪 Testing

### Using cURL

**Send OTP:**
```bash
curl -X POST http://localhost:5000/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "purpose": "registration"
  }'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:5000/api/email/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

**Check Status:**
```bash
curl http://localhost:5000/api/email/otp-status/test@example.com
```

### Using PowerShell

```powershell
$body = @{
  to = "test@example.com"
  purpose = "registration"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/email/send-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Customize OTP Expiration
```javascript
// In email.js - send-otp endpoint
const expiresInMinutes = req.body.expiresInMinutes || 5  // Default 5 minutes
```

### Customize Cleanup Interval
```javascript
// In otpService.js
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000)  // Change to your interval
```

---

## 📊 Database Integration (Optional)

For production, replace in-memory storage with database:

```javascript
// otpService.js
const db = require('./database')

const storeOTP = async (email, expiresInMinutes = 5) => {
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)
  
  await db('otp_codes').insert({
    email,
    code,
    expiresAt,
    attempts: 0
  })
  
  return code
}

const verifyOTP = async (email, code) => {
  const otpData = await db('otp_codes')
    .where({ email })
    .first()
  
  if (!otpData || new Date() > new Date(otpData.expiresAt)) {
    return { success: false, shouldRetry: true }
  }
  
  if (code !== otpData.code) {
    await db('otp_codes')
      .where({ email })
      .update({ attempts: otpData.attempts + 1 })
    
    return { success: false, shouldRetry: false }
  }
  
  await db('otp_codes').where({ email }).del()
  return { success: true }
}
```

---

## 🚀 Production Checklist

- [ ] API keys in `.env` (not committed)
- [ ] HTTPS enabled
- [ ] Rate limiting on email endpoints
- [ ] Database for OTP storage (not in-memory)
- [ ] Email domain verified in Resend
- [ ] Error logging configured
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] Test all scenarios:
  - [ ] Valid OTP verification
  - [ ] Expired OTP
  - [ ] Invalid OTP
  - [ ] Too many attempts
  - [ ] Resend during countdown

---

## 📚 Related Files

- **OTP Service**: [server/services/otpService.js](../server/services/otpService.js)
- **Email Routes**: [server/routes/email.js](../server/routes/email.js)
- **Email Service**: [server/services/resendEmailService.js](../server/services/resendEmailService.js)
- **Vue Component**: [client/src/components/EmailVerification.vue](../client/src/components/EmailVerification.vue)
- **Email Setup**: [EMAIL_SYSTEM_README.md](./EMAIL_SYSTEM_README.md)

---

## ❓ FAQ

**Q: Can I change the OTP expiration time?**
A: Yes! Pass `expiresInMinutes` in the request (1-60 minutes).

**Q: What happens after 5 failed attempts?**
A: The OTP is deleted and the user must request a new code.

**Q: Can users resend the OTP?**
A: Yes! The component shows a "Resend Code" button after 30 seconds.

**Q: Where is the OTP stored?**
A: Currently in-memory (fast, no database needed). See "Database Integration" section for persistence.

**Q: Is this secure?**
A: Yes! OTP codes are never exposed to frontend, time-limited, and attempt-limited.

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email service is not configured" | Check `RESEND_API_KEY` in `.env` |
| Email not received | Check email in verified recipients on Resend |
| OTP always invalid | Check server logs for OTP generation |
| Can't verify after expiry | User must request new code |
| Component not showing | Check Vue component import and registration |

---

**Last Updated:** May 2026
**Version:** 1.0.0
