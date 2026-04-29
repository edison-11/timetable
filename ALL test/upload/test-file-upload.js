const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testFileUpload() {
  try {
    // Get authentication token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtained successfully');

    // Create form data for file upload
    const form = new FormData();
    form.append('file', fs.createReadStream('test-upload.txt'));

    // Upload file
    const uploadResponse = await axios.post('http://localhost:5000/api/upload/single', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('File upload successful:', uploadResponse.data);
    
    // Test accessing uploaded file
    if (uploadResponse.data.file && uploadResponse.data.file.path) {
      const fileUrl = `http://localhost:5000${uploadResponse.data.file.path}`;
      console.log('Testing file access at:', fileUrl);
      
      try {
        const fileResponse = await axios.get(fileUrl);
        console.log('File access successful - File size:', fileResponse.data.length, 'bytes');
      } catch (error) {
        console.log('File access failed:', error.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Check if required packages are available
try {
  require('axios');
  require('form-data');
  testFileUpload();
} catch (error) {
  console.log('Required packages not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install axios form-data', { stdio: 'inherit' });
  testFileUpload();
}
