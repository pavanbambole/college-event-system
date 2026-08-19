const studentService = require('../services/studentService');

const getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving students.', error: 'SERVER_ERROR' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${req.params.id} not found.`,
        error: 'STUDENT_NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving student.', error: 'SERVER_ERROR' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const updated = await studentService.updateStudent(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully!',
      data: updated
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error updating student.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const deleted = await studentService.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${req.params.id} not found.`,
        error: 'STUDENT_NOT_FOUND'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student ${req.params.id} and associated registrations removed.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error deleting student.', error: 'SERVER_ERROR' });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
