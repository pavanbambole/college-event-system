const db = require('../utils/jsonDb');

const getAllRegistrations = async ({ eventId, status }) => {
  let registrations = await db.readData('registrations.json');

  if (eventId) {
    registrations = registrations.filter(r => r.eventId === eventId);
  }
  if (status && status !== 'All') {
    registrations = registrations.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }

  registrations.sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0));
  return registrations;
};

const getRegistrationsByStudentId = async (studentId) => {
  const registrations = await db.readData('registrations.json');
  return registrations
    .filter(r => r.studentId === studentId)
    .sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0));
};

const registerForEvent = async (studentId, eventId, notes = '') => {
  // 1. Fetch Student
  const student = await db.findById('students.json', studentId);
  if (!student) {
    const error = new Error('Student record not found.');
    error.statusCode = 404;
    error.code = 'STUDENT_NOT_FOUND';
    throw error;
  }

  // 2. Fetch Event
  const event = await db.findById('events.json', eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    error.code = 'EVENT_NOT_FOUND';
    throw error;
  }

  // 3. Check Event Status
  if (event.eventStatus === 'Cancelled') {
    const error = new Error('This event has been cancelled by administrators.');
    error.statusCode = 400;
    error.code = 'EVENT_CANCELLED';
    throw error;
  }
  if (event.eventStatus === 'Completed') {
    const error = new Error('This event is already completed.');
    error.statusCode = 400;
    error.code = 'EVENT_COMPLETED';
    throw error;
  }
  if (event.eventStatus === 'Registration Closed') {
    const error = new Error('Registration for this event is closed.');
    error.statusCode = 400;
    error.code = 'REGISTRATION_CLOSED';
    throw error;
  }

  // 4. Check Deadline
  if (event.registrationDeadline) {
    const today = new Date().toISOString().split('T')[0];
    if (today > event.registrationDeadline) {
      const error = new Error(`The registration deadline (${event.registrationDeadline}) has passed.`);
      error.statusCode = 400;
      error.code = 'DEADLINE_PASSED';
      throw error;
    }
  }

  // 5. Check Duplicate Registration
  const registrations = await db.readData('registrations.json');
  const existing = registrations.find(
    r => r.studentId === studentId && r.eventId === eventId && (r.status === 'Registered' || r.status === 'Attended')
  );

  if (existing) {
    const error = new Error('You are already registered for this event');
    error.statusCode = 409;
    error.code = 'DUPLICATE_REGISTRATION';
    error.data = existing;
    throw error;
  }

  // 6. Check Capacity
  const currentCount = Number(event.currentRegistrations || 0);
  const maxCap = Number(event.maxCapacity || 100);

  if (currentCount >= maxCap) {
    const error = new Error('Event capacity is full');
    error.statusCode = 409;
    error.code = 'CAPACITY_FULL';
    throw error;
  }

  // 7. Create Registration
  const ticketRandom = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `TKT-${new Date().getFullYear()}-${ticketRandom}`;

  const newRegistration = {
    studentId: student.id,
    studentName: student.fullName,
    studentRoll: student.studentId || '',
    studentEmail: student.email,
    studentDepartment: student.department || '',
    eventId: event.id,
    eventName: event.eventName,
    eventDate: event.date,
    venue: event.venue,
    registrationDate: new Date().toISOString(),
    status: 'Registered',
    ticketNumber,
    notes: notes ? notes.trim() : ''
  };

  const saved = await db.createRecord('registrations.json', newRegistration);

  // 8. Increment Event Registration Counter
  await db.updateRecord('events.json', event.id, {
    currentRegistrations: currentCount + 1
  });

  return saved;
};

const getTicketData = async (registrationId, requesterUser) => {
  const registrations = await db.readData('registrations.json');
  const registration = registrations.find(r => r.id === registrationId || r.ticketNumber === registrationId);

  if (!registration) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    error.code = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  // Authorization Check
  if (requesterUser && requesterUser.role !== 'admin' && registration.studentId !== requesterUser.id) {
    const error = new Error('You are not authorized to view this ticket');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  // Fetch Student & Event Details
  const student = await db.findById('students.json', registration.studentId);
  const event = await db.findById('events.json', registration.eventId);

  const ticketData = {
    ticketId: registration.ticketNumber || `TKT-2026-${registration.id}`,
    registrationId: registration.id,
    student: {
      studentId: (student && student.studentId) || registration.studentRoll || 'STU001',
      name: (student && student.fullName) || registration.studentName || 'Student Name',
      email: (student && student.email) || registration.studentEmail || 'student@example.com',
      department: (student && student.department) || registration.studentDepartment || 'Engineering'
    },
    event: {
      eventId: (event && event.id) || registration.eventId,
      eventName: (event && event.eventName) || registration.eventName,
      category: (event && event.category) || 'Technical',
      date: (event && event.date) || registration.eventDate,
      startTime: (event && event.startTime) || '09:00 AM',
      endTime: (event && event.endTime) || '05:00 PM',
      venue: (event && event.venue) || registration.venue,
      organizer: (event && event.organizer) || 'College Event Council'
    },
    status: registration.status,
    registrationDate: registration.registrationDate,
    notes: registration.notes || ''
  };

  return ticketData;
};

const updateRegistrationStatus = async (id, status, notes, requesterUser) => {
  const registration = await db.findById('registrations.json', id);
  if (!registration) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    error.code = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  if (requesterUser.role === 'student' && registration.studentId !== requesterUser.id) {
    const error = new Error('You are not authorized to modify this registration');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const previousStatus = registration.status;
  const updates = {};
  if (status) updates.status = status;
  if (typeof notes !== 'undefined') updates.notes = notes;

  const updated = await db.updateRecord('registrations.json', id, updates);

  // Adjust counter if status changed
  if (status && status !== previousStatus) {
    const event = await db.findById('events.json', registration.eventId);
    if (event) {
      let currentCount = Number(event.currentRegistrations || 0);
      if (previousStatus === 'Registered' && (status === 'Cancelled' || status === 'Waitlisted')) {
        currentCount = Math.max(0, currentCount - 1);
        await db.updateRecord('events.json', event.id, { currentRegistrations: currentCount });
      } else if (previousStatus !== 'Registered' && status === 'Registered') {
        currentCount = currentCount + 1;
        await db.updateRecord('events.json', event.id, { currentRegistrations: currentCount });
      }
    }
  }

  return updated;
};

const deleteRegistration = async (id) => {
  const registration = await db.findById('registrations.json', id);
  if (!registration) return false;

  const wasRegistered = registration.status === 'Registered';
  const eventId = registration.eventId;

  await db.deleteRecord('registrations.json', id);

  if (wasRegistered) {
    const event = await db.findById('events.json', eventId);
    if (event) {
      const currentCount = Math.max(0, Number(event.currentRegistrations || 0) - 1);
      await db.updateRecord('events.json', eventId, { currentRegistrations: currentCount });
    }
  }

  return true;
};

module.exports = {
  getAllRegistrations,
  getRegistrationsByStudentId,
  registerForEvent,
  getTicketData,
  updateRegistrationStatus,
  deleteRegistration
};
