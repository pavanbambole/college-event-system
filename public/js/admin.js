/**
 * CampusConnect - Admin Portal Controller
 */

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (
    path.includes('admin-') ||
    path.includes('manage-') ||
    path.includes('add-event') ||
    path.includes('edit-event') ||
    path.includes('event-analytics')
  ) {
    if (path.includes('admin-login')) return; // skip for login page
    if (!auth.requireAdmin()) return;
    currentAdmin = auth.getUser();
    initAdminHeader();

    if (path.includes('admin-dashboard')) loadAdminDashboard();
    if (path.includes('manage-events')) loadManageEventsPage();
    if (path.includes('add-event')) initAddEventForm();
    if (path.includes('edit-event')) initEditEventForm();
    if (path.includes('manage-students')) loadManageStudentsPage();
    if (path.includes('manage-registrations')) loadManageRegistrationsPage();
    if (path.includes('event-analytics')) loadAdminAnalyticsPage();
    if (path.includes('manage-feedback')) loadAdminFeedbackPage();
  }
});

function initAdminHeader() {
  const nameEl = document.getElementById('adminDisplayName');
  if (nameEl && currentAdmin) nameEl.innerText = currentAdmin.fullName;
}

/**
 * Load Admin Dashboard
 */
async function loadAdminDashboard() {
  try {
    const res = await api.dashboard.getAdmin();
    const { metrics, categoryCounts, regStatusCounts, popularEvents, recentRegistrations, recentFeedback } = res.data;

    // Stat Cards
    if (document.getElementById('adminTotalStudents')) document.getElementById('adminTotalStudents').innerText = metrics.totalStudents;
    if (document.getElementById('adminTotalEvents')) document.getElementById('adminTotalEvents').innerText = metrics.totalEvents;
    if (document.getElementById('adminTotalRegs')) document.getElementById('adminTotalRegs').innerText = metrics.totalRegistrations;
    if (document.getElementById('adminUpcomingEvents')) document.getElementById('adminUpcomingEvents').innerText = metrics.upcomingEventsCount;
    if (document.getElementById('adminCompletedEvents')) document.getElementById('adminCompletedEvents').innerText = metrics.completedEventsCount;
    if (document.getElementById('adminCancelledEvents')) document.getElementById('adminCancelledEvents').innerText = metrics.cancelledEventsCount;

    // Render Popular Events Table
    const popContainer = document.getElementById('popularEventsList');
    if (popContainer) {
      popContainer.innerHTML = popularEvents.map(e => `
        <tr>
          <td>
            <div class="fw-bold">${e.eventName}</div>
            <span class="small text-muted">${formatDate(e.date)}</span>
          </td>
          <td>${getCategoryBadge(e.category)}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height: 6px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${Math.min(100, e.utilization)}%"></div>
              </div>
              <span class="small fw-semibold">${e.currentRegistrations}/${e.maxCapacity} (${e.utilization}%)</span>
            </div>
          </td>
          <td>${getStatusBadge(e.eventStatus)}</td>
          <td class="text-end">
            <a href="/edit-event.html?id=${e.id}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-pencil"></i></a>
          </td>
        </tr>
      `).join('');
    }

    // Render Recent Registrations Table
    const regContainer = document.getElementById('recentRegistrationsAdmin');
    if (regContainer) {
      regContainer.innerHTML = recentRegistrations.slice(0, 6).map(r => `
        <tr>
          <td><strong>${r.studentName}</strong><br><small class="text-muted">${r.studentRoll || r.studentEmail}</small></td>
          <td>${r.eventName}</td>
          <td><code>${r.ticketNumber}</code></td>
          <td>${getStatusBadge(r.status)}</td>
          <td><small>${formatDate(r.registrationDate)}</small></td>
        </tr>
      `).join('');
    }

    // Render Chart.js Analytics if available
    initDashboardCharts(categoryCounts, regStatusCounts);

  } catch (error) {
    showToast(error.message || 'Failed to load admin dashboard', 'error');
  }
}

/**
 * Chart.js Visualizations for Dashboard
 */
