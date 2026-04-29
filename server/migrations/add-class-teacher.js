const pool = require('../config/database');

async function addClassTeacher() {
  const [columns] = await pool.query("SHOW COLUMNS FROM class LIKE 'class_teacher_id'");

  if (!columns.length) {
    await pool.query(
      'ALTER TABLE class ADD COLUMN class_teacher_id INT NULL AFTER academic_year'
    );
    await pool.query(
      'ALTER TABLE class ADD CONSTRAINT fk_class_teacher FOREIGN KEY (class_teacher_id) REFERENCES teacher(teacher_id) ON DELETE SET NULL'
    );
    console.log('class_teacher_id column added');
  } else {
    console.log('class_teacher_id column already exists');
  }
}

addClassTeacher()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
