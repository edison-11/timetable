const axios = require('axios');

async function testApproveTeacher() {
  try {
    console.log('Testing teacher approval...');
    
    // First, login to get admin token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Get pending teachers first
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    console.log('Pending teachers:', pendingResponse.data);
    
    if (pendingResponse.data.pendingTeachers && pendingResponse.data.pendingTeachers.length > 0) {
      const teacherToApprove = pendingResponse.data.pendingTeachers[0];
      console.log('Approving teacher:', teacherToApprove);
      
      // Approve the teacher
      const approveResponse = await axios.put(`http://localhost:5000/api/teachers/${teacherToApprove.teacher_id}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Approval response:', approveResponse.data);
      
      // Check if teacher is now in active list
      const teachersResponse = await axios.get('http://localhost:5000/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Active teachers after approval:', teachersResponse.data.teachers?.length);
      
    } else {
      console.log('No pending teachers to approve');
    }
    
  } catch (error) {
    console.error('Error testing teacher approval:', error.response?.data || error.message);
  }
}

testApproveTeacher();
