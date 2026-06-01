const pool = require('./server/config/database');

async function listSchools() {
  try {
    console.log('Fetching schools from database...\n');

    const [schools] = await pool.execute(`
      SELECT 
        school_id,
        school_name,
        school_email,
        registration_number,
        status,
        subscription_status,
        created_at
      FROM schools
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);

    if (schools.length === 0) {
      console.log('No schools found in database.');
      console.log('\nCreating a sample school for testing...');

      // Create a sample school
      const [result] = await pool.execute(
        `INSERT INTO schools 
          (school_name, school_email, registration_number, school_address, phone, 
           status, subscription_status, province, district, sector, school_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Central High School',
          'admin@centralhigh.edu.rw',
          'RW-2024-001',
          '123 Education Street, Kigali',
          '+250788123456',
          'pending_approval',
          'trial',
          'Kigali City',
          'Gasabo',
          'URBAN',
          'Secondary'
        ]
      );

      console.log('✓ Sample school created with ID:', result.insertId);
      console.log('  School: Central High School');
      console.log('  Email: admin@centralhigh.edu.rw');
      console.log('  Status: pending_approval\n');

    } else {
      console.log('Found ' + schools.length + ' school(s):\n');
      schools.forEach((school, i) => {
        console.log(`${i + 1}. ${school.school_name}`);
        console.log(`   Email: ${school.school_email}`);
        console.log(`   Registration: ${school.registration_number}`);
        console.log(`   Status: ${school.status}`);
        console.log(`   Subscription: ${school.subscription_status}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

listSchools();
