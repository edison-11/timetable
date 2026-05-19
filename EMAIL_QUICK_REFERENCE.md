# Email System - Quick Reference

## 1. Setup (5 minutes)

```bash
# 1. Install Resend (already done)
npm install resend

# 2. Update .env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# 3. Restart server
npm start
```

---

## 2. Backend Usage

### Import the service
```javascript
const { sendOtpEmail, sendNotificationEmail, sendCustomEmail } = 
  require('../services/resendEmailService');
```

### Send OTP in registration
```javascript
const result = await sendOtpEmail({
  to: 'user@example.com',
  code: '123456',
  purpose: 'registration',
  expiresInMinutes: 5
});

if (result.success) {
  console.log('Email sent!');
} else {
  console.error('Error:', result.message);
}
```

### Send notification
```javascript
const result = await sendNotificationEmail({
  to: 'teacher@example.com',
  title: 'Timetable Updated',
  message: 'Your timetable has been updated for next week.',
  actionUrl: 'https://yoursite.com/timetable',
  actionText: 'View Timetable'
});
```

### Send custom HTML
```javascript
const result = await sendCustomEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome</h1><p>Thanks for joining!</p>'
});
```

---

## 3. Frontend Usage (Vue.js)

### Import service
```vue
<script>
import { sendOtpEmail, sendNotificationEmail } from '@/utils/emailService';

export default {
  methods: {
    async handleOtp() {
      const result = await sendOtpEmail(
        'user@example.com',
        '123456',
        'registration'
      );
      
      if (result.success) {
        console.log('OTP sent!');
      }
    }
  }
}
</script>
```

---

## 4. API Endpoints

### POST /api/email/send-otp
```javascript
{
  "to": "user@example.com",
  "code": "123456",
  "purpose": "registration",
  "expiresInMinutes": 5
}
```

### POST /api/email/send-notification (auth required)
```javascript
{
  "to": "user@example.com",
  "title": "Subject Line",
  "message": "Email body text",
  "actionUrl": "https://yoursite.com",
  "actionText": "Click Here"
}
```

### POST /api/email/send-custom (auth required)
```javascript
{
  "to": "user@example.com",
  "subject": "Subject Line",
  "html": "<h1>Hello</h1>"
}
```

### GET /api/email/health
Returns: `{ service: 'resend', configured: true, message: '...' }`

---

## 5. Common Tasks

### Generate OTP code
```javascript
const code = String(Math.floor(100000 + Math.random() * 900000));
```

### Send OTP after registration
```javascript
// Step 1: Generate code
const otpCode = String(Math.floor(100000 + Math.random() * 900000));

// Step 2: Send email
const result = await sendOtpEmail({
  to: req.body.email,
  code: otpCode
});

// Step 3: Store for verification
pendingRegistrations.set(req.body.email, {
  otpCode,
  expiresAt: Date.now() + 5 * 60 * 1000
});
```

### Verify OTP
```javascript
router.post('/verify-otp', async (req, res) => {
  const pending = pendingRegistrations.get(req.body.email);
  
  if (!pending) {
    return res.status(400).json({ message: 'No pending registration' });
  }
  
  if (pending.otpCode !== req.body.code) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  
  if (Date.now() > pending.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  
  // Create user account
  // ...
});
```

### Check service before sending
```javascript
const health = await checkEmailServiceHealth();
if (!health.configured) {
  // Show error message
  console.error('Email service not configured');
}
```

---

## 6. Testing with PowerShell

### Test OTP
```powershell
$body = @{
    to = "test@example.com"
    code = "123456"
    purpose = "registration"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/email/send-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Test notification (need token)
```powershell
$body = @{
    to = "test@example.com"
    title = "Test"
    message = "This is a test"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/email/send-notification" `
  -Method POST `
  -Headers @{
    "Content-Type"="application/json"
    "Authorization"="Bearer YOUR_TOKEN"
  } `
  -Body $body
```

### Check health
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/email/health" | 
  Select-Object -ExpandProperty Content
```

---

## 7. Files Created/Modified

**New Files:**
- `server/services/resendEmailService.js` - Email service implementation
- `server/routes/email.js` - API endpoints
- `client/src/utils/emailService.js` - Vue.js utility
- `client/src/views/EmailExamples.vue` - Example component
- `EMAIL_SETUP_GUIDE.md` - Full setup guide

**Modified Files:**
- `server/index.js` - Added email routes
- `.env` - Added Resend configuration
- `package.json` - Added resend dependency

---

## 8. Environment Variables

```env
# Required
RESEND_API_KEY=re_your_api_key

# Optional
RESEND_FROM_EMAIL=noreply@yourdomain.com
APP_NAME=School Timetable
```

Get API key: https://resend.com/api-keys

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Service not configured" | Check `.env` has `RESEND_API_KEY` |
| Emails not arriving | Check spam folder, verify email address |
| 401 error on POST | Add `Authorization: Bearer TOKEN` header |
| Invalid email error | Check email format (user@domain.com) |
| API key not working | Regenerate key at https://resend.com/api-keys |

---

## 10. Production Notes

1. **Domain Verification:** Verify your custom domain in Resend dashboard
2. **From Address:** Use your verified domain in `RESEND_FROM_EMAIL`
3. **Rate Limiting:** Already enabled on `/api/` routes
4. **Monitoring:** Check Resend dashboard for delivery stats
5. **Error Handling:** Catch errors and show user-friendly messages
6. **Security:** Never log API keys or tokens

---

**Documentation:** [Full Setup Guide](./EMAIL_SETUP_GUIDE.md)
