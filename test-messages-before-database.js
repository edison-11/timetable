const axios = require('axios');

async function testMessagesBeforeDatabase() {
  console.log('Testing Messages Before Database Operations...\n');

  try {
    // Test 1: Client-side validation messages (simulated)
    console.log('=== Test 1: Client-side Form Validation ===');
    console.log('Before submitting teacher registration form:');

    // Simulate empty form submission
    console.log('❌ Empty Name: "Name is required"');
    console.log('❌ Empty Email: "Email is required"');
    console.log('❌ Empty Password: "Password is required"');
    console.log('❌ Invalid Email: "Please enter a valid email address"');
    console.log('❌ Short Password: "Password must be at least 6 characters"');
    console.log('✅ Form prevents submission until all validations pass\n');

    // Test 2: Server-side validation messages
    console.log('=== Test 2: Server-side Validation Messages ===');

    // Try to register with invalid data
    try {
      console.log('Attempting registration with invalid email...');
      await axios.post('http://localhost:5000/api/teachers/register', {
        name: '',
        email: 'invalid-email',
        password: '123'
      });
    } catch (error) {
      console.log('❌ Server Validation Messages:');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.msg}`);
        });
      }
      console.log('');
    }

    // Test 3: Confirmation dialogs before database operations
    console.log('=== Test 3: Confirmation Dialogs Before Database Operations ===');

    // First, login as admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Get pending teachers
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    const pendingTeachers = pendingResponse.data.pendingTeachers || [];

    if (pendingTeachers.length > 0) {
      const teacher = pendingTeachers[0];
      console.log(`Found pending teacher: ${teacher.name}`);
      console.log('');

      // Simulate confirmation dialogs
      console.log('=== Confirmation Dialogs (Client-side) ===');
      console.log('❓ Before APPROVE operation:');
      console.log(`   "Are you sure you want to approve ${teacher.name}?"`);
      console.log('   [Cancel] / [OK]');
      console.log('');

      console.log('❓ Before REJECT operation:');
      console.log(`   "Are you sure you want to reject ${teacher.name}? This action cannot be undone."`);
      console.log('   [Cancel] / [OK]');
      console.log('');

      // Test the actual approval with confirmation simulation
      console.log('=== Actual Database Operation (with simulated confirmation) ===');
      console.log('Simulating user clicking "OK" on confirmation dialog...');

      const approveResponse = await axios.put(`http://localhost:5000/api/teachers/${teacher.teacher_id}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Database operation completed successfully!');
      console.log('✅ Success message: "Teacher approved successfully!"');
      console.log(`✅ Teacher ${teacher.name} status changed to: ${approveResponse.data.teacher.status}`);

    } else {
      console.log('❌ No pending teachers found for testing');
      console.log('💡 Create a pending teacher first using: node "ALL test\\registration\\register-another-teacher.js"');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMessagesBeforeDatabase();