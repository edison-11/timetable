const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const {
  FIXED_DAYS,
  buildTimetableRowsFromSettings
} = require('../services/fixedTimetableStructure');
const SystemSetting = require('../models/SystemSetting');
const Teacher = require('../models/Teacher');

const ACADEMIC_YEAR = '2025-2026';
const TERM = 'Term 1';
const TEACHER_PASSWORD = 'Teacher@123';
const ADMIN_PASSWORD = 'admin123456';

const softwareModules = [
  'Programming Fundamentals',
  'Web Application Development',
  'Database Systems',
  'Software Engineering',
  'Mobile App Development',
  'Cloud Computing',
  'UI UX Design',
  'Object Oriented Programming'
];

const networkingModules = [
  'Network Fundamentals',
  'Routing and Switching',
  'Network Security',
  'Linux Server Administration',
  'Wireless Networks',
  'Cybersecurity Basics',
  'Cloud Networking',
  'IT Support Practice'
];

const classes = [
  { class_name: 'SOD Level 4 A', level: 'Level 4', section: 'Software Development', room: 'Software Lab 1' },
  { class_name: 'SOD Level 4 B', level: 'Level 4', section: 'Software Development', room: 'Software Lab 2' },
  { class_name: 'SOD Level 5 A', level: 'Level 5', section: 'Software Development', room: 'Software Lab 3' },
  { class_name: 'SOD Level 5 B', level: 'Level 5', section: 'Software Development', room: 'Software Lab 4' },
  { class_name: 'SOD Level 6 A', level: 'Level 6', section: 'Software Development', room: 'Software Lab 5' },
  { class_name: 'NET Level 4 A', level: 'Level 4', section: 'Networking', room: 'Networking Lab 1' },
  { class_name: 'NET Level 4 B', level: 'Level 4', section: 'Networking', room: 'Networking Lab 2' },
  { class_name: 'NET Level 5 A', level: 'Level 5', section: 'Networking', room: 'Networking Lab 3' }
];

const findOne = async (query, params) => {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
};

const insertAndReturnId = async (query, params) => {
  const [result] = await pool.execute(query, params);
  return result.insertId;
};

const resetAcademicTables = async () => {
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute('TRUNCATE TABLE timetable');
  await pool.execute('TRUNCATE TABLE assignment');
  await pool.execute('TRUNCATE TABLE class');
  await pool.execute('TRUNCATE TABLE module');
  await pool.execute('TRUNCATE TABLE room');
  await pool.execute('TRUNCATE TABLE section');
  await pool.execute('TRUNCATE TABLE shift');
  await pool.execute('TRUNCATE TABLE teacher');
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
};

const addColumnIfMissing = async (table, column, definition) => {
  try {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate')) {
      throw error;
    }
  }
};

const ensureTimetableColumns = async () => {
  await addColumnIfMissing('timetable', 'status', "ENUM('draft', 'published') DEFAULT 'draft'");
  await addColumnIfMissing('timetable', 'academic_year', 'VARCHAR(20) NULL');
  await addColumnIfMissing('timetable', 'term', 'VARCHAR(20) NULL');
};

const ensureAdmin = async () => {
  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await pool.execute(
    `INSERT INTO users (username, email, password, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password), role = VALUES(role)`,
    ['admin', 'admin@school.com', password, 'admin']
  );
};

