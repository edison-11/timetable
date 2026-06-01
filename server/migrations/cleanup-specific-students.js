const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

/**
 * Utility script to remove specific student records and their associated 
 * user accounts and attendance data based on a provided list.
 */
const cleanupSpecificStudents = async () => {
  const targetEmails = [
    'alice.uwase@school.com',
    'eric.niyonzima@school.com',
    'grace.mukamana@school.com',
    'patrick.habimana@school.com',
    'claudine.ishimwe@school.com'
  ];

  console.log(`Starting targeted cleanup for ${targetEmails.length} students...`);
  
  try {
    // 1. Export records to CSV before deleting
    const [students] = await pool.query('SELECT * FROM student WHERE email IN (?)', [targetEmails]);
    
    if (students.length > 0) {
      const csvPath = path.join(__dirname, 'deleted_students_backup.csv');
      const headers = Object.keys(students[0]).join(',');
      const rows = students.map(s => 
        Object.values(s).map(val => {
          if (val === null) return '""';
          // Escape quotes and wrap in quotes to handle commas within fields
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      ).join('\n');
      
      fs.writeFileSync(csvPath, `${headers}\n${rows}`);
      console.log(`Backup created successfully at: ${csvPath}`);
    }

    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Remove attendance records first to handle constraints
    await pool.query('DELETE FROM student_attendance WHERE student_id IN (SELECT student_id FROM student WHERE email IN (?))', [targetEmails]);
    
    // Remove records from student and users tables
    await pool.query('DELETE FROM student WHERE email IN (?)', [targetEmails]);
    await pool.query('DELETE FROM users WHERE email IN (?)', [targetEmails]);

    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Targeted cleanup finished successfully. The 5 student records have been removed.');
  } catch (error) {
    console.error('Failed to cleanup specific records:', error);
  } finally {
    await pool.end();
  }
};

cleanupSpecificStudents();