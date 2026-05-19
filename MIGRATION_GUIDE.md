# Migration Guide: Nodemailer → Resend

**Converting existing code to use Resend email service**

---

## Overview

| Aspect | Nodemailer | Resend |
|--------|-----------|--------|
| Setup | SMTP Configuration | API Key |
| Hosting | Self-hosted SMTP | Cloud (Resend) |
| Cost | Free (using Gmail etc) | Free tier + pay-as-you-go |
| Simplicity | Complex setup | Simple API |
| Reliability | Depends on SMTP | 99.9% SLA |
| Docker | Not needed | Not needed |

---

## File Changes

### Old Files (Nodemailer)
```
server/services/emailService.js     ← REPLACE
```

### New Files (Resend)
```
server/services/resendEmailService.js  ← USE THIS
server/routes/email.js                 ← USE THIS
client/src/utils/emailService.js       ← USE THIS
```

---

## Code Migration

### Before: Nodemailer
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'user@example.com',
  subject: 'OTP',
  text: 'Your code is 123456'
});
```

### After: Resend
```javascript
const { sendOtpEmail } = require('../services/resendEmailService');

await sendOtpEmail({
  to: 'user@example.com',
  code: '123456'
});
```

**Much simpler! ✅**

---

## Step-by-Step Migration

### Step 1: Update .env

**Before:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myemail@gmail.com
SMTP_PASS=myapppassword
SMTP_FROM=myemail@gmail.com
```

**After:**
```env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 2: Update Imports in auth.js

**Before:**
```javascript
const { sendOtpEmail } = require('../services/emailService');
```

**After:**
```javascript
const { sendOtpEmail } = require('../services/resendEmailService');
```

✅ **Already done!** See [server/routes/auth.js](server/routes/auth.js)

### Step 3: Update sendOtpEmail Calls

**Before:**
```javascript
await sendOtpEmail({
  to: email,
  code: otpCode,
  purpose: 'registration',
  expiresInMinutes: 5
});
```

**After:**
```javascript
await sendOtpEmail({
  to: email,
  code: otpCode,
  purpose: 'registration',
  expiresInMinutes: 5
});
```

**No change needed!** ✅ Same API!

### Step 4: Remove Old SMTP Config

Delete these from `.env`:
```env
# REMOVE THESE:
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=
```

### Step 5: Register Email Routes

**In server/index.js:**

**Before:**
```javascript
// No email routes
```

**After:**
```javascript
const emailRoutes = require('./routes/email');
app.use('/api/email', emailRoutes);
```

✅ **Already done!**

---

## Feature Comparison

### OTP Email Template

**Before (Nodemailer):**
```javascript
// Plain text only
text: `Your OTP code is ${code}. It expires in ${expiresInMinutes} minutes.`
```

**After (Resend):**
```
Professional HTML email with:
- Gradient header
- Large OTP display
- Security warnings
- Mobile responsive
- Professional styling
```

### Notification Email

**Before (Nodemailer):**
```javascript
// Manual HTML creation
html: `<h1>${title}</h1><p>${message}</p>`
```

**After (Resend):**
```
Professional template with:
- Subject line
- Message body
- Action button (optional)
- Branded header
- Footer
- Mobile responsive
```

---

## API Migration

### Sending OTP (same for both)

```javascript
await sendOtpEmail({
  to: 'user@example.com',
  code: '123456',
  purpose: 'registration'
});
```

### New: Sending Notifications (Resend only)

```javascript
const { sendNotificationEmail } = require('../services/resendEmailService');

await sendNotificationEmail({
  to: 'user@example.com',
  title: 'Class Updated',
  message: 'Your class has been scheduled',
  actionUrl: 'https://yoursite.com/class',
  actionText: 'View Class'
});
```

This wasn't available with Nodemailer!

### New: HTTP API (Resend only)

Instead of calling functions, you can now use HTTP:

```bash
# Send OTP via API
curl -X POST http://localhost:5000/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","code":"123456"}'

