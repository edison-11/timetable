const bcrypt = require('bcryptjs');

// Test password comparison
const plainPassword = 'Teacher@123456';
const hashedPassword = '$2a$10$y6gLNe7uGfevPdeLlgttOO34htFQkUvCEr55Wq/ywPS7nG6/OwUTC';

bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('Password match result:', isMatch);
  console.log('Plain password:', plainPassword);
  console.log('Hashed password:', hashedPassword);
});
