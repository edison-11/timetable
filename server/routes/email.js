const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  sendEmail,
  sendOtpEmail,
  sendNotificationEmail,
  sendCustomEmail
} = require('../services/resendEmailService');

const router = express.Router();

/**
 * POST /api/email/send-otp
 * Send OTP verification email
 * 
 * Body:
 *   - to: string (email address)
 *   - code: string (OTP code)
 *   - purpose: string (registration | reset) [optional]
 *   - expiresInMinutes: number [optional, default: 5]
 */
router.post(
  '/send-otp',
  [
    body('to').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').trim().isLength({ min: 1 }).withMessage('OTP code is required'),
    body('purpose')
      .optional()
      .isIn(['registration', 'reset'])
      .withMessage('Purpose must be registration or reset'),
    body('expiresInMinutes').optional().isInt({ min: 1, max: 60 }).withMessage('Expires must be 1-60 minutes')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, code, purpose = 'registration', expiresInMinutes = 5 } = req.body;

      const result = await sendOtpEmail({
        to,
        code,
        purpose,
        expiresInMinutes
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
