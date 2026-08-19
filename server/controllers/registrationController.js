const registrationService = require('../services/registrationService');

const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await registrationService.getAllRegistrations(req.query);
    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving registrations.', error: 'SERVER_ERROR' });
  }
};

const getRegistrationsByStudentId = async (req, res) => {
  try {
    const registrations = await registrationService.getRegistrationsByStudentId(req.params.studentId);
    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving registrations.', error: 'SERVER_ERROR' });
  }
};

const getTicketDetails = async (req, res) => {
  try {
    const regId = req.params.registrationId || req.params.id;
    const ticketData = await registrationService.getTicketData(regId, req.user);

    return res.status(200).json({
      success: true,
      data: ticketData
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Unable to load ticket details',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const createRegistration = async (req, res) => {
  try {
    const { eventId, notes } = req.body;
    const studentId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required.', error: 'MISSING_EVENT_ID' });
    }

    const savedRegistration = await registrationService.registerForEvent(studentId, eventId, notes);

    return res.status(201).json({
      success: true,
      message: `Successfully registered for "${savedRegistration.eventName}"! Ticket Number: ${savedRegistration.ticketNumber}.`,
      data: savedRegistration
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error creating registration.',
      error: error.code || 'SERVER_ERROR',
      data: error.data || undefined
    });
  }
};

const updateRegistration = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updated = await registrationService.updateRegistrationStatus(req.params.id, status, notes, req.user);

    return res.status(200).json({
      success: true,
      message: `Registration status updated to ${updated.status}.`,
      data: updated
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error updating registration.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const deleted = await registrationService.deleteRegistration(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        error: 'REGISTRATION_NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Registration ${req.params.id} deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting registration.', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  getAllRegistrations,
  getRegistrationsByStudentId,
  getTicketDetails,
  createRegistration,
  updateRegistration,
  deleteRegistration
};
