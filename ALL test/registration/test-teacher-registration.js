const axios = require('axios');

async function testTeacherRegistration() {
  try {
    console.log('Creating test teacher registration...');
    
    const response = await axios.post('http://localhost:5000/api/teachers/register', {
      name: 'Test Teacher',
      email: 'add@school.com',
      password: 'password123'
    });
    
    console.log('Teacher registration successful:');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error registering teacher:', error.response?.data || error.message);
  }
}

testTeacherRegistration();
