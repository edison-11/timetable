# Email System Setup Guide - Resend Integration

## Overview

This guide shows how to set up and use the Resend email service with your Node.js/Express backend and Vue.js frontend. Resend is a modern cloud email API that doesn't require Docker or self-hosting.

**Benefits:**
- No Docker required
- No self-hosting infrastructure
- Simple API integration
- Professional HTML emails
- Built-in email templates
- Production-ready

---

## Part 1: Get Resend API Key (Windows 11)

### Step 1: Create Resend Account
1. Visit https://resend.com
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with your email or GitHub account
4. Verify your email address

### Step 2: Get API Key
1. After login, go to **Dashboard** → **API Keys** (or https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name it: `school-timetable` (or your project name)
4. Click **"Create"**
5. **Copy the API key** (it starts with `re_`)
   - ⚠️ **IMPORTANT:** Copy it immediately! You won't see it again.
   - Store it safely - it's like a password

### Step 3: Verify Sending Domain
For production, you'll need to verify a custom domain. For now, Resend provides a sandbox domain for testing.

To send to any email in production:
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `school-timetable.com`)
3. Follow the DNS verification steps

For testing/development: Resend provides `onboarding@resend.dev` for test emails.

---

## Part 2: Configure Your Application (Windows 11)

### Step 1: Update .env File
Edit `c:\Users\THE 1ST\Desktop\timetable\.env`:

```env
# Resend Email Service Configuration
RESEND_API_KEY=re_YOUR_API_KEY_HERE
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application Settings
APP_NAME=School Timetable
```

**Example with real values:**
```env
RESEND_API_KEY=re_abcdef123456789
RESEND_FROM_EMAIL=noreply@school-timetable.com
```

### Step 2: Verify Installation
Resend package is already installed. Verify with:

```powershell
cd "c:\Users\THE 1ST\Desktop\timetable"
npm list resend
```

Should output: `resend@[version]`

### Step 3: Start Your Server
```powershell
cd "c:\Users\THE 1ST\Desktop\timetable"
npm start
```

You should see: `Email service is ready` in logs

---

## Part 3: Backend API Endpoints

Your backend now has 3 email endpoints:

### 1. Send OTP Email
```http
POST /api/email/send-otp
Content-Type: application/json

{
  "to": "user@example.com",
  "code": "123456",
  "purpose": "registration",
  "expiresInMinutes": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "abc123xyz"
}
```

### 2. Send Notification Email
```http
POST /api/email/send-notification
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "to": "user@example.com",
  "title": "Class Scheduled",
  "message": "Your class has been scheduled for tomorrow at 10:00 AM",
  "actionUrl": "https://yoursite.com/class/123",
  "actionText": "View Class"
}
```

### 3. Send Custom HTML Email
```http
POST /api/email/send-custom
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Custom Email",
  "html": "<h1>Hello!</h1><p>This is a custom email.</p>"
}
```

### 4. Check Service Health
```http
GET /api/email/health
```

**Response:**
```json
{
  "service": "resend",
  "configured": true,
  "message": "Email service is ready"
}
```

---

## Part 4: Frontend Usage (Vue.js)

### Import the Email Service

In your Vue component:

```vue
<script>
import { 
  sendOtpEmail, 
  sendNotificationEmail, 
  sendCustomEmail,
  checkEmailServiceHealth 
} from '@/utils/emailService';

export default {
  methods: {
    async handleSendOtp() {
      const result = await sendOtpEmail(
        'user@example.com',
        '123456',
        'registration',
        5
      );
      
      if (result.success) {
        console.log('OTP sent successfully');
      } else {
        console.error('Error:', result.message);
      }
    }
  }
}
</script>
```

### Example: Registration with OTP

```vue
<template>
  <div class="register">
    <form @submit.prevent="handleRegister">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
    
    <div v-if="otpSent">
      <input v-model="otpCode" type="text" placeholder="Enter OTP" maxlength="6" />
      <button @click="verifyOtp">Verify OTP</button>
    </div>
  </div>
</template>

<script>
import { sendOtpEmail } from '@/utils/emailService';

export default {
  data() {
    return {
      email: '',
      password: '',
      otpCode: '',
      otpSent: false
    };
  },
  methods: {
    async handleRegister() {
      // Generate OTP (6-digit code)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send OTP email
      const result = await sendOtpEmail(this.email, code, 'registration');
      
      if (result.success) {
        this.otpSent = true;
        // Store code in session for verification
        sessionStorage.setItem('otpCode', code);
      } else {
        alert('Failed to send OTP: ' + result.message);
      }
    },
    
    async verifyOtp() {
      const storedCode = sessionStorage.getItem('otpCode');
      if (this.otpCode === storedCode) {
        // OTP verified, create account
        console.log('OTP verified!');
        // Call registration API...
      } else {
        alert('Invalid OTP');
      }
    }
  }
};
</script>
```

