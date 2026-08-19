const db = require('../utils/jsonDb');

const getAllEvents = async ({ search, category, department, status, date, sort, sortBy }) => {
  let events = await db.readData('events.json');

  // Search filter (Name, Organizer, Venue, Description)
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    events = events.filter(e =>
      (e.eventName && e.eventName.toLowerCase().includes(q)) ||
      (e.organizer && e.organizer.toLowerCase().includes(q)) ||
      (e.venue && e.venue.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (category && category !== 'All') {
    events = events.filter(e => e.category && e.category.toLowerCase() === category.toLowerCase());
  }

  // Department filter
  if (department && department !== 'All') {
    events = events.filter(e => 
      e.department && (e.department.toLowerCase() === department.toLowerCase() || e.department.toLowerCase() === 'all departments')
    );
  }

  // Status filter
  if (status && status !== 'All') {
    events = events.filter(e => e.eventStatus && e.eventStatus.toLowerCase() === status.toLowerCase());
  }

  // Date filter
  if (date) {
    events = events.filter(e => e.date === date);
  }

  // Sorting
  const sortMode = sort || sortBy;
  if (sortMode === 'newest') {
    events.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  } else if (sortMode === 'upcoming') {
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortMode === 'popular' || sortMode === 'most_registered') {
    events.sort((a, b) => (b.currentRegistrations || 0) - (a.currentRegistrations || 0));
  } else {
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  return events;
};

const getEventById = async (id) => {
  const event = await db.findById('events.json', id);
  if (!event) return null;

  const feedbackList = await db.readData('feedback.json');
  const eventFeedback = feedbackList.filter(f => f.eventId === id);
  const avgRating = eventFeedback.length > 0
    ? (eventFeedback.reduce((acc, f) => acc + Number(f.rating || 5), 0) / eventFeedback.length).toFixed(1)
    : '5.0';

  return {
    ...event,
    feedback: eventFeedback,
    averageRating: Number(avgRating),
    feedbackCount: eventFeedback.length
  };
};

const createEvent = async (eventData) => {
  const newEvent = {
    eventName: eventData.eventName.trim(),
    description: eventData.description.trim(),
    category: eventData.category.trim(),
    department: eventData.department ? eventData.department.trim() : 'All Departments',
    organizer: eventData.organizer.trim(),
    date: eventData.date.trim(),
    startTime: eventData.startTime.trim(),
    endTime: eventData.endTime ? eventData.endTime.trim() : '05:00 PM',
    venue: eventData.venue.trim(),
    maxCapacity: Number(eventData.maxCapacity),
    currentRegistrations: 0,
    registrationDeadline: eventData.registrationDeadline ? eventData.registrationDeadline.trim() : eventData.date.trim(),
    eventStatus: eventData.eventStatus || 'Registration Open',
    eventImage: eventData.eventImage && eventData.eventImage.trim() !== ''
      ? eventData.eventImage.trim()
      : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    eligibility: eventData.eligibility ? eventData.eligibility.trim() : 'Open to all students with valid College ID.',
    rules: eventData.rules ? eventData.rules.trim() : '1. Carry College ID card.\n2. Maintain discipline.\n3. Report on time.'
  };

  return await db.createRecord('events.json', newEvent);
};

const updateEvent = async (id, updateFields) => {
  const existing = await db.findById('events.json', id);
  if (!existing) return null;

  const payload = { ...updateFields };
  if (payload.maxCapacity) payload.maxCapacity = Number(payload.maxCapacity);
  if (payload.currentRegistrations !== undefined) payload.currentRegistrations = Number(payload.currentRegistrations);

  return await db.updateRecord('events.json', id, payload);
};

const deleteEvent = async (id) => {
  const deleted = await db.deleteRecord('events.json', id);
  if (!deleted) return false;

  // Clean registrations and feedback
  const regs = await db.readData('registrations.json');
  await db.writeData('registrations.json', regs.filter(r => r.eventId !== id));

  const fdb = await db.readData('feedback.json');
  await db.writeData('feedback.json', fdb.filter(f => f.eventId !== id));

  return true;
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
