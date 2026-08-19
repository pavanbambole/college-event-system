/**
 * CampusConnect - Automated Backend Sanity & Integration Test Suite
 */

process.env.NODE_ENV = 'test';
process.env.PORT = 5099;

const http = require('http');
const app = require('../server/server');

let server;
let studentToken = '';
let adminToken = '';
let createdEventId = '';
let registrationId = '';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (dataString) headers['Content-Length'] = Buffer.byteLength(dataString);

    const req = http.request({
      hostname: 'localhost',
      port: 5099,
      path,
      method,
      headers
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
};

async function runTests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting CampusConnect Automated Test Suite...');
  console.log('----------------------------------------------------');

  server = app.listen(5099, async () => {
    try {
      // 1. Health check
      console.log('Test 1: Health Check Endpoint');
      const health = await request('/api/health');
      if (health.status === 200 && health.data.success === true) {
        console.log('✅ Health check passed.');
      } else {
        throw new Error(`Health check failed: ${JSON.stringify(health)}`);
      }

      // 2. Student Login
      console.log('\nTest 2: Student Authentication (Aarav Sharma)');
      const stuLogin = await request('/api/auth/student/login', 'POST', {
        email: 'aarav.sharma@campusconnect.edu',
        password: 'Student@123'
      });
      if (stuLogin.status === 200 && stuLogin.data.token) {
        studentToken = stuLogin.data.token;
        console.log('✅ Student login passed. Token generated.');
      } else {
        throw new Error(`Student login failed: ${JSON.stringify(stuLogin)}`);
      }

      // 3. Admin Login
      console.log('\nTest 3: Admin Authentication (Super Admin)');
      const admLogin = await request('/api/auth/admin/login', 'POST', {
        email: 'admin@campusconnect.edu',
        password: 'Admin@123'
      });
      if (admLogin.status === 200 && admLogin.data.token) {
        adminToken = admLogin.data.token;
        console.log('✅ Admin login passed. Token generated.');
      } else {
        throw new Error(`Admin login failed: ${JSON.stringify(admLogin)}`);
      }

      // 4. Get Events with Filter
      console.log('\nTest 4: Get Events with Category Filter');
      const eventsRes = await request('/api/events?category=Hackathon');
      if (eventsRes.status === 200 && Array.isArray(eventsRes.data.data)) {
        console.log(`✅ Events retrieved. Found ${eventsRes.data.data.length} Hackathon event(s).`);
      } else {
        throw new Error(`Get events failed: ${JSON.stringify(eventsRes)}`);
      }

      // 5. Admin Create Event
      console.log('\nTest 5: Admin Create New Event');
      const newEvt = {
        eventName: 'Autonomous Drone Racing & Flight Challenge',
        category: 'Technical',
        department: 'Electronics & Communication',
        organizer: 'Robotics & Aviation Club',
        date: '2026-11-20',
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: 'Campus Open Football Ground',
        maxCapacity: 60,
        registrationDeadline: '2026-11-15',
        eventStatus: 'Registration Open',
        eventImage: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80',
        description: 'First-person view (FPV) drone racing competition through custom obstacle hoops.',
        eligibility: 'Open to all drone pilots.',
        rules: 'Safety net rules must be respected.'
      };
      const createEvtRes = await request('/api/events', 'POST', newEvt, adminToken);
      if (createEvtRes.status === 201 && createEvtRes.data.data.id) {
        createdEventId = createEvtRes.data.data.id;
        console.log(`✅ Event created successfully with ID: ${createdEventId}`);
      } else {
        throw new Error(`Create event failed: ${JSON.stringify(createEvtRes)}`);
      }

      // 6. Student Event Registration
      console.log('\nTest 6: Student Register for Newly Created Event');
      const regRes = await request('/api/registrations', 'POST', {
        eventId: createdEventId,
        notes: 'Custom drone battery specs submitted'
      }, studentToken);
      if (regRes.status === 201 && regRes.data.data.ticketNumber) {
        registrationId = regRes.data.data.id;
        console.log(`✅ Registered successfully! Ticket: ${regRes.data.data.ticketNumber}`);
      } else {
        throw new Error(`Registration failed: ${JSON.stringify(regRes)}`);
      }

      // 7. Prevent Duplicate Registration
      console.log('\nTest 7: Prevent Duplicate Registration');
      const dupRegRes = await request('/api/registrations', 'POST', {
        eventId: createdEventId
      }, studentToken);
      if (dupRegRes.status === 409) {
        console.log('✅ Duplicate registration successfully blocked (409 Conflict).');
      } else {
        throw new Error(`Duplicate check failed: Expected 409, got ${dupRegRes.status}`);
      }

      // 8. Submit Feedback
      console.log('\nTest 8: Student Submit Feedback & Rating');
      const feedRes = await request('/api/feedback', 'POST', {
        eventId: createdEventId,
        rating: 5,
        comments: 'Incredible track design and safety precautions!'
      }, studentToken);
      if (feedRes.status === 201 || feedRes.status === 200) {
        console.log('✅ Feedback submitted successfully.');
      } else {
        throw new Error(`Feedback submission failed: ${JSON.stringify(feedRes)}`);
      }

      // 9. Admin Dashboard Metrics Calculation
      console.log('\nTest 9: Admin Dashboard Analytics');
      const adminDash = await request('/api/dashboard/admin', 'GET', null, adminToken);
      if (adminDash.status === 200 && adminDash.data.data.metrics.totalEvents > 0) {
        console.log(`✅ Admin Dashboard calculated metrics. Total Events: ${adminDash.data.data.metrics.totalEvents}, Total Regs: ${adminDash.data.data.metrics.totalRegistrations}`);
      } else {
        throw new Error(`Admin dashboard test failed: ${JSON.stringify(adminDash)}`);
      }

      // 10. Student Dashboard Metrics
      console.log('\nTest 10: Student Dashboard Metrics');
      const stuDash = await request('/api/dashboard/student/STU001', 'GET', null, studentToken);
      if (stuDash.status === 200 && stuDash.data.data.stats.totalRegistered > 0) {
        console.log(`✅ Student Dashboard verified for ${stuDash.data.data.student.fullName}. Total Registered: ${stuDash.data.data.stats.totalRegistered}`);
      } else {
        throw new Error(`Student dashboard test failed: ${JSON.stringify(stuDash)}`);
      }

      console.log('\n====================================================');
      console.log('🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY (100%)');
      console.log('====================================================\n');
      process.exit(0);

    } catch (err) {
      console.error('\n❌ Test Suite Failure:', err.message);
      process.exit(1);
    } finally {
      if (server) server.close();
    }
  });
}

runTests();
