/**
 * CampusConnect - Smart College Event Management System
 * Main Express Application Server
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Import Middlewares
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Application-Level Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Root Health & Info Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusConnect API is running',
    system: 'CampusConnect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'JSON File Engine'
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback routing for frontend static pages (e.g., direct clean URLs)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin-login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'student-dashboard.html'));
});

// 404 and Global Error Handlers
app.use(notFoundHandler);

// Fallback to custom 404 page for browser requests
app.use((req, res, next) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
  }
  next();
});

app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 CampusConnect Server is running on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 JSON Database initialized in /data folder`);
    console.log('====================================================');
  });
}

module.exports = app;
