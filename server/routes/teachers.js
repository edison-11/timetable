const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const { auth } = require('../middleware/auth');

const router = express.Router();

const generateToken = (teacherId) => {
  return jwt.sign({ teacherId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register Teacher
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('status').optional().isIn(['active', 'inactive', 'on_leave'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, status = 'active', date_joined } = req.body;

    const existingTeacher = await Teacher.findByEmail(email);
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }

    const teacherId = await Teacher.create({ name, email, password, status, date_joined });
    const teacher = await Teacher.findById(teacherId);

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
  body('status').optional().isIn(['active', 'inactive', 'on_leave']),
  body('date_joined').optional().isDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, status, date_joined } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (status) updateData.status = status;
    if (date_joined) updateData.date_joined = date_joined;

    await Teacher.update(req.params.id, updateData);
    const updatedTeacher = await Teacher.findById(req.params.id);

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
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
