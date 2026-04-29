const jwt = require('jsonwebtoken');
const User = require('./server/models/User');

async function testAdminAuthDirect() {
  try {
    console.log('Testing admin auth directly...');
    
    // First, let's login to get a token
    const axios = require('axios');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now let's decode the token and check the user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('User found:', user);
    
    if (user && user.role === 'admin') {
      console.log('User is admin, authentication should work');
    } else {
      console.log('User is not admin or not found');
    }
    
  } catch (error) {
    console.error('Error in admin auth direct test:', error.message);
  }
}

testAdminAuthDirect();
