const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const School = require('./models/School');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const TimetableEntry = require('./models/TimetableEntry');
const Notification = require('./models/Notification');

const ACADEMIC_YEAR = '2025-2026';
const TERM = 'Term 1';
const TEACHER_PASSWORD = 'Teacher@123';

const findOne = async (query, params) => {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
};

const ensureSchool = async (data) => {
  let school = await School.findByRegistrationNumber(data.registration_number);
  if (school) {
    await School.updateStatus(school.school_id, data.status);
    return School.findById(school.school_id);
  }

  const schoolId = await School.create({
    ...data,
    subscription_status: 'active'
  });
  return School.findById(schoolId);
};

const ensureRow = async ({ table, keyColumn, keyValue, columns, values, schoolId }) => {
  try {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN school_id INT NULL`);
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate')) {
      throw error;
    }
  }

  const existing = await findOne(
    `SELECT * FROM \`${table}\` WHERE \`${keyColumn}\` = ? AND (school_id = ? OR school_id IS NULL) LIMIT 1`,
    [keyValue, schoolId]
  );
  if (existing) {
    await pool.execute(`UPDATE \`${table}\` SET school_id = ? WHERE \`${keyColumn}\` = ?`, [schoolId, keyValue]);
    return existing[`${table}_id`] || existing.id || existing[`${keyColumn}`];
  }

  const insertColumns = [...columns, 'school_id'];
  const placeholders = insertColumns.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `INSERT INTO \`${table}\` (${insertColumns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
    [...values, schoolId]
  );
  return result.insertId;
};

const ensureTeacher = async ({ schoolId, name, email, department, moduleName, index }) => {
  const existing = await Teacher.findByEmail(email);
  if (existing) {
    await Teacher.update(existing.teacher_id, {
      name,
      email,
      password: TEACHER_PASSWORD,
      department,
      status: 'active',
      school_id: schoolId,
      module_name: moduleName,
      phone: `+25078820${String(index).padStart(4, '0')}`,
      qualification: 'Bachelor of Education'
    });
    return existing.teacher_id;
  }

  return Teacher.create({
    name,
    email,
    password: TEACHER_PASSWORD,
    department,
    status: 'active',
    school_id: schoolId,
    date_joined: new Date().toISOString().split('T')[0],
    employee_id: `TCH-${String(index).padStart(3, '0')}`,
    phone: `+25078820${String(index).padStart(4, '0')}`,
    module_name: moduleName,
    qualification: 'Bachelor of Education',
    years_experience: 4 + index
  });
};

const ensureTeacherUser = async ({ teacherId, schoolId, name, email, index }) => {
  const existing = await User.findByEmail(email);
  if (existing) {
    await pool.execute(
      'UPDATE users SET username = ?, full_name = ?, role = ?, status = ?, is_verified = ?, school_id = ? WHERE id = ?',
      [`teacher${index}`, name, 'teacher', 'active', 1, schoolId, existing.id]
    );
    await User.updatePassword(existing.id, TEACHER_PASSWORD);
    return existing.id;
  }

  return User.create({
    username: `teacher${index}`,
    full_name: name,
    email,
    phone: `+25078820${String(index).padStart(4, '0')}`,
    password: TEACHER_PASSWORD,
    role: 'teacher',
    school_id: schoolId,
    status: 'active',
    is_verified: true
  });
};

const createTimetableRows = async ({ schoolId, classId, roomId, assignments }) => {
  await TimetableEntry.ensureActivityColumns();
  await pool.execute('DELETE FROM timetable WHERE class_id = ? AND school_id = ?', [classId, schoolId]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [
    ['08:00:00', '09:00:00'],
    ['09:00:00', '10:00:00'],
    ['10:30:00', '11:30:00'],
    ['11:30:00', '12:30:00'],
    ['13:30:00', '14:30:00'],
    ['14:30:00', '15:30:00']
  ];

  for (const [dayIndex, day] of days.entries()) {
    for (const [slotIndex, [start, end]] of slots.entries()) {
      const assignment = assignments[(dayIndex + slotIndex) % assignments.length];
      await TimetableEntry.create({
        class_id: classId,
        assignment_id: assignment.assignmentId,
        day_of_week: day,
        start_time: start,
        end_time: end,
        room_id: roomId,
        module_name: assignment.moduleName,
        entry_type: 'lesson',
        slot_number: slotIndex + 1,
        status: 'published',
        academic_year: ACADEMIC_YEAR,
        term: TERM,
        school_id: schoolId
      });
    }
  }
};

const seed = async () => {
  try {
    await School.ensureTenantColumns();
    await Teacher.ensureProfileColumns();

    const activeSchool = await ensureSchool({
      school_name: 'Academic Bridge Demonstration School',
      school_email: 'demo.school@academicbridge.local',
      registration_number: 'DEMO-SCH-001',
      school_code: 'AB-DEMO',
      school_address: 'Innovation Campus',
      phone: '+250788100100',
      province: 'Kigali',
      district: 'Gasabo',
      sector: 'Kacyiru',
      school_type: 'TVET',
      status: 'active'
    });

    const pendingSchool = await ensureSchool({
      school_name: 'Horizon Pending Academy',
      school_email: 'pending.school@academicbridge.local',
      registration_number: 'PEND-SCH-001',
      school_code: 'HPA',
      school_address: 'Pending Review Road',
      phone: '+250788100200',
      province: 'Kigali',
      district: 'Nyarugenge',
      sector: 'Nyamirambo',
      school_type: 'Secondary',
      status: 'pending_approval'
    });

    await Notification.create({
      type: 'school_registered',
      title: `New school registration: ${pendingSchool.school_name}`,
      message: `${pendingSchool.school_name} is waiting for super admin approval.`,
      path: '/super-admin/schools',
      tone: 'amber',
      recipient_role: 'super_admin'
    });

    const schoolId = activeSchool.school_id;
    const shiftId = await ensureRow({
      table: 'shift',
      keyColumn: 'shift_name',
      keyValue: 'Showcase Full Day',
      columns: ['shift_name', 'start_time', 'end_time', 'teacher_changeover_minutes'],
      values: ['Showcase Full Day', '08:00:00', '15:30:00', 5],
      schoolId
    });

    const sectionId = await ensureRow({
      table: 'section',
      keyColumn: 'section_name',
      keyValue: 'Showcase Software Development',
      columns: ['section_name', 'level', 'description'],
      values: ['Showcase Software Development', 'Level 4', 'Demo software development section'],
      schoolId
    });

    const roomId = await ensureRow({
      table: 'room',
      keyColumn: 'room_name',
      keyValue: 'Showcase Lab 1',
      columns: ['room_name', 'room_type', 'capacity'],
      values: ['Showcase Lab 1', 'Computer Lab', 36],
      schoolId
    });

    const moduleSeed = [
      ['Programming Fundamentals', 'Software Development', 180],
      ['Database Systems', 'Software Development', 120],
      ['Web Application Development', 'Software Development', 180],
      ['UI UX Design', 'Software Development', 90]
    ];

    const assignments = [];
    for (const [index, [moduleName, department, hours]] of moduleSeed.entries()) {
      const moduleId = await ensureRow({
        table: 'module',
        keyColumn: 'module_name',
        keyValue: moduleName,
        columns: ['module_name', 'department', 'hours_per_year', 'description', 'required_room_type'],
        values: [moduleName, department, hours, `${moduleName} demo module`, 'Computer Lab'],
        schoolId
      });

      const email = index === 0 ? 'teacher1@school.com' : `showcase.teacher${index + 1}@school.com`;
      const name = index === 0 ? 'Teacher One' : `Showcase Teacher ${index + 1}`;
      const teacherId = await ensureTeacher({
        schoolId,
        name,
        email,
        department,
        moduleName,
        index: index + 1
      });
      await ensureTeacherUser({ teacherId, schoolId, name, email, index: index + 1 });

      assignments.push({ teacherId, moduleId, moduleName });
    }

    const classId = await ensureRow({
      table: 'class',
      keyColumn: 'class_name',
      keyValue: 'Showcase SOD Level 4 A',
      columns: ['class_name', 'level', 'academic_year', 'class_teacher_id', 'shift_id', 'section_id', 'room_id'],
      values: ['Showcase SOD Level 4 A', 'Level 4', ACADEMIC_YEAR, assignments[0].teacherId, shiftId, sectionId, roomId],
      schoolId
    });

    const assignmentRows = [];
    for (const item of assignments) {
      let assignment = await findOne(
        'SELECT assignment_id FROM assignment WHERE teacher_id = ? AND module_id = ? AND class_id = ? AND school_id = ?',
        [item.teacherId, item.moduleId, classId, schoolId]
      );
      if (!assignment) {
        const [result] = await pool.execute(
          `INSERT INTO assignment (teacher_id, module_id, class_id, shift_id, academic_year, term, school_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.teacherId, item.moduleId, classId, shiftId, ACADEMIC_YEAR, TERM, schoolId]
        );
        assignment = { assignment_id: result.insertId };
      }
      assignmentRows.push({ assignmentId: assignment.assignment_id, moduleName: item.moduleName });
    }

    await createTimetableRows({ schoolId, classId, roomId, assignments: assignmentRows });

    console.log('Showcase schools, teachers, assignments, and timetable data are ready.');
    console.log(`Teacher dashboard: teacher1@school.com / ${TEACHER_PASSWORD}`);
    console.log('Pending school available for super-admin notification approval.');
  } finally {
    await pool.end();
  }
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
