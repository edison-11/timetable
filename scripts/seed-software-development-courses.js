const db = require('../db');

const DOS_EMAIL = process.env.DOS_EMAIL || 'mugisha@gmail.com';
const SHIFT_ID = null;
const ACADEMIC_YEAR = '2025-2026';
const TERM = 'Term 1';
const DEPARTMENT = 'Software Development';
const TARGET_COURSE_COUNT = 15;
const DEFAULT_PASSWORD_HASH = '$2a$10$RRI.eUb44PqbCiT6NiTPq.TdL8twHEI9GXziLDwcoWoobmUJr8WVa';

const teacherCatalog = [
  ['Software Development Teacher 1', 'sod-teacher-1@gha.local', '+250788200001'],
  ['Software Development Teacher 2', 'sod-teacher-2@gha.local', '+250788200002'],
  ['Software Development Teacher 3', 'sod-teacher-3@gha.local', '+250788200003'],
  ['Software Development Teacher 4', 'sod-teacher-4@gha.local', '+250788200004']
];

const courseCatalog = [
  ['Introduction to Software Development', 120, 'Core concepts, tools, and workflows used in software development.'],
  ['Programming Fundamentals with JavaScript', 140, 'Variables, control flow, functions, and problem solving with JavaScript.'],
  ['Object Oriented Programming', 120, 'Classes, objects, inheritance, encapsulation, and reusable application design.'],
  ['Web Design and HTML/CSS', 120, 'Building responsive user interfaces with semantic HTML and modern CSS.'],
  ['Front-End Development with Vue', 140, 'Component-based front-end development using Vue and routing patterns.'],
  ['Back-End Development with Node.js', 140, 'Server-side APIs, middleware, authentication, and backend structure.'],
  ['Database Design and SQL', 120, 'Relational database design, SQL queries, joins, and data integrity.'],
  ['Software Testing and Debugging', 100, 'Testing techniques, debugging workflows, and quality assurance practices.'],
  ['Data Structures and Algorithms', 140, 'Arrays, lists, maps, stacks, queues, searching, and sorting fundamentals.'],
  ['Mobile Application Development', 120, 'Building mobile-ready applications and understanding mobile UX patterns.'],
  ['UI/UX Design for Developers', 100, 'Usability, wireframes, interface design, and user-centered product thinking.'],
  ['Version Control with Git and GitHub', 80, 'Git workflows, branches, commits, collaboration, and repository hygiene.'],
  ['API Development and Integration', 120, 'REST APIs, JSON, third-party integration, and API documentation.'],
  ['Cybersecurity Basics for Developers', 100, 'Secure coding, authentication, authorization, and common web vulnerabilities.'],
  ['Software Project Management', 100, 'Planning, documentation, agile workflow, teamwork, and delivery practices.']
];

