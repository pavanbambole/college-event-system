const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_final_year_project';

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

/**
 * Middleware to verify Admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrator privileges required.'
    });
  }
  next();
};

/**
 * Middleware to verify Student role
 */
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Student access required.'
    });
  }
  next();
};

/**
 * Middleware allowing student access only to their own data or an admin
 */
const requireSelfOrAdmin = (req, res, next) => {
  const targetId = req.params.studentId || req.params.id;
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'admin' || req.user.id === targetId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: You cannot view or modify another student\'s records.'
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStudent,
  requireSelfOrAdmin
};