### Example: Send Notification Email

```vue
<script>
import { sendNotificationEmail } from '@/utils/emailService';

export default {
  methods: {
    async notifyTeacher() {
      const result = await sendNotificationEmail(
        'teacher@example.com',
        'Timetable Updated',
        'Your timetable for next week has been updated. Please review the changes.',
        'https://yoursite.com/timetable',
        'View Timetable'
      );
      
      if (result.success) {
        console.log('Notification sent!');
      }
    }
  }
};
</script>
```

---

## Part 5: Example: Integrating with Registration Flow

Update your `server/routes/auth.js` to use the new email service:

```javascript
const { sendOtpEmail } = require('../services/resendEmailService');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  // ... other validators
], async (req, res) => {
  try {
    // 1. Generate OTP code
    const otpCode = String(crypto.randomInt(100000, 1000000));
    
    // 2. Send OTP email
    const emailResult = await sendOtpEmail({
      to: req.body.email,
      code: otpCode,
      purpose: 'registration',
      expiresInMinutes: 5
    });
    
    if (!emailResult.success) {
      return res.status(503).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
    
    // 3. Store pending registration with OTP in memory/database
    pendingRegistrations.set(req.body.email, {
      ...req.body,
      otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // 4. Return success
    res.status(200).json({
      success: true,
      message: 'Verification email sent. Check your inbox.',
      requiresOtp: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
```

---

## Part 6: Testing (Windows 11 PowerShell)

### Test OTP Endpoint

```powershell
$body = @{
    to = "test@example.com"
    code = "123456"
    purpose = "registration"
    expiresInMinutes = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/email/send-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Test Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/email/health" `
  -Method GET | Select-Object -ExpandProperty Content
```

### Test with cURL

```powershell
curl -X POST http://localhost:5000/api/email/send-otp `
  -H "Content-Type: application/json" `
  -d '{
    "to": "test@example.com",
    "code": "123456",
    "purpose": "registration"
  }'
```

---

## Part 7: Email Templates

### Available Templates in Backend

1. **OTP Template** - For verification codes
   - Professional gradient header
   - Large, readable OTP display
   - Expiry information
   - Security warning

2. **Notification Template** - For alerts and updates
   - Title and message
   - Optional action button with URL
   - Clean, professional design

3. **Custom Template** - Raw HTML for custom designs
   - Full control over HTML/CSS
   - Perfect for custom notifications

All templates are fully responsive and mobile-friendly.

---

## Part 8: Environment Variables Reference

```env
# REQUIRED
RESEND_API_KEY=your_api_key_here

# OPTIONAL (defaults provided)
RESEND_FROM_EMAIL=noreply@yourdomain.com
APP_NAME=School Timetable
```

---

## Part 9: Common Issues & Solutions

### Issue: "Email OTP service is not configured"
**Solution:** Check `.env` file has `RESEND_API_KEY` set with valid value

### Issue: "Email service error: Invalid email address"
**Solution:** Ensure email format is valid (user@domain.com)

### Issue: Emails not arriving in development
**Solution:** Check spam/junk folder, verify email service health with `/api/email/health`

### Issue: "401 Unauthorized" on notification endpoints
**Solution:** Send `Authorization: Bearer YOUR_JWT_TOKEN` header for authenticated endpoints

### Issue: Custom domain emails not working
**Solution:** Verify domain in Resend dashboard and update `RESEND_FROM_EMAIL`

---

## Part 10: Production Checklist

- [ ] Create Resend account at https://resend.com
- [ ] Generate API key and store securely
- [ ] Update `.env` with API key and domain
- [ ] Verify custom domain in Resend dashboard
- [ ] Test email delivery with real domain
- [ ] Update `RESEND_FROM_EMAIL` to your domain
- [ ] Set `NODE_ENV=production` in deployment
- [ ] Enable rate limiting on email endpoints
- [ ] Monitor email delivery in Resend dashboard
- [ ] Set up email bounce/complaint handling (optional)

---

## Part 11: Next Steps

1. **View Example Component:** Navigate to `/email-examples` route to test sending emails
2. **Integrate with Registration:** Update auth routes to use OTP emails
3. **Send Notifications:** Use notification endpoint for class updates, alerts, etc.
4. **Monitor Delivery:** Check Resend dashboard for email logs and analytics

---

## Support Resources

- **Resend Docs:** https://resend.com/docs
- **Vue.js HTTP Guide:** https://axios-http.com
- **Express Email Endpoints:** See `/server/routes/email.js`
- **Frontend Service:** See `/client/src/utils/emailService.js`

---

**Happy emailing! 🚀**
