const pool = require('../server/config/database');

const FROM_EMAIL = 'teacher1@school.com';
const TO_EMAIL = 'claude@school.com';
const MODULE_NAME = 'Computer Essentials';
const MODULE_CODE = 'SWDCE301';

const run = async () => {
  const [[fromTeacher]] = await pool.execute(
    'SELECT teacher_id, name, email FROM teacher WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [FROM_EMAIL]
  );
  const [[toTeacher]] = await pool.execute(
    'SELECT teacher_id, name, email FROM teacher WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [TO_EMAIL]
  );

  if (!fromTeacher) throw new Error(`Source teacher not found: ${FROM_EMAIL}`);
  if (!toTeacher) throw new Error(`Target teacher not found: ${TO_EMAIL}`);

  const [assignments] = await pool.execute(
    `SELECT a.assignment_id, a.class_id, a.module_id, m.module_name, c.class_name
     FROM assignment a
     JOIN module m ON m.module_id = a.module_id
     JOIN class c ON c.class_id = a.class_id
     WHERE a.teacher_id = ?
       AND (LOWER(m.module_name) LIKE LOWER(?) OR LOWER(m.module_name) LIKE LOWER(?))`,
    [fromTeacher.teacher_id, `%${MODULE_NAME}%`, `%${MODULE_CODE}%`]
  );

  if (!assignments.length) {
    console.log(`${MODULE_NAME} is already not assigned to ${FROM_EMAIL}.`);
    return;
  }

  for (const assignment of assignments) {
    const [[existingTarget]] = await pool.execute(
      `SELECT assignment_id
       FROM assignment
       WHERE teacher_id = ? AND module_id = ? AND class_id = ?
       LIMIT 1`,
      [toTeacher.teacher_id, assignment.module_id, assignment.class_id]
    );

    if (existingTarget) {
      await pool.execute(
        'UPDATE timetable SET assignment_id = ? WHERE assignment_id = ?',
        [existingTarget.assignment_id, assignment.assignment_id]
      );
      await pool.execute('DELETE FROM assignment WHERE assignment_id = ?', [assignment.assignment_id]);
      console.log(`Merged duplicate ${MODULE_NAME} assignment for ${assignment.class_name}.`);
    } else {
      await pool.execute(
        'UPDATE assignment SET teacher_id = ? WHERE assignment_id = ?',
        [toTeacher.teacher_id, assignment.assignment_id]
      );
      console.log(`Moved ${MODULE_NAME} for ${assignment.class_name} to ${toTeacher.name}.`);
    }
  }

  const [remaining] = await pool.execute(
    `SELECT a.assignment_id
     FROM assignment a
     JOIN module m ON m.module_id = a.module_id
     WHERE a.teacher_id = ?
       AND (LOWER(m.module_name) LIKE LOWER(?) OR LOWER(m.module_name) LIKE LOWER(?))`,
    [fromTeacher.teacher_id, `%${MODULE_NAME}%`, `%${MODULE_CODE}%`]
  );

  console.log(`Remaining ${MODULE_NAME} assignments on ${FROM_EMAIL}: ${remaining.length}`);
  console.log(`Assigned to: ${toTeacher.name} <${toTeacher.email}>`);
};

run()
  .catch((error) => {
    console.error('Failed to move module:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
