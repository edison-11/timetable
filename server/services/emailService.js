const nodemailer = require('nodemailer');

const requiredKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

const assertEmailConfigured = () => {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Email service is not configured. Missing: ${missing.join(', ')}`);
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }
};

const createTransporter = () => {
  assertEmailConfigured();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const purposeText = {
  registration: 'complete your account registration',
  reset: 'reset your password'
};

const sendOtpEmail = async ({ to, code, purpose = 'registration', expiresInMinutes = 5 }) => {
  const transporter = createTransporter();
  const actionText = purposeText[purpose] || 'verify your account';
  const subject = `Your ${process.env.APP_NAME || 'School Timetable'} verification code`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: [
      `Your OTP code is ${code}.`,
      `Use this code to ${actionText}.`,
      `It expires in ${expiresInMinutes} minutes and can only be used once.`,
      'Keep this code confidential. School staff will never ask you to share it.'
    ].join('\n\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Verification code</h2>
        <p>Use this one-time code to ${actionText}.</p>
        <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 14px 18px; background: #eff6ff; color: #1d4ed8; border-radius: 12px; display: inline-block;">${code}</div>
        <p>This code expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
        <p style="color: #b91c1c; font-weight: 700;">Keep this code confidential. Do not share it with anyone.</p>
      </div>
    `
  });
};

module.exports = {
  sendOtpEmail
};
