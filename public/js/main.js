/**
 * CampusConnect - Main UI Utility Functions
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarAuth();
  initToastContainer();
});

/**
 * Creates Toast Container in DOM if not exists
 */
function initToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }
}

/**
 * Display modern toast notification
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 4000) {
  initToastContainer();
  const container = document.getElementById('toastContainer');

  const icons = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-exclamation-octagon-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-primary'
  };

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;
  toast.innerHTML = `
    <i class="bi ${icons[type] || icons.info} fs-5"></i>
    <div class="flex-grow-1">
      <div class="small fw-semibold text-dark">${message}</div>
    </div>
    <button type="button" class="btn-close btn-sm" aria-label="Close"></button>
  `;

  const closeBtn = toast.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

/**
 * Dynamically updates navbar links based on session
 */
function initNavbarAuth() {
  const authNav = document.getElementById('navAuthSection');
  if (!authNav) return;

  const user = auth.getUser();

  if (user) {
    const dashboardLink = user.role === 'admin' ? '/admin-dashboard.html' : '/student-dashboard.html';
    const profileLink = user.role === 'admin' ? '/manage-events.html' : '/student-profile.html';

    authNav.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi ${user.role === 'admin' ? 'bi-shield-check text-danger' : 'bi-person-circle text-primary'}"></i>
          <span>${user.fullName.split(' ')[0]}</span>
          <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'} ms-1">${user.role === 'admin' ? 'Admin' : 'Student'}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
          <li><h6 class="dropdown-header">${user.fullName}</h6></li>
          <li><span class="dropdown-item-text text-muted small">${user.email}</span></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="${dashboardLink}"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
          ${user.role === 'student' ? '<li><a class="dropdown-item" href="/student-profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li><li><a class="dropdown-item" href="/my-registrations.html"><i class="bi bi-ticket-perforated me-2"></i>My Registrations</a></li>' : ''}
          ${user.role === 'admin' ? '<li><a class="dropdown-item" href="/manage-events.html"><i class="bi bi-calendar-event me-2"></i>Manage Events</a></li><li><a class="dropdown-item" href="/event-analytics.html"><i class="bi bi-graph-up me-2"></i>Analytics</a></li>' : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <a href="/student-login.html" class="btn btn-outline-primary me-2">Student Login</a>
      <a href="/student-register.html" class="btn btn-primary-custom">Register</a>
      <a href="/admin-login.html" class="btn btn-sm btn-link text-muted ms-1" title="Admin Portal"><i class="bi bi-shield-lock"></i></a>
    `;
  }
}

/**
 * Return styled badge HTML based on event status
 */
function getStatusBadge(status) {
  const statusMap = {
    'Registration Open': '<span class="badge-status badge-open"><i class="bi bi-check-circle"></i> Open</span>',
    'Upcoming': '<span class="badge-status badge-upcoming"><i class="bi bi-clock-history"></i> Upcoming</span>',
    'Registration Closed': '<span class="badge-status badge-closed"><i class="bi bi-lock-fill"></i> Closed</span>',
    'Completed': '<span class="badge-status badge-completed"><i class="bi bi-flag-fill"></i> Completed</span>',
    'Cancelled': '<span class="badge-status badge-cancelled"><i class="bi bi-x-circle-fill"></i> Cancelled</span>',
    'Registered': '<span class="badge bg-success"><i class="bi bi-check-lg me-1"></i>Registered</span>',
    'Attended': '<span class="badge bg-primary"><i class="bi bi-patch-check-fill me-1"></i>Attended</span>',
    'Waitlisted': '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Waitlisted</span>'
  };
  return statusMap[status] || `<span class="badge bg-secondary">${status}</span>`;
}

/**
 * Return category badge HTML
 */
function getCategoryBadge(category) {
  return `<span class="badge-category">${category || 'Event'}</span>`;
}

/**
 * Format ISO date string to user-friendly format e.g. "15 Sep 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Render star icons from numeric rating
 */
function renderStars(rating = 5) {
  let starsHtml = '';
  const num = Math.round(Number(rating));
  for (let i = 1; i <= 5; i++) {
    if (i <= num) {
      starsHtml += '<i class="bi bi-star-fill text-warning"></i> ';
    } else {
      starsHtml += '<i class="bi bi-star text-muted"></i> ';
    }
  }
  return starsHtml;
}
