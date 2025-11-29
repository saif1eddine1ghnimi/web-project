// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // ✅ DEVELOPMENT MODE: Accept demo tokens for testing
    if (token.startsWith('demo-token-')) {
      console.log('⚡ Demo token detected - creating dev user');
      req.user = {
        id: 2, // Use existing employee user ID from DB
        name: 'موظف تجريبي',
        email: 'employee@office.com',
        role_id: 2, // employee role
        role_name: 'employee',
        login: 'employee',
        active: true
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    const [users] = await pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.active = TRUE`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }
    next();
  };
};

module.exports = { auth, authorize };