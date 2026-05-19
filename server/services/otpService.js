/**
 * OTP Service - Manages One-Time Password generation, storage, and verification
 * OTPs expire after 5 minutes by default
 */

// In-memory storage for OTPs: { email: { code, expiresAt, attempts } }
const otpStore = {};

/**
 * Generate a random 6-digit OTP code
 * @returns {string} - 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP for an email address
 * @param {string} email - Email address
 * @param {number} expiresInMinutes - How long the OTP is valid (default: 5 minutes)
 * @returns {string} - The generated OTP code
 */
const storeOTP = (email, expiresInMinutes = 5) => {
  const normalizedEmail = email.toLowerCase();
  const code = generateOTP();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  otpStore[normalizedEmail] = {
    code,
    expiresAt,
    attempts: 0,
    createdAt: Date.now()
  };

  console.log(`✅ OTP stored for ${normalizedEmail} (expires in ${expiresInMinutes} minutes)`);

  return code;
};

/**
 * Verify OTP for an email address
 * @param {string} email - Email address
 * @param {string} code - The OTP code to verify
 * @returns {object} - { success: boolean, message: string, shouldRetry: boolean }
 */
const verifyOTP = (email, code) => {
  const normalizedEmail = email.toLowerCase();

  // Check if OTP exists for this email
  if (!otpStore[normalizedEmail]) {
    console.warn(`⚠️ No OTP found for ${normalizedEmail}`);
    return {
      success: false,
      message: 'No OTP request found for this email. Please request a new code.',
      shouldRetry: true
    };
  }

  const otpData = otpStore[normalizedEmail];

  // Check if OTP has expired
  if (Date.now() > otpData.expiresAt) {
    delete otpStore[normalizedEmail];
    console.warn(`⚠️ OTP expired for ${normalizedEmail}`);
    return {
      success: false,
      message: 'OTP has expired. Please request a new code.',
      shouldRetry: true
    };
  }

  // Check if code matches
  if (code.toString() !== otpData.code.toString()) {
    otpData.attempts += 1;
    console.warn(`⚠️ Invalid OTP attempt for ${normalizedEmail} (attempt ${otpData.attempts})`);

    // Lock after 5 failed attempts
    if (otpData.attempts >= 5) {
      delete otpStore[normalizedEmail];
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
        shouldRetry: true
      };
    }

    return {
      success: false,
      message: `Invalid OTP. ${5 - otpData.attempts} attempts remaining.`,
      shouldRetry: false
    };
  }

  // OTP is valid - delete it
  delete otpStore[normalizedEmail];
  console.log(`✅ OTP verified successfully for ${normalizedEmail}`);

  return {
    success: true,
    message: 'OTP verified successfully',
    shouldRetry: false
  };
};

/**
 * Check if an email has a pending OTP
 * @param {string} email - Email address
 * @returns {boolean}
 */
const hasPendingOTP = (email) => {
  const normalizedEmail = email.toLowerCase();
  const otpData = otpStore[normalizedEmail];

  if (!otpData) return false;

  // Check if expired
  if (Date.now() > otpData.expiresAt) {
    delete otpStore[normalizedEmail];
    return false;
  }

  return true;
};

/**
 * Get remaining time for OTP (in seconds)
 * @param {string} email - Email address
 * @returns {number|null} - Seconds remaining, or null if no OTP
 */
const getRemainingTime = (email) => {
  const normalizedEmail = email.toLowerCase();
  const otpData = otpStore[normalizedEmail];

  if (!otpData) return null;

  const remaining = Math.max(0, Math.floor((otpData.expiresAt - Date.now()) / 1000));
  return remaining;
};

/**
 * Clean up expired OTPs (run periodically)
 * Should be called every few minutes in production
 */
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const email in otpStore) {
    if (otpStore[email].expiresAt < now) {
      delete otpStore[email];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired OTPs`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  hasPendingOTP,
  getRemainingTime,
  cleanupExpiredOTPs
};
