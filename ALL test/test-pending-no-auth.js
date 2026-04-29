const axios = require('axios');

async function testPendingTeachersNoAuth() {
  try {
    console.log('Testing pending teachers API without authentication...');
    
    const response = await axios.get('http://localhost:5000/api/teachers/pending-test');
    
    console.log('Pending teachers API response:');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error testing pending teachers API:', error.response?.data || error.message);
  }
}

testPendingTeachersNoAuth();
