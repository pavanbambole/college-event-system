const db = require('../utils/jsonDb');
const { sanitizeUser } = require('../utils/validators');

const getStudentDashboardData = async (studentId) => {
  const student = await db.findById('students.json', studentId);
  if (!student) {
    const error = new Error('Student record not found.');
    error.statusCode = 404;
    error.code = 'STUDENT_NOT_FOUND';
    throw error;
  }

  const allEvents = await db.readData('events.json');
  const allRegistrations = await db.readData('registrations.json');
  const allFeedback = await db.readData('feedback.json');

  const studentRegs = allRegistrations.filter(r => r.studentId === studentId);
  const studentFeedback = allFeedback.filter(f => f.studentId === studentId);
  const today = new Date().toISOString().split('T')[0];

  const activeRegistrations = studentRegs.filter(r => r.status === 'Registered');
  const attendedRegistrations = studentRegs.filter(r => r.status === 'Attended');
  const cancelledRegistrations = studentRegs.filter(r => r.status === 'Cancelled');
  const waitlistedRegistrations = studentRegs.filter(r => r.status === 'Waitlisted');

  const upcomingRegistered = activeRegistrations.filter(r => r.eventDate >= today);
  const completedRegistered = studentRegs.filter(r => r.status === 'Attended' || (r.status === 'Registered' && r.eventDate < today));

  const registeredEventIds = new Set(studentRegs.filter(r => r.status === 'Registered' || r.status === 'Attended').map(r => r.eventId));
  const availableEvents = allEvents.filter(e => !registeredEventIds.has(e.id) && e.eventStatus === 'Registration Open');

  const recentRegistrations = [...studentRegs]
    .sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0))
    .slice(0, 5);

  return {
    student: sanitizeUser(student),
    stats: {
      totalRegistrations: studentRegs.length,
      upcomingEvents: upcomingRegistered.length,
      completedEvents: completedRegistered.length,
      cancelledRegistrations: cancelledRegistrations.length,
      feedbackSubmitted: studentFeedback.length,
      totalRegistered: studentRegs.length,
      activeCount: activeRegistrations.length,
      upcomingCount: upcomingRegistered.length,
      completedCount: completedRegistered.length,
      cancelledCount: cancelledRegistrations.length,
      waitlistedCount: waitlistedRegistrations.length,
      feedbackCount: studentFeedback.length,
      availableEventsCount: availableEvents.length
    },
    totalRegistrations: studentRegs.length,
    upcomingEvents: upcomingRegistered,
    completedEvents: completedRegistered.length,
    cancelledRegistrations: cancelledRegistrations.length,
    feedbackSubmitted: studentFeedback.length,
    recentRegistrations,
    availableEvents: availableEvents.slice(0, 4)
  };
};

const getAdminDashboardData = async () => {
  const students = await db.readData('students.json');
  const events = await db.readData('events.json');
  const registrations = await db.readData('registrations.json');
  const feedbackList = await db.readData('feedback.json');

  const today = new Date().toISOString().split('T')[0];

  const totalStudents = students.length;
  const totalEvents = events.length;
  const totalRegistrations = registrations.length;
  const totalFeedback = feedbackList.length;

  const upcomingEventsCount = events.filter(e => e.date >= today && e.eventStatus !== 'Cancelled').length;
  const completedEventsCount = events.filter(e => e.eventStatus === 'Completed' || e.date < today).length;
  const cancelledEventsCount = events.filter(e => e.eventStatus === 'Cancelled').length;
  const openRegistrationEventsCount = events.filter(e => e.eventStatus === 'Registration Open').length;

  const categoryCounts = {};
  events.forEach(e => {
    const cat = e.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const regStatusCounts = {
    Registered: 0,
    Attended: 0,
    Cancelled: 0,
    Waitlisted: 0
  };
  registrations.forEach(r => {
    const st = r.status || 'Registered';
    regStatusCounts[st] = (regStatusCounts[st] || 0) + 1;
  });

  const popularEvents = [...events]
    .sort((a, b) => (b.currentRegistrations || 0) - (a.currentRegistrations || 0))
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      eventName: e.eventName,
      category: e.category,
      maxCapacity: e.maxCapacity,
      currentRegistrations: e.currentRegistrations || 0,
      utilization: e.maxCapacity ? Math.round(((e.currentRegistrations || 0) / e.maxCapacity) * 100) : 0,
      eventStatus: e.eventStatus,
      date: e.date
    }));

  const capacityUtilization = events.map(e => {
    const regCount = registrations.filter(r => r.eventId === e.id && (r.status === 'Registered' || r.status === 'Attended')).length;
    const pct = e.maxCapacity > 0 ? Math.min(100, Math.round((regCount / e.maxCapacity) * 100)) : 0;
    return {
      id: e.id,
      eventName: e.eventName,
      category: e.category,
      maxCapacity: e.maxCapacity,
      registeredCount: regCount,
      percentage: pct,
      status: e.eventStatus
    };
  });

  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0))
    .slice(0, 10);

  const recentFeedback = [...feedbackList]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 5);

  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + Number(f.rating || 5), 0) / feedbackList.length).toFixed(1)
    : '5.0';

  return {
    metrics: {
      totalStudents,
      totalEvents,
      totalRegistrations,
      totalFeedback,
      upcomingEventsCount,
      completedEventsCount,
      cancelledEventsCount,
      openRegistrationEventsCount,
      avgRating: Number(avgRating)
    },
    totalStudents,
    totalEvents,
    totalRegistrations,
    upcomingEvents: upcomingEventsCount,
    completedEvents: completedEventsCount,
    cancelledEvents: cancelledEventsCount,
    categoryCounts,
    regStatusCounts,
    popularEvents,
    capacityUtilization,
    recentRegistrations,
    recentFeedback
  };
};

module.exports = {
  getStudentDashboardData,
  getAdminDashboardData
};
