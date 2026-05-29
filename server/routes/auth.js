const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { sendOtpEmail } = require('../services/resendEmailService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_RESENDS = 3;
const OTP_MAX_ATTEMPTS = 5;
const pendingRegistrations = new Map();

const generateToken = (user) => {
  return jwt.sign({
    userId: user.id,
    role: user.role,
    type: user.role,
    teacherId: user.teacher_id || undefined
  }, JWT_SECRET, { expiresIn: '7d' });
};

const publicUser = (user, teacher = null) => ({
  id: user.id,
  username: user.username || user.full_name,
  full_name: user.full_name || user.username,
  name: user.full_name || user.username,
  email: user.email,
  phone: user.phone || teacher?.phone || null,
  role: user.role,
  is_verified: Boolean(user.is_verified),
  profile_photo: user.profile_photo || teacher?.profile_photo || null,
  school_id: user.school_id || teacher?.school_id || null,
  teacher_id: teacher?.teacher_id || user.teacher_id || null,
  department: teacher?.department || null,
  status: teacher?.status || user.status || null,
  employee_id: teacher?.employee_id || null,
  module_name: teacher?.module_name || null
});

const buildLoginResponse = async (user, teacher = null) => {
  if (!['super_admin', 'dos', 'teacher', 'student', 'admin'].includes(user.role)) {
    return { status: 403, body: { message: 'Unsupported account role' } };
  }

  const schoolId = teacher?.school_id || user.school_id || null;
  if (user.role !== 'super_admin') {
    const school = schoolId ? await School.findById(schoolId) : null;
    if (!school || school.status !== 'active' || school.subscription_status === 'suspended') {
      return {
        status: 403,
        body: {
          code: 'SCHOOL_ACCESS_DISABLED',
          school_status: school?.status || 'deactivated',
          subscription_status: school?.subscription_status || null,
          message: school?.status === 'pending_approval'
            ? 'Your school account is waiting for system administrator approval.'
            : school?.status === 'suspended'
              ? 'Your school account has been suspended. Please contact system administration.'
              : 'School access disabled by Super Admin.'
        }
      };
    }
  }

  if (user.role !== 'teacher' && user.status && user.status !== 'active') {
    return {
      status: 403,
      body: {
        message: user.role === 'dos'
          ? 'Your registration is waiting for system administrator approval.'
          : 'Your account is not active.'
      }
    };
  }

  if (user.role === 'teacher') {
    if (!teacher) teacher = await Teacher.findByEmail(user.email);
    if (teacher?.status === 'pending') {
      return { status: 403, body: { message: 'Your account is pending approval by an administrator' } };
    }
    if (teacher?.status !== 'active') {
      return { status: 403, body: { message: 'Your teacher account is not active' } };
    }
  }

  if (user.role === 'dos') {
    const school = user.school_id ? await School.findById(user.school_id) : null;
    if (!school || ['pending', 'pending_approval'].includes(school.status)) {
      return { status: 403, body: { message: 'Your registration is waiting for system administrator approval.' } };
    }
    if (school.status !== 'active') {
      return {
        status: 403,
        body: {
          code: 'SCHOOL_ACCESS_DISABLED',
          school_status: school.status,
          message: school.status === 'suspended'
            ? 'Your school account has been suspended. Please contact system administration.'
            : 'School access disabled by Super Admin.'
        }
      };
    }
  }

  await User.touchLastLogin(user.id);
  const token = generateToken({ ...user, teacher_id: teacher?.teacher_id });

  return {
    status: 200,
    body: {
      message: 'Login successful',
      token,
      user: publicUser(user, teacher),
      teacher: user.role === 'teacher' ? publicUser(user, teacher) : undefined,
      role: user.role,
      redirectTo: user.role === 'teacher'
        ? '/teacher/dashboard'
        : user.role === 'student'
          ? '/student/dashboard'
          : user.role === 'super_admin'
            ? '/super-admin/dashboard'
            : '/dashboard'
    }
  };
};

const syncTeacherUser = async (teacher, password) => {
  let user = await User.findByEmail(teacher.email);
  if (user) return user;

  const userId = await User.create({
    full_name: teacher.name,
    username: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    password,
    role: 'teacher',
    is_verified: true
  });

  return User.findById(userId);
};

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const sanitizeRegistrationPayload = (payload) => ({
  full_name: payload.full_name || payload.username,
  username: payload.username || payload.full_name,
  email: payload.email,
  phone: payload.phone,
  password: payload.password,
  role: payload.role,
  department: payload.department,
  employeeId: payload.employeeId || payload.employee_id,
  module_name: payload.module_name || payload.subject,
  qualification: payload.qualification,
  profile_photo: payload.profile_photo,
  national_id: payload.national_id,
  school_registration_number: payload.school_registration_number,
  yearsExperience: payload.yearsExperience || payload.years_experience || 0,
  availableDays: payload.availableDays || payload.available_days,
  availableFrom: payload.availableFrom || payload.available_from,
  availableTo: payload.availableTo || payload.available_to,
  notes: payload.notes
});

const handleRouteError = (res, error) => {
  if (error.code === 'EMAIL_NOT_CONFIGURED') {
    return res.status(503).json({ message: 'Email OTP service is not configured. Contact the system administrator.' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Server error' });
};

// Create super admin user (for initial setup)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, full_name, email, password, phone } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userId = await User.create({ username, full_name: full_name || username, email, phone, password, role: 'super_admin', is_verified: true });
    const user = await User.findById(userId);

    const token = generateToken(user);

    res.status(201).json({
      message: 'Super admin user created successfully',
      token,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register user: request OTP before creating the account
router.post('/register', [
  body('full_name').optional().trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').if(body('role').equals('teacher')).trim().notEmpty().withMessage('Phone number is required'),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number'),
  body('confirmPassword').optional().custom((value, { req }) => !value || value === req.body.password).withMessage('Passwords do not match'),
  body('role').isIn(['teacher']).withMessage('Use the DOS registration page for school administrators'),
  body('department').if(body('role').equals('teacher')).trim().notEmpty().withMessage('Department is required'),
  body('qualification').if(body('role').equals('teacher')).trim().notEmpty().withMessage('Qualification is required'),
  body('employeeId').if(body('role').equals('teacher')).trim().notEmpty().withMessage('National ID or Staff ID is required'),
  body('school_id').if(body('role').equals('teacher')).toInt().isInt().withMessage('Select an active school'),
  body('profile_photo').if(body('role').equals('teacher')).isString().notEmpty().withMessage('Profile photo is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, username, email, phone, password, role } = req.body;
    const displayName = full_name || username;

    if (!displayName || displayName.trim().length < 3) {
      return res.status(400).json({ message: 'Full name must be at least 3 characters' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'teacher') {
      const existingTeacher = await Teacher.findByEmail(email);
      if (existingTeacher) {
        return res.status(400).json({ message: 'Teacher email already registered' });
      }

      const school = await School.findById(req.body.school_id);
      if (!school || school.status !== 'active') {
        return res.status(400).json({ message: 'Selected school is not active or has not been approved' });
      }

      req.body.school_registration_number = school.registration_number;
    }

    const existingPending = pendingRegistrations.get(email);
    if (existingPending && Date.now() - existingPending.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP code.' });
    }

    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    pendingRegistrations.set(email, {
      codeHash,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
      resendCount: existingPending ? existingPending.resendCount + 1 : 1,
      lastSentAt: Date.now(),
      payload: sanitizeRegistrationPayload({ ...req.body, full_name: displayName, username: displayName })
    });

    if (pendingRegistrations.get(email).resendCount > OTP_MAX_RESENDS) {
      pendingRegistrations.delete(email);
      return res.status(429).json({ message: 'OTP resend limit reached. Please try again later.' });
    }

    try {
      await sendOtpEmail({
        to: email,
        code,
        purpose: 'registration',
        expiresInMinutes: OTP_EXPIRY_MS / 60000
      });
    } catch (emailError) {
      pendingRegistrations.delete(email);
      throw emailError;
    }

    res.status(202).json({
      message: 'OTP sent. Verify your email to create the account.',
      email,
      role,
      expires_in_seconds: OTP_EXPIRY_MS / 1000,
      resend_cooldown_seconds: OTP_RESEND_COOLDOWN_MS / 1000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unified login for Admin and Teacher
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

    let user = await User.findByEmail(email);
    let teacher = null;

    if (user) {
      const isMatch = await User.comparePassword(password, user.password_hash || user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.role === 'teacher') {
        teacher = await Teacher.findByEmail(email);
      }
    } else {
      teacher = await Teacher.findByEmail(email);
      if (!teacher) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isTeacherPassword = await Teacher.comparePassword(password, teacher.password);
      if (!isTeacherPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      user = await syncTeacherUser(teacher, password);
    }

    const loginResponse = await buildLoginResponse(user, teacher);
    res.status(loginResponse.status).json(loginResponse.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  if (req.user?.role === 'teacher' || req.user?.type === 'teacher') {
    const teacher = req.user.teacherId ? await Teacher.findById(req.user.teacherId) : await Teacher.findByEmail(req.user.email);
    const identity = await User.findByEmail(req.user.email);
    return res.json({ user: publicUser(identity || req.user, teacher), teacher: publicUser(identity || req.user, teacher) });
  }

  res.json({
    user: publicUser(req.user)
  });
});

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    let user = await User.findByEmail(email);
    if (!user) {
      const teacher = await Teacher.findByEmail(email);
      if (teacher) {
        user = await syncTeacherUser(teacher, crypto.randomBytes(18).toString('hex'));
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'No account found for this email address' });
    }

    const lastSentAt = user.reset_last_sent_at ? new Date(user.reset_last_sent_at).getTime() : 0;
    if (lastSentAt && Date.now() - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP code.' });
    }

    const currentCount = Number(user.reset_resend_count || 0);
    if (currentCount >= 3) {
      return res.status(429).json({ message: 'Reset code resend limit reached. Please contact administration.' });
    }

    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await sendOtpEmail({
      to: email,
      code,
      purpose: 'reset',
      expiresInMinutes: OTP_EXPIRY_MS / 60000
    });
    await User.saveResetCode(user.id, codeHash, expiresAt, currentCount + 1);

    res.json({
      message: 'Reset OTP sent. It expires in 5 minutes.',
      email,
      expires_in_seconds: OTP_EXPIRY_MS / 1000,
      resend_cooldown_seconds: OTP_RESEND_COOLDOWN_MS / 1000
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

router.post('/verify-registration', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;
    const pending = pendingRegistrations.get(email);

    if (!pending) {
      return res.status(400).json({ message: 'No pending registration OTP found.' });
    }

    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }

    pending.attempts += 1;
    if (pending.attempts > OTP_MAX_ATTEMPTS) {
      pendingRegistrations.delete(email);
      return res.status(429).json({ message: 'Too many verification attempts. Please register again.' });
    }

    const valid = await bcrypt.compare(code, pending.codeHash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    const data = pending.payload;
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: 'User already exists' });
    }

    let teacher = null;
    let school = null;

    if (data.role === 'teacher') {
      school = data.school_id
        ? await School.findById(data.school_id)
        : await School.findByRegistrationNumber(data.school_registration_number);
      if (!school || school.status !== 'active') {
        pendingRegistrations.delete(email);
        return res.status(400).json({ message: 'Selected school is not active or has not been approved' });
      }
    }

    const userId = await User.create({
      username: data.full_name,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
      is_verified: true,
      profile_photo: data.profile_photo || null,
      school_id: school?.school_id || null,
      status: data.role === 'teacher' ? 'pending' : 'active'
    });

    const user = await User.findById(userId);

    if (data.role === 'teacher') {
      const teacherId = await Teacher.create({
        name: data.full_name,
        email: data.email,
        password: data.password,
        department: data.department || 'SSOD',
        status: 'pending',
        date_joined: new Date().toISOString().split('T')[0],
        school_id: school.school_id,
        employee_id: data.employeeId || null,
        national_id: data.national_id || data.employeeId || null,
        phone: data.phone,
        gender: data.gender || null,
        module_name: data.module_name || null,
        qualification: data.qualification || null,
        profile_photo: data.profile_photo || null,
        years_experience: data.yearsExperience || 0,
        available_days: data.availableDays || null,
        available_from: data.availableFrom || null,
        available_to: data.availableTo || null,
        notes: data.notes || null
      });
      teacher = await Teacher.findById(teacherId);

      await Notification.create({
        type: 'teacher_registered',
        title: `New teacher registered: ${teacher.name}`,
        message: `${teacher.name} is waiting for approval.`,
        path: '/teachers',
        tone: 'green',
        recipient_role: 'dos'
      });
    }

    pendingRegistrations.delete(email);

    if (data.role === 'teacher') {
      return res.status(201).json({
        message: 'Teacher registered successfully. Awaiting admin approval.',
        requiresApproval: true,
        user: publicUser(user, teacher),
        teacher: publicUser(user, teacher),
        role: 'teacher',
        redirectTo: '/login'
      });
    }

    const token = generateToken({ ...user, teacher_id: teacher?.teacher_id });

    res.status(201).json({
      message: 'OTP verified. Account created successfully.',
      token,
      user: publicUser(user, teacher),
      role: data.role,
      redirectTo: data.role === 'student' ? '/student/dashboard' : '/dashboard'
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

router.post('/verify-reset-code', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;
    const user = await User.findByEmail(email);

    if (!user || !user.reset_code_hash || user.reset_code_used) {
      return res.status(400).json({ message: 'Invalid or used reset code' });
    }

    if (!user.reset_code_expires_at || new Date(user.reset_code_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Reset code expired' });
    }

    if (Number(user.reset_verify_attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many verification attempts. Request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(code, user.reset_code_hash);
    if (!isMatch) {
      await User.incrementResetAttempts(user.id);
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    res.json({ message: 'OTP verified', email, reset_token: jwt.sign({ userId: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '5m' }) });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').optional().custom((value, { req }) => !value || value === req.body.password).withMessage('Passwords do not match')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user || !user.reset_code_hash || user.reset_code_used) {
      return res.status(400).json({ message: 'Invalid or used reset code' });
    }

    if (!user.reset_code_expires_at || new Date(user.reset_code_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Reset code expired' });
    }

    if (Number(user.reset_verify_attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many verification attempts. Request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(code, user.reset_code_hash);
    if (!isMatch) {
      await User.incrementResetAttempts(user.id);
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    await User.updatePassword(user.id, password);
    await User.markResetCodeUsed(user.id);

    if (user.role === 'teacher') {
      const teacher = await Teacher.findByEmail(email);
      if (teacher) await Teacher.update(teacher.teacher_id, { password });
    }

    res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', auth, [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('full_name').optional().trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().trim(),
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
    if (req.user.type === 'teacher') {
      return res.status(403).json({ message: 'Admin account required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, full_name, email, phone, password, profile_photo } = req.body;
    const displayName = full_name || username;

    if (!displayName || displayName.trim().length < 3) {
      return res.status(400).json({ message: 'Full name must be at least 3 characters' });
    }

    const existingUser = await User.findByEmailExcludingId(email, req.user.id);

    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    await User.updateProfile(req.user.id, {
      username: displayName,
      full_name: displayName,
      email,
      phone,
      password,
      profile_photo
    });

    const user = await User.findById(req.user.id);

    await Notification.create({
      type: 'profile_changed',
      title: `Profile changed: ${user.username}`,
      message: `${user.username}'s admin profile was updated.`,
      path: '/dashboard',
      tone: 'violet'
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const users = await User.getAll();
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
