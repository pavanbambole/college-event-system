/**
 * Validation utilities for CampusConnect
 */

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

const isValidMobile = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const re = /^[6-9]\d{9}$/; // Standard 10-digit mobile number
  return re.test(phone.replace(/[\s-]/g, ''));
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const sanitizeUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(u => sanitizeUser(u));
};

module.exports = {
  isValidEmail,
  isValidMobile,
  sanitizeUser,
  sanitizeUsers
};
