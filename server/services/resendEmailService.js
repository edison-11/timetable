const { Resend } = require('resend');

let resend = null;
let initialized = false;

// Lazy initialization - will be called on first use
const initializeResend = () => {
  if (initialized) return;
  initialized = true;

  try {
    const apiKey = process.env.RESEND_API_KEY;
    console.log('DEBUG: RESEND_API_KEY value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    console.log('DEBUG: API key starts with re_?', apiKey ? apiKey.startsWith('re_') : 'N/A');
    
    if (apiKey && apiKey !== 're_your_api_key_here' && apiKey.startsWith('re_')) {
      resend = new Resend(apiKey);
      console.log('✅ Resend email service initialized');
    } else {
      console.log('⚠️ Resend API key not configured - emails will log to console');
      if (apiKey) {
        console.log('   API key exists but validation failed. Key length:', apiKey.length, 'Starts with re_?', apiKey.startsWith('re_'));
      }
    }
  } catch (error) {
    console.error('⚠️ Resend initialization error:', error.message);
  }
};

/**
 * Email templates with default styles
 */
const emailTemplates = {
  otp: ({ code, expiresInMinutes = 5, appName = 'School Timetable' }) => ({
    subject: `Your ${appName} Verification Code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Verification Code</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 20px; color: #475569; font-size: 16px;">
            Use this one-time code to complete your account registration.
          </p>
          
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          
          <p style="margin: 20px 0 0; color: #64748b; font-size: 14px;">
            <strong>Code expires in ${expiresInMinutes} minutes</strong>
          </p>
          
          <p style="margin: 12px 0; color: #64748b; font-size: 14px;">
            This code can only be used once.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          
          <p style="margin: 16px 0; color: #e11d48; font-weight: 700; font-size: 14px;">
            ⚠️ Keep this code confidential. School staff will never ask you to share it.
          </p>
          
          <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      </div>
    `
  }),

  notification: ({ title, message, actionUrl, actionText = 'View Details' }) => ({
    subject: title,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          
          ${actionUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${actionUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                ${actionText}
              </a>
            </div>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          
          <p style="margin: 12px 0; color: #94a3b8; font-size: 12px; text-align: center;">
            © School Timetable System. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  custom: ({ subject, html }) => ({
    subject,
    html
  })
};

/**
 * Send email using Resend
 * @param {string} to - Recipient email address
 * @param {string} templateName - Template name (otp, notification, custom)
 * @param {object} templateData - Data for the template
 * @returns {Promise<{success: boolean, message: string, messageId?: string}>}
 */
const sendEmail = async (to, templateName, templateData = {}) => {
  try {
    // Initialize Resend on first use
    initializeResend();

    // Validate email address
    if (!to || !to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid email address');
    }

    // Get template
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }

    const emailContent = template(templateData);

    // If Resend is available, send real email
    if (resend) {
      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@school-timetable.com',
        to,
        subject: emailContent.subject,
        html: emailContent.html
      });

      if (response.error) {
        console.error('Resend API error:', response.error);
        throw new Error(`Email service error: ${response.error.message}`);
      }

      console.log(`✅ Email sent to ${to} (${templateName})`);
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: response.data?.id
      };
    }

    // Fallback: Log email in development mode
    console.log(`\n[DEV MODE] Email would be sent:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`Template: ${templateName}`);
    console.log(`Data:`, templateData);
    console.log(`---\n`);
    
    return {
      success: true,
      message: 'Email sent successfully (dev mode)',
      messageId: `dev_${Date.now()}`
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: error.message,
      code: error.code
    };
  }
};

/**
 * Send OTP email
 */
const sendOtpEmail = async ({ to, code, purpose = 'registration', expiresInMinutes = 5 }) => {
  return sendEmail(to, 'otp', {
    code,
    expiresInMinutes,
    appName: process.env.APP_NAME || 'School Timetable'
  });
};

/**
 * Send notification email
 */
const sendNotificationEmail = async ({ to, title, message, actionUrl, actionText }) => {
  return sendEmail(to, 'notification', {
    title,
    message,
    actionUrl,
    actionText
  });
};

/**
 * Send custom email
 */
const sendCustomEmail = async ({ to, subject, html }) => {
  return sendEmail(to, 'custom', { subject, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendNotificationEmail,
  sendCustomEmail
};
