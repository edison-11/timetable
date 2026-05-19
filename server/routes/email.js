const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  sendEmail,
  sendOtpEmail,
  sendNotificationEmail,
  sendCustomEmail
} = require('../services/resendEmailService');
const { storeOTP, verifyOTP, getRemainingTime, hasPendingOTP } = require('../services/otpService');

const router = express.Router();

/**
 * POST /api/email/send-otp
 * Generate and send OTP verification email
 * Server automatically generates the OTP code
 * 
 * Body:
 *   - to: string (email address, required)
 *   - purpose: string (registration | password_reset | email_verification) [optional, default: registration]
 *   - expiresInMinutes: number [optional, default: 5, max: 60]
 * 
 * Response:
 *   - success: boolean
 *   - message: string
 *   - messageId: string (email message ID)
 *   - expiresIn: number (seconds until OTP expires)
 */
router.post(
  '/send-otp',
  [
    body('to').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('purpose')
      .optional()
      .isIn(['registration', 'password_reset', 'email_verification'])
      .withMessage('Purpose must be registration, password_reset, or email_verification'),
    body('expiresInMinutes').optional().isInt({ min: 1, max: 60 }).withMessage('Expires must be 1-60 minutes')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, purpose = 'registration', expiresInMinutes = 5 } = req.body;

      // Generate and store OTP server-side
      const otpCode = storeOTP(to, expiresInMinutes);

      // Send OTP email
      const result = await sendOtpEmail({
        to,
        code: otpCode,
        purpose,
        expiresInMinutes
      });

      if (result.success) {
        return res.status(200).json({
          ...result,
          expiresIn: expiresInMinutes * 60 // return in seconds
        });
      }

      if (result.code === 'RESEND_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          message: 'Email service is not configured. Contact the system administrator.'
        });
      }

      return res.status(400).json(result);
    } catch (error) {
      console.error('Error in send-otp endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * POST /api/email/send-notification
 * Send notification email
 * Requires authentication
 * 
 * Body:
 *   - to: string (email address)
 *   - title: string (email subject)
 *   - message: string (email body)
 *   - actionUrl: string [optional]
 *   - actionText: string [optional]
 */
router.post(
  '/send-notification',
  auth,
  [
    body('to').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('message').trim().isLength({ min: 3 }).withMessage('Message must be at least 3 characters'),
    body('actionUrl').optional().isURL().withMessage('Action URL must be valid'),
    body('actionText').optional().trim().isLength({ min: 1 }).withMessage('Action text is required if URL provided')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, title, message, actionUrl, actionText } = req.body;

      const result = await sendNotificationEmail({
        to,
        title,
        message,
        actionUrl,
        actionText
      });

      if (result.success) {
        return res.status(200).json(result);
      }

      if (result.code === 'RESEND_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          message: 'Email service is not configured. Contact the system administrator.'
        });
      }

      return res.status(400).json(result);
    } catch (error) {
      console.error('Error in send-notification endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * POST /api/email/send-custom
 * Send custom HTML email
 * Requires authentication
 * 
 * Body:
 *   - to: string (email address)
 *   - subject: string (email subject)
 *   - html: string (HTML email body)
 */
router.post(
  '/send-custom',
  auth,
  [
    body('to').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().isLength({ min: 3 }).withMessage('Subject must be at least 3 characters'),
    body('html').trim().isLength({ min: 1 }).withMessage('HTML content is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, subject, html } = req.body;

      const result = await sendCustomEmail({
        to,
        subject,
        html
      });

      if (result.success) {
        return res.status(200).json(result);
      }

      if (result.code === 'RESEND_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          message: 'Email service is not configured. Contact the system administrator.'
        });
      }

      return res.status(400).json(result);
    } catch (error) {
      console.error('Error in send-custom endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * POST /api/email/verify-otp
 * Verify OTP code sent to user's email
 * 
 * Body:
 *   - email: string (email address, required)
 *   - code: string (6-digit OTP code, required)
 * 
 * Response:
 *   - success: boolean
 *   - message: string
 *   - shouldRetry: boolean (can user request a new code)
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('OTP code must be exactly 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;

      // Verify OTP
      const result = verifyOTP(email, code);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          verified: true
        });
      }

      // Return 400 for invalid OTP, 429 for too many attempts
      const statusCode = result.shouldRetry ? 400 : 429;
      return res.status(statusCode).json({
        success: false,
        message: result.message,
        shouldRetry: result.shouldRetry
      });
    } catch (error) {
      console.error('Error in verify-otp endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * GET /api/email/otp-status/:email
 * Check if OTP is pending for email and get remaining time
 * 
 * Params:
 *   - email: email address
 * 
 * Response:
 *   - hasPending: boolean
 *   - remainingSeconds: number (null if no pending OTP)
 */
router.get('/otp-status/:email', (req, res) => {
  try {
    const { email } = req.params;

    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const hasPending = hasPendingOTP(email);
    const remainingTime = hasPending ? getRemainingTime(email) : null;

    return res.status(200).json({
      hasPending,
      remainingSeconds: remainingTime
    });
  } catch (error) {
    console.error('Error in otp-status endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/email/health
 * Check if email service is configured
 */
router.get('/health', (req, res) => {
  const isConfigured = !!process.env.RESEND_API_KEY;
  res.json({
    service: 'resend',
    configured: isConfigured,
    message: isConfigured ? 'Email service is ready' : 'Email service is not configured'
  });
});

module.exports = router;
