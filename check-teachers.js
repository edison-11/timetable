const axios = require('axios');

async function checkTeachers() {
  try {
    console.log('Checking active teachers...\n');

    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = login.data.token;

    const teachers = await axios.get('http://localhost:5000/api/teachers/active', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Active teachers:');
    teachers.data.teachers.forEach(t => {
      console.log(`ID: ${t.teacher_id}, Name: ${t.name}, Status: ${t.status}, Department: ${t.department}`);
    });

    // Also check all teachers
    console.log('\nAll teachers:');
    const allTeachers = await axios.get('http://localhost:5000/api/teachers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    allTeachers.data.teachers.forEach(t => {
      console.log(`ID: ${t.teacher_id}, Name: ${t.name}, Status: ${t.status}, Department: ${t.department}`);
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkTeachers();