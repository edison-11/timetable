const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Module = require('../models/Module');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
const pendingTeacherRegistrations = new Map();

const createVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

const sanitizeRegistrationPayload = (body) => ({
  name: body.name,
  email: body.email,
  password: body.password,
  department: body.department || 'SSOD',
  employeeId: body.employeeId,
  phone: body.phone,
  module_name: body.module_name,
  qualification: body.qualification,
  profile_photo: body.profile_photo,
  national_id: body.national_id,
  yearsExperience: body.yearsExperience,
  availableDays: body.availableDays,
  availableFrom: body.availableFrom,
  availableTo: body.availableTo,
  notes: body.notes,
  school_id: body.school_id
});

const getRegistrationResponseCode = (code) => {
  if (process.env.NODE_ENV === 'production') return undefined;
  return code;
};

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
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number'),
  body('department').optional().trim(),
  body('employeeId').trim().notEmpty().withMessage('Teacher ID is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('module_name').trim().notEmpty().withMessage('Module or subject is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('profile_photo').optional().isString().withMessage('Profile photo must be an uploaded file path'),
  body('national_id').optional().trim(),
  body('yearsExperience').optional().isInt({ min: 0 }).toInt(),
  body('availableDays').optional().trim(),
  body('availableFrom').optional().isString(),
  body('availableTo').optional().isString(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      department = 'SSOD',
      employeeId,
      phone,
      module_name,
      qualification,
      profile_photo,
      national_id,
      yearsExperience,
      availableDays,
      availableFrom,
      availableTo,
      notes
    } = req.body;

    const existingTeacher = await Teacher.findByEmail(email);
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const verificationCode = createVerificationCode();
    pendingTeacherRegistrations.set(email, {
      code: verificationCode,
      expiresAt: Date.now() + (10 * 60 * 1000),
      attempts: 0,
      payload: sanitizeRegistrationPayload(req.body)
    });

    console.log(`Teacher registration verification code for ${email}: ${verificationCode}`);

    return res.status(202).json({
      message: 'Verification code sent. Enter the code to complete registration.',
      requires_verification: true,
      email,
      verification_expires_minutes: 10,
      dev_verification_code: getRegistrationResponseCode(verificationCode)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-registration', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;
    const pending = pendingTeacherRegistrations.get(email);

    if (!pending) {
      return res.status(400).json({ message: 'No pending registration found for this email' });
    }

    if (Date.now() > pending.expiresAt) {
      pendingTeacherRegistrations.delete(email);
      return res.status(400).json({ message: 'Verification code expired. Please register again.' });
    }

    pending.attempts += 1;
    if (pending.attempts > 5) {
      pendingTeacherRegistrations.delete(email);
      return res.status(429).json({ message: 'Too many incorrect verification attempts. Please register again.' });
    }

    if (String(pending.code) !== String(code).trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const existingTeacher = await Teacher.findByEmail(email);
    if (existingTeacher) {
      pendingTeacherRegistrations.delete(email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    const {
      name,
      password,
      department,
      employeeId,
      phone,
      module_name,
      qualification,
      profile_photo,
      national_id,
      yearsExperience,
      availableDays,
      availableFrom,
      availableTo,
      notes,
      school_id
    } = pending.payload;

    const teacherId = await Teacher.create({
      name,
      email,
      password,
      department,
      status: 'pending',
      date_joined: new Date().toISOString().split('T')[0],
      employee_id: employeeId,
      national_id: national_id || employeeId,
      phone,
      module_name,
      qualification,
      profile_photo,
      years_experience: yearsExperience,
      available_days: availableDays,
      available_from: availableFrom,
      available_to: availableTo,
      notes,
      school_id: school_id || null
    });

    const teacher = await Teacher.findById(teacherId);
    pendingTeacherRegistrations.delete(email);

    await Notification.create({
      type: 'teacher_registered',
      title: `New teacher registered: ${teacher.name}`,
      message: `${teacher.name} is waiting for approval.`,
      path: '/teachers',
      tone: 'green',
      school_id: teacher.school_id || null,
      recipient_role: 'dos'
    });

    res.status(201).json({
      message: 'Teacher registered successfully. Awaiting approval.',
      teacher: {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status,
        profile_photo: teacher.profile_photo || null,
        employee_id: teacher.employee_id || null,
        phone: teacher.phone || null,
        module_name: teacher.module_name || null,
        qualification: teacher.qualification || null,
        years_experience: teacher.years_experience || null,
        available_days: teacher.available_days || null,
        available_from: teacher.available_from || null,
        available_to: teacher.available_to || null,
        notes: teacher.notes || null
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

    const teacher = await Teacher.findByEmail(email);
    
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = teacher.password && typeof teacher.password === 'string'
      ? await bcrypt.compare(password, teacher.password)
      : false;
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
        profile_photo: teacher.profile_photo || null,
        employee_id: teacher.employee_id || null,
        phone: teacher.phone || null,
        module_name: teacher.module_name || null,
        qualification: teacher.qualification || null,
        years_experience: teacher.years_experience || null,
        available_days: teacher.available_days || null,
        available_from: teacher.available_from || null,
        available_to: teacher.available_to || null,
        notes: teacher.notes || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/assignments', auth, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not a teacher account' });
    }

    const assignments = await Assignment.getByTeacher(teacherId, { school_id: req.user.school_id || null });
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/classes', auth, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not a teacher account' });
    }
    const school_id = req.user?.school_id || null;

    const [teachingClasses, teachingModules, assignments, allClasses] = await Promise.all([
      Class.getClassesByTeacher(teacherId, { school_id }),
      Module.getModulesByTeacher(teacherId, { school_id }),
      Assignment.getByTeacher(teacherId, { school_id }),
      Class.getAll({ school_id })
    ]);
    const headTeacherClasses = allClasses.filter((classItem) => {
      return String(classItem.class_teacher_id || '') === String(teacherId);
    });

    res.json({
      teaching_classes: teachingClasses,
      teaching_modules: teachingModules,
      assignments,
      head_teacher_classes: headTeacherClasses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/assignments', auth, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not a teacher account' });
    }

    const assignments = await Assignment.getByTeacher(teacherId, { school_id: req.user?.school_id || null });
    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', auth, [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('employee_id').optional().trim(),
  body('phone').optional().trim(),
  body('module_name').optional().trim(),
  body('qualification').optional().trim(),
  body('yearsExperience').optional().isInt({ min: 0 }).toInt(),
  body('availableDays').optional().trim(),
  body('availableFrom').optional().isString(),
  body('availableTo').optional().isString(),
  body('notes').optional().trim(),
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

    const {
      name,
      email,
      department,
      password,
      profile_photo,
      employee_id,
      phone,
      module_name,
      qualification,
      yearsExperience,
      availableDays,
      availableFrom,
      availableTo,
      notes
    } = req.body;

    const existingTeacher = await Teacher.findByEmailExcludingId(email, teacherId);
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const currentTeacher = await Teacher.findById(teacherId);

    await Teacher.update(teacherId, {
      name,
      email,
      department,
      password: password || undefined,
      profile_photo,
      employee_id,
      phone,
      module_name,
      qualification,
      years_experience: yearsExperience,
      available_days: availableDays,
      available_from: availableFrom,
      available_to: availableTo,
      notes
    });

    const teacher = await Teacher.findById(teacherId);
    const linkedUser = await User.findByEmail(currentTeacher?.email || teacher.email);
    if (linkedUser) {
      await User.updateProfile(linkedUser.id, {
        username: teacher.name,
        full_name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        profile_photo: teacher.profile_photo
      });
    }

    await Notification.create({
      type: 'profile_changed',
      title: `Profile changed: ${teacher.name}`,
      message: `${teacher.name}'s teacher profile was updated.`,
      path: '/teachers',
      tone: 'violet'
    });

    res.json({
      message: 'Profile updated successfully',
      teacher: {
        teacher_id: teacher.teacher_id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        status: teacher.status,
        profile_photo: teacher.profile_photo || null,
        employee_id: teacher.employee_id || null,
        phone: teacher.phone || null,
        module_name: teacher.module_name || null,
        qualification: teacher.qualification || null,
        years_experience: teacher.years_experience || null,
        available_days: teacher.available_days || null,
        available_from: teacher.available_from || null,
        available_to: teacher.available_to || null,
        notes: teacher.notes || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
