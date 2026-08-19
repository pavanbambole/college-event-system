const eventService = require('../services/eventService');

const getAllEvents = async (req, res) => {
  try {
    const events = await eventService.getAllEvents(req.query);
    return res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving events.', error: 'SERVER_ERROR' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event with ID ${req.params.id} not found.`,
        error: 'EVENT_NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving event details.', error: 'SERVER_ERROR' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { eventName, description, category, organizer, date, startTime, venue, maxCapacity } = req.body;

    if (!eventName || !description || !category || !organizer || !date || !startTime || !venue || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory event details.',
        error: 'MISSING_EVENT_FIELDS'
      });
    }

    const createdEvent = await eventService.createEvent(req.body);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: createdEvent
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error creating event.', error: 'SERVER_ERROR' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const updated = await eventService.updateEvent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Event with ID ${req.params.id} not found.`,
        error: 'EVENT_NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating event.', error: 'SERVER_ERROR' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const deleted = await eventService.deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Event with ID ${req.params.id} not found.`,
        error: 'EVENT_NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Event ${req.params.id} and associated bookings removed.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting event.', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
