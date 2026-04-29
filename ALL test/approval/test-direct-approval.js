const axios = require('axios');

async function testDirectApproval() {
  try {
    console.log('Testing direct teacher approval without auth...');
    
    // Get pending teachers first
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers');
    const teacherToApprove = pendingResponse.data.pendingTeachers[0];
    
    console.log('Approving teacher:', teacherToApprove.name, 'ID:', teacherToApprove.teacher_id);
    
    // Create a temporary approval endpoint without auth
    const testApprovalEndpoint = async (teacherId) => {
      try {
        const response = await axios.put(`http://localhost:5000/api/teachers/${teacherId}/approve-test`);
        return response.data;
      } catch (error) {
        return error.response?.data;
      }
    };
    
    // Test the approval
    const result = await testApprovalEndpoint(teacherToApprove.teacher_id);
    console.log('Direct approval result:', result);
    
  } catch (error) {
    console.error('Error testing direct approval:', error.response?.data || error.message);
  }
}

testDirectApproval();
