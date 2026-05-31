const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const Teacher = require('./models/Teacher');
const User = require('./models/User');
const Module = require('./models/Module');
const Assignment = require('./models/Assignment');
const Class = require('./models/Class');
const TimetableEntry = require('./models/TimetableEntry');
const Student = require('./models/Student');

const PASSWORD = 'Teacher@123';
const ACADEMIC_YEAR = '2025-2026';
const TERM = 'Term 1';

const softwareDevelopmentModules = [
  'Programming Fundamentals',
  'Object-Oriented Programming',
  'Web Development',
  'Database Design',
  'System Analysis and Design',
  'Software Testing',
  'Mobile Application Development',
  'API Development',
  'UI/UX Design',
  'Software Project Management',
  'Data Structures',
  'Version Control with Git',
  'DevOps Foundations',
  'Software Architecture'
];

const networkingModules = [
  'Networking Fundamentals',
  'Routing and Switching',
  'Network Security',
  'Server Administration',
  'Linux Administration',
  'Wireless Networks',
  'Cloud Computing',
  'Cybersecurity Basics',
  'Network Troubleshooting',
  'IT Support',
  'Network Design',
  'Virtualization',
  'Computer Maintenance',
  'IoT Fundamentals'
];

const teacherOneModules = [...softwareDevelopmentModules, ...networkingModules];

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
  await pool.execute(
    'UPDATE module SET department = ?, hours_per_year = ?, description = ?, required_room_type = ? WHERE LOWER(module_name) = LOWER(?)',
    [department, hours_per_year, description, required_room_type || null, module_name]
  );

  const existing = await findOne(
    'SELECT module_id FROM module WHERE LOWER(module_name) = LOWER(?) AND (school_id <=> ?)',
    [module_name, school_id]
  );
  if (existing) {
    await Module.update(existing.module_id, {
      module_name,
      department,
      hours_per_year,
      description,
      required_room_type,
      school_id
    });
    return existing.module_id;
  }

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

