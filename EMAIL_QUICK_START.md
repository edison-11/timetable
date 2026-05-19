# 🚀 Email System - Developer Quick Start

**⏱️ 5 minutes to working email system**

---

## The 4 Steps

### Step 1: Get API Key (2 min)
```
Visit: https://resend.com → Sign Up → Create API Key → Copy
```
You'll get something like: `re_abc123def456`

### Step 2: Add to .env (1 min)
```env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Restart Server (1 min)
```powershell
npm start
```

### Step 4: Test (1 min)
```powershell
node test/email-service-test.js
```

**Done! ✅**

---

## Use It Immediately

### Backend: Send OTP
```javascript
const { sendOtpEmail } = require('../services/resendEmailService');

await sendOtpEmail({
  to: 'user@example.com',
  code: '123456'
});
```

### Frontend: Send OTP
```vue
<script>
import { sendOtpEmail } from '@/utils/emailService';

// In a method:
await sendOtpEmail('user@example.com', '123456');
</script>
```

### Send Notification
```javascript
const { sendNotificationEmail } = require('../services/resendEmailService');

await sendNotificationEmail({
  to: 'teacher@example.com',
  title: 'Class Updated',
  message: 'Your class schedule changed',
  actionUrl: 'https://yoursite.com/class',
  actionText: 'View Class'
});
```

---

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/email/send-otp` | ❌ | Send OTP code |
| POST | `/api/email/send-notification` | ✅ | Send alert |
| POST | `/api/email/send-custom` | ✅ | Send custom HTML |
| GET | `/api/email/health` | ❌ | Check status |

---

## Test It

```bash
# Automated tests
node test/email-service-test.js

# Check health
curl http://localhost:5000/api/email/health

# Send OTP (PowerShell)
$body = @{to='test@example.com'; code='123456'} | ConvertTo-Json
curl -X POST http://localhost:5000/api/email/send-otp `
  -H "Content-Type: application/json" `
  -d $body
```

---

## Common Patterns

### Registration with OTP
```javascript
// 1. User submits registration
// 2. Generate OTP
const code = String(Math.floor(100000 + Math.random() * 900000));

// 3. Send OTP email
const result = await sendOtpEmail({ to: email, code });

// 4. Store for verification
pendingRegistrations.set(email, { code, expiresAt: Date.now() + 5*60000 });

// 5. User submits OTP
// 6. Verify
if (pendingRegistrations.get(email).code === submittedCode) {
  // Create account
}
```

### Notify Users
```javascript
// Notify all teachers about schedule
for (const teacher of teachers) {
  await sendNotificationEmail({
    to: teacher.email,
    title: 'Schedule Updated',
    message: `Your schedule for ${weekOf} is ready`,
    actionUrl: `${baseUrl}/schedule`,
    actionText: 'View Schedule'
  });
}
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/services/resendEmailService.js` | Email service |
| `server/routes/email.js` | API routes |
| `client/src/utils/emailService.js` | Vue helper |
| `client/src/views/EmailExamples.vue` | Demo component |
| `test/email-service-test.js` | Tests |

---

## Environment

```env
REQUIRED:
RESEND_API_KEY=re_xxxxx

OPTIONAL (has defaults):
RESEND_FROM_EMAIL=noreply@yourdomain.com
APP_NAME=School Timetable
```

Get key: https://resend.com/api-keys

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not configured" | Add `RESEND_API_KEY` to `.env` |
| "Invalid email" | Use format: user@domain.com |
| Emails missing | Check spam folder |
| 401 error | Add auth header: `Authorization: Bearer TOKEN` |
| Server won't start | Run: `npm install resend` |

---

## Production

Before going live:
- [ ] Get real API key
- [ ] Verify custom domain in Resend
- [ ] Use verified domain in `RESEND_FROM_EMAIL`
- [ ] Test with real emails
- [ ] Set `NODE_ENV=production`
- [ ] Monitor Resend dashboard

---

## Need More?

- **Setup Guide:** [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
- **Code Examples:** [EMAIL_QUICK_REFERENCE.md](./EMAIL_QUICK_REFERENCE.md)
- **What Changed:** [EMAIL_IMPLEMENTATION_SUMMARY.md](./EMAIL_IMPLEMENTATION_SUMMARY.md)
- **Overview:** [EMAIL_SYSTEM_README.md](./EMAIL_SYSTEM_README.md)

---

## Support Resources

- Resend Docs: https://resend.com/docs
- Resend API Keys: https://resend.com/api-keys
- Express.js: https://expressjs.com
- Vue.js: https://vuejs.org

---

**Now go send some emails! 📧✨**
