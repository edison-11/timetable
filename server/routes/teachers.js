const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

const generateToken = (teacherId) => {
  return jwt.sign({ teacherId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register Teacher
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('status').optional().isIn(['active', 'inactive', 'on_leave', 'pending'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, department = 'SSOD', status = 'pending', date_joined } = req.body;

    const existingTeacher = await Teacher.findByEmail(email);
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }

    const teacherId = await Teacher.create({ name, email, password, department, status, date_joined });
    const teacher = await Teacher.findById(teacherId);

    await Notification.create({
      type: 'teacher_registered',
      title: `New teacher registered: ${teacher.name}`,
      message: `${teacher.name} is waiting for review in the teachers list.`,
      path: '/teachers',
      tone: 'green'
    });

    const token = generateToken(teacherId);

    res.status(201).json({
      message: 'Teacher created successfully',
      token,
      teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Teacher
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const teacher = await Teacher.findByEmail(email);
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await Teacher.comparePassword(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(teacher.teacher_id);

    res.json({
      message: 'Login successful',
      token,
      teacher: {
        id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current teacher
router.get('/me', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    res.json({ teacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teachers
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.getAll();
    res.json({ teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teachers by status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const teachers = await Teacher.getByStatus(req.params.status);
    res.json({ teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active teachers
router.get('/active', auth, async (req, res) => {
  try {
    const teachers = await Teacher.getActiveTeachers();
    res.json({ teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending teachers
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingTeachers = await Teacher.getByStatus('pending');
    res.json({ pendingTeachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ teacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update teacher
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'on_leave', 'pending']),
  body('date_joined').optional().isDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, department, status, date_joined } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (department) updateData.department = department;
    if (status) updateData.status = status;
    if (date_joined) updateData.date_joined = date_joined;

    await Teacher.update(req.params.id, updateData);
    const updatedTeacher = await Teacher.findById(req.params.id);

    await Notification.create({
      type: 'teacher_updated',
      title: `Teacher profile changed: ${updatedTeacher.name}`,
      message: `${updatedTeacher.name}'s teacher record was updated.`,
      path: '/teachers',
      tone: 'violet'
    });

    res.json({
      message: 'Teacher updated successfully',
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete teacher
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    await Teacher.delete(req.params.id);
    await Notification.create({
      type: 'teacher_deleted',
      title: `Teacher deleted: ${teacher.name}`,
      message: `${teacher.name} was removed from the system.`,
      path: '/teachers',
      tone: 'rose'
    });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending teachers (temporary test without auth)
router.get('/pending-test', async (req, res) => {
  try {
    const pendingTeachers = await Teacher.getByStatus('pending');
    res.json({ pendingTeachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve teacher (test without auth)
router.put('/:id/approve-test', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher is not pending approval' });
    }

    await Teacher.update(req.params.id, { status: 'active' });
    const updatedTeacher = await Teacher.findById(req.params.id);

    await Notification.create({
      type: 'teacher_approved',
      title: `Teacher approved: ${updatedTeacher.name}`,
      message: `${updatedTeacher.name} can now access the system.`,
      path: '/teachers',
      tone: 'green'
    });

    res.json({
      success: true,
      message: 'Teacher approved successfully',
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error('Error approving teacher:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve teacher
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher is not pending approval' });
    }

    await Teacher.update(req.params.id, { status: 'active' });
    const updatedTeacher = await Teacher.findById(req.params.id);

    await Notification.create({
      type: 'teacher_approved',
      title: `Teacher approved: ${updatedTeacher.name}`,
      message: `${updatedTeacher.name} can now access the system.`,
      path: '/teachers',
      tone: 'green'
    });

    res.json({
      success: true,
      message: 'Teacher approved successfully',
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject teacher (delete)
router.delete('/:id/reject', adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher is not pending approval' });
    }

    await Teacher.delete(req.params.id);
    await Notification.create({
      type: 'teacher_rejected',
      title: `Teacher rejected: ${teacher.name}`,
      message: `${teacher.name}'s registration request was rejected.`,
      path: '/teachers',
      tone: 'rose'
    });

    res.json({
      success: true,
      message: 'Teacher rejected and removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
