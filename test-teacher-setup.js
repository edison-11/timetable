const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

async function setupTestTeacher() {
  try {
    console.log('Setting up test teacher...');
    
    // Register teacher
    const registerRes = await api.post('/teacher-auth/register', {
      name: 'John Smith',
      email: 'john.smith@school.com',
      password: 'password123',
      department: 'Mathematics',
      employee_id: 'EMP001',
      employeeId: 'EMP001',
      phone: '555-1234',
      module_name: 'Mathematics'
    });
    
    console.log('Teacher registered:', registerRes.data);
    
    // Login
    const loginRes = await api.post('/teacher-auth/login', {
      email: 'john.smith@school.com',
      password: 'password123'
    });
    
    console.log('Teacher logged in:', loginRes.data);
    console.log('\nLogin credentials:');
    console.log('Email: john.smith@school.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

setupTestTeacher();
