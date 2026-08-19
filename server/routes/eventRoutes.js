const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public routes for viewing and searching events
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected routes (Admin only)
router.post('/', authenticateToken, requireAdmin, eventController.createEvent);
router.put('/:id', authenticateToken, requireAdmin, eventController.updateEvent);
router.delete('/:id', authenticateToken, requireAdmin, eventController.deleteEvent);

module.exports = router;