const createTeacher = async ({ name, email, department, moduleName, index }) => {
  const password = await bcrypt.hash(TEACHER_PASSWORD, 10);
  return insertAndReturnId(
    `INSERT INTO teacher
      (name, email, password, department, status, date_joined, employee_id, phone, module_name, qualification, years_experience, available_days, available_from, available_to)
     VALUES (?, ?, ?, ?, 'active', CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      email,
      password,
      department,
      `TCH-${String(index).padStart(3, '0')}`,
      `+265999${String(100000 + index).slice(-6)}`,
      moduleName,
      'Diploma / Degree',
      3 + (index % 8),
      'Monday, Tuesday, Wednesday, Thursday, Friday',
      '08:00',
      '17:15'
    ]
  );
};

const createModule = async ({ module_name, department, hours_per_year, required_room_type }) => {
  return insertAndReturnId(
    `INSERT INTO module (module_name, department, hours_per_year, description, required_room_type)
     VALUES (?, ?, ?, ?, ?)`,
    [
      module_name,
      department,
      hours_per_year,
      `${module_name} for ${department}`,
      required_room_type
    ]
  );
};

const moduleProps = {
  'Programming Fundamentals': { hours: 180, type: 'Computer Lab', department: 'Software Development' },
  'Web Application Development': { hours: 180, type: 'Computer Lab', department: 'Software Development' },
  'Database Systems': { hours: 120, type: 'Computer Lab', department: 'Software Development' },
  'Software Engineering': { hours: 120, type: 'Computer Lab', department: 'Software Development' },
  'Mobile App Development': { hours: 120, type: 'Computer Lab', department: 'Software Development' },
  'Cloud Computing': { hours: 120, type: 'Computer Lab', department: 'Software Development' },
  'UI UX Design': { hours: 60, type: 'Computer Lab', department: 'Software Development' }, // Small module
  'Object Oriented Programming': { hours: 120, type: 'Computer Lab', department: 'Software Development' },

  'Network Fundamentals': { hours: 180, type: 'Networking Lab', department: 'Networking' },
  'Routing and Switching': { hours: 180, type: 'Networking Lab', department: 'Networking' },
  'Network Security': { hours: 120, type: 'Networking Lab', department: 'Networking' },
  'Linux Server Administration': { hours: 120, type: 'Networking Lab', department: 'Networking' },
  'Wireless Networks': { hours: 120, type: 'Networking Lab', department: 'Networking' },
  'Cybersecurity Basics': { hours: 120, type: 'Networking Lab', department: 'Networking' },
  'Cloud Networking': { hours: 120, type: 'Networking Lab', department: 'Networking' },
  'IT Support Practice': { hours: 60, type: 'Networking Lab', department: 'Networking' } // Small module
};

const createClass = async ({ class_name, level, section_id, room_id, shift_id, class_teacher_id }) => {
  return insertAndReturnId(
    `INSERT INTO class (class_name, level, academic_year, class_teacher_id, shift_id, section_id, room_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [class_name, level, ACADEMIC_YEAR, class_teacher_id, shift_id, section_id, room_id]
  );
};

const run = async () => {
  await Teacher.ensureProfileColumns();
  await ensureTimetableColumns();
  await SystemSetting.updateTimetableSettings({
    teacher_changeover_minutes: 0,
    break_start_time: '10:15',
    break_end_time: '10:45',
    timetable_breaks: [
      { break_name: 'Morning Break', start_time: '10:15', end_time: '10:45' },
      { break_name: 'Lunch Break', start_time: '12:15', end_time: '13:00' },
      { break_name: 'Evening Break', start_time: '15:15', end_time: '15:45' }
    ],
    break_period_rules: {
      enabled: true,
      periods_before_morning_break: 3,
      periods_before_lunch: 2,
      periods_before_afternoon_break: 3,
      periods_after_afternoon_break: 2,
      morning_break_minutes: 30,
      lunch_break_minutes: 45,
      afternoon_break_minutes: 30
    }
  });

  await resetAcademicTables();
  await ensureAdmin();

  const shiftId = await insertAndReturnId(
    'INSERT INTO shift (shift_name, start_time, end_time, teacher_changeover_minutes) VALUES (?, ?, ?, ?)',
    ['Full Day', '08:00', '17:15', 0]
  );

  const sectionIds = {};
  for (const section of ['Software Development', 'Networking']) {
    sectionIds[section] = await insertAndReturnId(
      'INSERT INTO section (section_name, level, description) VALUES (?, ?, ?)',
      [section, 'All Levels', `${section} academic section`]
    );
  }

  const roomIds = {};
  const roomSeed = [
    ...Array.from({ length: 5 }, (_, index) => ({ name: `Software Lab ${index + 1}`, type: 'Computer Lab' })),
    ...Array.from({ length: 3 }, (_, index) => ({ name: `Networking Lab ${index + 1}`, type: 'Networking Lab' })),
    { name: 'Lecture Room A', type: 'Classroom' },
    { name: 'Lecture Room B', type: 'Classroom' }
  ];
  for (const room of roomSeed) {
    roomIds[room.name] = await insertAndReturnId(
      'INSERT INTO room (room_name, room_type, capacity) VALUES (?, ?, ?)',
      [room.name, room.type, 40]
    );
  }

  const moduleIds = {};
  // Create software modules with defined hours_per_year and room types
  for (const moduleName of softwareModules) {
    const props = moduleProps[moduleName];
    moduleIds[moduleName] = await createModule({
      module_name: moduleName,
      department: props.department,
      hours_per_year: props.hours,
      required_room_type: props.type
    });
  }
  // Create networking modules with defined hours_per_year and room types
  for (const moduleName of networkingModules) {
    const props = moduleProps[moduleName];
    moduleIds[moduleName] = await createModule({
      module_name: moduleName,
      department: props.department,
      hours_per_year: props.hours,
      required_room_type: props.type
    });
  }

  const classRecords = [];
  let teacherIndex = 1;

  for (const classItem of classes) {
    const modulePool = classItem.section === 'Networking' ? networkingModules : softwareModules;
    const classTeachers = [];

    for (let slot = 0; slot < 5; slot += 1) {
      const moduleName = modulePool[(classes.indexOf(classItem) + slot) % modulePool.length];
      const teacherId = await createTeacher({
        name: `${classItem.section === 'Networking' ? 'Network' : 'Software'} Teacher ${teacherIndex}`,
        email: `teacher${String(teacherIndex).padStart(3, '0')}@school.com`,
        department: classItem.section,
        moduleName,
        index: teacherIndex
      });
      classTeachers.push({ teacherId, moduleName });
      teacherIndex += 1;
    }

    const classId = await createClass({
      ...classItem,
      section_id: sectionIds[classItem.section],
      room_id: roomIds[classItem.room],
      shift_id: shiftId,
      class_teacher_id: classTeachers[0].teacherId
    });

    const assignments = [];
    for (const teacher of classTeachers) {
      const assignmentId = await insertAndReturnId(
        `INSERT INTO assignment (teacher_id, module_id, class_id, shift_id, academic_year, term)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [teacher.teacherId, moduleIds[teacher.moduleName], classId, shiftId, ACADEMIC_YEAR, TERM]
      );
      assignments.push({ assignmentId, moduleName: teacher.moduleName });
    }

    classRecords.push({
      class_id: classId,
      class_name: classItem.class_name,
      room_id: roomIds[classItem.room],
      assignments
    });
  }

  const timetableRows = buildTimetableRowsFromSettings(await SystemSetting.getTimetableSettings());
  const periods = timetableRows.filter((row) => row.type === 'period');
  const breaks = timetableRows.filter((row) => row.type === 'break');

  for (const classRecord of classRecords) {
    for (const day of FIXED_DAYS) {
      for (const breakRow of breaks) {
        await pool.execute(
          `INSERT INTO timetable (class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number)
           VALUES (?, NULL, ?, ?, ?, NULL, ?, 'break', NULL)`,
          [classRecord.class_id, day, breakRow.start_time, breakRow.end_time, breakRow.break_name]
        );
      }

      for (const period of periods) {
        // Ensure there are assignments to pick from, otherwise skip this period
        if (classRecord.assignments.length === 0) {
          console.warn(`No assignments found for class ${classRecord.class_name}. Skipping timetable generation for this period.`);
          continue;
        }
        const assignment = classRecord.assignments[(period.slot_number - 1) % classRecord.assignments.length]; // This ensures large modules are picked more often
        await pool.execute(
          `INSERT INTO timetable (class_id, assignment_id, day_of_week, start_time, end_time, room_id, module_name, entry_type, slot_number, status, academic_year, term)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'lesson', ?, 'published', ?, ?)`,
          [
            classRecord.class_id,
            assignment.assignmentId,
            day,
            period.start_time,
            period.end_time,
            classRecord.room_id,
            assignment.moduleName,
            period.slot_number,
            ACADEMIC_YEAR,
            TERM
          ]
        );
      }
    }
  }

  console.log('Academic demo data reset and full timetables generated.');
  console.log(`Admin: admin@school.com / ${ADMIN_PASSWORD}`);
  console.log(`Teachers: teacher001@school.com to teacher${String(teacherIndex - 1).padStart(3, '0')}@school.com / ${TEACHER_PASSWORD}`);
  console.log(`Classes generated: ${classRecords.length}`);
  await pool.end();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
