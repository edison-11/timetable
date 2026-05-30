const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { getRequestSchoolId } = require('../utils/tenant');

const router = express.Router();

const getTeacherIdFromRequest = async (req) => {
  const directId = req.user?.teacherId || req.user?.teacher_id;
  if (directId) return directId;

  const email = req.user?.email;
  if (!email) return null;
  const teacher = await Teacher.findByEmail(email).catch(() => null);
  return teacher?.teacher_id || null;
};

const requireTeacher = async (req, res, next, options = {}) => {
  const teacherId = await getTeacherIdFromRequest(req);
  if (!teacherId || req.user?.type !== 'teacher') {
    if (options.passThrough) {
      next('router');
      return null;
    }
    res.status(403).json({ message: 'Teacher account required' });
    return null;
  }
  return teacherId;
};

router.get('/classes', auth, async (req, res, next) => {
  try {
    const teacherId = await requireTeacher(req, res, next);
    if (!teacherId) return;

    const classes = await Student.getTeacherClasses(teacherId, { school_id: getRequestSchoolId(req) });
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Failed to fetch teacher classes' });
  }
});

router.get('/classes/:classId/students', auth, async (req, res, next) => {
  try {
    const teacherId = await requireTeacher(req, res, next);
    if (!teacherId) return;

    const students = await Student.getClassStudentsForTeacher(req.params.classId, teacherId, {
      school_id: getRequestSchoolId(req)
    });
    if (!students) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    res.json({ students });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ message: 'Failed to fetch class students' });
  }
});

router.get('/attendance', auth, async (req, res, next) => {
  try {
    const teacherId = await requireTeacher(req, res, next, { passThrough: true });
    if (!teacherId) return;

    const school_id = getRequestSchoolId(req);
    const students = await Student.getClassStudentsForTeacher(req.query.class_id, teacherId, { school_id });
    if (!students) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
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

router.post('/attendance', auth, [
  body('class_id').isInt().withMessage('Class is required'),
  body('attendance_date').isISO8601().withMessage('Attendance date is required'),
  body('timetable_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  body('period_label').optional({ nullable: true, checkFalsy: true }).trim(),
  body('records').isArray().withMessage('Attendance records are required'),
  body('records.*.student_id').isInt().withMessage('Student is required'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
  body('records.*.notes').optional({ nullable: true, checkFalsy: true }).trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const teacherId = await requireTeacher(req, res, next, { passThrough: true });
    if (!teacherId) return;

    const school_id = getRequestSchoolId(req);
    const students = await Student.getClassStudentsForTeacher(req.body.class_id, teacherId, { school_id });
    if (!students) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
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

module.exports = router;
