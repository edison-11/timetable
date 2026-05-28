const normalizeRole = (role) => String(role || '').toLowerCase();

const hasRole = (user, roles = []) => {
  const allowed = roles.map(normalizeRole);
  return allowed.includes(normalizeRole(user?.role || user?.type));
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!hasRole(req.user, roles)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  return next();
};

const requireSuperAdmin = requireRoles('super_admin');
const requireSchoolAdmin = requireRoles('dos');
const requireManagement = requireRoles('super_admin', 'dos');

module.exports = {
  hasRole,
  requireRoles,
  requireSuperAdmin,
  requireSchoolAdmin,
  requireManagement
};
