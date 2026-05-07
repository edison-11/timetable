const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const { auth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';

const generateToken = (teacherId, email) => {
  return jwt.sign({ 
    teacherId, 
    email,
    type: 'teacher'
  }, JWT_SECRET, { expiresIn: '7d' });
};

// Teacher Registration
router.post('/register', [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, department = 'SSOD' } = req.body;

    // Check if teacher email already exists
    const existingTeacher = await Teacher.findByEmail(email);
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create teacher account in pending state
    const teacherId = await Teacher.create({
      name,
      email,
      password,
      department,
      status: 'pending',
      date_joined: new Date().toISOString().split('T')[0]
    });

    const teacher = await Teacher.findById(teacherId);

    res.status(201).json({
      message: 'Teacher registered successfully. Awaiting admin approval.',
      teacher: {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status,
        profile_photo: teacher.profile_photo || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Teacher Login
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

    // Temporary bypass for testing - remove in production
    if (email === 'test@example.com' && password === 'password123') {
      const token = jwt.sign({ teacherId: 1, type: 'teacher' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        message: 'Login successful',
        token,
        teacher: {
          teacher_id: 1,
          id: 1,
          name: 'Test Teacher',
          email: 'test@example.com',
          department: 'Computer Science',
          status: 'active',
          profile_photo: null
        }
      });
    }

    const teacher = await Teacher.findByEmail(email);
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (teacher.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval by an administrator' });
    }

    if (teacher.status === 'inactive') {
      return res.status(403).json({ message: 'Your account is inactive' });
    }

    const token = generateToken(teacher.teacher_id, teacher.email);

    res.json({
      message: 'Login successful',
      token,
      teacher: {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status,
        profile_photo: teacher.profile_photo || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher profile
router.get('/me', auth, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not a teacher account' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      teacher: {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status,
        profile_photo: teacher.profile_photo || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', auth, [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('profile_photo')
    .optional({ nullable: true })
    .isString()
    .withMessage('Profile photo must be a file path')
], async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not a teacher account' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, department, password, profile_photo } = req.body;
    const existingTeacher = await Teacher.findByEmailExcludingId(email, teacherId);

    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    await Teacher.update(teacherId, {
      name,
      email,
      department,
      password: password || undefined,
      profile_photo
    });

    const teacher = await Teacher.findById(teacherId);

    res.json({
      message: 'Profile updated successfully',
      teacher: {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status,
        profile_photo: teacher.profile_photo || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
