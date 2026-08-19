const db = require('../utils/jsonDb');

const getAllFeedback = async ({ eventId, studentId }) => {
  let feedbackList = await db.readData('feedback.json');

  if (eventId) {
    feedbackList = feedbackList.filter(f => f.eventId === eventId);
  }
  if (studentId) {
    feedbackList = feedbackList.filter(f => f.studentId === studentId);
  }

  feedbackList.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  return feedbackList;
};

const createFeedback = async (studentId, eventId, rating, comments) => {
  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    const error = new Error('Rating must be a valid number between 1 and 5.');
    error.statusCode = 400;
    error.code = 'INVALID_RATING';
    throw error;
  }

  const student = await db.findById('students.json', studentId);
  if (!student) {
    const error = new Error('Student record not found.');
    error.statusCode = 404;
    error.code = 'STUDENT_NOT_FOUND';
    throw error;
  }

  const event = await db.findById('events.json', eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    error.code = 'EVENT_NOT_FOUND';
    throw error;
  }

  // Check if student registered for this event
  const registrations = await db.readData('registrations.json');
  const userRegistration = registrations.find(r => r.studentId === studentId && r.eventId === eventId);

  if (!userRegistration) {
    const error = new Error('Only students who registered for this event can submit feedback.');
    error.statusCode = 403;
    error.code = 'NOT_REGISTERED_FOR_EVENT';
    throw error;
  }

  const feedbackList = await db.readData('feedback.json');
  const existingFeedback = feedbackList.find(f => f.studentId === studentId && f.eventId === eventId);

  if (existingFeedback) {
    const updated = await db.updateRecord('feedback.json', existingFeedback.id, {
      rating: numRating,
      comments: comments.trim(),
      submittedAt: new Date().toISOString()
    });
    return { feedback: updated, isUpdate: true };
  }

  const newFeedback = {
    studentId: student.id,
    studentName: student.fullName,
    studentEmail: student.email,
    eventId: event.id,
    eventName: event.eventName,
    rating: numRating,
    comments: comments.trim(),
    submittedAt: new Date().toISOString()
  };

  const saved = await db.createRecord('feedback.json', newFeedback);
  return { feedback: saved, isUpdate: false };
};

const updateFeedback = async (id, rating, comments, requesterUser) => {
  const feedback = await db.findById('feedback.json', id);
  if (!feedback) {
    const error = new Error('Feedback entry not found.');
    error.statusCode = 404;
    error.code = 'FEEDBACK_NOT_FOUND';
    throw error;
  }

  if (requesterUser.role !== 'admin' && feedback.studentId !== requesterUser.id) {
    const error = new Error('Unauthorized to modify this feedback.');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const updates = {};
  if (rating) updates.rating = Number(rating);
  if (comments) updates.comments = comments.trim();

  return await db.updateRecord('feedback.json', id, updates);
};

const deleteFeedback = async (id, requesterUser) => {
  const feedback = await db.findById('feedback.json', id);
  if (!feedback) {
    const error = new Error('Feedback not found.');
    error.statusCode = 404;
    error.code = 'FEEDBACK_NOT_FOUND';
    throw error;
  }

  if (requesterUser.role !== 'admin' && feedback.studentId !== requesterUser.id) {
    const error = new Error('Unauthorized to delete this feedback.');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  await db.deleteRecord('feedback.json', id);
  return true;
};

module.exports = {
  getAllFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback
};
