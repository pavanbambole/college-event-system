# 🎙️ CampusConnect – 30 Viva Questions & Comprehensive Answers

---

### Q1. What is the title and core objective of this project?
**Answer:** The project is titled **"CampusConnect – Smart College Event Management and Student Engagement System"**. Its primary objective is to digitize and unify campus event operations—allowing students to discover and register for events with 1-click digital passes while enabling administrators to create, manage, monitor, and analyze events, seat capacities, and student feedback.

---

### Q2. Why did you choose Node.js for the backend?
**Answer:** Node.js is an asynchronous, event-driven JavaScript runtime built on Chrome's V8 engine. It offers non-blocking I/O operations, high execution speed, and allows using a single programming language (JavaScript) across both the client and server.

---

### Q3. Why did you choose Express.js as the web framework?
**Answer:** Express.js is a minimal and flexible Node.js web application framework. It simplifies routing, middleware integration, JSON request parsing, and error handling, making it ideal for designing RESTful APIs.

---

### Q4. Why is a JSON database used instead of MySQL or MongoDB for this project?
**Answer:** A JSON database was selected to strictly adhere to the academic TAE-I project requirements. It provides a lightweight, serverless, and portable storage engine with zero external database installation dependencies, making it simple to run, inspect, and evaluate during viva.

---

### Q5. How do you ensure safe file writing in the JSON database without data corruption?
**Answer:** In `server/utils/jsonDb.js`, we use **atomic file writes**. Data is first written to a temporary file (`<filename>.tmp`). Once the write operation succeeds, Node's `fs.rename()` atomically replaces the target file. If an error occurs, the original database file remains intact.

---

### Q6. What is a REST API?
**Answer:** REST (Representational State Transfer) is an architectural style for building network applications. It uses standard HTTP methods (`GET` for retrieval, `POST` for creation, `PUT` for updates, and `DELETE` for removal) to perform CRUD operations on stateless resource endpoints.

---

### Q7. What does CRUD stand for, and how is it implemented in CampusConnect?
**Answer:** CRUD stands for **Create, Read, Update, and Delete**.
- **Create:** Adding events (`POST /api/events`), registrations (`POST /api/registrations`), and feedback.
- **Read:** Fetching event catalogs, student profiles, and dashboard statistics.
- **Update:** Modifying event details (`PUT /api/events/:id`) and updating pass statuses (`PUT /api/registrations/:id`).
- **Delete:** Removing cancelled events, accounts, or feedback records.

---

### Q8. How does the Student Registration flow work?
**Answer:**
1. The student submits their details (Name, Roll ID, Email, Phone, Department, Password).
2. The server validates the format and checks `students.json` for duplicate emails or roll numbers.
3. The password is encrypted using `bcryptjs` with 10 salt rounds.
4. The student record is saved into `students.json`, and a signed JWT authentication token is returned.

---

### Q9. How does the Event Registration process work?
**Answer:**
1. The student triggers 1-click registration for an event.
2. The server verifies the student's JWT token.
3. It verifies the event exists, is open for registration, and the deadline has not passed.
4. It checks whether the student has already registered (preventing duplicate bookings).
5. If seats are available, it increments the event's `currentRegistrations` counter, assigns a unique ticket ID (`TCK-EVTxxx-xxxx`), and sets status to `Registered`. If capacity is full, the student is marked as `Waitlisted`.

---

### Q10. How is duplicate event registration prevented?
**Answer:** The registration controller searches `registrations.json` for an existing record matching both `studentId === currentStudent.id` and `eventId === targetEvent.id` with an active status. If a match is found, the server returns an **HTTP 409 Conflict** status with an informative error message.

---

### Q11. How is user authentication implemented?
**Answer:** Authentication uses **JSON Web Tokens (JWT)**. Upon successful login, the server generates a cryptographically signed token containing the user's ID, role, and expiration time. The frontend stores this in `localStorage` and attaches it to subsequent requests via the `Authorization: Bearer <token>` HTTP header.

---

### Q12. How is role-based authorization implemented?
**Answer:** In `server/middleware/authMiddleware.js`, custom middleware functions (`requireAdmin`, `requireStudent`, `requireSelfOrAdmin`) inspect the decoded JWT payload. If a student attempts to perform administrative actions (e.g. creating or deleting events), the middleware returns an **HTTP 403 Forbidden** response.

---

### Q13. How does password hashing work, and why not store plain text passwords?
**Answer:** Plain-text passwords are never stored because a database breach would expose user credentials. We use `bcryptjs`, which combines the password with a randomly generated cryptographic salt and runs multiple hashing rounds, making rainbow-table and brute-force attacks computationally infeasible.

---

### Q14. How are passwords sanitized in API responses?
**Answer:** A sanitization utility (`sanitizeUser` in `server/utils/validators.js`) destructures the user object and strips out the `password` field before sending any response to the client.

---

