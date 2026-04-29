const axios = require('axios');

async function testPendingTeachersAPI() {
  try {
    console.log('Testing pending teachers API endpoint...');
    
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now test the pending teachers endpoint
    const response = await axios.get('http://localhost:5000/api/teachers/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Pending teachers API response:');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error testing pending teachers API:', error.response?.data || error.message);
  }
}

testPendingTeachersAPI();
