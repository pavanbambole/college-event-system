const feedbackService = require('../services/feedbackService');

const getAllFeedback = async (req, res) => {
  try {
    const feedbackList = await feedbackService.getAllFeedback(req.query);
    return res.status(200).json({
      success: true,
      count: feedbackList.length,
      data: feedbackList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving feedback.', error: 'SERVER_ERROR' });
  }
};

const createFeedback = async (req, res) => {
  try {
    const { eventId, rating, comments } = req.body;
    const studentId = req.user.id;

    if (!eventId || !rating || !comments) {
      return res.status(400).json({
        success: false,
        message: 'Event ID, Rating (1-5), and Comments are required.',
        error: 'MISSING_FEEDBACK_FIELDS'
      });
    }

    const { feedback, isUpdate } = await feedbackService.createFeedback(studentId, eventId, rating, comments);

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Your feedback has been updated successfully!' : 'Thank you for your valuable feedback!',
      data: feedback
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error saving feedback.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const updated = await feedbackService.updateFeedback(req.params.id, rating, comments, req.user);

    return res.status(200).json({
      success: true,
      message: 'Feedback updated successfully.',
      data: updated
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error updating feedback.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    await feedbackService.deleteFeedback(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully.'
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error deleting feedback.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getAllFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback
};
