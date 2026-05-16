const axios = require('axios');

async function testFrontendAccess() {
  try {
    console.log('Testing frontend access...');
    
    // Test if frontend HTML is served
    const response = await axios.get('http://localhost:5000/');
    console.log('✅ Frontend HTML accessible');
    console.log('Content type:', response.headers['content-type']);
    console.log('Content length:', response.data.length);
    
    // Test if API is working
    const apiResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123'
    });
    console.log('✅ API login working');
    console.log('Token received:', apiResponse.data.token ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('❌ Frontend access failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testFrontendAccess();
