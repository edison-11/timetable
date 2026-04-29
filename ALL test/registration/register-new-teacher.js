const axios = require('axios');

async function registerNewTeacher() {
  try {
    console.log('Creating new teacher registration...');
    
    const response = await axios.post('http://localhost:5000/api/teachers/register', {
      name: 'John Smith',
      email: 'johnsmith@school.com',
      password: 'password123'
    });
    
    console.log('New teacher registration successful:');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error registering new teacher:', error.response?.data || error.message);
  }
}

registerNewTeacher();
