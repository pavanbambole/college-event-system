const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireAdmin, requireSelfOrAdmin } = require('../middleware/authMiddleware');

// Get all students (Admin only)
router.get('/', authenticateToken, requireAdmin, studentController.getAllStudents);

// Get single student by ID (Admin or self)
router.get('/:id', authenticateToken, requireSelfOrAdmin, studentController.getStudentById);

// Update student profile (Admin or self)
router.put('/:id', authenticateToken, requireSelfOrAdmin, studentController.updateStudent);

// Delete student (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, studentController.deleteStudent);

module.exports = router;
