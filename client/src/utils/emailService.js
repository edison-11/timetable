import axios from 'axios';

/**
 * Email Service - Vue.js utility for calling backend email endpoints
 */

const API_BASE_URL = '/api/email';

// Create axios instance with base configuration
const emailAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
emailAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} code - OTP code
 * @param {string} purpose - 'registration' or 'reset'
 * @param {number} expiresInMinutes - Code expiry time
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOtpEmail = async (email, code, purpose = 'registration', expiresInMinutes = 5) => {
  try {
    const response = await emailAPI.post('/send-otp', {
      to: email,
      code,
      purpose,
      expiresInMinutes
    });
    return response.data;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send email. Please try again.'
    };
  }
};

/**
 * Send notification email
 * @param {string} email - Recipient email
 * @param {string} title - Email subject
 * @param {string} message - Email body
 * @param {string} actionUrl - Optional action URL
 * @param {string} actionText - Optional action button text
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendNotificationEmail = async (email, title, message, actionUrl = null, actionText = 'View Details') => {
  try {
    const response = await emailAPI.post('/send-notification', {
      to: email,
      title,
      message,
      actionUrl,
      actionText
    });
    return response.data;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send email. Please try again.'
    };
  }
};

/**
 * Send custom HTML email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendCustomEmail = async (email, subject, html) => {
  try {
    const response = await emailAPI.post('/send-custom', {
      to: email,
      subject,
      html
    });
    return response.data;
  } catch (error) {
    console.error('Error sending custom email:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send email. Please try again.'
    };
  }
};

/**
 * Check if email service is configured
 * @returns {Promise<{service: string, configured: boolean, message: string}>}
 */
export const checkEmailServiceHealth = async () => {
  try {
    const response = await emailAPI.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking email service health:', error);
    return {
      service: 'resend',
      configured: false,
      message: 'Unable to check email service status'
    };
  }
};

export default {
  sendOtpEmail,
  sendNotificationEmail,
  sendCustomEmail,
  checkEmailServiceHealth
};
