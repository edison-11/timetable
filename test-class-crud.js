const axios = require('axios');

async function testClassCRUD() {
  try {
    console.log('Testing Class CRUD Functionality...');
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Step 2: Get existing classes
    console.log('Step 2: Getting existing classes...');
    const classesResponse = await axios.get('http://localhost:5000/api/classes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const classes = classesResponse.data.classes || [];
    console.log(`Found ${classes.length} existing classes`);
    
    // Step 3: Get required data for class creation
    console.log('Step 3: Getting teachers, shifts, sections, and DOS...');
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
    
    console.log(`Found ${teachers.length} teachers, ${shifts.length} shifts, ${sections.length} sections, ${dosList.length} DOS`);
    
    // Step 4: Create a new class
    console.log('Step 4: Creating a new class...');
    const newClass = {
      class_name: 'Test Class 10A',
      level: 'Grade 10',
      academic_year: '2024-2025',
      class_teacher_id: teachers.length > 0 ? teachers[0].teacher_id : null,
      shift_id: shifts.length > 0 ? shifts[0].shift_id : null,
      section_id: sections.length > 0 ? sections[0].section_id : null,
      dos_id: dosList.length > 0 ? dosList[0].dos_id : null
    };
    
    console.log('Creating class:', newClass);
    
    const createResponse = await axios.post('http://localhost:5000/api/classes', newClass, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Class created successfully:', createResponse.data);
    const createdClass = createResponse.data.class;
    
    // Step 5: Verify class was created
    console.log('Step 5: Verifying class creation...');
    const updatedClassesResponse = await axios.get('http://localhost:5000/api/classes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const verifiedClass = updatedClassesResponse.data.classes.find(c => c.class_id === createdClass.class_id);
    
    if (verifiedClass) {
      console.log('Class found in database:');
      console.log(`   Name: ${verifiedClass.class_name}`);
      console.log(`   Level: ${verifiedClass.level}`);
      console.log(`   Academic Year: ${verifiedClass.academic_year}`);
      console.log(`   Class Teacher: ${verifiedClass.class_teacher_name || 'None'}`);
      console.log(`   Shift: ${verifiedClass.shift_name || 'None'}`);
      console.log(`   Section: ${verifiedClass.section_name || 'None'}`);
      console.log(`   DOS: ${verifiedClass.dos_name || 'None'}`);
      
      // Step 6: Test class update
      console.log('Step 6: Testing class update...');
      
      const updateData = {
        class_name: 'Test Class 10A Updated',
        level: 'Grade 10',
        academic_year: '2024-2025'
      };
      
      // Only include optional fields if they exist
      if (teachers.length > 1) {
        updateData.class_teacher_id = teachers[1].teacher_id;
      }
      if (shifts.length > 1) {
        updateData.shift_id = shifts[1].shift_id;
      }
      if (sections.length > 1) {
        updateData.section_id = sections[1].section_id;
      }
      if (dosList.length > 1) {
        updateData.dos_id = dosList[1].dos_id;
      }
      
      const updateResponse = await axios.put(`http://localhost:5000/api/classes/${createdClass.class_id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Class updated successfully:', updateResponse.data);
      
      // Step 7: Verify class update
      console.log('Step 7: Verifying class update...');
      const finalClassesResponse = await axios.get('http://localhost:5000/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const updatedClass = finalClassesResponse.data.classes.find(c => c.class_id === createdClass.class_id);
      
      if (updatedClass) {
        console.log('Updated class found:');
        console.log(`   Name: ${updatedClass.class_name}`);
        console.log(`   Class Teacher: ${updatedClass.class_teacher_name || 'None'}`);
        console.log(`   Shift: ${updatedClass.shift_name || 'None'}`);
        console.log(`   Section: ${updatedClass.section_name || 'None'}`);
        console.log(`   DOS: ${updatedClass.dos_name || 'None'}`);
        
        // Step 8: Test class deletion
        console.log('Step 8: Testing class deletion...');
        
        const deleteResponse = await axios.delete(`http://localhost:5000/api/classes/${updatedClass.class_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Class deleted successfully:', deleteResponse.data);
        
        // Step 9: Verify class deletion
        console.log('Step 9: Verifying class deletion...');
        const finalCheckResponse = await axios.get('http://localhost:5000/api/classes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const deletedClass = finalCheckResponse.data.classes.find(c => c.class_id === updatedClass.class_id);
        
        if (!deletedClass) {
          console.log('Class CRUD Test: PASSED');
          console.log('All operations working correctly:');
          console.log('   - Create: PASSED');
          console.log('   - Read: PASSED');
          console.log('   - Update: PASSED');
          console.log('   - Delete: PASSED');
        } else {
          console.log('Class deletion failed - class still exists');
        }
      } else {
        console.log('Updated class not found');
      }
    } else {
      console.log('Created class not found');
    }
    
  } catch (error) {
    console.error('Class CRUD Test: FAILED');
    console.error('Error details:', error.response?.data || error.message);
  }
}

testClassCRUD();
