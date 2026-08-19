/**
 * CampusConnect - Client Auth & Session Manager
 */

const auth = {
  /**
   * Save session token and user info
   */
  saveSession(token, user) {
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(user));
  },

  /**
   * Get current auth token
   */
  getToken() {
    return localStorage.getItem('cc_token');
  },

  /**
   * Get currently logged in user info
   */
  getUser() {
    const userStr = localStorage.getItem('cc_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  /**
   * Check if logged in user is student
   */
  isStudent() {
    const user = this.getUser();
    return user && user.role === 'student';
  },

  /**
   * Check if logged in user is admin
   */
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  /**
   * Log out current user and redirect to home or login
   */
  logout() {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    window.location.href = '/index.html';
  },

  /**
   * Protect a student page - redirect if not student
   */
  requireStudent() {
    if (!this.isLoggedIn()) {
      window.location.href = `/student-login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    if (!this.isStudent()) {
      window.location.href = '/access-denied.html';
      return false;
    }
    return true;
  },

  /**
   * Protect an admin page - redirect if not admin
   */
  requireAdmin() {
    if (!this.isLoggedIn()) {
      window.location.href = `/admin-login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    if (!this.isAdmin()) {
      window.location.href = '/access-denied.html';
      return false;
    }
    return true;
  },

  /**
   * Redirect if already logged in (for login/register pages)
   */
  redirectIfAuthenticated() {
    if (this.isLoggedIn()) {
      if (this.isAdmin()) {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/student-dashboard.html';
      }
    }
  }
};
