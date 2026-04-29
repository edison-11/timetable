const axios = require('axios');

async function testDirectApprovalSarah() {
  try {
    console.log('Testing direct teacher approval without auth...');
    
    // Get pending teachers first
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    const teacherToApprove = pendingResponse.data.pendingTeachers.find(t => t.email === 'sarahjohnson@school.com');
    
    console.log('Approving teacher:', teacherToApprove.name, 'ID:', teacherToApprove.teacher_id);
    
    // Test the direct approval endpoint without auth
    const response = await axios.put(`http://localhost:5000/api/teachers/${teacherToApprove.teacher_id}/approve-test`);
    
    console.log('Direct approval response:', response.data);
    
    // Verify the approval worked
    const updatedPendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    console.log('Remaining pending teachers:', updatedPendingResponse.data.pendingTeachers.length);
    
  } catch (error) {
    console.error('Error testing direct approval:', error.response?.data || error.message);
  }
}

testDirectApprovalSarah();
