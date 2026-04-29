const axios = require('axios');

async function testAuthDebug() {
  try {
    console.log('Testing authentication debug...');
    
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    console.log('Token:', token);
    
    // Test a simple auth endpoint first
    try {
      const authTestResponse = await axios.get('http://localhost:5000/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Auth test successful, teachers count:', authTestResponse.data.teachers?.length);
    } catch (error) {
      console.log('Auth test failed:', error.response?.data);
    }
    
    // Now test the pending endpoint
    try {
      const pendingResponse = await axios.get('http://localhost:5000/api/teachers/pending-test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Pending test successful:', pendingResponse.data);
    } catch (error) {
      console.log('Pending test failed:', error.response?.data);
    }
    
  } catch (error) {
    console.error('Error in auth debug:', error.response?.data || error.message);
  }
}

testAuthDebug();
