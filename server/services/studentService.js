const db = require('../utils/jsonDb');
const bcrypt = require('bcryptjs');
const { sanitizeUser, sanitizeUsers, isValidEmail, isValidMobile } = require('../utils/validators');

const getAllStudents = async () => {
  const students = await db.readData('students.json');
  return sanitizeUsers(students);
};

const getStudentById = async (id) => {
  const student = await db.findById('students.json', id);
  if (!student) return null;
  return sanitizeUser(student);
};

const updateStudent = async (id, updateData, requesterUser) => {
  const student = await db.findById('students.json', id);
  if (!student) {
    const error = new Error(`Student with ID ${id} not found.`);
    error.statusCode = 404;
    error.code = 'STUDENT_NOT_FOUND';
    throw error;
  }

  const { fullName, email, mobileNumber, department, course, year, bio, currentPassword, newPassword } = updateData;
  const updates = {};

  if (fullName) updates.fullName = fullName.trim();
  if (department) updates.department = department.trim();
  if (course) updates.course = course.trim();
  if (year) updates.year = year.trim();
  if (typeof bio !== 'undefined') updates.bio = bio.trim();

  if (email && email.trim().toLowerCase() !== student.email.toLowerCase()) {
    if (!isValidEmail(email)) {
      const error = new Error('Invalid email format.');
      error.statusCode = 400;
      error.code = 'INVALID_EMAIL';
      throw error;
    }
    const existingEmail = await db.findByEmail('students.json', email);
    if (existingEmail && existingEmail.id !== id) {
      const error = new Error('Email is already used by another student.');
      error.statusCode = 409;
      error.code = 'EMAIL_IN_USE';
      throw error;
    }
    updates.email = email.trim().toLowerCase();
  }

  if (mobileNumber) {
    if (!isValidMobile(mobileNumber)) {
      const error = new Error('Invalid mobile number format.');
      error.statusCode = 400;
      error.code = 'INVALID_MOBILE';
      throw error;
    }
    updates.mobileNumber = mobileNumber.trim();
  }

  if (newPassword) {
    if (!currentPassword && requesterUser.role !== 'admin') {
      const error = new Error('Current password is required to set a new password.');
      error.statusCode = 400;
      error.code = 'CURRENT_PASSWORD_REQUIRED';
      throw error;
    }

    if (requesterUser.role !== 'admin') {
      const isMatch = await bcrypt.compare(currentPassword, student.password);
      if (!isMatch) {
        const error = new Error('Current password does not match.');
        error.statusCode = 400;
        error.code = 'INCORRECT_PASSWORD';
        throw error;
      }
    }

    if (newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters.');
      error.statusCode = 400;
      error.code = 'WEAK_PASSWORD';
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(newPassword, salt);
  }

  const updated = await db.updateRecord('students.json', id, updates);
  return sanitizeUser(updated);
};

const deleteStudent = async (id) => {
  const deleted = await db.deleteRecord('students.json', id);
  if (!deleted) return false;

  const registrations = await db.readData('registrations.json');
  const remainingRegs = registrations.filter(r => r.studentId !== id);
  await db.writeData('registrations.json', remainingRegs);

  return true;
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
