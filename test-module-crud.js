const axios = require('axios');

async function testModuleCRUD() {
  try {
    console.log('🧪 Testing Module CRUD Functionality...');
    
    // Step 1: Login as admin
    console.log('📝 Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get existing modules
    console.log('📋 Step 2: Getting existing modules...');
    const modulesResponse = await axios.get('http://localhost:5000/api/modules', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const modules = modulesResponse.data.modules || [];
    console.log(`✅ Found ${modules.length} existing modules`);
    
    // Step 3: Test module creation
    console.log('🔄 Step 3: Testing module creation...');
    const newModule = {
      module_name: 'Test Module',
      hours_per_year: 120,
      description: 'This is a test module for CRUD functionality'
    };
    
    console.log('📤 Creating module:', newModule);
    
    const createResponse = await axios.post('http://localhost:5000/api/modules', newModule, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Module created successfully:', createResponse.data);
    
    // Step 4: Verify module was created
    console.log('🔍 Step 4: Verifying module creation...');
    const updatedModulesResponse = await axios.get('http://localhost:5000/api/modules', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const createdModule = updatedModulesResponse.data.modules.find(m => m.module_name === 'Test Module');
    
    if (createdModule) {
      console.log('✅ Module found in database:');
      console.log(`   Name: ${createdModule.module_name}`);
      console.log(`   Hours: ${createdModule.hours_per_year}`);
      console.log(`   Description: ${createdModule.description}`);
      
      // Step 5: Test module update
      console.log('🔄 Step 5: Testing module update...');
      
      const updateData = {
        module_name: 'Test Module Updated',
        hours_per_year: 150,
        description: 'This is an updated test module'
      };
      
      const updateResponse = await axios.put(`http://localhost:5000/api/modules/${createdModule.module_id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Module updated successfully:', updateResponse.data);
      
      // Step 6: Verify module update
      console.log('🔍 Step 6: Verifying module update...');
      const finalModulesResponse = await axios.get('http://localhost:5000/api/modules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const updatedModule = finalModulesResponse.data.modules.find(m => m.module_id === createdModule.module_id);
      
      if (updatedModule) {
        console.log('✅ Updated module found:');
        console.log(`   Name: ${updatedModule.module_name}`);
        console.log(`   Hours: ${updatedModule.hours_per_year}`);
        console.log(`   Description: ${updatedModule.description}`);
        
        // Step 7: Test module deletion
        console.log('🔄 Step 7: Testing module deletion...');
        
        const deleteResponse = await axios.delete(`http://localhost:5000/api/modules/${updatedModule.module_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Module deleted successfully:', deleteResponse.data);
        
        // Step 8: Verify module deletion
        console.log('🔍 Step 8: Verifying module deletion...');
        const finalCheckResponse = await axios.get('http://localhost:5000/api/modules', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const deletedModule = finalCheckResponse.data.modules.find(m => m.module_id === updatedModule.module_id);
        
        if (!deletedModule) {
          console.log('🎉 Module CRUD Test: PASSED ✅');
          console.log('✅ All operations working correctly:');
          console.log('   - Create: ✅');
          console.log('   - Read: ✅');
          console.log('   - Update: ✅');
          console.log('   - Delete: ✅');
        } else {
          console.log('❌ Module deletion failed - module still exists');
        }
      } else {
        console.log('❌ Updated module not found');
      }
    } else {
      console.log('❌ Created module not found');
    }
    
  } catch (error) {
    console.error('❌ Module CRUD Test: FAILED');
    console.error('Error details:', error.response?.data || error.message);
  }
}

testModuleCRUD();
