const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create student
router.post('/', auth, [
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

    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Failed to create student' });
  }
});

// Get all students
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.class_id) filters.class_id = req.query.class_id;
    if (req.query.section_id) filters.section_id = req.query.section_id;
    if (req.query.academic_year) filters.academic_year = req.query.academic_year;
    if (req.query.status) filters.status = req.query.status;

    const students = await Student.findAll(filters);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

router.get('/teacher/classes', auth, async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.teacher_id;
    if (!teacherId) {
      return res.status(403).json({ message: 'Teacher account required' });
    }

    const classes = await Student.getTeacherClasses(teacherId);
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Failed to fetch teacher classes' });
  }
});

router.get('/teacher/classes/:classId/students', auth, async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.teacher_id;
    if (!teacherId) {
      return res.status(403).json({ message: 'Teacher account required' });
    }

    const students = await Student.getClassStudentsForTeacher(req.params.classId, teacherId);
    if (!students) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    res.json({ students });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ message: 'Failed to fetch class students' });
  }
});

router.get('/attendance', auth, async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.teacher_id || null;
    if (req.user?.type === 'teacher') {
      const students = await Student.getClassStudentsForTeacher(req.query.class_id, teacherId);
      if (!students) {
        return res.status(403).json({ message: 'You are not assigned to this class' });
      }
    }

    const attendance = await Student.getAttendance({
      class_id: req.query.class_id,
      attendance_date: req.query.attendance_date,
      timetable_id: req.query.timetable_id || null,
      period_label: req.query.period_label || null
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

router.post('/attendance', auth, [
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

    const teacherId = req.user?.teacherId || req.user?.teacher_id || null;
    if (req.user?.type === 'teacher') {
      const students = await Student.getClassStudentsForTeacher(req.body.class_id, teacherId);
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
      records: req.body.records
    });

    res.json({ message: 'Attendance saved', attendance: saved });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
});

// Get student by user ID (for student portal)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const student = await Student.findByUserId(req.params.userId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student by user ID:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

router.get('/:id/attendance-history', auth, async (req, res) => {
  try {
    const attendance = await Student.getAttendanceHistory(req.params.id, {
      status: req.query.status || undefined,
      from_date: req.query.from_date || undefined,
      to_date: req.query.to_date || undefined
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: 'Failed to fetch student attendance history' });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Get student timetable
router.get('/:id/timetable', auth, async (req, res) => {
  try {
    const { academic_year, term } = req.query;
    const timetable = await Student.getTimetable(req.params.id, academic_year, term);
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({ message: 'Failed to fetch student timetable' });
  }
});

// Update student
router.put('/:id', auth, [
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

    const student = await Student.update(req.params.id, req.body);
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
  try {
    await Student.delete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

module.exports = router;
