const axios = require('axios');

async function registerAnotherTeacher() {
  try {
    console.log('Creating another teacher registration...');
    
    const response = await axios.post('http://localhost:5000/api/teachers/register', {
      name: 'Sarah Johnson',
      email: 'sarahjohnson@school.com',
      password: 'password123'
    });
    
    console.log('Another teacher registration successful:');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error registering another teacher:', error.response?.data || error.message);
  }
}

registerAnotherTeacher();
