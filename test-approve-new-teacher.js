const axios = require('axios');

async function testApproveNewTeacher() {
  try {
    console.log('Testing Teacher Approval Functionality...');
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful');
    
    // Step 2: Get pending teachers
    console.log('Step 2: Getting pending teachers...');
    const pendingResponse = await axios.get('http://localhost:5000/api/pending/teachers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const pendingTeachers = pendingResponse.data.pendingTeachers || [];
    console.log(`Found ${pendingTeachers.length} pending teachers`);
    
    if (pendingTeachers.length === 0) {
      console.log('No pending teachers found. Creating a new teacher...');
      
      // Step 3: Create a new teacher
      console.log('Step 3: Creating a new teacher...');
      const newTeacher = {
        name: 'Test Teacher Approval',
        email: 'testapproval@example.com',
        password: 'password123'
      };
      
      const registerResponse = await axios.post('http://localhost:5000/api/teachers/register', newTeacher);
      console.log('New teacher created:', registerResponse.data);
      
      // Get pending teachers again
      const updatedPendingResponse = await axios.get('http://localhost:5000/api/pending/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const updatedPendingTeachers = updatedPendingResponse.data.pendingTeachers || [];
      console.log(`Found ${updatedPendingTeachers.length} pending teachers after registration`);
      
      if (updatedPendingTeachers.length > 0) {
        const teacherToApprove = updatedPendingTeachers[0];
        console.log(`Step 4: Approving teacher: ${teacherToApprove.name}`);
        
        // Step 4: Approve the teacher
        const approveResponse = await axios.put(`http://localhost:5000/api/teachers/${teacherToApprove.teacher_id}/approve`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Teacher approval response:', approveResponse.data);
        
        // Step 5: Verify the teacher is now active
        console.log('Step 5: Verifying teacher approval...');
        const allTeachersResponse = await axios.get('http://localhost:5000/api/teachers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const approvedTeacher = allTeachersResponse.data.teachers.find(t => t.teacher_id === teacherToApprove.teacher_id);
        
        if (approvedTeacher && approvedTeacher.status === 'active') {
          console.log('Teacher approval test: PASSED');
          console.log(`Teacher ${approvedTeacher.name} is now ${approvedTeacher.status}`);
        } else {
          console.log('Teacher approval test: FAILED');
          console.log('Teacher was not found or not approved');
        }
      }
    } else {
      // Approve existing pending teacher
      const teacherToApprove = pendingTeachers[0];
      console.log(`Step 3: Approving existing teacher: ${teacherToApprove.name}`);
      
      const approveResponse = await axios.put(`http://localhost:5000/api/teachers/${teacherToApprove.teacher_id}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Teacher approval response:', approveResponse.data);
      
      // Verify approval
      const allTeachersResponse = await axios.get('http://localhost:5000/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const approvedTeacher = allTeachersResponse.data.teachers.find(t => t.teacher_id === teacherToApprove.teacher_id);
      
      if (approvedTeacher && approvedTeacher.status === 'active') {
        console.log('Teacher approval test: PASSED');
        console.log(`Teacher ${approvedTeacher.name} is now ${approvedTeacher.status}`);
      } else {
        console.log('Teacher approval test: FAILED');
        console.log('Teacher was not found or not approved');
      }
    }
    
  } catch (error) {
    console.error('Teacher approval test: FAILED');
    console.error('Error details:', error.response?.data || error.message);
  }
}

testApproveNewTeacher();
