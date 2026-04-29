const axios = require('axios');

async function testTeacherUpdateCRUD() {
  try {
    console.log('🧪 Testing CRUD Update Teacher Functionality...');
    
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
    
    // Step 3: Test teacher update
    const teacherToUpdate = teachers[0];
    console.log(`🔄 Step 3: Testing update for teacher: ${teacherToUpdate.name}`);
    
    const updateData = {
      name: `${teacherToUpdate.name} (Updated)`,
      email: teacherToUpdate.email,
      status: teacherToUpdate.status === 'active' ? 'inactive' : 'active'
    };
    
    console.log('📤 Update data:', updateData);
    
    const updateResponse = await axios.put(`http://localhost:5000/api/teachers/${teacherToUpdate.teacher_id}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update response:', updateResponse.data);
    
    // Step 4: Verify the update
    console.log('🔍 Step 4: Verifying update...');
    const updatedTeachersResponse = await axios.get('http://localhost:5000/api/teachers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedTeacher = updatedTeachersResponse.data.teachers.find(t => t.teacher_id === teacherToUpdate.teacher_id);
    
    if (updatedTeacher) {
      console.log('✅ Updated teacher data:');
      console.log(`   Name: ${updatedTeacher.name}`);
      console.log(`   Email: ${updatedTeacher.email}`);
      console.log(`   Status: ${updatedTeacher.status}`);
      
      // Verify the changes
      const nameChanged = updatedTeacher.name === updateData.name;
      const statusChanged = updatedTeacher.status === updateData.status;
      
      console.log(`📊 Update verification:`);
      console.log(`   Name changed: ${nameChanged ? '✅' : '❌'}`);
      console.log(`   Status changed: ${statusChanged ? '✅' : '❌'}`);
      
      if (nameChanged && statusChanged) {
        console.log('🎉 CRUD Update Teacher Test: PASSED ✅');
      } else {
        console.log('⚠️ CRUD Update Teacher Test: PARTIAL PASS ⚠️');
      }
    } else {
      console.log('❌ Updated teacher not found');
    }
    
  } catch (error) {
    console.error('❌ CRUD Update Teacher Test: FAILED');
    console.error('Error details:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication error - checking token...');
    } else if (error.response?.status === 404) {
      console.log('🔍 Teacher not found error');
    } else if (error.response?.status === 400) {
      console.log('📝 Validation error:', error.response.data.errors);
    }
  }
}

testTeacherUpdateCRUD();
