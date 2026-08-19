const authService = require('../services/authService');
const { isValidEmail, isValidMobile } = require('../utils/validators');
const db = require('../utils/jsonDb');
const { sanitizeUser } = require('../utils/validators');

const registerStudent = async (req, res) => {
  try {
    const { studentId, fullName, email, mobileNumber, department, course, year, password, confirmPassword, bio } = req.body;

    if (!studentId || !fullName || !email || !mobileNumber || !department || !course || !year || !password) {
      return res.status(400).json({
        success: false,
        message: 'All required registration fields must be provided.',
        error: 'MISSING_FIELDS'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        error: 'INVALID_EMAIL'
      });
    }

    if (!isValidMobile(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.',
        error: 'INVALID_MOBILE'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
        error: 'WEAK_PASSWORD'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
        error: 'PASSWORD_MISMATCH'
      });
    }

    const { user, token } = await authService.registerStudent(req.body);

    return res.status(201).json({
      success: true,
      message: 'Student registration successful!',
      token,
      data: user,
      user
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Internal server error during registration.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const { user, token } = await authService.loginStudent(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      data: user,
      user
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Internal server error during login.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide administrator email and password.',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const { user, token } = await authService.loginAdmin(email, password);

    return res.status(200).json({
      success: true,
      message: 'Administrator authentication successful!',
      token,
      data: user,
      user
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Internal server error during administrator login.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated', error: 'UNAUTHORIZED' });
    }

    const file = req.user.role === 'admin' ? 'admins.json' : 'students.json';
    const user = await db.findById(file, req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.', error: 'USER_NOT_FOUND' });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.', error: 'SERVER_ERROR' });
  }
};

const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin,
  getMe,
  logout
};
