const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticateToken, requireAdmin, requireSelfOrAdmin } = require('../middleware/authMiddleware');

// Get all registrations (Admin only)
router.get('/', authenticateToken, requireAdmin, registrationController.getAllRegistrations);

// Get registrations for a student (Student self or Admin)
router.get('/student/:studentId', authenticateToken, requireSelfOrAdmin, registrationController.getRegistrationsByStudentId);

// Get Ticket details for a registration (Self or Admin)
router.get('/:id/ticket', authenticateToken, registrationController.getTicketDetails);
router.get('/:registrationId/ticket', authenticateToken, registrationController.getTicketDetails);

// Create registration (Student authenticated)
router.post('/', authenticateToken, registrationController.createRegistration);

// Update registration status (Cancel by Student or Admin update)
router.put('/:id', authenticateToken, registrationController.updateRegistration);

// Delete registration (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, registrationController.deleteRegistration);

module.exports = router;
