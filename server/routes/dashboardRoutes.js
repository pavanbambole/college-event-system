const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireAdmin, requireSelfOrAdmin } = require('../middleware/authMiddleware');

// Student Dashboard metrics
router.get('/student/:id', authenticateToken, requireSelfOrAdmin, dashboardController.getStudentDashboard);

// Admin Dashboard & Analytics metrics
router.get('/admin', authenticateToken, requireAdmin, dashboardController.getAdminDashboard);

module.exports = router;
