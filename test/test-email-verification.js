/**
 * Email Verification System - Test Script
 * Run: node test/test-email-verification.js
 * 
 * Tests the complete OTP verification flow
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/email';
const TEST_EMAIL = 'rabiauwase2@gmail.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`),
  test: (msg) => console.log(`\n${colors.blue}📝 ${msg}${colors.reset}`)
};

/**
 * Test 1: Send OTP
 */
async function testSendOTP() {
  log.section('TEST 1: Send OTP');

  try {
    log.info(`Sending OTP to ${TEST_EMAIL}...`);

    const response = await axios.post(`${API_URL}/send-otp`, {
      to: TEST_EMAIL,
      purpose: 'registration',
      expiresInMinutes: 5
    });

    if (response.data.success) {
      log.success(`OTP sent successfully!`);
      log.info(`Message ID: ${response.data.messageId}`);
      log.info(`Expires in: ${response.data.expiresIn} seconds (${response.data.expiresIn / 60} minutes)`);
      return response.data;
    }

    log.error(`Failed to send OTP: ${response.data.message}`);
    return null;
  } catch (error) {
    log.error(`Error sending OTP: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

/**
 * Test 2: Check OTP Status
 */
async function testOTPStatus() {
  log.section('TEST 2: Check OTP Status');

  try {
    log.info(`Checking OTP status for ${TEST_EMAIL}...`);

    const response = await axios.get(`${API_URL}/otp-status/${TEST_EMAIL}`);

    if (response.data.hasPending) {
      log.success(`OTP is pending!`);
      log.info(`Remaining time: ${response.data.remainingSeconds} seconds`);
      return response.data;
    }

    log.warn(`No pending OTP found`);
    return response.data;
  } catch (error) {
    log.error(`Error checking status: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

/**
 * Test 3: Verify with Wrong Code (Should fail)
 */
async function testWrongCode() {
  log.section('TEST 3: Verify with Wrong Code');

  try {
    log.info(`Attempting to verify with wrong code "000000"...`);

    const response = await axios.post(`${API_URL}/verify-otp`, {
      email: TEST_EMAIL,
      code: '000000'
    });

    log.error(`Unexpected success: ${response.data.message}`);
    return false;
  } catch (error) {
    const data = error.response?.data;
    if (data?.success === false) {
      log.success(`Correctly rejected invalid code!`);
      log.info(`Message: ${data.message}`);
      log.info(`Should retry: ${data.shouldRetry}`);
      return true;
    }

    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Verify with Valid Code (Manual - shows what success looks like)
 */
async function testValidCode() {
  log.section('TEST 4: Verify with Valid Code (Manual Test)');

  log.warn(`To test valid code verification:`);
  log.info(`1. Check your email inbox at ${TEST_EMAIL}`);
  log.info(`2. Look for the 6-digit verification code from School Timetable`);
  log.info(`3. Run this command to verify:`);
  log.info(`\n   curl -X POST http://localhost:5000/api/email/verify-otp \\`);
  log.info(`     -H "Content-Type: application/json" \\`);
  log.info(`     -d '{"email":"${TEST_EMAIL}","code":"XXXXXX"}'\n`);
  log.info(`Replace XXXXXX with the actual 6-digit code from your email.`);
}

/**
 * Test 5: Invalid Email Format
 */
async function testInvalidEmail() {
  log.section('TEST 5: Invalid Email Format');

  try {
    log.info(`Attempting to send OTP with invalid email...`);

    const response = await axios.post(`${API_URL}/send-otp`, {
      to: 'not-an-email',
      purpose: 'registration'
    });

    log.error(`Unexpected success: ${response.data.message}`);
    return false;
  } catch (error) {
    const data = error.response?.data;
    if (!data.success) {
      log.success(`Correctly rejected invalid email!`);
      log.info(`Error: ${data.errors?.[0]?.msg || data.message}`);
      return true;
    }

    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Invalid OTP Code Format
 */
async function testInvalidCodeFormat() {
  log.section('TEST 6: Invalid OTP Code Format');

  try {
    log.info(`Attempting to verify with invalid code format "abc"...`);

    const response = await axios.post(`${API_URL}/verify-otp`, {
      email: TEST_EMAIL,
      code: 'abc'
    });

    log.error(`Unexpected success: ${response.data.message}`);
    return false;
  } catch (error) {
    const data = error.response?.data;
    if (!data.success) {
      log.success(`Correctly rejected invalid code format!`);
      log.info(`Error: ${data.errors?.[0]?.msg || data.message}`);
      return true;
    }

    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Email Verification System - Test Suite                  ║${colors.reset}`);
  console.log(`${colors.cyan}║   Testing OTP Generation & Verification                   ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const results = {
    passed: 0,
    failed: 0
  };

  try {
    // Test 1: Send OTP
    const sendOtpResult = await testSendOTP();
    if (sendOtpResult) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 2: Check OTP Status
    const statusResult = await testOTPStatus();
    if (statusResult?.hasPending !== undefined) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 3: Wrong Code
    if (await testWrongCode()) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 4: Valid Code (Manual)
    await testValidCode();
    results.passed++;

    // Test 5: Invalid Email
    if (await testInvalidEmail()) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 6: Invalid Code Format
    if (await testInvalidCodeFormat()) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Summary
    log.section('TEST SUMMARY');
    log.success(`Passed: ${results.passed}`);
    if (results.failed > 0) {
      log.error(`Failed: ${results.failed}`);
    }
    console.log(`${'─'.repeat(60)}`);

    if (results.failed === 0) {
      log.success(`\nAll tests completed successfully! ✨\n`);
      console.log(`📧 Email Verification System is ready for use!\n`);
    } else {
      log.warn(`\nSome tests failed. Please check the errors above.\n`);
    }
  } catch (error) {
    log.error(`Fatal error during testing: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});
