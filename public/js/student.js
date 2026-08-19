/**
 * CampusConnect - Student Portal Controller
 */

// Global state for student portal
let currentStudent = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if current page is within student portal
  const path = window.location.pathname;
  if (
    path.includes('student-') ||
    path.includes('my-registrations') ||
    path.includes('event-history') ||
    path.includes('feedback.html') ||
    path.includes('settings.html')
  ) {
    if (!auth.requireStudent()) return;
    currentStudent = auth.getUser();
    initStudentHeader();

    if (path.includes('student-dashboard')) loadStudentDashboard();
    if (path.includes('student-profile')) loadStudentProfile();
    if (path.includes('student-events')) loadStudentEventsBrowse();
    if (path.includes('my-registrations')) loadMyRegistrations();
    if (path.includes('event-history')) loadEventHistory();
    if (path.includes('feedback.html')) loadStudentFeedbackPage();
    if (path.includes('settings.html')) loadStudentSettings();
  }
});

function initStudentHeader() {
  const nameEl = document.getElementById('studentDisplayName');
  const roleEl = document.getElementById('studentDisplayRoll');
  if (nameEl && currentStudent) nameEl.innerText = currentStudent.fullName;
  if (roleEl && currentStudent) roleEl.innerText = currentStudent.studentId || currentStudent.email;
}

/**
 * Load Student Dashboard
 */
