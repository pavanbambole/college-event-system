const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Student auth
router.post('/student/register', authController.registerStudent);
router.post('/student/login', authController.loginStudent);

// Admin auth
router.post('/admin/login', authController.loginAdmin);

// Session & Profile verification
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
