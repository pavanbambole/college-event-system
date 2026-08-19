const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Get all feedback (Public or filtered)
router.get('/', feedbackController.getAllFeedback);

// Submit feedback (Authenticated Student)
router.post('/', authenticateToken, feedbackController.createFeedback);

// Update feedback (Author or Admin)
router.put('/:id', authenticateToken, feedbackController.updateFeedback);

// Delete feedback (Author or Admin)
router.delete('/:id', authenticateToken, feedbackController.deleteFeedback);

module.exports = router;
