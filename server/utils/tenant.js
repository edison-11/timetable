const getRequestSchoolId = (req) => {
  if (req.user?.role === 'super_admin') {
    return req.query?.school_id || req.body?.school_id || null;
  }

  return req.user?.school_id || null;
};

const tenantFilter = (alias, schoolId) => {
  if (!schoolId) {
    return { clause: '', values: [] };
  }

  const prefix = alias ? `${alias}.` : '';
  return {
    clause: `${prefix}school_id = ?`,
    values: [schoolId]
  };
};

const enforceSameSchool = (req, record, label = 'Record') => {
  if (!record) return false;
  if (req.user?.role === 'super_admin') return true;
  if (!req.user?.school_id) return false;
  if (record.school_id === null || record.school_id === undefined) return false;
  return Number(record.school_id || 0) === Number(req.user.school_id);
};

const requireSchoolContext = (req, res, next) => {
  if (req.user?.role === 'super_admin') return next();
  if (!req.user?.school_id) {
    return res.status(403).json({ message: 'School context is required' });
  }
  return next();
};

module.exports = {
  getRequestSchoolId,
  tenantFilter,
  enforceSameSchool,
  requireSchoolContext
};