async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function ensureCourse([moduleName, hoursPerYear, description], schoolId) {
  const existing = await findOne(
    'SELECT module_id FROM module WHERE school_id = ? AND department = ? AND LOWER(module_name) = LOWER(?) LIMIT 1',
    [schoolId, DEPARTMENT, moduleName]
  );

  if (existing) return existing.module_id;

  const [result] = await db.execute(
    `INSERT INTO module (school_id, module_name, department, hours_per_year, description, required_room_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [schoolId, moduleName, DEPARTMENT, hoursPerYear, description, 'Computer Lab']
  );

  return result.insertId;
}

async function resolveSchoolId() {
  const dos = await findOne(
    `SELECT school_id FROM directors_of_studies WHERE LOWER(email) = LOWER(?) AND status = 'active' LIMIT 1`,
    [DOS_EMAIL]
  );

  if (dos?.school_id) return dos.school_id;

  const user = await findOne(
    `SELECT school_id FROM users WHERE LOWER(email) = LOWER(?) AND role = 'dos' AND status = 'active' LIMIT 1`,
    [DOS_EMAIL]
  );

  if (user?.school_id) return user.school_id;

  throw new Error(`Could not find an active DOS school for ${DOS_EMAIL}.`);
}

async function ensureTeachers(schoolId) {
  const existingTeachers = await query(
    `SELECT teacher_id, name
     FROM teacher
     WHERE school_id = ? AND status = 'active'
     ORDER BY teacher_id`,
    [schoolId]
  );

  for (const [name, email, phone] of teacherCatalog) {
    if (existingTeachers.length >= 4) break;

    const existing = await findOne(
      'SELECT teacher_id, name FROM teacher WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email]
    );

    if (!existing) {
      await db.execute(
        `INSERT INTO teacher
          (school_id, name, email, password, department, status, date_joined, phone, module_name)
         VALUES (?, ?, ?, ?, ?, 'active', CURRENT_DATE, ?, ?)`,
        [schoolId, name, email, DEFAULT_PASSWORD_HASH, DEPARTMENT, phone, 'Software Development Modules']
      );
    }

    existingTeachers.splice(0, existingTeachers.length, ...await query(
      `SELECT teacher_id, name
       FROM teacher
       WHERE school_id = ? AND status = 'active'
       ORDER BY teacher_id`,
      [schoolId]
    ));
  }

  return existingTeachers.slice(0, 4);
}

async function ensureClass(schoolId, teachers) {
  const existing = await findOne(
    `SELECT class_id
     FROM class
     WHERE school_id = ?
       AND (LOWER(class_name) LIKE '%software%' OR LOWER(class_name) LIKE '%sod%')
     ORDER BY class_id
     LIMIT 1`,
    [schoolId]
  );

  if (existing) return existing.class_id;

  const [result] = await db.execute(
    `INSERT INTO class
      (school_id, class_name, level, academic_year, class_teacher_id, shift_id, section_id, room_id)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    [schoolId, 'Software Development L3 A', 'L3', ACADEMIC_YEAR, teachers[0]?.teacher_id || null]
  );

  return result.insertId;
}

async function main() {
  const schoolId = await resolveSchoolId();
  const teachers = await ensureTeachers(schoolId);

  if (teachers.length < 4) {
    throw new Error(`Expected 4 active teachers for school ${schoolId}, found ${teachers.length}.`);
  }

  const classId = await ensureClass(schoolId, teachers);

  const catalogModuleIds = [];
  for (const course of courseCatalog) {
    catalogModuleIds.push(await ensureCourse(course, schoolId));
  }

  const softwareDevCourses = await query(
    `SELECT module_id, module_name
     FROM module
     WHERE module_id IN (${catalogModuleIds.map(() => '?').join(', ')})
     ORDER BY module_id`,
    catalogModuleIds
  );

  for (let index = 0; index < softwareDevCourses.length; index += 1) {
    const course = softwareDevCourses[index];
    const teacher = teachers[index % teachers.length];

    const existingAssignment = await findOne(
      `SELECT assignment_id
       FROM assignment
       WHERE school_id = ? AND module_id = ? AND class_id = ? AND academic_year = ? AND term = ?
       LIMIT 1`,
      [schoolId, course.module_id, classId, ACADEMIC_YEAR, TERM]
    );

    if (existingAssignment) continue;

    await db.execute(
      `INSERT INTO assignment (school_id, teacher_id, module_id, class_id, shift_id, academic_year, term)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, teacher.teacher_id, course.module_id, classId, SHIFT_ID, ACADEMIC_YEAR, TERM]
    );
  }

  const summary = await query(
    `SELECT
       t.teacher_id,
       t.name AS teacher_name,
       COUNT(DISTINCT a.module_id) AS assigned_courses
     FROM teacher t
     LEFT JOIN assignment a
      ON a.teacher_id = t.teacher_id
      AND a.school_id = ?
      AND a.class_id = ?
      AND a.academic_year = ?
      AND a.term = ?
     WHERE t.school_id = ?
     GROUP BY t.teacher_id, t.name
     ORDER BY t.teacher_id`,
    [schoolId, classId, ACADEMIC_YEAR, TERM, schoolId]
  );

  const count = { total: softwareDevCourses.length };

  console.log(`DOS: ${DOS_EMAIL}`);
  console.log(`School ID: ${schoolId}`);
  console.log(`Class ID: ${classId}`);
  console.log(`Seeded Software Development courses: ${count.total}`);
  console.table(summary);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
