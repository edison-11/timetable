const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateSchoolAccess } = require('./schoolAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's a user token (admin)
    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      const allowedRoles = ['dos', 'super_admin'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Management access required' });
      }

      if (user.status && user.status !== 'active') {
        return res.status(403).json({
          code: 'ACCOUNT_NOT_ACTIVE',
          account_status: user.status,
          message: 'Account is not active'
        });
      }

      req.user = user;
      const schoolAccess = await validateSchoolAccess(req.user);
      if (!schoolAccess.allowed) return res.status(schoolAccess.statusCode || 403).json(schoolAccess);
    } else {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { adminAuth };
