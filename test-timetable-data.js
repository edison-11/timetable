const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test token - you may need to update this
const adminToken = 'test-admin-token'; // This will likely fail, we just want to see the response

(async () => {
  try {
    console.log('Fetching timetable data...\n');
    
    const response = await axios.get(`${BASE_URL}/timetable`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }).catch(err => {
      // Even if auth fails, we can see the error message
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Response:', JSON.stringify(err.response.data, null, 2));
      }
      return null;
    });

    if (response) {
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.timetables && response.data.timetables.length > 0) {
        const firstEntry = response.data.timetables[0];
        console.log('\n\nFirst timetable entry fields:');
        console.log(Object.keys(firstEntry));
        console.log('\n\nFirst entry:', JSON.stringify(firstEntry, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
