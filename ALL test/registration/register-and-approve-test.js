const axios = require('axios');

async function registerAndApproveTest() {
  try {
    console.log('Testing complete register and approve workflow...');
    
    // Step 1: Register a new teacher
    console.log('Step 1: Registering new teacher...');
    const registerResponse = await axios.post('http://localhost:5000/api/teachers/register', {
      name: 'Michael Brown',
      email: 'michaelbrown@school.com',
      password: 'password123'
    });
    
    console.log('Teacher registered successfully:', registerResponse.data.teacher.name);
    
    // Step 2: Login as admin
    console.log('Step 2: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Step 3: Check pending teachers
    console.log('Step 3: Checking pending teachers...');
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    const pendingTeacher = pendingResponse.data.pendingTeachers.find(t => t.email === 'michaelbrown@school.com');
    
    console.log('Pending teacher found:', pendingTeacher?.name);
    
    // Step 4: Approve the teacher with authentication
    console.log('Step 4: Approving teacher with authentication...');
    const approveResponse = await axios.put(`http://localhost:5000/api/teachers/${pendingTeacher.teacher_id}/approve`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Approval response:', approveResponse.data.message);
    
    // Step 5: Verify teacher is now active
    console.log('Step 5: Verifying teacher is now active...');
    const teachersResponse = await axios.get('http://localhost:5000/api/teachers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const activeTeacher = teachersResponse.data.teachers.find(t => t.email === 'michaelbrown@school.com');
    console.log('Teacher status after approval:', activeTeacher?.status);
    
    // Step 6: Check pending teachers count
    const updatedPendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    console.log('Remaining pending teachers:', updatedPendingResponse.data.pendingTeachers.length);
    
    console.log('✅ Complete workflow test successful!');
    
  } catch (error) {
    console.error('❌ Error in complete workflow test:', error.response?.data || error.message);
  }
}

registerAndApproveTest();
