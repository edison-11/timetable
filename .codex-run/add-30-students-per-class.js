const pool = require('../server/config/database');
const Student = require('../server/models/Student');

const TARGET_PER_CLASS = 30;
const ACADEMIC_YEAR = '2025-2026';

const firstNames = [
  'Aline', 'Eric', 'Grace', 'Jean', 'Marie', 'Patrick', 'Claudine', 'Emmanuel',
  'Diane', 'Samuel', 'Alice', 'Daniel', 'Clementine', 'Kevin', 'Irene', 'Claude',
  'Divine', 'Aimable', 'Sandrine', 'Olivier', 'Nadine', 'Pascal', 'Solange',
  'Thierry', 'Chantal', 'Fabrice', 'Yvette', 'Bosco', 'Ange', 'Cedric'
];

const lastNames = [
  'Uwimana', 'Niyonsenga', 'Mukamana', 'Habimana', 'Uwamahoro', 'Nshimiyimana',
  'Iradukunda', 'Bizimana', 'Mutabazi', 'Nsabimana', 'Mugisha', 'Kayitesi',
  'Ndayisaba', 'Mutesi', 'Hakizimana', 'Munyaneza', 'Ingabire', 'Twagirayezu',
  'Nkurunziza', 'Uwase', 'Rukundo', 'Ishimwe', 'Niyigena', 'Bimenyimana',
  'Manirakiza', 'Tuyisenge', 'Byukusenge', 'Niyomugabo', 'Uwera', 'Mugenzi'
];

const slug = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const getClasses = async () => {
  const [rows] = await pool.execute(`
    SELECT class_id, class_name, academic_year, section_id, school_id
    FROM class
    ORDER BY level, class_name
  `);
  return rows;
};

const getExistingStudents = async (classId) => {
  const [rows] = await pool.execute(
    'SELECT student_id, student_number FROM student WHERE class_id = ? ORDER BY student_id',
    [classId]
  );
  return rows;
};

const studentNumberFor = (className, classId, index) => {
  const classCode = slug(className).toUpperCase().replace(/-/g, '').slice(0, 10) || `CLASS${classId}`;
  return `${classCode}-${String(index).padStart(3, '0')}`;
};

const run = async () => {
  await Student.ensureSchema();
  const classes = await getClasses();

  if (!classes.length) {
    console.log('No classes found. Add classes first, then rerun this script.');
    return;
  }

  let createdTotal = 0;

  for (const cls of classes) {
    const existing = await getExistingStudents(cls.class_id);
    const existingNumbers = new Set(existing.map((student) => student.student_number));
    let createdForClass = 0;

    for (let index = 1; index <= TARGET_PER_CLASS; index += 1) {
      const studentNumber = studentNumberFor(cls.class_name, cls.class_id, index);
      if (existingNumbers.has(studentNumber)) continue;

      const firstName = firstNames[(index - 1) % firstNames.length];
      const lastName = lastNames[(Number(cls.class_id) + index - 2) % lastNames.length];
      const name = `${firstName} ${lastName}`;
      const emailBase = `${slug(cls.class_name)}-${String(index).padStart(2, '0')}`;

      await Student.create({
        student_number: studentNumber,
        name,
        sex: index % 2 === 0 ? 'Male' : 'Female',
        email: `${emailBase}@student.local`,
        parent_name: `${lastName} Parent`,
        parent_email: '',
        parent_phone: `+25078${String(1000000 + Number(cls.class_id) * 100 + index).slice(-7)}`,
        class_id: cls.class_id,
        section_id: cls.section_id,
        academic_year: cls.academic_year || ACADEMIC_YEAR,
        school_id: cls.school_id || null
      });

      createdForClass += 1;
      createdTotal += 1;
    }

    const after = await getExistingStudents(cls.class_id);
    console.log(`${cls.class_name}: ${after.length} students (${createdForClass} added)`);
  }

  console.log(`Done. Added ${createdTotal} students.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
