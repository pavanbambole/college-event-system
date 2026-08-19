/**
 * CampusConnect - Frontend API Client
 * Reusable helper wrapper around fetch with automatic JWT authentication header handling.
 */

const API_BASE = '/api';

const api = {
  /**
   * Helper for standard HTTP request
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('cc_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 401 Unauthorized or 403 Invalid Token, handle session expiry
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          console.warn('Session expired or unauthorized.');
        }
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // Auth Methods
  auth: {
    loginStudent: (credentials) => api.request('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    registerStudent: (data) => api.request('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    loginAdmin: (credentials) => api.request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    getMe: () => api.request('/auth/me'),
    logout: () => api.request('/auth/logout', { method: 'POST' })
  },

  // Events Methods
  events: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/events${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.request(`/events/${id}`),
    create: (data) => api.request('/events', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => api.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => api.request(`/events/${id}`, {
      method: 'DELETE'
    })
  },

  // Registrations Methods
  registrations: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/registrations${query ? `?${query}` : ''}`);
    },
    getByStudent: (studentId) => api.request(`/registrations/student/${studentId}`),
    getTicket: (id) => api.request(`/registrations/${id}/ticket`),
    create: (data) => api.request('/registrations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => api.request(`/registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => api.request(`/registrations/${id}`, {
      method: 'DELETE'
    })
  },

  // Students Methods
  students: {
    getAll: () => api.request('/students'),
    getById: (id) => api.request(`/students/${id}`),
    update: (id, data) => api.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => api.request(`/students/${id}`, {
      method: 'DELETE'
    })
  },

  // Feedback Methods
  feedback: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/feedback${query ? `?${query}` : ''}`);
    },
    create: (data) => api.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => api.request(`/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => api.request(`/feedback/${id}`, {
      method: 'DELETE'
    })
  },

  // Dashboard Methods
  dashboard: {
    getStudent: (id) => api.request(`/dashboard/student/${id}`),
    getAdmin: () => api.request('/dashboard/admin')
  }
};