### Q15. How does the Admin Dashboard calculate real-time analytics?
**Answer:** When the admin dashboard loads, the backend reads the current state of `events.json`, `registrations.json`, and `students.json`. It computes metrics dynamically:
- Event count by category (e.g. Technical, Cultural, Hackathons)
- Registration count by status (Registered, Attended, Cancelled, Waitlisted)
- Seat utilization percentages (`(currentRegistrations / maxCapacity) * 100`)
- Average ratings from `feedback.json`

---

### Q16. What happens when a student cancels an event registration?
**Answer:** The registration record status is updated to `Cancelled` in `registrations.json`, and the server automatically decrements the `currentRegistrations` counter in `events.json`, immediately freeing up a seat for other students.

---

### Q17. How does the search and filter mechanism work on the frontend and backend?
**Answer:** The backend endpoint `GET /api/events` accepts query parameters (`?search=`, `?category=`, `?department=`, `?status=`, `?sortBy=`). The controller applies multi-condition array filtering and sorts by upcoming date, newest, or popularity before returning the data.

---

### Q18. How is the user interface designed for mobile responsiveness?
**Answer:** We used **Bootstrap 5.3's grid system** (`row`, `col-12`, `col-md-6`, `col-lg-4`), flexbox utilities, and responsive navigation toggles, supplemented by custom media queries in `public/css/style.css`.

---

### Q19. What is the purpose of middleware in Express.js?
**Answer:** Middleware functions have access to the request object (`req`), response object (`res`), and the `next` function in the application's request-response cycle. They perform cross-cutting tasks such as logging (`morgan`), body parsing (`express.json()`), CORS handling, authentication, and global error handling.

---

### Q20. How is client-side route protection handled in the single-page/multi-page scripts?
**Answer:** In `public/js/auth.js`, helper methods `auth.requireStudent()` and `auth.requireAdmin()` inspect the user's role and token in `localStorage`. If unauthorized, the user is redirected to the login page or `access-denied.html`.

---

### Q21. How are toast notifications implemented?
**Answer:** In `public/js/main.js`, `showToast(message, type, duration)` dynamically generates a floating alert element inside `#toastContainer` with color-coded borders and icons, and removes it with a slide-out animation after the timeout.

---

### Q22. How are digital event passes generated and printed?
**Answer:** When a registration is created, a unique ticket number (`TCK-EVTxxx-xxxx`) is generated. In `public/js/student.js`, `viewTicketModal()` renders an event pass modal showing the student's name, roll number, venue, and pass ID, and includes a print button that invokes `window.print()`.

---

### Q23. What HTTP status codes are used across the API?
**Answer:**
- `200 OK`: Successful retrieval or update.
- `201 Created`: Successful creation of an account, event, or registration.
- `400 Bad Request`: Validation failure or missing required fields.
- `401 Unauthorized`: Missing or invalid authentication credentials.
- `403 Forbidden`: Authenticated user lacks required role permissions.
- `404 Not Found`: Requested endpoint or resource does not exist.
- `409 Conflict`: Duplicate email, roll ID, or event registration.
- `500 Internal Server Error`: Unhandled server exception.

---

### Q24. How is the project configured for Render deployment?
**Answer:** The repository includes a `render.yaml` blueprint declaring a Node.js web service. Render runs `npm install` followed by `npm start`. The server binds to `process.env.PORT || 5000` to support Render's dynamic port assignment.

---

### Q25. Why is version control with Git and GitHub important?
**Answer:** Git tracks incremental code changes, provides branch isolation for features, enables collaboration, and facilitates continuous deployment to cloud hosts like Render via GitHub webhooks.

---

### Q26. How did you test the application?
**Answer:** We implemented an automated integration test script in `tests/api_test.js` using Node.js's built-in `http` module. It tests 10 core integration flows: health check, student auth, admin auth, event filtering, event creation, registration, duplicate blocking, feedback, and dashboard analytics.

---

### Q27. What are the main limitations of using a JSON file database?
**Answer:** JSON files lack native indexing (B-trees) and have limited concurrency scaling under high-frequency simultaneous writes compared to database engines like PostgreSQL or MongoDB.

---

### Q28. How would you migrate this project to a production database like MongoDB or PostgreSQL?
**Answer:** Because our codebase isolates database operations inside `server/utils/jsonDb.js` and controllers, we can replace the internal methods with Mongoose or Sequelize/Prisma queries without altering the REST API route interfaces or frontend client code.

---

### Q29. What are three major future enhancements for CampusConnect?
**Answer:**
1. **QR Code Check-in:** Scanning QR codes at venue entry gates using student mobile cameras.
2. **Automated PDF Certificates:** Generating verifiable participation certificates upon event completion.
3. **SMS & Email Alerts:** Automated notifications 24 hours prior to registered events using Twilio or Nodemailer.

---

### Q30. Why is this project suitable for a Final Year Engineering evaluation?
**Answer:** It demonstrates end-to-end full-stack software engineering: structured REST API design, asynchronous JavaScript execution, security best practices (JWT, bcrypt), defensive validation, responsive UI/UX, Chart.js analytics, automated testing, cloud deployment readiness, and complete academic documentation.

---
*End of Viva Preparation Questions & Answers.*
