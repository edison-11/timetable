const bcrypt = require('bcryptjs');
const pool = require('../server/config/database');
const School = require('../server/models/School');
const Teacher = require('../server/models/Teacher');
const Student = require('../server/models/Student');
const Section = require('../server/models/Section');
const Room = require('../server/models/Room');
const Module = require('../server/models/Module');
const Assignment = require('../server/models/Assignment');
const User = require('../server/models/User');

const ACADEMIC_YEAR = '2025-2026';
const TERM = 'Term 1';

const findOne = async (query, params = []) => {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
};

const ensureSchool = async () => {
  await School.ensureSchema();
  await School.ensureTenantColumns();

  const existing = await findOne("SELECT school_id FROM schools WHERE status = 'active' ORDER BY school_id LIMIT 1");
  if (existing) return existing.school_id;

  const [result] = await pool.execute(`
    INSERT INTO schools (school_name, school_email, registration_number, school_address, phone, status, school_code)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `, ['Academic Bridge Demo School', 'demo-school@academicbridge.local', 'AB-DEMO-001', 'Kigali', '+250788000000', 'AB-DEMO']);
  return result.insertId;
};

const ensureTeacher = async ({ name, email, phone, school_id }) => {
  await Teacher.ensureProfileColumns();
  await User.ensureAuthColumns();
  const passwordHash = await bcrypt.hash('Teacher@123', 10);
  const existing = await Teacher.findByEmail(email);
  if (existing) {
    await pool.execute(
      "UPDATE teacher SET password = ?, status = 'active', school_id = COALESCE(school_id, ?), phone = COALESCE(phone, ?) WHERE teacher_id = ?",
      [passwordHash, school_id, phone || null, existing.teacher_id]
    );
    const user = await User.findByEmail(email);
    if (user) {
      await User.updateProfile(user.id, {
        full_name: existing.name || name,
        username: existing.name || name,
        phone: phone || existing.phone,
        school_id,
        status: 'active',
        password: 'Teacher@123'
      });
    } else {
      await User.create({
        full_name: existing.name || name,
        username: existing.name || name,
        email,
        phone: phone || existing.phone,
        password: 'Teacher@123',
        role: 'teacher',
        is_verified: true,
        school_id,
        status: 'active'
      });
    }
    return existing.teacher_id;
  }

  const [result] = await pool.execute(`
    INSERT INTO teacher (name, email, password, department, status, date_joined, school_id, phone, module_name)
    VALUES (?, ?, ?, 'Software Development', 'active', NOW(), ?, ?, ?)
  `, [name, email, passwordHash, school_id, phone || null, 'Software Development Modules']);
  await User.create({
    full_name: name,
    username: name,
    email,
    phone: phone || null,
    password: 'Teacher@123',
    role: 'teacher',
    is_verified: true,
    school_id,
    status: 'active'
  });
  return result.insertId;
};

const ensureSection = async ({ school_id }) => {
  await Section.ensureSchema();
  const existing = await findOne(
    'SELECT section_id FROM section WHERE section_name = ? AND (school_id = ? OR school_id IS NULL) ORDER BY school_id DESC LIMIT 1',
    ['Software Development', school_id]
  );
  if (existing) return existing.section_id;

  const [result] = await pool.execute(
    'INSERT INTO section (section_name, level, description, school_id) VALUES (?, ?, ?, ?)',
    ['Software Development', 'Level 4', 'Software development trade classes', school_id]
  );
  return result.insertId;
};

const ensureRoom = async ({ school_id }) => {
  await Room.ensureSchema();
  const existing = await findOne(
    'SELECT room_id FROM room WHERE room_name = ? AND (school_id = ? OR school_id IS NULL) ORDER BY school_id DESC LIMIT 1',
    ['Computer Lab 1', school_id]
  );
  if (existing) return existing.room_id;

  const [result] = await pool.execute(
    'INSERT INTO room (room_name, room_type, capacity, school_id) VALUES (?, ?, ?, ?)',
    ['Computer Lab 1', 'Computer Lab', 40, school_id]
  );
  return result.insertId;
};

const ensureShift = async () => {
  const existing = await findOne('SELECT shift_id FROM shift WHERE shift_name = ? LIMIT 1', ['Morning Attendance Demo']);
  if (existing) return existing.shift_id;

  const [result] = await pool.execute(
    'INSERT INTO shift (shift_name, start_time, end_time, teacher_changeover_minutes) VALUES (?, ?, ?, ?)',
    ['Morning Attendance Demo', '08:00:00', '12:30:00', 5]
  );
  return result.insertId;
};

