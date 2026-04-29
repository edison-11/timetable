const axios = require('axios');

async function testAddClass() {
  console.log('Testing Class Addition Functionality...\n');

  try {
    // First, login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Get existing data for reference
    console.log('Step 2: Getting reference data...');
    const [teachersResponse, shiftsResponse, sectionsResponse, dosResponse] = await Promise.all([
      axios.get('http://localhost:5000/api/teachers/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      axios.get('http://localhost:5000/api/shifts', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      axios.get('http://localhost:5000/api/sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      axios.get('http://localhost:5000/api/dos', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const teachers = teachersResponse.data.teachers || [];
    const shifts = shiftsResponse.data.shifts || [];
    const sections = sectionsResponse.data.sections || [];
    const dosList = dosResponse.data.dos || [];

    console.log(`Found ${teachers.length} active teachers`);
    console.log(`Found ${shifts.length} shifts`);
    console.log(`Found ${sections.length} sections`);
    console.log(`Found ${dosList.length} DOS entries\n`);

    // Test 3: Add a new class
    console.log('Step 3: Adding a new class...');

    const newClass = {
      class_name: 'Grade 10A',
      level: 'Grade 10',
      academic_year: '2024-2025',
      class_teacher_id: teachers.length > 0 ? teachers[0].teacher_id : null,
      shift_id: shifts.length > 0 ? shifts[0].shift_id : null,
      section_id: sections.length > 0 ? sections[0].section_id : null,
      dos_id: dosList.length > 0 ? dosList[0].dos_id : null
    };

    console.log('Class data to add:', newClass);

    const addResponse = await axios.post('http://localhost:5000/api/classes', newClass, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Class added successfully!');
    console.log('Response:', addResponse.data);

    // Test 4: Verify the class was added
    console.log('\nStep 4: Verifying class was added...');
    const classesResponse = await axios.get('http://localhost:5000/api/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const addedClass = classesResponse.data.classes.find(c => c.class_name === 'Grade 10A');
    if (addedClass) {
      console.log('✅ Class verification successful!');
      console.log('Added class details:', {
        class_id: addedClass.class_id,
        class_name: addedClass.class_name,
        level: addedClass.level,
        academic_year: addedClass.academic_year,
        class_teacher_name: addedClass.class_teacher_name,
        shift_name: addedClass.shift_name,
        section_name: addedClass.section_name,
        dos_name: addedClass.dos_name
      });
    } else {
      console.log('❌ Class verification failed - class not found in list');
    }

    // Test 5: Test validation (try to add invalid class)
    console.log('\nStep 5: Testing validation with invalid data...');
    try {
      await axios.post('http://localhost:5000/api/classes', {
        class_name: '', // Invalid: empty class name
        level: '', // Invalid: empty level
        academic_year: '2024-2025'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.log('✅ Validation working correctly!');
      console.log('Validation errors:', error.response?.data?.errors || error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAddClass();