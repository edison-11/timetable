const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { requireSchoolAdmin } = require('../middleware/rbac');
const { getRequestSchoolId, enforceSameSchool } = require('../utils/tenant');

const router = express.Router();

const isStudentUser = (req) => req.user?.role === 'student' || req.user?.type === 'student';
const isTeacherUser = (req) => req.user?.role === 'teacher' || req.user?.type === 'teacher';
const canManageStudents = (req) => ['dos', 'admin'].includes(req.user?.role);

const requireOwnStudentAccess = async (req, res, next) => {
  try {
    if (!isStudentUser(req)) return next();

    const studentId = req.params.id;
    if (!studentId) {
      return res.status(403).json({ message: 'Student record access required' });
    }

    const ownStudent = await Student.findByUserId(req.user.id);
    if (!ownStudent || Number(ownStudent.student_id) !== Number(studentId)) {
      return res.status(403).json({ message: 'You can only view your own student information' });
    }

    req.studentRecord = ownStudent;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireStudentOrSchoolAdmin = async (req, res, next) => {
  if (isStudentUser(req)) return requireOwnStudentAccess(req, res, next);
  if (canManageStudents(req)) return next();
  return res.status(403).json({ message: 'Insufficient permissions' });
};

const requireTeacherOrSchoolAdmin = (req, res, next) => {
  if (isTeacherUser(req) || canManageStudents(req)) return next();
  return res.status(403).json({ message: 'Insufficient permissions' });
};

const getTeacherIdFromRequest = async (req) => {
  const directId = req.user?.teacherId || req.user?.teacher_id;
  if (directId) return directId;

  const email = req.user?.email;
  if (!email) return null;
  const teacher = await Teacher.findByEmail(email).catch(() => null);
  return teacher?.teacher_id || null;
};

// Create student
router.post('/', auth, requireSchoolAdmin, [
  body('student_number').trim().notEmpty().withMessage('Student number is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('sex').optional({ nullable: true, checkFalsy: true }).trim(),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Valid student email is required'),
  body('parent_name').optional({ nullable: true, checkFalsy: true }).trim(),
  body('parent_email').isEmail().withMessage('Valid parent email is required'),
  body('parent_phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('parent_password').isLength({ min: 6 }).withMessage('Parent password must be at least 6 characters'),
  body('academic_year').trim().notEmpty().withMessage('Academic year is required'),
  body('class_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('section_id').optional({ nullable: true, checkFalsy: true }).isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.create({ ...req.body, school_id: getRequestSchoolId(req) });
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Failed to create student' });
  }
});

// Get all students
router.get('/', auth, requireSchoolAdmin, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.class_id) filters.class_id = req.query.class_id;
    if (req.query.section_id) filters.section_id = req.query.section_id;
    if (req.query.academic_year) filters.academic_year = req.query.academic_year;
    if (req.query.status) filters.status = req.query.status;
    filters.school_id = getRequestSchoolId(req);

    const students = await Student.findAll(filters);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

router.get('/teacher/classes', auth, async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromRequest(req);
    if (!teacherId) {
      return res.status(403).json({ message: 'Teacher account required' });
    }

    const classes = await Student.getTeacherClasses(teacherId, { school_id: getRequestSchoolId(req) });
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Failed to fetch teacher classes' });
  }
});

router.get('/teacher/classes/:classId/students', auth, async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromRequest(req);
    if (!teacherId) {
      return res.status(403).json({ message: 'Teacher account required' });
    }

    const students = await Student.getClassStudentsForTeacher(req.params.classId, teacherId, { school_id: getRequestSchoolId(req) });
    if (!students) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    res.json({ students });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ message: 'Failed to fetch class students' });
  }
});

router.get('/attendance', auth, requireTeacherOrSchoolAdmin, async (req, res) => {
  try {
    const teacherId = await getTeacherIdFromRequest(req);
    const school_id = getRequestSchoolId(req);
    if (req.user?.type === 'teacher') {
      const students = await Student.getClassStudentsForTeacher(req.query.class_id, teacherId, { school_id });
      if (!students) {
        return res.status(403).json({ message: 'You are not assigned to this class' });
      }
    }

    const attendance = await Student.getAttendance({
      class_id: req.query.class_id,
      attendance_date: req.query.attendance_date,
      timetable_id: req.query.timetable_id || null,
      period_label: req.query.period_label || null,
      school_id
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

router.get('/attendance/records', auth, requireTeacherOrSchoolAdmin, async (req, res) => {
  try {
    if (!req.query.attendance_date && !req.query.from_date && !req.query.to_date) {
      return res.status(400).json({ message: 'Attendance date or report date range is required' });
    }

    const attendance = await Student.getAttendanceRecords({
      attendance_date: req.query.attendance_date || null,
      from_date: req.query.from_date || null,
      to_date: req.query.to_date || null,
      class_id: req.query.class_id || null,
      school_id: getRequestSchoolId(req)
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

router.post('/attendance', auth, requireTeacherOrSchoolAdmin, [
  body('class_id').isInt().withMessage('Class is required'),
  body('attendance_date').isISO8601().withMessage('Attendance date is required'),
  body('timetable_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('period_label').optional({ nullable: true, checkFalsy: true }).trim(),
  body('records').isArray().withMessage('Attendance records are required'),
  body('records.*.student_id').isInt().withMessage('Student is required'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
  body('records.*.notes').optional({ nullable: true, checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const teacherId = await getTeacherIdFromRequest(req);
    const school_id = getRequestSchoolId(req);
    if (req.user?.type === 'teacher') {
      const students = await Student.getClassStudentsForTeacher(req.body.class_id, teacherId, { school_id });
      if (!students) {
        return res.status(403).json({ message: 'You are not assigned to this class' });
      }
    }

    const saved = await Student.saveAttendance({
      class_id: req.body.class_id,
      timetable_id: req.body.timetable_id || null,
      teacher_id: teacherId,
      attendance_date: req.body.attendance_date,
      period_label: req.body.period_label || null,
      records: req.body.records.map((record) => ({ ...record, school_id }))
    });

    const presentCount = req.body.records.filter((record) => record.status === 'present').length;
    const absentCount = req.body.records.filter((record) => record.status === 'absent').length;
    const lateCount = req.body.records.filter((record) => record.status === 'late').length;
    const excusedCount = req.body.records.filter((record) => record.status === 'excused').length;

    if (req.body.report === true) {
      const students = await Student.findAll({ class_id: req.body.class_id, status: 'active', school_id });
      const studentNames = new Map(students.map((student) => [Number(student.student_id), student.name]));
      const absentNames = req.body.records
        .filter((record) => record.status === 'absent')
        .map((record) => studentNames.get(Number(record.student_id)) || `Student #${record.student_id}`);
      const className = students[0]?.class_name || `Class ${req.body.class_id}`;
      const teacherName = req.user?.name || req.user?.full_name || 'Teacher';

      await Notification.create({
        type: 'attendance_report',
        title: `Attendance report: ${className}`,
        message: `${teacherName} reported ${req.body.records.length} students for ${req.body.attendance_date} (${req.body.period_label || 'period'}). Present: ${presentCount}, Absent: ${absentCount}, Late: ${lateCount}, Excused: ${excusedCount}. Absent list: ${absentNames.length ? absentNames.join(', ') : 'None'}.`,
        path: '/students',
        school_id,
        recipient_role: 'dos',
        tone: absentCount ? 'amber' : 'green'
      });
    }

    res.json({
      message: req.body.report === true ? 'Attendance report sent' : 'Attendance saved',
      attendance: saved,
      summary: {
        total: req.body.records.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount
      }
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
});

// Get student by user ID (for student portal)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (isStudentUser(req) && Number(req.params.userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'You can only view your own student information' });
    }

    const student = await Student.findByUserId(req.params.userId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!enforceSameSchool(req, student)) return res.status(403).json({ message: 'Student belongs to another school' });

    res.json(student);
  } catch (error) {
    console.error('Error fetching student by user ID:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

router.get('/:id/attendance-history', auth, requireStudentOrSchoolAdmin, async (req, res) => {
  try {
    const attendance = await Student.getAttendanceHistory(req.params.id, {
      status: req.query.status || undefined,
      from_date: req.query.from_date || undefined,
      to_date: req.query.to_date || undefined,
      school_id: getRequestSchoolId(req)
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: 'Failed to fetch student attendance history' });
  }
});

// Get student by ID
router.get('/:id', auth, requireStudentOrSchoolAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!enforceSameSchool(req, student)) return res.status(403).json({ message: 'Student belongs to another school' });

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Get student timetable
router.get('/:id/timetable', auth, requireStudentOrSchoolAdmin, async (req, res) => {
  try {
    const student = req.studentRecord || await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (!enforceSameSchool(req, student)) return res.status(403).json({ message: 'Student belongs to another school' });

    const { academic_year, term } = req.query;
    const timetable = await Student.getTimetable(req.params.id, academic_year, term);
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({ message: 'Failed to fetch student timetable' });
  }
});

// Update student
router.put('/:id', auth, requireSchoolAdmin, [
  body('name').optional().trim().notEmpty(),
  body('sex').optional({ nullable: true, checkFalsy: true }).trim(),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  body('parent_name').optional({ nullable: true, checkFalsy: true }).trim(),
  body('parent_email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  body('parent_phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('class_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('section_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('academic_year').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'graduated'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) return res.status(404).json({ message: 'Student not found' });
    if (!enforceSameSchool(req, existingStudent)) return res.status(403).json({ message: 'Student belongs to another school' });

    const student = await Student.update(req.params.id, { ...req.body, school_id: getRequestSchoolId(req) });
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', auth, requireSchoolAdmin, async (req, res) => {
  try {
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) return res.status(404).json({ message: 'Student not found' });
    if (!enforceSameSchool(req, existingStudent)) return res.status(403).json({ message: 'Student belongs to another school' });

    await Student.delete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

module.exports = router;
