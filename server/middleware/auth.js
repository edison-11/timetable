const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';

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
      req.user = {
        ...teacher,
        teacherId: decoded.teacherId,
        type: 'teacher'
      };
      req.teacher = teacher;
      return next();
    }

    // Otherwise treat as admin user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { auth };
