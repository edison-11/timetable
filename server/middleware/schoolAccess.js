const School = require('../models/School');

const blockedSchoolStatuses = new Set(['pending_approval', 'pending', 'suspended', 'deactivated', 'inactive', 'rejected']);
const blockedSubscriptionStatuses = new Set(['suspended']);

const statusMessage = (school) => {
  if (!school) {
    return 'School access disabled by Super Admin.';
  }

  if (school.subscription_status && blockedSubscriptionStatuses.has(school.subscription_status)) {
    return 'Subscription inactive. Please contact system administration.';
  }

  if (['pending', 'pending_approval'].includes(school.status)) {
    return 'Your school account is waiting for system administrator approval.';
  }

  if (school.status === 'suspended') {
    return 'Your school account has been suspended. Please contact system administration.';
  }

  if (['deactivated', 'inactive', 'rejected'].includes(school.status)) {
    return 'School access disabled by Super Admin.';
  }

  return 'School access is not active.';
};

const validateSchoolAccess = async (user) => {
  if (!user || user.role === 'super_admin') return { allowed: true };

  const schoolId = user.school_id || user.schoolId || null;
  if (!schoolId) {
    return {
      allowed: false,
      statusCode: 403,
      code: 'SCHOOL_CONTEXT_REQUIRED',
      message: 'School context is required.'
    };
  }

  const school = await School.findById(schoolId);
  if (!school || blockedSchoolStatuses.has(school.status) || blockedSubscriptionStatuses.has(school.subscription_status)) {
    return {
      allowed: false,
      statusCode: 403,
      code: 'SCHOOL_ACCESS_DISABLED',
      school_status: school?.status || 'deactivated',
      subscription_status: school?.subscription_status || null,
      message: statusMessage(school)
    };
  }

  return { allowed: true, school };
};

const enforceSchoolAccess = async (req, res, next) => {
  try {
    const result = await validateSchoolAccess(req.user);
    if (!result.allowed) {
      return res.status(result.statusCode || 403).json(result);
    }

    req.school = result.school || null;
    return next();
  } catch (error) {
    console.error('School access check failed:', error);
    return res.status(500).json({ message: 'School access check failed' });
  }
};

module.exports = {
  validateSchoolAccess,
  enforceSchoolAccess
};
