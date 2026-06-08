const bcrypt = require('bcryptjs');

const plainPassword = 'password123';
const hash = '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa';

bcrypt.compare(plainPassword, hash).then(isMatch => {
  console.log('Password match:', isMatch);
  if (isMatch) {
    console.log('✅ Login should work!');
  } else {
    console.log('❌ Password does NOT match the hash');
  }
}).catch(err => {
  console.error('Error:', err.message);
});
