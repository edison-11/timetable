const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const Teacher = require('./models/Teacher');
const User = require('./models/User');
const Module = require('./models/Module');
const Assignment = require('./models/Assignment');
const Class = require('./models/Class');

const PASSWORD = 'Teacher@123';
const ACADEMIC_YEAR = '2025-2026';
const TERM = 'Term 1';

const findOne = async (query, params = []) => {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
};

const columnExists = async (table, column) => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
};

const ensureUser = async ({ email, name, phone, school_id }) => {
  const existing = await User.findByEmail(email);
  if (existing) {
    const fields = ['username = ?', 'full_name = ?', 'role = ?', 'status = ?', 'is_verified = ?'];
    const values = [name, name, 'teacher', 'active', 1];

    if (await columnExists('users', 'school_id')) {
      fields.push('school_id = ?');
      values.push(school_id || null);
    }

    if (await columnExists('users', 'phone')) {
      fields.push('phone = ?');
      values.push(phone || null);
    }

    values.push(existing.id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    await User.updatePassword(existing.id, PASSWORD);
    return existing.id;
  }

  return User.create({
    username: name,
    full_name: name,
    email,
    phone,
    password: PASSWORD,
    role: 'teacher',
    is_verified: true,
    school_id,
    status: 'active'
  });
};

const resolveSchoolId = async () => {
  const teacherOne = await Teacher.findByEmail('teacher1@school.com').catch(() => null);
  if (teacherOne?.school_id) return teacherOne.school_id;

  const dosUser = await findOne("SELECT school_id FROM users WHERE role = 'dos' AND school_id IS NOT NULL ORDER BY id LIMIT 1");
  if (dosUser?.school_id) return dosUser.school_id;

  const school = await findOne("SELECT school_id FROM schools WHERE status IN ('approved', 'active') AND deleted_at IS NULL ORDER BY school_id LIMIT 1")
    .catch(() => null);
  return school?.school_id || null;
};

const ensureTeacher = async ({ name, email, department, module_name, employee_id, phone, school_id }) => {
  let teacher = await Teacher.findByEmail(email);
  if (teacher) {
    await Teacher.update(teacher.teacher_id, {
      name,
      email,
      password: PASSWORD,
      department,
      status: 'active',
      module_name,
      employee_id,
      phone,
      school_id,
      available_days: 'Monday, Tuesday, Wednesday, Thursday, Friday',
      available_from: '08:00',
      available_to: '17:00'
    });
  } else {
    await Teacher.create({
      name,
      email,
      password: PASSWORD,
      department,
      status: 'active',
      date_joined: new Date().toISOString().slice(0, 10),
      module_name,
      employee_id,
      phone,
      school_id,
      available_days: 'Monday, Tuesday, Wednesday, Thursday, Friday',
      available_from: '08:00',
      available_to: '17:00'
    });
  }

  teacher = await Teacher.findByEmail(email);
  await ensureUser({ email, name, phone, school_id });
  return teacher;
};

const ensureShift = async (school_id) => {
  const existing = await findOne(
    'SELECT shift_id FROM shift WHERE LOWER(shift_name) = LOWER(?) AND (school_id <=> ?)',
    ['Day Shift', school_id]
  ).catch(() => null);
  if (existing) return existing.shift_id;

  const columns = ['shift_name', 'start_time', 'end_time'];
  const values = ['Day Shift', '08:00:00', '16:00:00'];
  if (await columnExists('shift', 'school_id')) {
    columns.push('school_id');
    values.push(school_id || null);
  }
  if (await columnExists('shift', 'teacher_changeover_minutes')) {
    columns.push('teacher_changeover_minutes');
    values.push(5);
  }

  const [result] = await pool.execute(
    `INSERT INTO shift (${columns.map(column => `\`${column}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );
  return result.insertId;
};

const ensureSection = async (school_id) => {
  const existing = await findOne(
    'SELECT section_id FROM section WHERE LOWER(section_name) = LOWER(?) AND (school_id <=> ?)',
    ['General Studies', school_id]
  ).catch(() => null);
  if (existing) return existing.section_id;

  const columns = ['section_name', 'level', 'description'];
  const values = ['General Studies', 'S1', 'Default section for demo assignments'];
  if (await columnExists('section', 'school_id')) {
    columns.push('school_id');
    values.push(school_id || null);
  }

  const [result] = await pool.execute(
    `INSERT INTO section (${columns.map(column => `\`${column}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );
  return result.insertId;
};

const ensureRoom = async (roomName, roomType, school_id) => {
  const existing = await findOne(
    'SELECT room_id FROM room WHERE LOWER(room_name) = LOWER(?) AND (school_id <=> ?)',
    [roomName, school_id]
  ).catch(() => null);
  if (existing) return existing.room_id;

  const columns = ['room_name', 'room_type', 'capacity'];
  const values = [roomName, roomType, 40];
  if (await columnExists('room', 'school_id')) {
    columns.push('school_id');
    values.push(school_id || null);
  }

  const [result] = await pool.execute(
    `INSERT INTO room (${columns.map(column => `\`${column}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );
  return result.insertId;
};

const ensureClass = async ({ class_name, level, school_id, shift_id, section_id, room_id, class_teacher_id }) => {
  const existing = await Class.findByName(class_name, school_id ? { school_id } : {});
  if (existing) return existing.class_id;

  return Class.create({
    class_name,
    level,
    academic_year: ACADEMIC_YEAR,
    class_teacher_id,
    shift_id,
    section_id,
    room_id,
    school_id
  });
};

const ensureModule = async ({ module_name, department, hours_per_year, description, required_room_type, school_id }) => {
  await Module.ensureSchema();
  const existing = await findOne(
    'SELECT module_id FROM module WHERE LOWER(module_name) = LOWER(?) AND (school_id <=> ?)',
    [module_name, school_id]
  );
  if (existing) return existing.module_id;

  return Module.create({
    module_name,
    department,
    hours_per_year,
    description,
    required_room_type,
    school_id
  });
};

const ensureAssignment = async ({ teacher_id, module_id, class_id, school_id }) => {
  await Assignment.ensureSchema();
  const existing = await Assignment.findByCombination(
    teacher_id,
    module_id,
    class_id,
    ACADEMIC_YEAR,
    TERM,
    school_id ? { school_id } : {}
  );
  if (existing) return existing.assignment_id;

  return Assignment.create({
    teacher_id,
    module_id,
    class_id,
    academic_year: ACADEMIC_YEAR,
    term: TERM,
    school_id
  });
};

const run = async () => {
  await Teacher.ensureProfileColumns();
  await User.ensureAuthColumns();
  await Module.ensureSchema();
  await Assignment.ensureSchema();
  await Class.ensureSchema();

  const school_id = await resolveSchoolId();
  const shift_id = await ensureShift(school_id);
  const section_id = await ensureSection(school_id);
  const roomIds = {
    general: await ensureRoom('Room 101', 'Classroom', school_id),
    lab: await ensureRoom('Computer Lab 1', 'Computer Lab', school_id),
    science: await ensureRoom('Science Lab 1', 'Science Lab', school_id)
  };

  const teachers = [
    {
      name: 'Teacher One',
      email: 'teacher1@school.com',
      department: 'Mathematics',
      module_name: 'Mathematics, Physics, Chemistry, Biology, Computer Science, Web Development, English, Kinyarwanda, Geography, Entrepreneurship',
      employee_id: 'TCH-001',
      phone: '+250788100001'
    },
    {
      name: 'Aline Uwase',
      email: 'teacher31@school.com',
      department: 'Science',
      module_name: 'Chemistry, Biology',
      employee_id: 'TCH-031',
      phone: '+250788100031'
    },
    {
      name: 'Eric Niyonzima',
      email: 'teacher32@school.com',
      department: 'Languages',
      module_name: 'English, Kinyarwanda',
      employee_id: 'TCH-032',
      phone: '+250788100032'
    },
    {
      name: 'Grace Mukamana',
      email: 'teacher33@school.com',
      department: 'Humanities',
      module_name: 'History, Geography',
      employee_id: 'TCH-033',
      phone: '+250788100033'
    },
    {
      name: 'Patrick Habimana',
      email: 'teacher34@school.com',
      department: 'ICT',
      module_name: 'Computer Science, Web Development',
      employee_id: 'TCH-034',
      phone: '+250788100034'
    },
    {
      name: 'Claudine Ishimwe',
      email: 'teacher35@school.com',
      department: 'Business',
      module_name: 'Entrepreneurship, Accounting',
      employee_id: 'TCH-035',
      phone: '+250788100035'
    }
  ];

  const teacherRecords = new Map();
  for (const teacher of teachers) {
    const record = await ensureTeacher({ ...teacher, school_id });
    teacherRecords.set(teacher.email, record);
  }

  const classIds = {
    s1a: await ensureClass({
      class_name: 'S1 A',
      level: 'S1',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.general,
      class_teacher_id: teacherRecords.get('teacher1@school.com').teacher_id
    }),
    s1b: await ensureClass({
      class_name: 'S1 B',
      level: 'S1',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.general,
      class_teacher_id: teacherRecords.get('teacher31@school.com').teacher_id
    }),
    s2a: await ensureClass({
      class_name: 'S2 A',
      level: 'S2',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.science,
      class_teacher_id: teacherRecords.get('teacher32@school.com').teacher_id
    }),
    s3a: await ensureClass({
      class_name: 'S3 A',
      level: 'S3',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.lab,
      class_teacher_id: teacherRecords.get('teacher34@school.com').teacher_id
    })
  };

  const moduleIds = {};
  const modules = [
    ['Mathematics', 'Mathematics', 160, 'Algebra, geometry, and problem solving', 'Classroom'],
    ['Physics', 'Science', 120, 'Mechanics, electricity, and practical physics', 'Science Lab'],
    ['Chemistry', 'Science', 120, 'Matter, reactions, and laboratory practice', 'Science Lab'],
    ['Biology', 'Science', 110, 'Life sciences and environmental studies', 'Science Lab'],
    ['Computer Science', 'ICT', 140, 'Programming, digital literacy, and algorithms', 'Computer Lab'],
    ['Web Development', 'ICT', 100, 'HTML, CSS, JavaScript, and web projects', 'Computer Lab'],
    ['English', 'Languages', 130, 'Reading, writing, speaking, and grammar', 'Classroom'],
    ['Kinyarwanda', 'Languages', 100, 'Language, literature, and communication', 'Classroom'],
    ['History', 'Humanities', 90, 'Rwandan, African, and world history', 'Classroom'],
    ['Geography', 'Humanities', 90, 'Maps, climate, resources, and environment', 'Classroom'],
    ['Entrepreneurship', 'Business', 90, 'Business planning and innovation', 'Classroom'],
    ['Accounting', 'Business', 100, 'Bookkeeping and financial records', 'Classroom']
  ];

  for (const [module_name, department, hours_per_year, description, required_room_type] of modules) {
    moduleIds[module_name] = await ensureModule({
      module_name,
      department,
      hours_per_year,
      description,
      required_room_type,
      school_id
    });
  }

  const assignments = [
    ['teacher1@school.com', 'Mathematics', 's1a'],
    ['teacher1@school.com', 'Mathematics', 's1b'],
    ['teacher1@school.com', 'Physics', 's2a'],
    ['teacher1@school.com', 'Computer Science', 's3a'],
    ['teacher1@school.com', 'English', 's1a'],
    ['teacher1@school.com', 'Chemistry', 's2a'],
    ['teacher1@school.com', 'Biology', 's1b'],
    ['teacher1@school.com', 'Web Development', 's3a'],
    ['teacher1@school.com', 'Kinyarwanda', 's1b'],
    ['teacher1@school.com', 'Geography', 's2a'],
    ['teacher1@school.com', 'Entrepreneurship', 's3a'],
    ['teacher31@school.com', 'Chemistry', 's2a'],
    ['teacher31@school.com', 'Biology', 's1b'],
    ['teacher32@school.com', 'English', 's2a'],
    ['teacher32@school.com', 'Kinyarwanda', 's1a'],
    ['teacher33@school.com', 'History', 's1b'],
    ['teacher33@school.com', 'Geography', 's2a'],
    ['teacher34@school.com', 'Computer Science', 's1a'],
    ['teacher34@school.com', 'Web Development', 's3a'],
    ['teacher35@school.com', 'Entrepreneurship', 's3a'],
    ['teacher35@school.com', 'Accounting', 's2a']
  ];

  let assignmentCount = 0;
  for (const [teacherEmail, moduleName, classKey] of assignments) {
    await ensureAssignment({
      teacher_id: teacherRecords.get(teacherEmail).teacher_id,
      module_id: moduleIds[moduleName],
      class_id: classIds[classKey],
      school_id
    });
    assignmentCount += 1;
  }

  console.log('Teacher/module seed completed.');
  console.log(`School ID: ${school_id || 'none'}`);
  console.log(`Teachers ready: ${teachers.length}`);
  console.log(`Modules ready: ${modules.length}`);
  console.log(`Assignments ensured: ${assignmentCount}`);
  console.log('');
  console.log('Teacher credentials:');
  teachers.forEach((teacher) => {
    console.log(`  ${teacher.email} / ${PASSWORD}`);
  });
};

run()
  .catch((error) => {
    console.error('Teacher/module seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
