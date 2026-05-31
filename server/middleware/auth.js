const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const db = require('../config/database');
const { validateSchoolAccess } = require('./schoolAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';

const inferTeacherSchoolId = async (teacherId) => {
  if (!teacherId) return null;

  const [rows] = await db.query(`
    SELECT school_id
    FROM (
      SELECT c.school_id
      FROM class c
      WHERE c.class_teacher_id = ? AND c.school_id IS NOT NULL
      UNION
      SELECT c.school_id
      FROM assignment a
      JOIN class c ON c.class_id = a.class_id
      WHERE a.teacher_id = ? AND c.school_id IS NOT NULL
    ) teacher_schools
    LIMIT 1
  `, [teacherId, teacherId]);

  return rows[0]?.school_id || null;
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's a teacher token
    if (decoded.type === 'teacher' && decoded.teacherId) {
      const teacher = await Teacher.findById(decoded.teacherId);
      if (!teacher) {
        return res.status(401).json({ message: 'Teacher not found' });
      }

      if (teacher.status !== 'active') {
        return res.status(403).json({
          message: teacher.status === 'pending'
            ? 'Your account is waiting for admin approval.'
            : 'Your teacher account is not active.'
        });
      }

      const linkedUser = teacher.email ? await User.findByEmail(teacher.email).catch(() => null) : null;

      const schoolId = teacher.school_id || linkedUser?.school_id || await inferTeacherSchoolId(decoded.teacherId);

      req.user = {
        ...teacher,
        teacherId: decoded.teacherId,
        school_id: schoolId || null,
        type: 'teacher',
        role: 'teacher'
      };
      if (schoolId) {
        const schoolAccess = await validateSchoolAccess(req.user);
        if (!schoolAccess.allowed) return res.status(schoolAccess.statusCode || 403).json(schoolAccess);
      }
      req.teacher = teacher;
      return next();
    }

    // Otherwise treat as admin user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        code: 'ACCOUNT_NOT_ACTIVE',
        account_status: user.status,
        message: user.status === 'pending'
          ? 'Your account is pending approval.'
          : 'Your account is not active.'
      });
    }

    if (user.role === 'teacher') {
      const teacher = await Teacher.findByEmail(user.email);
      if (!teacher || teacher.status !== 'active') {
        return res.status(403).json({
          message: teacher?.status === 'pending'
            ? 'Your account is waiting for admin approval.'
            : 'Your teacher account is not active.'
        });
      }

      const schoolId = user.school_id || teacher.school_id || await inferTeacherSchoolId(teacher.teacher_id);

      req.user = {
        ...user,
        teacherId: teacher.teacher_id,
        school_id: schoolId || null,
        type: 'teacher'
      };
      if (schoolId) {
        const schoolAccess = await validateSchoolAccess(req.user);
        if (!schoolAccess.allowed) return res.status(schoolAccess.statusCode || 403).json(schoolAccess);
      }
      req.teacher = teacher;
      return next();
    }

    req.user = user;
    const schoolAccess = await validateSchoolAccess(req.user);
    if (!schoolAccess.allowed) return res.status(schoolAccess.statusCode || 403).json(schoolAccess);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { auth };
