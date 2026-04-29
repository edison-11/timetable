const axios = require('axios');

async function testClassTeacherAssignment() {
  try {
    console.log('Testing class teacher assignment...\n');

    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = login.data.token;

    // Try adding class with teacher ID 28 (Sarah Johnson)
    const newClass = {
      class_name: 'Grade 11B',
      level: 'Grade 11',
      academic_year: '2024-2025',
      class_teacher_id: 28,
      shift_id: 1,
      section_id: 1,
      dos_id: 1
    };

    console.log('Adding class with teacher ID 28 (Sarah Johnson)...');
    const response = await axios.post('http://localhost:5000/api/classes', newClass, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Success! Class teacher assigned:', response.data.class.class_teacher_id);
    console.log('Class details:', {
      class_name: response.data.class.class_name,
      class_teacher_name: response.data.class.class_teacher_name,
      class_teacher_department: response.data.class.class_teacher_department
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testClassTeacherAssignment();