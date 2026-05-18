const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

async function setupAdmin() {
  try {
    // First, try to login as admin (assuming admin exists)
    console.log('Attempting to approve teacher...');
    
    // We'll call the test approval endpoint
    const approveRes = await api.put('/teachers/10/approve-test');
    
    console.log('Teacher approved:', approveRes.data);
    
    // Now try to login
    const loginRes = await api.post('/teacher-auth/login', {
      email: 'john.smith@school.com',
      password: 'password123'
    });
    
    console.log('Teacher login successful!');
    console.log('Token:', loginRes.data.token);
    console.log('\nYou can now login with:');
    console.log('Email: john.smith@school.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

setupAdmin();
