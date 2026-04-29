const axios = require('axios');

async function testNewPendingTeachers() {
  try {
    console.log('Testing new pending teachers route...');
    
    const response = await axios.get('http://localhost:5000/api/pending/teachers');
    
    console.log('New pending teachers API response:');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error testing new pending teachers API:', error.response?.data || error.message);
  }
}

testNewPendingTeachers();