const ensureStudent = async ({ student_number, name, sex, class_id, section_id, academic_year, school_id }) => {
  await Student.ensureSchema();
  const existing = await findOne('SELECT student_id FROM student WHERE student_number = ? LIMIT 1', [student_number]);
  if (existing) {
    await pool.execute(
      'UPDATE student SET name = ?, sex = ?, class_id = ?, section_id = ?, academic_year = ?, status = ?, school_id = ? WHERE student_id = ?',
      [name, sex, class_id, section_id, academic_year, 'active', school_id || null, existing.student_id]
    );
    return existing.student_id;
  }

  const safeNumber = String(student_number).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const parentEmail = `parent.${safeNumber}@school.com`;
  return Student.create({
    student_number,
    name,
    sex,
    class_id,
    section_id,
    academic_year,
    school_id,
    parent_name: `${name} Parent`,
    parent_email: parentEmail,
    parent_phone: '+250788200000',
    parent_password: 'Parent@123'
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
      department: 'Software Development & Networking',
      module_name: `${teacherOneModules.length} Software Development and Networking modules`,
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
    },
    {
      name: 'Claude',
      email: 'claude@school.com',
      department: 'Software Development',
      module_name: 'SWDDA401, SWDBD401, SWDFA501, SWDMA501, UI/UX Design',
      employee_id: 'TCH-040',
      phone: '+250788100001'
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
    }),
    sod4a: await ensureClass({
      class_name: 'Software Development Level 4 A',
      level: 'Level 4',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.lab,
      class_teacher_id: teacherRecords.get('teacher1@school.com').teacher_id
    }),
    net4a: await ensureClass({
      class_name: 'Networking Level 4 A',
      level: 'Level 4',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.lab,
      class_teacher_id: teacherRecords.get('teacher1@school.com').teacher_id
    }),
    swd3a: await ensureClass({
      class_name: 'Software Development Level 3 A',
      level: 'Level 3',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.lab,
      class_teacher_id: teacherRecords.get('claude@school.com').teacher_id
    }),
    swd4a: await ensureClass({
      class_name: 'Software Development Level 4 A - Claude',
      level: 'Level 4',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.lab,
      class_teacher_id: teacherRecords.get('claude@school.com').teacher_id
    }),
    swd5a: await ensureClass({
      class_name: 'Software Development Level 5 A',
      level: 'Level 5',
      school_id,
      shift_id,
      section_id,
      room_id: roomIds.lab,
      class_teacher_id: teacherRecords.get('claude@school.com').teacher_id
    })
  };

  const moduleIds = {};
  const modules = [
    ['Mathematics', 'Mathematics', 160, 'Algebra, geometry, and problem solving', 'Classroom'],
    ['Physics', 'Science', 120, 'Mechanics, electricity, and practical physics', 'Science Lab'],
    ['Chemistry', 'Science', 120, 'Matter, reactions, and laboratory practice', 'Science Lab'],
    ['Biology', 'Science', 110, 'Life sciences and environmental studies', 'Science Lab'],
    ['Computer Science', 'ICT', 140, 'Programming, digital literacy, and algorithms', 'Computer Lab'],
    ['Web Development', 'Software Development', 100, 'HTML, CSS, JavaScript, frontend structure, and web projects', 'Computer Lab'],
    ['English', 'Languages', 130, 'Reading, writing, speaking, and grammar', 'Classroom'],
    ['Kinyarwanda', 'Languages', 100, 'Language, literature, and communication', 'Classroom'],
    ['History', 'Humanities', 90, 'Rwandan, African, and world history', 'Classroom'],
    ['Geography', 'Humanities', 90, 'Maps, climate, resources, and environment', 'Classroom'],
    ['Entrepreneurship', 'Business', 90, 'Business planning and innovation', 'Classroom'],
    ['Accounting', 'Business', 100, 'Bookkeeping and financial records', 'Classroom'],
    ['Programming Fundamentals', 'Software Development', 120, 'Core programming logic, syntax, control flow, and problem solving', 'Computer Lab'],
    ['Object-Oriented Programming', 'Software Development', 120, 'Classes, objects, inheritance, encapsulation, and reusable software design', 'Computer Lab'],
    ['Database Design', 'Software Development', 100, 'Relational models, SQL, normalization, and database implementation', 'Computer Lab'],
    ['System Analysis and Design', 'Software Development', 90, 'Requirements gathering, diagrams, design documents, and solution planning', 'Computer Lab'],
    ['Software Testing', 'Software Development', 80, 'Test planning, debugging, unit testing, and quality assurance practice', 'Computer Lab'],
    ['Mobile Application Development', 'Software Development', 100, 'Mobile app design, implementation, testing, and deployment basics', 'Computer Lab'],
    ['API Development', 'Software Development', 90, 'REST API design, backend services, authentication, and integration', 'Computer Lab'],
    ['UI/UX Design', 'Software Development', 80, 'User research, interface design, prototyping, and usability practice', 'Computer Lab'],
    ['Software Project Management', 'Software Development', 80, 'Agile planning, version control workflows, estimation, and delivery tracking', 'Computer Lab'],
    ['Data Structures', 'Software Development', 100, 'Arrays, stacks, queues, trees, maps, and algorithmic problem solving', 'Computer Lab'],
    ['Version Control with Git', 'Software Development', 70, 'Git workflows, branching, merging, pull requests, and collaboration practice', 'Computer Lab'],
    ['DevOps Foundations', 'Software Development', 80, 'CI/CD concepts, deployment pipelines, environments, and release basics', 'Computer Lab'],
    ['Software Architecture', 'Software Development', 90, 'Layered systems, design patterns, scalability, and maintainable application structure', 'Computer Lab'],
    ['SWDDA401 - Data Structure and Algorithm Fundamentals', 'Software Development', 120, 'Level 4 data structures, algorithms, complexity, searching, sorting, and problem-solving labs', 'Computer Lab'],
    ['SWDBD401 - Backend Application Development', 'Software Development', 120, 'Level 4 backend services, REST APIs, authentication, database integration, and server-side validation', 'Computer Lab'],
    ['SWDFA501 - Front-End App Development', 'Software Development', 120, 'Level 5 frontend application architecture, state management, component design, and API integration', 'Computer Lab'],
    ['SWDMA501 - Mobile App Development', 'Software Development', 120, 'Level 5 mobile application development, navigation, device APIs, data sync, and deployment basics', 'Computer Lab'],
    ['SWDQA501 - Software Quality Assurance', 'Software Development', 90, 'Level 5 test plans, automated testing, quality metrics, and defect management', 'Computer Lab'],
    ['SWDAS501 - Application Security', 'Software Development', 90, 'Level 5 secure coding, OWASP risks, authentication, authorization, and vulnerability prevention', 'Computer Lab'],
    ['SWDCC501 - Cloud and Container Deployment', 'Software Development', 90, 'Level 5 cloud services, Docker basics, environment configuration, and deployment pipelines', 'Computer Lab'],
    ['SWDPM401 - Agile Project Management', 'Software Development', 80, 'Level 4 agile delivery, sprint planning, backlog management, estimation, and team collaboration', 'Computer Lab'],
    ['Networking Fundamentals', 'Networking', 120, 'Network models, cabling, addressing, topologies, and device roles', 'Computer Lab'],
    ['Routing and Switching', 'Networking', 120, 'LAN switching, routing concepts, VLANs, and packet forwarding practice', 'Computer Lab'],
    ['Network Security', 'Networking', 100, 'Firewall basics, access control, secure configuration, and threat prevention', 'Computer Lab'],
    ['Server Administration', 'Networking', 100, 'Server installation, user management, services, backups, and monitoring', 'Computer Lab'],
    ['Linux Administration', 'Networking', 90, 'Linux commands, permissions, services, packages, and system maintenance', 'Computer Lab'],
    ['Wireless Networks', 'Networking', 80, 'Wireless standards, access points, coverage planning, and troubleshooting', 'Computer Lab'],
    ['Cloud Computing', 'Networking', 90, 'Cloud services, virtualization, storage, networking, and deployment basics', 'Computer Lab'],
    ['Cybersecurity Basics', 'Networking', 90, 'Security awareness, vulnerabilities, safe practices, and incident response basics', 'Computer Lab'],
    ['Network Troubleshooting', 'Networking', 90, 'Diagnostic tools, fault isolation, documentation, and repair workflows', 'Computer Lab'],
    ['IT Support', 'Networking', 80, 'Helpdesk operations, device setup, user support, and maintenance routines', 'Computer Lab'],
    ['Network Design', 'Networking', 90, 'Network planning, segmentation, addressing strategy, diagrams, and documentation', 'Computer Lab'],
    ['Virtualization', 'Networking', 80, 'Virtual machines, hypervisors, virtual networking, snapshots, and lab environments', 'Computer Lab'],
    ['Computer Maintenance', 'Networking', 80, 'Hardware diagnostics, operating system care, preventive maintenance, and repairs', 'Computer Lab'],
    ['IoT Fundamentals', 'Networking', 70, 'Connected devices, sensors, edge networking, and IoT security basics', 'Computer Lab']
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

  const claudeRecord = teacherRecords.get('claude@school.com');
  if (claudeRecord?.teacher_id) {
    await pool.execute(`
      DELETE t FROM timetable t
      INNER JOIN assignment a ON a.assignment_id = t.assignment_id
      WHERE a.teacher_id = ?
    `, [claudeRecord.teacher_id]).catch(() => null);
    await pool.execute('DELETE FROM assignment WHERE teacher_id = ?', [claudeRecord.teacher_id]);
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
    ...softwareDevelopmentModules.map((moduleName) => ['teacher1@school.com', moduleName, 'sod4a']),
    ...networkingModules.map((moduleName) => ['teacher1@school.com', moduleName, 'net4a']),
    ['teacher31@school.com', 'Chemistry', 's2a'],
    ['teacher31@school.com', 'Biology', 's1b'],
    ['teacher32@school.com', 'English', 's2a'],
    ['teacher32@school.com', 'Kinyarwanda', 's1a'],
    ['teacher33@school.com', 'History', 's1b'],
    ['teacher33@school.com', 'Geography', 's2a'],
    ['teacher34@school.com', 'Computer Science', 's1a'],
    ['teacher34@school.com', 'Web Development', 's3a'],
    ['teacher35@school.com', 'Entrepreneurship', 's3a'],
    ['teacher35@school.com', 'Accounting', 's2a'],
    ['claude@school.com', 'SWDDA401 - Data Structure and Algorithm Fundamentals', 'swd4a'],
    ['claude@school.com', 'SWDBD401 - Backend Application Development', 'swd4a'],
    ['claude@school.com', 'SWDFA501 - Front-End App Development', 'swd5a'],
    ['claude@school.com', 'SWDMA501 - Mobile App Development', 'swd5a'],
    ['claude@school.com', 'UI/UX Design', 'swd3a'],
    ['teacher31@school.com', 'SWDQA501 - Software Quality Assurance', 'swd5a'],
    ['teacher32@school.com', 'SWDPM401 - Agile Project Management', 'swd4a'],
    ['teacher33@school.com', 'SWDAS501 - Application Security', 'swd5a'],
    ['teacher34@school.com', 'SWDCC501 - Cloud and Container Deployment', 'swd5a'],
    ['teacher35@school.com', 'Software Project Management', 'swd4a'],
    ['teacher35@school.com', 'Version Control with Git', 'swd3a']
  ];

  let assignmentCount = 0;
  const assignmentIds = new Map();
  for (const [teacherEmail, moduleName, classKey] of assignments) {
    const assignmentId = await ensureAssignment({
      teacher_id: teacherRecords.get(teacherEmail).teacher_id,
      module_id: moduleIds[moduleName],
      class_id: classIds[classKey],
      school_id
    });
    assignmentIds.set(`${teacherEmail}|${moduleName}|${classKey}`, assignmentId);
    assignmentCount += 1;
  }

  const claudeSlots = [
    ['SWDDA401 - Data Structure and Algorithm Fundamentals', 'swd4a', 'Monday', '08:00', '09:00', 1],
    ['SWDDA401 - Data Structure and Algorithm Fundamentals', 'swd4a', 'Monday', '09:00', '10:00', 2],
    ['SWDBD401 - Backend Application Development', 'swd4a', 'Tuesday', '10:30', '11:30', 3],
    ['SWDBD401 - Backend Application Development', 'swd4a', 'Tuesday', '11:30', '12:30', 4],
    ['UI/UX Design', 'swd3a', 'Wednesday', '08:00', '09:00', 1],
    ['SWDFA501 - Front-End App Development', 'swd5a', 'Thursday', '08:00', '09:00', 1],
    ['SWDFA501 - Front-End App Development', 'swd5a', 'Thursday', '09:00', '10:00', 2],
    ['SWDMA501 - Mobile App Development', 'swd5a', 'Friday', '10:30', '11:30', 3],
    ['SWDMA501 - Mobile App Development', 'swd5a', 'Friday', '11:30', '12:30', 4]
  ];

  for (const [moduleName, classKey, day_of_week, start_time, end_time, slot_number] of claudeSlots) {
    const assignment_id = assignmentIds.get(`claude@school.com|${moduleName}|${classKey}`);
    if (!assignment_id) continue;
    const [existing] = await pool.execute(
      'SELECT timetable_id FROM timetable WHERE assignment_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ? LIMIT 1',
      [assignment_id, day_of_week, start_time, end_time]
    );
    if (existing.length) continue;
    await TimetableEntry.create({
      class_id: classIds[classKey],
      assignment_id,
      day_of_week,
      start_time,
      end_time,
      room_id: roomIds.lab,
      module_name: moduleName,
      entry_type: 'lesson',
      slot_number,
      status: 'published',
      academic_year: ACADEMIC_YEAR,
      term: TERM,
      school_id
    });
  }

  const demoStudentsByClass = {
    swd3a: [
      ['SWD3-001', 'Ishimwe Aime', 'M'],
      ['SWD3-002', 'Mutesi Diane', 'F'],
      ['SWD3-003', 'Ndayisenga Eric', 'M'],
      ['SWD3-004', 'Uwase Claire', 'F']
    ],
    swd4a: [
      ['SWD4-001', 'Niyonsenga Claude', 'M'],
      ['SWD4-002', 'Mukamana Alice', 'F'],
      ['SWD4-003', 'Hategekimana Jean', 'M'],
      ['SWD4-004', 'Ingabire Grace', 'F'],
      ['SWD4-005', 'Mugisha Patrick', 'M'],
      ['SWD4-006', 'Umulisa Bella', 'F']
    ],
    swd5a: [
      ['SWD5-001', 'Kamanzi Brian', 'M'],
      ['SWD5-002', 'Uwamahoro Divine', 'F'],
      ['SWD5-003', 'Bizimana Olivier', 'M'],
      ['SWD5-004', 'Akayezu Sandrine', 'F'],
      ['SWD5-005', 'Nshimiyimana Kevin', 'M']
    ],
    sod4a: [
      ['SOD4-001', 'Manzi Cedric', 'M'],
      ['SOD4-002', 'Irakoze Aline', 'F'],
      ['SOD4-003', 'Habimana Yves', 'M'],
      ['SOD4-004', 'Iradukunda Sonia', 'F']
    ],
    net4a: [
      ['NET4-001', 'Twagirayezu Bosco', 'M'],
      ['NET4-002', 'Mukeshimana Flora', 'F'],
      ['NET4-003', 'Nsabimana Thierry', 'M'],
      ['NET4-004', 'Uwimana Chantal', 'F']
    ]
  };

  let studentCount = 0;
  for (const [classKey, studentRows] of Object.entries(demoStudentsByClass)) {
    for (const [student_number, name, sex] of studentRows) {
      await ensureStudent({
        student_number,
        name,
        sex,
        class_id: classIds[classKey],
        section_id,
        academic_year: ACADEMIC_YEAR,
        school_id
      });
      studentCount += 1;
    }
  }

  console.log('Teacher/module seed completed.');
  console.log(`School ID: ${school_id || 'none'}`);
  console.log(`Teachers ready: ${teachers.length}`);
  console.log(`Modules ready: ${modules.length}`);
  console.log(`Assignments ensured: ${assignmentCount}`);
  console.log(`Students ensured: ${studentCount}`);
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