# Send notification via API
curl -X POST http://localhost:5000/api/email/send-notification \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","title":"Hello","message":"Test"}'
```

---

## Changes Summary

### What's Different

| Feature | Nodemailer | Resend |
|---------|-----------|--------|
| SMTP Config | Required | Not needed |
| API Key | Not used | Required |
| Templates | Basic | Professional |
| HTML Email | Manual | Automatic |
| Cost | Free (SMTP) | Free tier |
| Docker | Not required | Not required |
| Notifications | Must create manually | Built-in |
| Reliability | SMTP dependent | 99.9% SLA |

### What's the Same

| Feature | Status |
|---------|--------|
| Function names | Same (`sendOtpEmail`) |
| Function parameters | Same |
| Error handling | Similar |
| async/await usage | Same |

---

## Registration Flow Comparison

### Nodemailer Flow
```
1. User submits registration
2. Code: await sendOtpEmail({...})  ← Uses nodemailer
3. Email sent via SMTP
4. User receives email
```

### Resend Flow
```
1. User submits registration
2. Code: await sendOtpEmail({...})  ← Uses Resend
3. Email sent via Resend API
4. User receives email
```

**The code is identical!** ✅

---

## Testing Migration

### Before (Nodemailer)
```bash
# Had to use real SMTP server
# Hard to test without email configuration
```

### After (Resend)
```bash
# Test with automated suite
node test/email-service-test.js

# Test with HTTP requests
curl -X POST http://localhost:5000/api/email/send-otp \
  -d '{"to":"test@example.com","code":"123456"}'

# Check health
curl http://localhost:5000/api/email/health
```

Much better for development! ✅

---

## Backward Compatibility

✅ **Good news!** The function signatures are the same:

```javascript
// Works with BOTH Nodemailer and Resend
await sendOtpEmail({
  to: email,
  code: otpCode,
  purpose: 'registration',
  expiresInMinutes: 5
});
```

So if you have existing code using `sendOtpEmail()`, it will work with the new service!

---

## Deployment Checklist

- [ ] Update `.env` with `RESEND_API_KEY`
- [ ] Remove SMTP variables from `.env`
- [ ] Update import in auth.js (already done)
- [ ] Test with `node test/email-service-test.js`
- [ ] Verify email routes registered
- [ ] Test registration flow with real email
- [ ] Verify emails arrive in inbox
- [ ] Check Resend dashboard for logs

---

## Rollback Plan

If you need to go back to Nodemailer:

### Step 1: Restore .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Step 2: Update imports
```javascript
const { sendOtpEmail } = require('../services/emailService');
```

### Step 3: Restart server
```bash
npm start
```

**Function calls remain identical!** ✅

---

## Troubleshooting Migration

### Issue: "Module not found: resendEmailService"
```
❌ Error: Cannot find module '../services/resendEmailService'
✅ Fix: File already exists at server/services/resendEmailService.js
        Make sure import path is correct
```

### Issue: "RESEND_API_KEY is not configured"
```
❌ Error: Email service is not configured
✅ Fix: 
  1. Get API key from https://resend.com
  2. Add to .env: RESEND_API_KEY=re_xxxxx
  3. Restart server: npm start
```

### Issue: Email service endpoints not found
```
❌ Error: 404 on /api/email/send-otp
✅ Fix:
  1. Check email routes registered in server/index.js
  2. Should have: app.use('/api/email', emailRoutes);
  3. Restart server
```

### Issue: Emails not arriving
```
❌ Error: Email seems to be sent but not received
✅ Fix:
  1. Check spam/junk folder
  2. Check Resend dashboard for delivery status
  3. Verify `RESEND_FROM_EMAIL` is correct
  4. Check recipient email is valid
```

---

## Performance Comparison

| Metric | Nodemailer | Resend |
|--------|-----------|--------|
| Setup time | 10 minutes | 2 minutes |
| SMTP connection | 1-2 seconds | 500ms |
| Email delivery | Variable | ~500ms |
| Reliability | Depends on SMTP | 99.9% |
| Scalability | Limited | Unlimited |
| Cost at scale | Increases | Predictable |

---

## Next Steps

1. **Immediate:**
   - Get Resend API key (2 min)
   - Update `.env` (1 min)
   - Restart server (1 min)
   - Run tests: `node test/email-service-test.js` (1 min)

2. **Short-term:**
   - Test registration with real email
   - Verify domain in Resend (if custom domain)
   - Monitor delivery in Resend dashboard

3. **Long-term:**
   - Set up bounce handling
   - Monitor email metrics
   - Optimize templates based on data

---

## Resources

- **Resend Docs:** https://resend.com/docs
- **Resend API Keys:** https://resend.com/api-keys
- **Email Setup Guide:** [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
- **Quick Reference:** [EMAIL_QUICK_REFERENCE.md](./EMAIL_QUICK_REFERENCE.md)

---

## Summary

Migration from Nodemailer to Resend is:
- ✅ Quick (5 minutes)
- ✅ Simple (API key + 1 config)
- ✅ Painless (same function names)
- ✅ Beneficial (better reliability & features)

**The hardest part is clicking the "Get API Key" button! 🎉**

---

*Last Updated: May 18, 2026*
*Migration: Complete & Simple ✅*
