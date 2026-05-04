const axios = require('axios');

// Test Sections API functionality
async function testSectionsAPI() {
  console.log('Testing Sections API Functionality...\n');

  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@timetable.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Get all sections
    console.log('Step 2: Getting all sections...');
    const sectionsResponse = await axios.get('http://localhost:5000/api/sections', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sections = sectionsResponse.data.sections;
    console.log(`✅ Found ${sections.length} sections`);
    console.log('Sample sections:', sections.slice(0, 3).map(s => `${s.section_name} (${s.level})`));
    console.log();

    // Step 3: Get sections with class count
    console.log('Step 3: Getting sections with class count...');
    const sectionsWithCountResponse = await axios.get('http://localhost:5000/api/sections/with-count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sectionsWithCount = sectionsWithCountResponse.data.sections;
    console.log('✅ Sections with class count retrieved');
    console.log('Sample sections with counts:', sectionsWithCount.slice(0, 3).map(s => `${s.section_name} (${s.level}): ${s.class_count} classes`));
    console.log();

    // Step 4: Add a new section
    console.log('Step 4: Adding a new section...');
    const newSectionData = {
      section_name: 'Test Section',
      level: 'Grade 12',
      description: 'Test section for API validation'
    };
    const addSectionResponse = await axios.post('http://localhost:5000/api/sections', newSectionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const addedSection = addSectionResponse.data.section;
    console.log('✅ Section added successfully!');
    console.log('Added section:', addedSection);
    console.log();

    // Step 5: Update the section
    console.log('Step 5: Updating the section...');
    const updateData = {
      section_name: 'Updated Test Section',
      level: 'Grade 12',
      description: 'Updated test section'
    };
    const updateResponse = await axios.put(`http://localhost:5000/api/sections/${addedSection.section_id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedSection = updateResponse.data.section;
    console.log('✅ Section updated successfully!');
    console.log('Updated section:', updatedSection);
    console.log();

    // Step 6: Delete the test section
    console.log('Step 6: Deleting the test section...');
    await axios.delete(`http://localhost:5000/api/sections/${addedSection.section_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Section deleted successfully!\n');

    console.log('🎉 All sections API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSectionsAPI();