let Resend = null;
let resend = null;
let initialized = false;

// Safe package loading
try {
  const resendPackage = require('resend');
  Resend = resendPackage.Resend || resendPackage;
} catch (error) {
  console.log('⚠️ Resend package not installed');
}

/**
 * Lazy initialization
 */
const initializeResend = () => {
  if (initialized) return;
  initialized = true;

  try {
    // If package missing
    if (!Resend) {
      console.log('⚠️ Resend module unavailable - using dev mode');
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;

    console.log(
      'DEBUG: RESEND_API_KEY:',
      apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'
    );

    if (
      apiKey &&
      apiKey !== 're_your_api_key_here' &&
      apiKey.startsWith('re_')
    ) {
      resend = new Resend(apiKey);
      console.log('✅ Resend email service initialized');
    } else {
      console.log(
        '⚠️ Resend API key not configured - emails will log to console'
      );
    }
  } catch (error) {
    console.error('❌ Resend initialization error:', error.message);
  }
};

/**
 * Email templates
 */
const emailTemplates = {
  otp: ({ code, expiresInMinutes = 5, appName = 'School Timetable' }) => ({
    subject: `Your ${appName} Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Verification Code</h2>

        <p>Use this code to continue:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          background: #f3f4f6;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
        ">
          ${code}
        </div>

        <p style="margin-top:20px;">
          Code expires in ${expiresInMinutes} minutes.
        </p>

        <p style="color:red;">
          Never share this code with anyone.
        </p>
      </div>
    `
  }),

  notification: ({
    title,
    message,
    actionUrl,
    actionText = 'View Details'
  }) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto;">
        <h2>${title}</h2>

        <p>${message}</p>

        ${
          actionUrl
            ? `
          <a href="${actionUrl}" style="
            display:inline-block;
            padding:12px 20px;
            background:#2563eb;
            color:white;
            text-decoration:none;
            border-radius:6px;
          ">
            ${actionText}
          </a>
        `
            : ''
        }
      </div>
    `
  }),

  custom: ({ subject, html }) => ({
    subject,
    html
  })
};

/**
 * Send email
 */
const sendEmail = async (to, templateName, templateData = {}) => {
  try {
    initializeResend();

    // Validate email
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid email address');
    }

    const template = emailTemplates[templateName];

    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    const emailContent = template(templateData);

    /**
     * REAL EMAIL
     */
    if (resend) {
      const response = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          'onboarding@resend.dev',

        to,
        subject: emailContent.subject,
        html: emailContent.html
      });

      if (response.error) {
        console.error('❌ Resend API error:', response.error);

        return {
          success: false,
          message: response.error.message
        };
      }

      console.log(`✅ Email sent to ${to}`);

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: response.data?.id
      };
    }

    /**
     * DEV MODE FALLBACK
     */
    console.log('\n========== EMAIL DEV MODE ==========');
    console.log('TO:', to);
    console.log('SUBJECT:', emailContent.subject);
    console.log('TEMPLATE:', templateName);
    console.log('DATA:', templateData);
    console.log('====================================\n');

    return {
      success: true,
      message: 'Email simulated successfully',
      messageId: `dev_${Date.now()}`
    };
  } catch (error) {
    console.error('❌ Email sending error:', error);

    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * OTP email
 */
const sendOtpEmail = async ({
  to,
  code,
  purpose = 'registration',
  expiresInMinutes = 5
}) => {
  return sendEmail(to, 'otp', {
    code,
    purpose,
    expiresInMinutes,
    appName: process.env.APP_NAME || 'School Timetable'
  });
};

/**
 * Notification email
 */
const sendNotificationEmail = async ({
  to,
  title,
  message,
  actionUrl,
  actionText
}) => {
  return sendEmail(to, 'notification', {
    title,
    message,
    actionUrl,
    actionText
  });
};

/**
 * Custom email
 */
const sendCustomEmail = async ({
  to,
  subject,
  html
}) => {
  return sendEmail(to, 'custom', {
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendNotificationEmail,
  sendCustomEmail
};