const ensureClass = async ({ class_name, level, teacher_id, section_id, room_id, shift_id, school_id }) => {
  const existing = await findOne(
    'SELECT class_id FROM class WHERE class_name = ? AND (school_id = ? OR school_id IS NULL) ORDER BY school_id DESC LIMIT 1',
    [class_name, school_id]
  );
  if (existing) {
    await pool.execute(
      'UPDATE class SET class_teacher_id = COALESCE(class_teacher_id, ?), section_id = COALESCE(section_id, ?), room_id = COALESCE(room_id, ?), shift_id = COALESCE(shift_id, ?), school_id = COALESCE(school_id, ?) WHERE class_id = ?',
      [teacher_id, section_id, room_id, shift_id, school_id, existing.class_id]
    );
    return existing.class_id;
  }

  const [result] = await pool.execute(`
    INSERT INTO class (class_name, level, academic_year, class_teacher_id, shift_id, section_id, room_id, school_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [class_name, level, ACADEMIC_YEAR, teacher_id, shift_id, section_id, room_id, school_id]);
  return result.insertId;
};

const moduleHoursFromCredits = (credits = 30) => {
  const value = Number(credits) || 30;
  if (value >= 100) return value * 2;
  if (value >= 60) return value * 4;
  if (value >= 45) return value * 4;
  return Math.max(value * 4, 80);
};

const ensureModule = async ({ module_name, level, school_id, credits = 30, code = '' }) => {
  await Module.ensureSchema();
  const hoursPerYear = moduleHoursFromCredits(credits);
  const displayName = code ? `${code} - ${module_name}` : module_name;
  const description = `${displayName} for ${level}. Credits: ${credits}. Planned hours: ${hoursPerYear}.`;
  const existing = await findOne(
    'SELECT module_id FROM module WHERE module_name = ? AND (school_id = ? OR school_id IS NULL) ORDER BY school_id DESC LIMIT 1',
    [displayName, school_id]
  );
  if (existing) {
    await pool.execute(
      'UPDATE module SET department = ?, hours_per_year = ?, description = ?, required_room_type = ?, school_id = COALESCE(school_id, ?) WHERE module_id = ?',
      ['Software Development', hoursPerYear, description, 'Computer Lab', school_id, existing.module_id]
    );
    return existing.module_id;
  }

  const [result] = await pool.execute(
    'INSERT INTO module (module_name, department, hours_per_year, description, required_room_type, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [displayName, 'Software Development', hoursPerYear, description, 'Computer Lab', school_id]
  );
  return result.insertId;
};

const ensureAssignment = async ({ teacher_id, module_id, class_id, school_id }) => {
  await Assignment.ensureSchema();
  const existing = await findOne(
    'SELECT assignment_id FROM assignment WHERE teacher_id = ? AND module_id = ? AND class_id = ? AND academic_year = ? AND term = ? LIMIT 1',
    [teacher_id, module_id, class_id, ACADEMIC_YEAR, TERM]
  );
  if (existing) {
    await pool.execute('UPDATE assignment SET school_id = COALESCE(school_id, ?) WHERE assignment_id = ?', [school_id, existing.assignment_id]);
    return existing.assignment_id;
  }

  const [result] = await pool.execute(
    'INSERT INTO assignment (teacher_id, module_id, class_id, academic_year, term, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [teacher_id, module_id, class_id, ACADEMIC_YEAR, TERM, school_id]
  );
  return result.insertId;
};

const removeLegacyTeacherAssignments = async ({ teacher_id }) => {
  const legacyModuleNames = [
    'Computer Essentials',
    'Introduction to Programming',
    'Web Design Basics',
    'Programming Fundamentals',
    'Database Systems',
    'Backend Application Development',
    'Front-End App Development',
    'Mobile App Development',
    'Software Testing'
  ];

  await pool.execute(
    `DELETE a
     FROM assignment a
     JOIN module m ON m.module_id = a.module_id
     WHERE a.teacher_id = ?
       AND m.module_name IN (${legacyModuleNames.map(() => '?').join(', ')})`,
    [teacher_id, ...legacyModuleNames]
  );
};

const ensureStudents = async ({ class_id, section_id, school_id, prefix, className }) => {
  await Student.ensureSchema();
  const names = [
    ['Aline Uwase', 'Female'],
    ['Eric Ndayisaba', 'Male'],
    ['Divine Ishimwe', 'Female'],
    ['Patrick Mugisha', 'Male'],
    ['Grace Uwera', 'Female'],
    ['Jean Bizimana', 'Male'],
    ['Claudine Mukamana', 'Female'],
    ['Kevin Manzi', 'Male'],
    ['Diane Umutesi', 'Female'],
    ['Olivier Niyonsenga', 'Male'],
    ['Sandrine Umuhoza', 'Female'],
    ['Emmanuel Hakizimana', 'Male'],
    ['Clarisse Mukeshimana', 'Female'],
    ['Aimable Nshimiyimana', 'Male'],
    ['Yvette Iradukunda', 'Female'],
    ['Fabrice Tuyisenge', 'Male'],
    ['Alice Nyirahabimana', 'Female'],
    ['Samuel Nkurunziza', 'Male'],
    ['Chantal Imanizabayo', 'Female'],
    ['David Habimana', 'Male']
  ];

  for (const [index, [name, sex]] of names.entries()) {
    const studentNumber = `${prefix}-${String(index + 1).padStart(3, '0')}`;
    const existing = await findOne('SELECT student_id FROM student WHERE student_number = ? LIMIT 1', [studentNumber]);
    if (existing) {
      await pool.execute(
        "UPDATE student SET class_id = ?, section_id = ?, status = 'active', school_id = COALESCE(school_id, ?) WHERE student_id = ?",
        [class_id, section_id, school_id, existing.student_id]
      );
      continue;
    }

    await Student.create({
      student_number: studentNumber,
      name,
      sex,
      class_id,
      section_id,
      academic_year: ACADEMIC_YEAR,
      school_id,
      parent_name: `${name} Parent`,
      parent_phone: '+250788200000',
      parent_email: '',
      parent_password: ''
    });
  }

  console.log(`Seeded attendance students for ${className}`);
};

const run = async () => {
  const school_id = await ensureSchool();
  const section_id = await ensureSection({ school_id });
  const room_id = await ensureRoom({ school_id });
  const shift_id = await ensureShift();

  const teachers = [
    {
      name: 'Teacher One',
      email: 'teacher1@school.com',
      phone: '+250788100000',
      class_name: 'Software Development Level 3 A',
      level: 'Level 3',
      prefix: 'SWD3A',
      modules: [
        { code: 'SWDIP301', module_name: 'Introduction to Programming', credits: 45 },
        { code: 'SWDWB301', module_name: 'Web Design Basics', credits: 30 },
        { code: 'SWDUX301', module_name: 'UI/UX Design Fundamentals', credits: 30 },
        { code: 'SWDDB301', module_name: 'Database Fundamentals', credits: 45 }
      ]
    },
    {
      name: 'Teacher One',
      email: 'teacher1@school.com',
      phone: '+250788100000',
      class_name: 'Software Development Level 4 A',
      level: 'Level 4',
      prefix: 'SWD4A',
      modules: [
        { code: 'SWDPF401', module_name: 'Programming Fundamentals', credits: 60 },
        { code: 'SWDBD401', module_name: 'Backend Application Development', credits: 60 },
        { code: 'SWDDA401', module_name: 'Data Structure and Algorithm Fundamentals', credits: 70 },
        { code: 'SWDDS401', module_name: 'Database Systems', credits: 45 },
        { code: 'SWDAPI401', module_name: 'REST API Development', credits: 45 },
        { code: 'SWDQA401', module_name: 'Software Quality Assurance', credits: 30 }
      ]
    },
    {
      name: 'Teacher One',
      email: 'teacher1@school.com',
      phone: '+250788100000',
      class_name: 'Software Development Level 5 A',
      level: 'Level 5',
      prefix: 'SWD5A-T1',
      modules: [
        { code: 'SWDFA501', module_name: 'Front-End App Development', credits: 60 },
        { code: 'SWDMA501', module_name: 'Mobile App Development', credits: 60 },
        { code: 'SWDST501', module_name: 'Software Testing', credits: 45 },
        { code: 'SWDCP501', module_name: 'Cloud Deployment Practices', credits: 45 },
        { code: 'SWDPM501', module_name: 'Software Project Management', credits: 30 }
      ]
    },
    {
      name: 'Claude',
      email: 'claude@school.com',
      phone: '+250788100001',
      class_name: 'Software Development Level 5 A',
      level: 'Level 5',
      prefix: 'SWD5A',
      modules: [
        { code: 'SWDCE301', module_name: 'Computer Essentials', credits: 30 },
        { code: 'SWDDA401', module_name: 'Data Structure and Algorithm Fundamentals', credits: 70 },
        { code: 'SWDBD401', module_name: 'Backend Application Development', credits: 60 },
        { code: 'SWDFA501', module_name: 'Front-End App Development', credits: 60 },
        { code: 'SWDMA501', module_name: 'Mobile App Development', credits: 60 },
        { code: 'SWDUX301', module_name: 'UI/UX Design', credits: 30 }
      ]
    }
  ];

  for (const teacher of teachers) {
    const teacher_id = await ensureTeacher({ ...teacher, school_id });
    if (teacher.email === 'teacher1@school.com') {
      await removeLegacyTeacherAssignments({ teacher_id });
    }
    const class_id = await ensureClass({
      class_name: teacher.class_name,
      level: teacher.level,
      teacher_id,
      section_id,
      room_id,
      shift_id,
      school_id
    });

    for (const moduleSpec of teacher.modules) {
      const module_id = await ensureModule({ ...moduleSpec, level: teacher.level, school_id });
      await ensureAssignment({ teacher_id, module_id, class_id, school_id });
    }

    await ensureStudents({ class_id, section_id, school_id, prefix: teacher.prefix, className: teacher.class_name });
  }

  console.log('Attendance demo seed complete.');
};

run()
  .catch((error) => {
    console.error('Attendance demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