function initDashboardCharts(categoryCounts, regStatusCounts) {
  if (typeof Chart === 'undefined') return;

  // Category Pie/Doughnut Chart
  const catCanvas = document.getElementById('categoryChart');
  if (catCanvas) {
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Registration Status Bar Chart
  const statusCanvas = document.getElementById('statusChart');
  if (statusCanvas) {
    new Chart(statusCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(regStatusCounts),
        datasets: [{
          label: 'Registrations',
          data: Object.values(regStatusCounts),
          backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }
}

/**
 * Manage Events Page Logic
 */
async function loadManageEventsPage() {
  const container = document.getElementById('manageEventsTableBody');
  if (!container) return;

  try {
    const res = await api.events.getAll();
    let events = res.data;

    const renderTable = (list) => {
      if (!list || list.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No events found matching your criteria.</td></tr>`;
        return;
      }

      container.innerHTML = list.map(e => `
        <tr>
          <td><code class="text-primary">${e.id}</code></td>
          <td>
            <strong>${e.eventName}</strong><br>
            <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${e.venue}</small>
          </td>
          <td>${getCategoryBadge(e.category)}</td>
          <td>${formatDate(e.date)}<br><small class="text-muted">${e.startTime}</small></td>
          <td>
            <span class="fw-bold">${e.currentRegistrations || 0}</span> / ${e.maxCapacity}
          </td>
          <td>${getStatusBadge(e.eventStatus)}</td>
          <td class="text-end">
            <div class="btn-group">
              <a href="/event-details.html?id=${e.id}" target="_blank" class="btn btn-sm btn-outline-info" title="Preview"><i class="bi bi-eye"></i></a>
              <a href="/edit-event.html?id=${e.id}" class="btn btn-sm btn-outline-primary" title="Edit"><i class="bi bi-pencil"></i></a>
              <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteEventRecord('${e.id}', '${e.eventName.replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    };

    renderTable(events);

    // Search and Filter Handlers
    const searchInput = document.getElementById('eventSearchInput');
    const categoryFilter = document.getElementById('eventCategoryFilter');
    const statusFilter = document.getElementById('eventStatusFilter');

    const filterHandler = () => {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const cat = categoryFilter ? categoryFilter.value : 'All';
      const st = statusFilter ? statusFilter.value : 'All';

      const filtered = events.filter(e => {
        const matchesQuery = !q || e.eventName.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q);
        const matchesCat = cat === 'All' || (e.category && e.category.toLowerCase() === cat.toLowerCase());
        const matchesSt = st === 'All' || (e.eventStatus && e.eventStatus.toLowerCase() === st.toLowerCase());
        return matchesQuery && matchesCat && matchesSt;
      });

      renderTable(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterHandler);
    if (categoryFilter) categoryFilter.addEventListener('change', filterHandler);
    if (statusFilter) statusFilter.addEventListener('change', filterHandler);

  } catch (error) {
    showToast('Failed to load events table', 'error');
  }
}

/**
 * Delete Event Record
 */
async function deleteEventRecord(id, name) {
  if (!confirm(`Are you sure you want to permanently delete event "${name}"? All associated registrations and feedback will also be removed.`)) return;

  try {
    await api.events.delete(id);
    showToast('Event deleted successfully.', 'info');
    loadManageEventsPage();
  } catch (error) {
    showToast(error.message || 'Failed to delete event', 'error');
  }
}

/**
 * Add Event Form Handler
 */
function initAddEventForm() {
  const form = document.getElementById('addEventForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitEventBtn');
    btn.disabled = true;
    btn.innerText = 'Creating Event...';

    const payload = {
      eventName: document.getElementById('evtName').value,
      category: document.getElementById('evtCategory').value,
      department: document.getElementById('evtDepartment').value,
      organizer: document.getElementById('evtOrganizer').value,
      date: document.getElementById('evtDate').value,
      startTime: document.getElementById('evtStartTime').value,
      endTime: document.getElementById('evtEndTime').value,
      venue: document.getElementById('evtVenue').value,
      maxCapacity: Number(document.getElementById('evtMaxCapacity').value),
      registrationDeadline: document.getElementById('evtDeadline').value,
      eventStatus: document.getElementById('evtStatus').value,
      eventImage: document.getElementById('evtImage').value,
      description: document.getElementById('evtDescription').value,
      eligibility: document.getElementById('evtEligibility').value,
      rules: document.getElementById('evtRules').value
    };

    try {
      const res = await api.events.create(payload);
      showToast(res.message, 'success');
      setTimeout(() => {
        window.location.href = '/manage-events.html';
      }, 1000);
    } catch (error) {
      showToast(error.message || 'Failed to create event', 'error');
      btn.disabled = false;
      btn.innerText = 'Create Event';
    }
  });
}

/**
 * Edit Event Form Handler
 */
async function initEditEventForm() {
  const form = document.getElementById('editEventForm');
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    showToast('No Event ID provided', 'error');
    window.location.href = '/manage-events.html';
    return;
  }

  try {
    const res = await api.events.getById(eventId);
    const evt = res.data;

    document.getElementById('evtId').value = evt.id;
    document.getElementById('evtName').value = evt.eventName || '';
    document.getElementById('evtCategory').value = evt.category || 'Technical';
    document.getElementById('evtDepartment').value = evt.department || 'All Departments';
    document.getElementById('evtOrganizer').value = evt.organizer || '';
    document.getElementById('evtDate').value = evt.date || '';
    document.getElementById('evtStartTime').value = evt.startTime || '';
    document.getElementById('evtEndTime').value = evt.endTime || '';
    document.getElementById('evtVenue').value = evt.venue || '';
    document.getElementById('evtMaxCapacity').value = evt.maxCapacity || 100;
    document.getElementById('evtCurrentRegs').value = evt.currentRegistrations || 0;
    document.getElementById('evtDeadline').value = evt.registrationDeadline || '';
    document.getElementById('evtStatus').value = evt.eventStatus || 'Registration Open';
    document.getElementById('evtImage').value = evt.eventImage || '';
    document.getElementById('evtDescription').value = evt.description || '';
    document.getElementById('evtEligibility').value = evt.eligibility || '';
    document.getElementById('evtRules').value = evt.rules || '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('updateEventBtn');
      btn.disabled = true;
      btn.innerText = 'Updating...';

      const payload = {
        eventName: document.getElementById('evtName').value,
        category: document.getElementById('evtCategory').value,
        department: document.getElementById('evtDepartment').value,
        organizer: document.getElementById('evtOrganizer').value,
        date: document.getElementById('evtDate').value,
        startTime: document.getElementById('evtStartTime').value,
        endTime: document.getElementById('evtEndTime').value,
        venue: document.getElementById('evtVenue').value,
        maxCapacity: Number(document.getElementById('evtMaxCapacity').value),
        currentRegistrations: Number(document.getElementById('evtCurrentRegs').value),
        registrationDeadline: document.getElementById('evtDeadline').value,
        eventStatus: document.getElementById('evtStatus').value,
        eventImage: document.getElementById('evtImage').value,
        description: document.getElementById('evtDescription').value,
        eligibility: document.getElementById('evtEligibility').value,
        rules: document.getElementById('evtRules').value
      };

      try {
        const updateRes = await api.events.update(eventId, payload);
        showToast(updateRes.message, 'success');
        setTimeout(() => {
          window.location.href = '/manage-events.html';
        }, 1000);
      } catch (err) {
        showToast(err.message || 'Failed to update event', 'error');
        btn.disabled = false;
        btn.innerText = 'Save Changes';
      }
    });

  } catch (error) {
    showToast('Failed to load event details', 'error');
  }
}

/**
 * Manage Students Page Logic
 */
async function loadManageStudentsPage() {
  const container = document.getElementById('manageStudentsTableBody');
  if (!container) return;

  try {
    const res = await api.students.getAll();
    const students = res.data;

    const renderTable = (list) => {
      if (!list || list.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No students found.</td></tr>`;
        return;
      }

      container.innerHTML = list.map(s => `
        <tr>
          <td><code class="text-primary">${s.id}</code></td>
          <td><span class="badge bg-light text-dark border">${s.studentId || 'N/A'}</span></td>
          <td><strong>${s.fullName}</strong></td>
          <td>${s.email}<br><small class="text-muted">${s.mobileNumber || ''}</small></td>
          <td>${s.department}<br><small class="text-muted">${s.course} (${s.year})</small></td>
          <td><small>${formatDate(s.createdAt)}</small></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" title="Delete Student" onclick="deleteStudentRecord('${s.id}', '${s.fullName.replace(/'/g, "\\'")}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    };

    renderTable(students);

    const searchInput = document.getElementById('studentSearchInput');
    const deptFilter = document.getElementById('studentDeptFilter');

    const filterHandler = () => {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const dept = deptFilter ? deptFilter.value : 'All';

      const filtered = students.filter(s => {
        const matchesQuery = !q || s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.studentId && s.studentId.toLowerCase().includes(q));
        const matchesDept = dept === 'All' || (s.department && s.department.toLowerCase() === dept.toLowerCase());
        return matchesQuery && matchesDept;
      });

      renderTable(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterHandler);
    if (deptFilter) deptFilter.addEventListener('change', filterHandler);

  } catch (error) {
    showToast('Failed to load students', 'error');
  }
}

async function deleteStudentRecord(id, name) {
  if (!confirm(`Are you sure you want to remove student "${name}"? Their account and event registrations will be removed.`)) return;

  try {
    await api.students.delete(id);
    showToast('Student deleted successfully.', 'info');
    loadManageStudentsPage();
  } catch (error) {
    showToast(error.message || 'Failed to delete student', 'error');
  }
}

/**
 * Manage Registrations Page Logic
 */
async function loadManageRegistrationsPage() {
  const container = document.getElementById('manageRegistrationsTableBody');
  if (!container) return;

  try {
    const res = await api.registrations.getAll();
    let registrations = res.data;

    const renderTable = (list) => {
      if (!list || list.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No registrations found.</td></tr>`;
        return;
      }

      container.innerHTML = list.map(r => `
        <tr>
          <td><code class="text-primary">${r.ticketNumber}</code></td>
          <td><strong>${r.studentName}</strong><br><small class="text-muted">${r.studentRoll || r.studentEmail}</small></td>
          <td>${r.eventName}</td>
          <td>${formatDate(r.eventDate)}</td>
          <td>${getStatusBadge(r.status)}</td>
          <td>
            <select class="form-select form-select-sm" onchange="updateRegStatus('${r.id}', this.value)" style="width: 130px;">
              <option value="Registered" ${r.status === 'Registered' ? 'selected' : ''}>Registered</option>
              <option value="Attended" ${r.status === 'Attended' ? 'selected' : ''}>Attended</option>
              <option value="Cancelled" ${r.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              <option value="Waitlisted" ${r.status === 'Waitlisted' ? 'selected' : ''}>Waitlisted</option>
            </select>
          </td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="deleteRegRecord('${r.id}')" title="Delete"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('');
    };

    renderTable(registrations);

    const searchInput = document.getElementById('regSearchInput');
    const statusFilter = document.getElementById('regStatusFilter');

    const filterHandler = () => {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const st = statusFilter ? statusFilter.value : 'All';

      const filtered = registrations.filter(r => {
        const matchesQuery = !q || r.studentName.toLowerCase().includes(q) || r.eventName.toLowerCase().includes(q) || r.ticketNumber.toLowerCase().includes(q);
        const matchesSt = st === 'All' || (r.status && r.status.toLowerCase() === st.toLowerCase());
        return matchesQuery && matchesSt;
      });

      renderTable(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterHandler);
    if (statusFilter) statusFilter.addEventListener('change', filterHandler);

  } catch (error) {
    showToast('Failed to load registrations', 'error');
  }
}

async function updateRegStatus(regId, newStatus) {
  try {
    await api.registrations.update(regId, { status: newStatus });
    showToast(`Status updated to ${newStatus}`, 'success');
  } catch (error) {
    showToast(error.message || 'Failed to update status', 'error');
  }
}

async function deleteRegRecord(id) {
  if (!confirm('Are you sure you want to delete this registration record?')) return;
  try {
    await api.registrations.delete(id);
    showToast('Registration deleted.', 'info');
    loadManageRegistrationsPage();
  } catch (error) {
    showToast(error.message || 'Failed to delete registration', 'error');
  }
}

/**
 * Manage Feedback Page Logic
 */
async function loadAdminFeedbackPage() {
  const container = document.getElementById('adminFeedbackTableBody');
  if (!container) return;

  try {
    const res = await api.feedback.getAll();
    const list = res.data;

    if (!list || list.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No student feedback records available.</td></tr>`;
      return;
    }

    container.innerHTML = list.map(f => `
      <tr>
        <td><strong>${f.eventName}</strong></td>
        <td>${f.studentName}<br><small class="text-muted">${f.studentEmail}</small></td>
        <td>${renderStars(f.rating)} <span class="fw-bold ms-1">(${f.rating}/5)</span></td>
        <td><em>"${f.comments}"</em></td>
        <td><small>${formatDate(f.submittedAt)}</small></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteAdminFeedback('${f.id}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    showToast('Failed to load feedback', 'error');
  }
}

async function deleteAdminFeedback(id) {
  if (!confirm('Are you sure you want to remove this feedback review?')) return;
  try {
    await api.feedback.delete(id);
    showToast('Feedback removed.', 'info');
    loadAdminFeedbackPage();
  } catch (error) {
    showToast(error.message || 'Failed to delete feedback', 'error');
  }
}

/**
 * Load Analytics Page
 */
async function loadAdminAnalyticsPage() {
  try {
    const res = await api.dashboard.getAdmin();
    const { categoryCounts, regStatusCounts, capacityUtilization, metrics } = res.data;

    initDashboardCharts(categoryCounts, regStatusCounts);

    const capContainer = document.getElementById('capacityUtilizationTable');
    if (capContainer) {
      capContainer.innerHTML = capacityUtilization.map(c => `
        <tr>
          <td><strong>${c.eventName}</strong></td>
          <td>${getCategoryBadge(c.category)}</td>
          <td>${c.registeredCount} / ${c.maxCapacity}</td>
          <td>
            <div class="progress" style="height: 10px;">
              <div class="progress-bar ${c.percentage >= 90 ? 'bg-danger' : c.percentage >= 60 ? 'bg-warning' : 'bg-success'}" style="width: ${c.percentage}%"></div>
            </div>
          </td>
          <td><strong>${c.percentage}%</strong></td>
          <td>${getStatusBadge(c.status)}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    showToast('Failed to load analytics', 'error');
  }
}
