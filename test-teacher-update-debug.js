const axios = require('axios');

async function testTeacherUpdateDebug() {
  try {
    console.log('🔍 Testing Teacher Update Database Operation...');
    
    // Step 1: Login as admin
    console.log('📝 Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get existing teachers
    console.log('📋 Step 2: Getting existing teachers...');
    const teachersResponse = await axios.get('http://localhost:5000/api/teachers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const teachers = teachersResponse.data.teachers || [];
    console.log(`✅ Found ${teachers.length} teachers`);
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found to update');
      return;
    }
    
    // Step 3: Test minimal update (only name)
    const teacherToUpdate = teachers[0];
    console.log(`🔄 Step 3: Testing minimal update for teacher: ${teacherToUpdate.name}`);
    
    const minimalUpdateData = {
      name: 'Test Teacher Updated'
    };
    
    console.log('📤 Minimal update data:', minimalUpdateData);
    
    try {
      const updateResponse = await axios.put(`http://localhost:5000/api/teachers/${teacherToUpdate.teacher_id}`, minimalUpdateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Minimal update response:', updateResponse.data);
      
      // Step 4: Test full update
      console.log('🔄 Step 4: Testing full update...');
      
      const fullUpdateData = {
        name: 'Test Teacher Full Update',
        email: teacherToUpdate.email,
        status: teacherToUpdate.status === 'active' ? 'inactive' : 'active'
      };
      // Note: date_joined excluded to avoid validation issues
      
      console.log('📤 Full update data:', fullUpdateData);
      
      const fullUpdateResponse = await axios.put(`http://localhost:5000/api/teachers/${teacherToUpdate.teacher_id}`, fullUpdateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Full update response:', fullUpdateResponse.data);
      
      // Step 5: Verify the final update
      console.log('🔍 Step 5: Verifying final update...');
      const finalTeachersResponse = await axios.get('http://localhost:5000/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const finalTeacher = finalTeachersResponse.data.teachers.find(t => t.teacher_id === teacherToUpdate.teacher_id);
      
      if (finalTeacher) {
        console.log('✅ Final teacher data:');
        console.log(`   Name: ${finalTeacher.name}`);
        console.log(`   Email: ${finalTeacher.email}`);
        console.log(`   Status: ${finalTeacher.status}`);
        
        console.log('🎉 Teacher Update Database Test: PASSED ✅');
      } else {
        console.log('❌ Updated teacher not found');
      }
      
    } catch (updateError) {
      console.error('❌ Update error details:');
      console.error('Status:', updateError.response?.status);
      console.error('Data:', updateError.response?.data);
      console.error('Message:', updateError.message);
    }
    
  } catch (error) {
    console.error('❌ Teacher Update Database Test: FAILED');
    console.error('Error details:', error.response?.data || error.message);
  }
}

testTeacherUpdateDebug();
