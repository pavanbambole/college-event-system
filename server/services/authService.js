const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/jsonDb');
const { isValidEmail, isValidMobile, sanitizeUser } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_final_year_project';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const registerStudent = async (studentData) => {
  const { studentId, fullName, email, mobileNumber, department, course, year, password, bio } = studentData;

  // Duplicate email check
  const existingByEmail = await db.findByEmail('students.json', email);
  if (existingByEmail) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Duplicate student roll ID check
  const students = await db.readData('students.json');
  const existingByRoll = students.find(s => s.studentId && s.studentId.trim().toLowerCase() === studentId.trim().toLowerCase());
  if (existingByRoll) {
    const error = new Error('A student with this Student Roll ID is already registered.');
    error.statusCode = 409;
    error.code = 'STUDENT_ID_ALREADY_EXISTS';
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newStudent = {
    studentId: studentId.trim().toUpperCase(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    mobileNumber: mobileNumber.trim(),
    department: department.trim(),
    course: course.trim(),
    year: year.trim(),
    password: hashedPassword,
    role: 'student',
    bio: bio ? bio.trim() : 'Enthusiastic college student'
  };

  const savedStudent = await db.createRecord('students.json', newStudent);
  const token = generateToken({
    id: savedStudent.id,
    email: savedStudent.email,
    fullName: savedStudent.fullName,
    role: 'student',
    studentId: savedStudent.studentId
  });

  return { user: sanitizeUser(savedStudent), token };
};

const loginStudent = async (email, password) => {
  const student = await db.findByEmail('students.json', email);
  if (!student) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = generateToken({
    id: student.id,
    email: student.email,
    fullName: student.fullName,
    role: 'student',
    studentId: student.studentId
  });

  return { user: sanitizeUser(student), token };
};

const loginAdmin = async (email, password) => {
  const admin = await db.findByEmail('admins.json', email);
  if (!admin) {
    const error = new Error('Invalid administrator credentials.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    const error = new Error('Invalid administrator credentials.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = generateToken({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: 'admin',
    department: admin.department
  });

  return { user: sanitizeUser(admin), token };
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin,
  generateToken
};
