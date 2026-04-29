const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a user token (admin)
    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      req.user = user;
    } else {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { adminAuth };
