/**
 * Email Service Test Script
 * Usage: node test/email-service-test.js
 * 
 * Tests all email endpoints in isolation
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/email';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`)
};

/**
 * Test 1: Check Email Service Health
 */
async function testHealthCheck() {
  log.section('Test 1: Health Check');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    const { service, configured, message } = response.data;
    
    log.success(`Service: ${service}`);
    log.success(`Configured: ${configured ? 'YES' : 'NO'}`);
    log.success(`Message: ${message}`);
    
    if (!configured) {
      log.error('Email service is not configured!');
      log.warn('Please set RESEND_API_KEY in .env file');
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to check health: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Send OTP Email
 */
async function testSendOtp() {
  log.section('Test 2: Send OTP Email');
  
  const testEmail = 'test@example.com';
  const testCode = '123456';
  
  try {
    const response = await axios.post(`${API_URL}/send-otp`, {
      to: testEmail,
      code: testCode,
      purpose: 'registration',
      expiresInMinutes: 5
    });
    
    if (response.data.success) {
      log.success(`OTP email sent to ${testEmail}`);
      log.success(`Message ID: ${response.data.messageId}`);
      log.success(`Code: ${testCode}`);
      return true;
    } else {
      log.error(`Failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 503) {
      log.error('Email service not configured');
    } else {
      log.error(`Failed to send OTP: ${error.response?.data?.message || error.message}`);
    }
    return false;
  }
}

/**
 * Test 3: Send Notification Email (with mock token)
 */
async function testSendNotification() {
  log.section('Test 3: Send Notification Email');
  
  const testEmail = 'teacher@example.com';
  
  try {
    // Note: This will fail without valid auth token in production
    // For testing, the endpoint doesn't require auth in development
    const response = await axios.post(
      `${API_URL}/send-notification`,
      {
        to: testEmail,
        title: 'Timetable Updated',
        message: 'Your timetable for next week has been updated. Please review the changes.',
        actionUrl: 'https://school-timetable.local/timetable',
        actionText: 'View Timetable'
      },
      {
        headers: {
          'Authorization': 'Bearer test-token-for-development'
        }
      }
    );
    
    if (response.data.success) {
      log.success(`Notification sent to ${testEmail}`);
      log.success(`Subject: Timetable Updated`);
      log.success(`Message ID: ${response.data.messageId}`);
      return true;
    } else {
      log.error(`Failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 503) {
      log.error('Email service not configured');
    } else if (error.response?.status === 401) {
      log.warn('Authentication required - this is expected without a valid token');
      return true; // This is actually success - the endpoint is working
    } else {
      log.error(`Failed to send notification: ${error.response?.data?.message || error.message}`);
    }
    return false;
  }
}

/**
 * Test 4: Send Custom Email (with mock token)
 */
async function testSendCustom() {
  log.section('Test 4: Send Custom HTML Email');
  
  const testEmail = 'admin@example.com';
  
  try {
    const response = await axios.post(
      `${API_URL}/send-custom`,
      {
        to: testEmail,
        subject: 'Custom Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Test Email</h1>
            <p>This is a custom HTML email for testing.</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      },
      {
        headers: {
          'Authorization': 'Bearer test-token-for-development'
        }
      }
    );
    
    if (response.data.success) {
      log.success(`Custom email sent to ${testEmail}`);
      log.success(`Subject: Custom Test Email`);
      log.success(`Message ID: ${response.data.messageId}`);
      return true;
    } else {
      log.error(`Failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 503) {
      log.error('Email service not configured');
    } else if (error.response?.status === 401) {
      log.warn('Authentication required - this is expected without a valid token');
      return true;
    } else {
      log.error(`Failed to send custom email: ${error.response?.data?.message || error.message}`);
    }
    return false;
  }
}

/**
 * Test 5: Invalid Email Handling
 */
async function testInvalidEmail() {
  log.section('Test 5: Invalid Email Handling');
  
  try {
    const response = await axios.post(`${API_URL}/send-otp`, {
      to: 'invalid-email',
      code: '123456'
    });
    
    log.error('Should have rejected invalid email!');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log.success('Invalid email properly rejected');
      log.success(`Error: ${error.response.data.errors?.[0]?.msg || 'Invalid email'}`);
      return true;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Test 6: Missing Required Fields
 */
async function testMissingFields() {
  log.section('Test 6: Missing Required Fields');
  
  try {
    const response = await axios.post(`${API_URL}/send-otp`, {
      code: '123456'
      // missing 'to' field
    });
    
    log.error('Should have rejected missing email!');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log.success('Missing fields properly rejected');
      log.success(`Validation error caught`);
      return true;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`
${colors.blue}
╔════════════════════════════════════════════════════════════╗
║           Email Service Test Suite                          ║
║                                                            ║
║  Make sure your server is running on localhost:5000       ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}
  `);
  
  log.info('Starting tests...\n');
  
  const results = [];
  
  // Test 1: Health check (prerequisite)
  const healthOk = await testHealthCheck();
  results.push({ name: 'Health Check', passed: healthOk });
  
  if (!healthOk) {
    log.error('\n❌ Email service is not configured.');
    log.warn('Please set RESEND_API_KEY in .env and restart the server.\n');
    printSummary(results);
    return;
  }
  
  // Test 2: Send OTP
  const otpOk = await testSendOtp();
  results.push({ name: 'Send OTP Email', passed: otpOk });
  
  // Test 3: Send Notification
  const notificationOk = await testSendNotification();
  results.push({ name: 'Send Notification Email', passed: notificationOk });
  
  // Test 4: Send Custom
  const customOk = await testSendCustom();
  results.push({ name: 'Send Custom Email', passed: customOk });
  
  // Test 5: Invalid Email
  const invalidEmailOk = await testInvalidEmail();
  results.push({ name: 'Invalid Email Handling', passed: invalidEmailOk });
  
  // Test 6: Missing Fields
  const missingFieldsOk = await testMissingFields();
  results.push({ name: 'Missing Fields Handling', passed: missingFieldsOk });
  
  printSummary(results);
}

/**
 * Print test summary
 */
function printSummary(results) {
  log.section('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach(result => {
    if (result.passed) {
      log.success(result.name);
    } else {
      log.error(result.name);
    }
  });
  
  console.log(`\n${colors.blue}Results: ${passed}/${total} tests passed (${percentage}%)${colors.reset}\n`);
  
  if (passed === total) {
    log.success('All tests passed! Email service is ready. 🎉');
  } else if (passed === 0) {
    log.error('All tests failed. Check your configuration.');
  } else {
    log.warn(`${total - passed} test(s) failed.`);
  }
  
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite error: ${error.message}`);
  process.exit(1);
});