async function loadStudentDashboard() {
  try {
    const res = await api.dashboard.getStudent(currentStudent.id);
    const { stats, recentRegistrations, upcomingEvents, availableEvents } = res.data;

    // Set Stats Counters
    if (document.getElementById('statTotalReg')) document.getElementById('statTotalReg').innerText = stats.totalRegistrations || stats.totalRegistered || 0;
    if (document.getElementById('statUpcoming')) document.getElementById('statUpcoming').innerText = stats.upcomingEvents || stats.upcomingCount || 0;
    if (document.getElementById('statCompleted')) document.getElementById('statCompleted').innerText = stats.completedEvents || stats.completedCount || 0;
    if (document.getElementById('statFeedback')) document.getElementById('statFeedback').innerText = stats.feedbackSubmitted || stats.feedbackCount || 0;

    // Render Recent Registrations Table
    const regContainer = document.getElementById('recentRegistrationsList');
    if (regContainer) {
      if (!recentRegistrations || recentRegistrations.length === 0) {
        regContainer.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No event registrations found yet. Browse upcoming events to register!</td></tr>`;
      } else {
        regContainer.innerHTML = recentRegistrations.map(r => `
          <tr>
            <td class="fw-bold">${r.eventName}</td>
            <td>${formatDate(r.eventDate)}</td>
            <td><code class="text-primary">${r.ticketNumber}</code></td>
            <td>${getStatusBadge(r.status)}</td>
            <td class="text-end">
              ${renderTicketButton(r)}
            </td>
          </tr>
        `).join('');
      }
    }

    // Render Available Events Discovery Grid
    const availContainer = document.getElementById('availableEventsGrid');
    if (availContainer) {
      if (!availableEvents || availableEvents.length === 0) {
        availContainer.innerHTML = `<div class="col-12 text-center py-4 text-muted">You are all caught up! No new open events right now.</div>`;
      } else {
        availContainer.innerHTML = availableEvents.map(e => `
          <div class="col-md-6 mb-3">
            <div class="card h-100 border shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  ${getCategoryBadge(e.category)}
                  <span class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${e.venue}</span>
                </div>
                <h6 class="card-title fw-bold text-truncate">${e.eventName}</h6>
                <p class="card-text small text-muted text-truncate-2" style="max-height: 40px; overflow: hidden;">${e.description}</p>
                <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                  <span class="small fw-semibold"><i class="bi bi-calendar-event me-1"></i>${formatDate(e.date)}</span>
                  <button class="btn btn-sm btn-primary-custom" onclick="registerForEvent('${e.id}')">Register Now</button>
                </div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Student Dashboard Error:', error);
    showToast(error.message || 'Failed to load dashboard data', 'error');
  }
}

/**
 * Helper to render ticket button state according to registration status
 */
function renderTicketButton(r) {
  if (r.status === 'Cancelled') {
    return `<button class="btn btn-sm btn-outline-secondary text-muted" disabled title="Registration is cancelled"><i class="bi bi-x-circle me-1"></i> Pass Cancelled</button>`;
  }
  if (r.status === 'Waitlisted') {
    return `<button class="btn btn-sm btn-outline-warning" onclick="viewTicketModal('${r.id}')"><i class="bi bi-hourglass-split me-1"></i> Waitlist Pass</button>`;
  }
  return `<button class="btn btn-sm btn-outline-primary" onclick="viewTicketModal('${r.id}')"><i class="bi bi-ticket-perforated me-1"></i> View Ticket</button>`;
}

/**
 * Load Profile
 */
async function loadStudentProfile() {
  try {
    const res = await api.students.getById(currentStudent.id);
    const stu = res.data;

    document.getElementById('profFullName').value = stu.fullName || '';
    document.getElementById('profEmail').value = stu.email || '';
    document.getElementById('profStudentId').value = stu.studentId || '';
    document.getElementById('profMobile').value = stu.mobileNumber || '';
    document.getElementById('profDepartment').value = stu.department || '';
    document.getElementById('profCourse').value = stu.course || '';
    document.getElementById('profYear').value = stu.year || '';
    document.getElementById('profBio').value = stu.bio || '';

    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  } catch (error) {
    console.error('Profile Load Error:', error);
    showToast(error.message || 'Failed to load profile details', 'error');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  btn.innerText = 'Saving...';

  try {
    const payload = {
      fullName: document.getElementById('profFullName').value,
      email: document.getElementById('profEmail').value,
      mobileNumber: document.getElementById('profMobile').value,
      department: document.getElementById('profDepartment').value,
      course: document.getElementById('profCourse').value,
      year: document.getElementById('profYear').value,
      bio: document.getElementById('profBio').value
    };

    const res = await api.students.update(currentStudent.id, payload);
    auth.saveSession(auth.getToken(), res.data);
    currentStudent = res.data;
    showToast('Profile updated successfully!', 'success');
  } catch (error) {
    console.error('Profile Update Error:', error);
    showToast(error.message || 'Failed to update profile', 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Save Changes';
  }
}

/**
 * Register directly for an event
 */
async function registerForEvent(eventId) {
  if (!confirm('Confirm registration for this event?')) return;
  try {
    const res = await api.registrations.create({ eventId });
    showToast(res.message, 'success');
    setTimeout(() => window.location.reload(), 1200);
  } catch (error) {
    console.error('Registration Error:', error);
    showToast(error.message || 'Registration failed', 'error');
  }
}

/**
 * Load My Registrations (Active, Attended, Waitlisted, Cancelled)
 */
async function loadMyRegistrations() {
  const container = document.getElementById('myRegistrationsContainer');
  if (!container) return;

  try {
    const res = await api.registrations.getByStudent(currentStudent.id);
    const regs = res.data;

    if (!regs || regs.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-ticket-perforated fs-1 text-muted"></i>
          <h5 class="mt-3 text-muted">No Event Registrations Yet</h5>
          <p class="text-muted">You haven't registered for any events. Discover upcoming fests, hackathons, and workshops!</p>
          <a href="/events.html" class="btn btn-primary-custom">Explore Events</a>
        </div>
      `;
      return;
    }

    container.innerHTML = regs.map(r => `
      <div class="col-md-6 mb-4">
        <div class="ticket-card">
          <div class="d-flex justify-content-between align-items-start ticket-header">
            <div>
              <span class="ticket-badge">${r.ticketNumber}</span>
              <h5 class="fw-bold mt-2 mb-1">${r.eventName}</h5>
              <div class="text-muted small"><i class="bi bi-geo-alt me-1"></i>${r.venue}</div>
            </div>
            <div>${getStatusBadge(r.status)}</div>
          </div>
          <div class="row g-2 small text-muted mb-3">
            <div class="col-6">
              <strong>Date:</strong> ${formatDate(r.eventDate)}
            </div>
            <div class="col-6">
              <strong>Registered:</strong> ${formatDate(r.registrationDate)}
            </div>
            ${r.notes ? `<div class="col-12"><strong>Notes:</strong> ${r.notes}</div>` : ''}
          </div>
          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            ${renderTicketButton(r)}
            <div class="d-flex gap-2">
              ${r.status === 'Registered' || r.status === 'Waitlisted' ? `
                <button class="btn btn-sm btn-outline-danger" onclick="cancelMyRegistration('${r.id}')">
                  <i class="bi bi-x-circle me-1"></i> Cancel
                </button>
              ` : ''}
              ${r.status === 'Attended' ? `
                <button class="btn btn-sm btn-outline-warning" onclick="openFeedbackModal('${r.eventId}', '${r.eventName.replace(/'/g, "\\'")}')">
                  <i class="bi bi-star me-1"></i> Rate Event
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load Registrations Error:', error);
    showToast(error.message || 'Failed to load registrations', 'error');
  }
}

/**
 * Cancel Registration
 */
async function cancelMyRegistration(regId) {
  if (!confirm('Are you sure you want to cancel this event registration? Your slot will be released.')) return;

  try {
    await api.registrations.update(regId, { status: 'Cancelled' });
    showToast('Registration cancelled successfully.', 'info');
    loadMyRegistrations();
  } catch (error) {
    console.error('Cancel Registration Error:', error);
    showToast(error.message || 'Failed to cancel registration', 'error');
  }
}

/**
 * View / Print Ticket Modal - Connected to GET /api/registrations/:id/ticket
 */
async function viewTicketModal(regId) {
  try {
    // Call dedicated ticket API endpoint with authentication token
    const res = await api.registrations.getTicket(regId);
    
    if (!res || !res.success || !res.data) {
      throw new Error(res.message || 'Unable to retrieve ticket information.');
    }

    const ticket = res.data;

    let modalEl = document.getElementById('ticketDetailModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'ticketDetailModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-primary text-white">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-mortarboard-fill fs-5"></i>
              <h5 class="modal-title fw-bold mb-0">CampusConnect Event Pass</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4" id="printableTicketArea">
            <div class="text-center border-bottom pb-3 mb-3">
              <span class="badge bg-primary fs-6 px-3 py-2 mb-2 font-monospace">${ticket.ticketId}</span>
              <h4 class="fw-bold mb-1 text-dark">${ticket.event.eventName}</h4>
              <div class="d-flex justify-content-center gap-2 align-items-center my-2">
                ${getCategoryBadge(ticket.event.category)}
                ${getStatusBadge(ticket.status)}
              </div>
              <p class="text-muted small mb-0"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${ticket.event.venue}</p>
            </div>
            
            <div class="row g-3 small">
              <div class="col-6">
                <span class="text-muted d-block">STUDENT NAME</span>
                <strong class="text-dark fs-6">${ticket.student.name}</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block">STUDENT ID / ROLL</span>
                <strong class="text-dark fs-6 font-monospace">${ticket.student.studentId}</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block">EVENT DATE</span>
                <strong class="text-dark">${formatDate(ticket.event.date)}</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block">TIME</span>
                <strong class="text-dark">${ticket.event.startTime} - ${ticket.event.endTime || '05:00 PM'}</strong>
              </div>
              <div class="col-6">
                <span class="text-muted d-block">ORGANIZER</span>
                <span class="text-dark">${ticket.event.organizer}</span>
              </div>
              <div class="col-6">
                <span class="text-muted d-block">REGISTRATION ID</span>
                <code class="text-primary">${ticket.registrationId}</code>
              </div>
              <div class="col-12">
                <span class="text-muted d-block">COLLEGE / DEPARTMENT</span>
                <span class="text-dark">${ticket.student.department || 'Engineering & Technology'}</span>
              </div>
              ${ticket.notes ? `
                <div class="col-12">
                  <span class="text-muted d-block">PARTICIPANT NOTES</span>
                  <span class="text-dark fst-italic">"${ticket.notes}"</span>
                </div>
              ` : ''}
            </div>

            <div class="alert alert-light border mt-4 text-center py-2 mb-0">
              <small class="text-muted"><i class="bi bi-qr-code me-1"></i> Present this official pass along with your College ID at the entry gate.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary-custom" onclick="window.print()">
              <i class="bi bi-printer me-1"></i> Print Ticket
            </button>
          </div>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  } catch (error) {
    console.error('Ticket API Error:', error);
    showToast(error.message || 'Failed to display ticket. Please verify your login.', 'error');
  }
}

/**
 * Load Student Feedback Page
 */
async function loadStudentFeedbackPage() {
  const container = document.getElementById('studentFeedbackList');
  if (!container) return;

  try {
    const res = await api.feedback.getAll({ studentId: currentStudent.id });
    const list = res.data;

    if (!list || list.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">You haven't submitted any event reviews yet.</td></tr>`;
      return;
    }

    container.innerHTML = list.map(f => `
      <tr>
        <td class="fw-bold">${f.eventName}</td>
        <td>${renderStars(f.rating)}</td>
        <td><em>"${f.comments}"</em></td>
        <td>${formatDate(f.submittedAt)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteFeedbackEntry('${f.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Feedback Load Error:', error);
    showToast(error.message || 'Failed to load feedback history', 'error');
  }
}

async function deleteFeedbackEntry(id) {
  if (!confirm('Are you sure you want to delete this feedback review?')) return;
  try {
    await api.feedback.delete(id);
    showToast('Feedback removed.', 'info');
    loadStudentFeedbackPage();
  } catch (error) {
    console.error('Feedback Delete Error:', error);
    showToast(error.message || 'Failed to remove feedback', 'error');
  }
}

/**
 * Open Feedback Rating Modal
 */
function openFeedbackModal(eventId, eventName) {
  let modalEl = document.getElementById('submitFeedbackModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'submitFeedbackModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content shadow-lg">
        <div class="modal-header">
          <h5 class="modal-title fw-bold">Rate & Review Event</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <h6 class="text-primary mb-3">${eventName}</h6>
          <div class="mb-3 text-center">
            <label class="form-label d-block text-muted small fw-bold">YOUR RATING</label>
            <div id="modalStarPicker" class="d-flex justify-content-center gap-2">
              <i class="bi bi-star-fill star-picker text-warning" data-val="1"></i>
              <i class="bi bi-star-fill star-picker text-warning" data-val="2"></i>
              <i class="bi bi-star-fill star-picker text-warning" data-val="3"></i>
              <i class="bi bi-star-fill star-picker text-warning" data-val="4"></i>
              <i class="bi bi-star-fill star-picker text-warning" data-val="5"></i>
            </div>
            <input type="hidden" id="selectedRatingVal" value="5">
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Your Review / Comments</label>
            <textarea id="feedbackCommentText" class="form-control" rows="3" placeholder="Share your experience, what you liked or how we can improve..." required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary-custom" onclick="submitEventFeedback('${eventId}')">Submit Review</button>
        </div>
      </div>
    </div>
  `;

  // Star selector event handlers
  const stars = modalEl.querySelectorAll('.star-picker');
  stars.forEach(s => {
    s.addEventListener('click', (e) => {
      const val = parseInt(e.target.getAttribute('data-val'));
      document.getElementById('selectedRatingVal').value = val;
      stars.forEach(star => {
        const sVal = parseInt(star.getAttribute('data-val'));
        if (sVal <= val) {
          star.className = 'bi bi-star-fill star-picker text-warning';
        } else {
          star.className = 'bi bi-star star-picker text-muted';
        }
      });
    });
  });

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

async function submitEventFeedback(eventId) {
  const rating = document.getElementById('selectedRatingVal').value;
  const comments = document.getElementById('feedbackCommentText').value;

  if (!comments || comments.trim() === '') {
    return showToast('Please enter your review comments', 'warning');
  }

  try {
    const res = await api.feedback.create({ eventId, rating, comments });
    showToast(res.message, 'success');
    const modalEl = document.getElementById('submitFeedbackModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  } catch (error) {
    console.error('Feedback Submit Error:', error);
    showToast(error.message || 'Failed to submit feedback', 'error');
  }
}
