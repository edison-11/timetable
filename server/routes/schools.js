const express = require('express');
const { body, query, validationResult } = require('express-validator');
const School = require('../models/School');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { adminAuth } = require('../middleware/adminAuth');
const { requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

const syncDirectorUserStatus = async (schoolId, status) => {
  const director = await School.findDirectorBySchoolId(schoolId);
  if (!director?.email) return;

  const user = await User.findByEmail(director.email);
  if (user) await User.updateStatus(user.id, status);
};

const getRequestMeta = (req) => ({
  device: req.headers['x-device-name'] || req.headers['sec-ch-ua-platform'] || null,
  browser: req.headers['user-agent'] || null,
  ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
  location: req.headers['x-location'] || null
});

const planPrice = (plan) => {
  if (plan === 'Enterprise') return 399;
  if (plan === 'Professional') return 149;
  return 49;
};

router.post('/dos-register', [
  body('full_name').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('school_name').trim().notEmpty().withMessage('School name is required'),
  body('school_code').optional({ nullable: true, checkFalsy: true }).trim(),
  body('school_email').isEmail().normalizeEmail().withMessage('Valid school email is required'),
  body('school_phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('dos_email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid DOS email is required'),
  body('dos_phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('national_id').trim().notEmpty().withMessage('National ID is required'),
  body('registration_number').trim().notEmpty().withMessage('School registration number is required'),
  body('school_address').trim().notEmpty().withMessage('School address is required'),
  body('province').optional({ nullable: true, checkFalsy: true }).trim(),
  body('district').optional({ nullable: true, checkFalsy: true }).trim(),
  body('sector').optional({ nullable: true, checkFalsy: true }).trim(),
  body('school_type').optional({ nullable: true, checkFalsy: true }).trim(),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  body('profile_photo').isString().notEmpty().withMessage('Profile photo is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    await School.ensureTenantColumns();

    const schoolPhone = req.body.school_phone || req.body.phone;
    const dosEmail = req.body.dos_email || req.body.email || req.body.school_email;
    const dosPhone = req.body.dos_phone || req.body.phone || req.body.school_phone;

    if (!schoolPhone) {
      return res.status(400).json({ message: 'School phone number is required' });
    }

    if (!dosEmail) {
      return res.status(400).json({ message: 'Director of Studies email is required' });
    }

    if (!dosPhone) {
      return res.status(400).json({ message: 'Director of Studies phone number is required' });
    }

    const existingSchoolEmail = await School.findByEmail(req.body.school_email);
    if (existingSchoolEmail) return res.status(400).json({ message: 'School email is already registered' });

    const existingRegistration = await School.findByRegistrationNumber(req.body.registration_number);
    if (existingRegistration) return res.status(400).json({ message: 'School registration number is already registered' });

    const existingDos = await School.findDirectorByEmail(dosEmail);
    if (existingDos) return res.status(400).json({ message: 'Director of Studies email is already registered' });

    const existingUser = await User.findByEmail(dosEmail);
    if (existingUser) return res.status(400).json({ message: 'Director of Studies email is already registered' });

    const schoolId = await School.create({
      school_name: req.body.school_name,
      school_email: req.body.school_email,
      registration_number: req.body.registration_number,
      school_code: req.body.school_code,
      school_address: req.body.school_address,
      phone: schoolPhone,
      province: req.body.province,
      district: req.body.district,
      sector: req.body.sector,
      school_type: req.body.school_type,
      profile_photo: req.body.profile_photo,
      status: 'pending_approval'
    });

    const userId = await User.create({
      full_name: req.body.full_name,
      username: req.body.full_name,
      email: dosEmail,
      phone: dosPhone,
      password: req.body.password,
      role: 'dos',
      school_id: schoolId,
      status: 'pending',
      is_verified: true,
      profile_photo: req.body.profile_photo
    });

    await School.createDirector({
      user_id: userId,
      school_id: schoolId,
      full_name: req.body.full_name,
      email: dosEmail,
      phone: dosPhone,
      national_id: req.body.national_id,
      profile_photo: req.body.profile_photo,
      status: 'pending'
    });

    await Notification.create({
      type: 'school_registered',
      title: `New school registration: ${req.body.school_name}`,
      message: `${req.body.full_name} submitted a Director of Studies registration for review.`,
      path: '/super-admin/schools',
      tone: 'amber',
      recipient_role: 'super_admin'
    });

    await School.logActivity({
      school_id: schoolId,
      user_id: userId,
      actor_role: 'dos',
      action: 'school_registration_submitted',
      entity_type: 'school',
      entity_id: schoolId,
      message: `${req.body.school_name} registration is pending verification.`
    });

    res.status(201).json({
      message: 'Your registration has been submitted successfully and is waiting for system administrator approval.',
      school_id: schoolId,
      status: 'pending_approval'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const [stats, activities] = await Promise.all([
      School.getPlatformStats(),
      School.getRecentActivities({ limit: 8 })
    ]);
    res.json({ stats, activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/activities', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const activities = await School.getRecentActivities({ limit: req.query.limit || 50 });
    res.json({ activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/audit', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const logs = await School.getAuditLogs({
      school_id: req.query.school_id,
      search: req.query.search,
      limit: req.query.limit || 150
    });
    res.json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', adminAuth, requireSuperAdmin, [
  body('school_name').trim().notEmpty().withMessage('School name is required'),
  body('school_email').isEmail().normalizeEmail().withMessage('Valid school email is required'),
  body('registration_number').trim().notEmpty().withMessage('School registration number is required'),
  body('school_code').optional({ nullable: true, checkFalsy: true }).trim(),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('school_address').optional({ nullable: true, checkFalsy: true }).trim(),
  body('province').optional({ nullable: true, checkFalsy: true }).trim(),
  body('district').optional({ nullable: true, checkFalsy: true }).trim(),
  body('sector').optional({ nullable: true, checkFalsy: true }).trim(),
  body('school_type').optional({ nullable: true, checkFalsy: true }).trim(),
  body('status').optional().isIn(['pending_approval', 'active', 'rejected', 'suspended', 'expired', 'deactivated']),
  body('subscription_status').optional().isIn(['trial', 'active', 'past_due', 'suspended', 'expired', 'canceled']),
  body('subscription_plan').optional({ nullable: true, checkFalsy: true }).trim(),
  body('subscription_expires_at').optional({ nullable: true, checkFalsy: true }).isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (await School.findByEmail(req.body.school_email)) {
      return res.status(400).json({ message: 'School email is already registered' });
    }
    if (await School.findByRegistrationNumber(req.body.registration_number)) {
      return res.status(400).json({ message: 'School registration number is already registered' });
    }

    const schoolId = await School.create({
      ...req.body,
      status: req.body.status || 'active',
      subscription_status: req.body.subscription_status || 'trial'
    });
    const school = await School.findById(schoolId);

    await School.logActivity({
      school_id: schoolId,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_created',
      entity_type: 'school',
      entity_id: schoolId,
      message: `${school.school_name} was created by super admin.`
    });

    res.status(201).json({ message: 'School created successfully', school });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const schools = await School.getAll({ status: 'active', search: req.query.search });
    res.json({
      schools: schools.map((school) => ({
        school_id: school.school_id,
        school_name: school.school_name,
        registration_number: school.registration_number,
        school_code: school.school_code,
        school_type: school.school_type
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', adminAuth, requireSuperAdmin, [
  query('status').optional().isIn(['pending_approval', 'active', 'rejected', 'suspended', 'expired', 'deactivated']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const schools = await School.getAll({
      status: req.query.status,
      search: req.query.search
    });
    res.json({ schools });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/workspace', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const [schools, activities, audit_logs, support_notes, billing_events, dos_login_history] = await Promise.all([
      School.getAll({ search: school.school_email }),
      School.getRecentActivities({ school_id: req.params.id, limit: 100 }),
      School.getAuditLogs({ school_id: req.params.id, limit: 100 }),
      School.getSupportNotes(req.params.id),
      School.getBillingEvents(req.params.id),
      School.getDosLoginHistory(req.params.id)
    ]);

    const enrichedSchool = schools.find((item) => Number(item.school_id) === Number(req.params.id)) || school;
    res.json({
      school: enrichedSchool,
      activities,
      audit_logs,
      support_notes,
      billing_events,
      dos_login_history
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/approve', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });
    if (!['pending', 'pending_approval'].includes(school.status)) return res.status(400).json({ message: 'School is not pending approval' });

    await School.updateStatus(req.params.id, 'active');
    await School.updateDirectorStatusBySchool(req.params.id, 'active');
    await syncDirectorUserStatus(req.params.id, 'active');

    const directors = await School.getAll({ search: school.school_email });
    const director = directors.find((item) => Number(item.school_id) === Number(req.params.id));
    if (director?.dos_email) {
      const user = await User.findByEmail(director.dos_email);
      if (user) await User.updateStatus(user.id, 'active');
    }

    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_approved',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} was approved.`,
      ...getRequestMeta(req)
    });

    res.json({ message: 'School approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/reject', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    await School.updateStatus(req.params.id, 'rejected');
    await School.updateDirectorStatusBySchool(req.params.id, 'rejected');
    await syncDirectorUserStatus(req.params.id, 'rejected');
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_rejected',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} was rejected.`,
      ...getRequestMeta(req)
    });
    res.json({ message: 'School rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/deactivate', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    await School.updateStatus(req.params.id, 'deactivated');
    await School.updateDirectorStatusBySchool(req.params.id, 'disabled');
    await syncDirectorUserStatus(req.params.id, 'disabled');
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_deactivated',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} was deactivated.`,
      ...getRequestMeta(req)
    });
    res.json({ message: 'School deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/suspend', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    await School.updateStatus(req.params.id, 'suspended');
    await School.updateDirectorStatusBySchool(req.params.id, 'suspended');
    await syncDirectorUserStatus(req.params.id, 'suspended');
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_suspended',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} was suspended.`,
      ...getRequestMeta(req)
    });
    res.json({ message: 'School suspended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/activate', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    await School.updateStatus(req.params.id, 'active');
    await School.updateDirectorStatusBySchool(req.params.id, 'active');
    await syncDirectorUserStatus(req.params.id, 'active');
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_activated',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} was activated.`,
      ...getRequestMeta(req)
    });
    res.json({ message: 'School activated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/subscription', adminAuth, requireSuperAdmin, [
  body('subscription_status').isIn(['trial', 'active', 'past_due', 'suspended', 'expired', 'canceled']).withMessage('Invalid subscription status'),
  body('subscription_plan').optional({ nullable: true, checkFalsy: true }).trim(),
  body('subscription_expires_at').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid expiry date'),
  body('auto_renewal').optional().isIn(['enabled', 'disabled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    await School.updateSubscriptionStatus(req.params.id, req.body.subscription_status, {
      subscription_plan: req.body.subscription_plan,
      subscription_expires_at: req.body.subscription_expires_at,
      auto_renewal: req.body.auto_renewal
    });
    await School.addBillingEvent({
      school_id: req.params.id,
      event_type: 'subscription_updated',
      plan: req.body.subscription_plan,
      amount: planPrice(req.body.subscription_plan),
      status: req.body.subscription_status,
      message: `${school.school_name} subscription changed to ${req.body.subscription_status}.`
    });
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_subscription_updated',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} subscription changed to ${req.body.subscription_status}.`,
      ...getRequestMeta(req)
    });
    res.json({ message: 'Subscription status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/dos', adminAuth, requireSuperAdmin, [
  body('full_name').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('national_id').optional({ nullable: true, checkFalsy: true }).trim(),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const existingUser = await User.findByEmail(req.body.email);
    if (existingUser) return res.status(400).json({ message: 'A user with this email already exists' });

    const userId = await User.create({
      full_name: req.body.full_name,
      username: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: 'dos',
      school_id: req.params.id,
      status: 'active',
      is_verified: true
    });

    const currentDirector = await School.getDirectorBySchool(req.params.id);
    if (currentDirector) {
      if (currentDirector.user_id) await User.updateStatus(currentDirector.user_id, 'disabled');
      await School.updateDirectorUser(req.params.id, {
        user_id: userId,
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone || '',
        status: 'active'
      });
    } else {
      await School.createDirector({
        user_id: userId,
        school_id: req.params.id,
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone || '',
        national_id: req.body.national_id || 'N/A',
        status: 'active'
      });
    }

    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'dos_created',
      entity_type: 'user',
      entity_id: userId,
      message: `${req.body.full_name} was created as DOS for ${school.school_name}.`,
      ...getRequestMeta(req)
    });

    res.status(201).json({ message: 'DOS account created successfully', user_id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/dos/disable', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const director = await School.getDirectorBySchool(req.params.id);
    if (!director) return res.status(404).json({ message: 'Director account not found' });

    await School.updateDirectorStatusBySchool(req.params.id, 'disabled');
    if (director.user_id) await User.updateStatus(director.user_id, 'disabled');

    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'dos_disabled',
      entity_type: 'user',
      entity_id: director.user_id,
      message: `${school.school_name} DOS account was disabled.`,
      ...getRequestMeta(req)
    });

    res.json({ message: 'DOS account disabled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/dos/transfer', adminAuth, requireSuperAdmin, [
  body('full_name').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('password').optional({ nullable: true, checkFalsy: true })
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const currentDirector = await School.getDirectorBySchool(req.params.id);
    const existingUser = await User.findByEmail(req.body.email);
    let userId = existingUser?.id;

    if (!userId) {
      userId = await User.create({
        full_name: req.body.full_name,
        username: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password || `Dos${Date.now()}A1`,
        role: 'dos',
        school_id: req.params.id,
        status: 'active',
        is_verified: true
      });
    } else {
      await User.updateProfile(userId, {
        full_name: req.body.full_name,
        phone: req.body.phone,
        password: req.body.password || undefined
      });
      await User.updateRoleAndSchool(userId, 'dos', req.params.id);
      await User.updateStatus(userId, 'active');
    }

    if (currentDirector?.user_id && Number(currentDirector.user_id) !== Number(userId)) {
      await User.updateStatus(currentDirector.user_id, 'disabled');
    }

    if (currentDirector) {
      await School.updateDirectorUser(req.params.id, {
        user_id: userId,
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone || '',
        status: 'active'
      });
    } else {
      await School.createDirector({
        user_id: userId,
        school_id: req.params.id,
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone || '',
        national_id: 'N/A',
        status: 'active'
      });
    }

    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'dos_ownership_transferred',
      entity_type: 'user',
      entity_id: userId,
      message: `${school.school_name} DOS ownership transferred to ${req.body.full_name}.`,
      ...getRequestMeta(req)
    });

    res.json({ message: 'DOS ownership transferred successfully', user_id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/dos/login-history', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const history = await School.getDosLoginHistory(req.params.id);
    res.json({ history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/support-notes', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const notes = await School.getSupportNotes(req.params.id);
    res.json({ notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/support-notes', adminAuth, requireSuperAdmin, [
  body('note').trim().isLength({ min: 2 }).withMessage('Support note is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const noteId = await School.addSupportNote({
      school_id: req.params.id,
      user_id: req.user.id,
      note: req.body.note
    });

    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'support_note_created',
      entity_type: 'support_note',
      entity_id: noteId,
      message: `Support note added for ${school.school_name}.`,
      ...getRequestMeta(req)
    });

    res.status(201).json({ message: 'Support note saved', note_id: noteId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/billing', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const events = await School.getBillingEvents(req.params.id);
    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/reset-dos-password', adminAuth, requireSuperAdmin, [
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const schools = await School.getAll({ search: school.school_email });
    const director = schools.find((item) => Number(item.school_id) === Number(req.params.id));
    if (!director?.dos_email) return res.status(404).json({ message: 'Director account not found' });

    const user = await User.findByEmail(director.dos_email);
    if (!user) return res.status(404).json({ message: 'Director user account not found' });

    await User.updatePassword(user.id, req.body.password);
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'dos_password_reset',
      entity_type: 'user',
      entity_id: user.id,
      message: `${school.school_name} DOS password was reset.`,
      ...getRequestMeta(req)
    });

    res.json({ message: 'Director password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    await School.softDelete(req.params.id);
    await School.logActivity({
      school_id: req.params.id,
      user_id: req.user.id,
      actor_role: req.user.role,
      action: 'school_deleted',
      entity_type: 'school',
      entity_id: req.params.id,
      message: `${school.school_name} was soft deleted.`,
      ...getRequestMeta(req)
    });
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
