const dashboardService = require('../services/dashboardService');

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.params.id || req.user.id;
    const dashboardData = await dashboardService.getStudentDashboardData(studentId);

    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error retrieving dashboard data.',
      error: error.code || 'SERVER_ERROR'
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const adminData = await dashboardService.getAdminDashboardData();
    return res.status(200).json({
      success: true,
      data: adminData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving admin dashboard statistics.',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getStudentDashboard,
  getAdminDashboard
};
