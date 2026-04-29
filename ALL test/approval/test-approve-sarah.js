const axios = require('axios');

async function testApproveSarah() {
  try {
    console.log('Testing teacher approval for Sarah Johnson...');
    
    // First, login to get admin token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Get pending teachers first
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    console.log('Pending teachers:', pendingResponse.data.pendingTeachers.length);
    
    if (pendingResponse.data.pendingTeachers && pendingResponse.data.pendingTeachers.length > 0) {
      const teacherToApprove = pendingResponse.data.pendingTeachers.find(t => t.email === 'sarahjohnson@school.com');
      
      if (teacherToApprove) {
        console.log('Approving teacher:', teacherToApprove.name);
        
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
        
        const approvedTeacher = teachersResponse.data.teachers.find(t => t.email === 'sarahjohnson@school.com');
        console.log('Teacher status after approval:', approvedTeacher?.status);
        
      } else {
        console.log('Sarah Johnson not found in pending teachers');
        console.log('Available pending teachers:', pendingResponse.data.pendingTeachers.map(t => t.name));
      }
    } else {
      console.log('No pending teachers to approve');
    }
    
  } catch (error) {
    console.error('Error testing teacher approval:', error.response?.data || error.message);
  }
}

testApproveSarah();
